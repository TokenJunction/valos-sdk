import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  evaluate,
  formatFindings,
  privateProductName,
  privateProductSlug,
} from "./leak-guard.mjs";
import { upstreamMarker } from "./license-notice-check.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, acc) {
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === "node_modules" || name === "dist") {
      continue;
    }
    const abs = path.join(dir, name);
    if (statSync(abs).isDirectory()) {
      walk(abs, acc);
      continue;
    }
    acc.push({
      path: path.relative(root, abs).replaceAll("\\", "/"),
      text: readFileSync(abs, "latin1"),
    });
  }
  return acc;
}

function joined(parts) {
  return parts.join("");
}

test("worktree has no leak-guard findings", () => {
  const findings = evaluate(walk(root, []));
  assert.deepEqual(findings, [], formatFindings(findings));
});

test("guard source does not contain the identifiers it searches for", () => {
  const src = readFileSync(new URL("./leak-guard.mjs", import.meta.url), "utf8");
  assert.equal(src.includes(privateProductSlug()), false);
  assert.equal(src.includes(privateProductName()), false);
  assert.equal(src.includes(upstreamMarker()), false);
});

test("private product slug and path fail", () => {
  const slug = privateProductSlug();
  const findings = evaluate([
    { path: "README.md", text: `see ${slug}` },
    { path: `vendor/${privateProductName()}/file.txt`, text: "x" },
  ]);
  assert.ok(findings.some((item) => item.rule === "private-product-slug"));
  assert.ok(findings.some((item) => item.rule === "private-product-path"));
});

test("env files, key files, and sourcemaps fail; example env is allowed", () => {
  const findings = evaluate([
    { path: ".env", text: "" },
    { path: ".env.local", text: "" },
    { path: ".env.example", text: "API_URL=https://example.com\n" },
    { path: "keys/id_rsa", text: "" },
    { path: "dist/app.js.map", text: "" },
  ]);
  const rules = findings.map((item) => item.rule);
  assert.ok(rules.includes("env-file"));
  assert.ok(rules.includes("key-file"));
  assert.ok(rules.includes("sourcemap"));
  assert.equal(findings.some((item) => item.path === ".env.example"), false);
});

test("secret shapes fail and the report does not echo the value", () => {
  const token = joined(["gh", "p_", "a".repeat(36)]);
  const pem = "-----BEGIN " + "RSA PRIVATE KEY-----\nabc\n-----END " + "RSA PRIVATE KEY-----";
  const wallet = joined(["mnemonic", ": abandon abandon"]);
  const findings = evaluate([
    { path: "secret.txt", text: `${token}\n${pem}\n${wallet}\n` },
  ]);
  const rules = findings.map((item) => item.rule);
  assert.ok(rules.includes("github-pat"));
  assert.ok(rules.includes("pem-private-key"));
  assert.ok(rules.includes("wallet-assignment"));
  const rendered = formatFindings(findings);
  assert.equal(rendered.includes(token), false);
  assert.equal(rendered.includes("abandon"), false);
});

test("prose about keys is allowed and an owner email is not", () => {
  const mail = ["owner", "example.test"].join("@");
  const publicMail = "dev@users.noreply.github.com";
  const findings = evaluate([
    {
      path: "docs/security/note.md",
      text: "Customers bring API keys and wallet secrets. Do not commit private keys.\n" +
        publicMail + "\n" + mail + "\n",
    },
  ]);
  assert.equal(findings.some((item) => item.rule === "wallet-assignment"), false);
  assert.equal(findings.some((item) => item.rule === "private-key-assignment"), false);
  assert.equal(findings.filter((item) => item.rule === "email-address").length, 1);
});

test("weak ciphers in source fail", () => {
  const findings = evaluate([
    { path: "src/crypto.js", text: "const algo = '" + joined(["3", "des"]) + "';\n" },
    { path: "docs/security/note.md", text: joined(["3", "des"]) + " is rejected in source.\n" },
  ]);
  assert.equal(findings.filter((item) => item.rule === "weak-cipher-triple").length, 1);
  assert.equal(findings[0].path, "src/crypto.js");
});

test("workflow secret references and the unsafe pull trigger fail", () => {
  const trigger = "pull_request" + "_target";
  const secretRef = ["se", "crets."].join("") + "TOKEN";
  const findings = evaluate([
    {
      path: ".github/workflows/example.yml",
      text: `on:\n  ${trigger}:\njobs:\n  x:\n    env:\n      TOKEN: \${{ ${secretRef} }}\n`,
    },
  ]);
  const rules = findings.map((item) => item.rule);
  assert.ok(rules.includes("workflow-pull-request-target"));
  assert.ok(rules.includes("workflow-secret-reference"));
});
