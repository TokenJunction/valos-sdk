// Public repository script. No license has been selected.
// See docs/security/licensing.md.
//
// Fails the build when private-product identifiers, secret shapes,
// key material, owner-style email addresses, or sourcemaps are tracked.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { readTracked } from "./git-files.mjs";

const SOURCE_EXT = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".c",
  ".cc",
  ".cpp",
  ".h",
  ".hpp",
  ".sol",
  ".rb",
  ".php",
  ".sh",
  ".bash",
]);

export function privateProductSlug() {
  const owner = "TokenJunction";
  const name = ["valos", "core"].join("-");
  return `${owner}/${name}`;
}

export function privateProductName() {
  return privateProductSlug().split("/")[1];
}

function isEnvFile(filePath) {
  const base = path.posix.basename(filePath);
  if (base === ".env.example") {
    return false;
  }
  return base === ".env" || base.startsWith(".env.");
}

function isKeyFile(filePath) {
  const base = path.posix.basename(filePath);
  const blockedNames = new Set([
    "id_rsa",
    "id_dsa",
    "id_ecdsa",
    "id_ed25519",
  ]);
  if (blockedNames.has(base)) {
    return true;
  }
  const blockedExt = [".pem", ".p12", ".pfx", ".jks", ".keystore", ".kdbx", ".key"];
  return blockedExt.some((ext) => base.endsWith(ext));
}

function isSource(filePath) {
  return SOURCE_EXT.has(path.posix.extname(filePath));
}

function isWorkflow(filePath) {
  return filePath.startsWith(".github/workflows/") &&
    (filePath.endsWith(".yml") || filePath.endsWith(".yaml"));
}

function lineOf(text, index) {
  if (index < 0) {
    return 1;
  }
  return text.slice(0, index).split("\n").length;
}

function allowEmail(address) {
  const lower = address.toLowerCase();
  const domain = lower.slice(lower.lastIndexOf("@") + 1);
  const allowedDomains = new Set([
    "users.noreply.github.com",
    "noreply.github.com",
    "example.com",
    "example.org",
    "example.net",
  ]);
  return allowedDomains.has(domain);
}

function contentRules() {
  const pem = "-----BEGIN " + "[A-Z0-9 ]*PRIVATE KEY-----";
  return [
    { id: "pem-private-key", re: new RegExp(pem) },
    { id: "github-pat", re: new RegExp("gh" + "p_[A-Za-z0-9]{36}") },
    { id: "github-fine-grained-pat", re: new RegExp("github_pat_" + "[A-Za-z0-9_]{20,}") },
    { id: "aws-access-key", re: new RegExp("AKIA" + "[0-9A-Z]{16}") },
    { id: "slack-token", re: new RegExp("xox[baprs]-" + "[0-9A-Za-z-]{10,}") },
    { id: "stripe-secret", re: new RegExp("sk_live_" + "[0-9a-zA-Z]{16,}") },
    { id: "npm-token", re: new RegExp("npm_" + "[A-Za-z0-9]{36}") },
    { id: "google-api-key", re: new RegExp("AIza" + "[0-9A-Za-z_-]{35}") },
    {
      id: "wallet-assignment",
      re: new RegExp(
        "\\b(?:mnemonic|seed[ _-]?phrase|wallet[ _-]?secret)\\b\\s*[:=]\\s*\\S",
        "i",
      ),
    },
    {
      id: "private-key-assignment",
      re: new RegExp(
        "\\b(?:private[ _-]?key|api[ _-]?secret|secret[ _-]?key)\\b\\s*[:=]\\s*['\"]?[A-Za-z0-9/+_=-]{12,}",
        "i",
      ),
    },
  ];
}

function weakCryptoRules() {
  return [
    { id: "weak-cipher-triple", re: new RegExp("3" + "des|des-" + "ede3|triple[- ]?" + "des", "i") },
    { id: "weak-cipher-stream", re: new RegExp("\\b" + "rc" + "4\\b", "i") },
    { id: "weak-cipher-single", re: new RegExp("\\bD" + "ES\\b") },
    { id: "weak-cipher-node-legacy", re: new RegExp("create" + "Cipher\\b|create" + "Decipher\\b") },
  ];
}

function push(findings, filePath, rule, line) {
  findings.push({ path: filePath, rule, line });
}

export function evaluate(files) {
  const findings = [];
  const slug = privateProductSlug();
  const productName = privateProductName();
  for (const file of files) {
    const filePath = file.path.replaceAll("\\", "/");
    const text = file.text ?? "";

    if (filePath.includes(slug) || filePath.includes(productName)) {
      push(findings, filePath, "private-product-path", 1);
    }
    if (isEnvFile(filePath)) {
      push(findings, filePath, "env-file", 1);
    }
    if (isKeyFile(filePath)) {
      push(findings, filePath, "key-file", 1);
    }
    if (filePath.endsWith(".map")) {
      push(findings, filePath, "sourcemap", 1);
    }

    const slugAt = text.indexOf(slug);
    if (slugAt !== -1) {
      push(findings, filePath, "private-product-slug", lineOf(text, slugAt));
    }
    const nameAt = text.indexOf(productName);
    if (nameAt !== -1) {
      push(findings, filePath, "private-product-name", lineOf(text, nameAt));
    }

    for (const rule of contentRules()) {
      const match = rule.re.exec(text);
      if (match) {
        push(findings, filePath, rule.id, lineOf(text, match.index));
      }
    }

    if (isSource(filePath)) {
      for (const rule of weakCryptoRules()) {
        const match = rule.re.exec(text);
        if (match) {
          push(findings, filePath, rule.id, lineOf(text, match.index));
        }
      }
    }

    if (isWorkflow(filePath)) {
      const secretRef = text.indexOf("secrets.");
      if (secretRef !== -1) {
        push(findings, filePath, "workflow-secret-reference", lineOf(text, secretRef));
      }
      const unsafeTrigger = "pull_request" + "_target";
      const triggerAt = text.indexOf(unsafeTrigger);
      if (triggerAt !== -1) {
        push(findings, filePath, "workflow-pull-request-target", lineOf(text, triggerAt));
      }
    }

    const email = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
    for (const match of text.matchAll(email)) {
      if (!allowEmail(match[0])) {
        push(findings, filePath, "email-address", lineOf(text, match.index));
      }
    }
  }

  return findings;
}

export function formatFindings(findings) {
  return findings
    .map((item) => `${item.path}:${item.line} ${item.rule}`)
    .join("\n");
}

function main() {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const findings = evaluate(readTracked(root));
  if (findings.length > 0) {
    console.error(formatFindings(findings));
    process.exit(1);
  }
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entry === fileURLToPath(import.meta.url)) {
  main();
}
