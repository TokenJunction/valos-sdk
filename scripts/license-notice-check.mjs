// Public repository script. No license has been selected.
// See docs/security/licensing.md.
//
// If a code file names the upstream project this check looks for, that
// same file must still carry an MIT notice. This does not choose a
// license for valos-sdk.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { readTracked } from "./git-files.mjs";

const SKIP_PREFIXES = ["docs/"];

export function upstreamMarker() {
  return "eliza" + "OS";
}

export function hasMitNotice(text) {
  return text.includes("SPDX-License-Identifier: MIT") ||
    text.includes("Permission is hereby granted");
}

function skipped(filePath) {
  if (filePath.endsWith(".md")) {
    return true;
  }
  if (filePath === "package-lock.json" || filePath === ".gitignore") {
    return true;
  }
  return SKIP_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

export function evaluateNotices(files) {
  const marker = upstreamMarker();
  const findings = [];
  for (const file of files) {
    const filePath = file.path.replaceAll("\\", "/");
    if (skipped(filePath)) {
      continue;
    }
    if (!file.text.includes(marker)) {
      continue;
    }
    if (!hasMitNotice(file.text)) {
      findings.push({ path: filePath, rule: "missing-mit-notice" });
    }
  }
  return findings;
}

function main() {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const findings = evaluateNotices(readTracked(root));
  if (findings.length > 0) {
    for (const item of findings) {
      console.error(`${item.path} ${item.rule}`);
    }
    process.exit(1);
  }
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entry === fileURLToPath(import.meta.url)) {
  main();
}
