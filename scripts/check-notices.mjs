#!/usr/bin/env node
// Copyright (c) 2026 TokenJunction LLC
// SPDX-License-Identifier: MIT

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { URL, fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const copyright = "Copyright (c) 2026 TokenJunction LLC";
const failures = [];

function read(relativePath) {
  try {
    return readFileSync(join(root, relativePath), "utf8");
  } catch {
    failures.push(`${relativePath}: missing`);
    return "";
  }
}

function requireText(relativePath, text, ...needles) {
  for (const needle of needles) {
    if (!text.includes(needle)) {
      failures.push(`${relativePath}: missing ${JSON.stringify(needle)}`);
    }
  }
}

function javascriptFiles(directory) {
  const found = [];
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      found.push(...javascriptFiles(fullPath));
    } else if (entry.endsWith(".js")) {
      found.push(fullPath);
    }
  }
  return found;
}

const license = read("LICENSE");
requireText(
  "LICENSE",
  license,
  "MIT License",
  copyright,
  "Permission is hereby granted",
  'THE SOFTWARE IS PROVIDED "AS IS"',
);

const notice = read("NOTICE");
requireText("NOTICE", notice, "valos-sdk", copyright, "MIT License", "LICENSE");

const readme = read("README.md");
requireText("README.md", readme, "[MIT License](LICENSE)");

let pkg;
try {
  pkg = JSON.parse(read("package.json"));
} catch {
  failures.push("package.json: invalid JSON");
}
if (pkg) {
  if (pkg.license !== "MIT") failures.push('package.json: license must be "MIT"');
  if (pkg.private !== true) failures.push("package.json: package must remain private");
}

for (const filePath of javascriptFiles(join(root, "src"))) {
  const source = readFileSync(filePath, "utf8");
  if (!source.includes(`// ${copyright}`)) {
    failures.push(`${filePath.slice(root.length + 1)}: missing copyright header`);
  }
}

if (failures.length > 0) {
  process.stderr.write("Licence and notice check failed:\n");
  for (const failure of failures) process.stderr.write(`- ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("Licence and notice check passed: MIT licence, copyright headers and NOTICE are intact.\n");
}
