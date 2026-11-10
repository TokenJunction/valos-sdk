// Copyright (c) 2026 TokenJunction LLC. All rights reserved.

import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { describe, it } from "node:test";
import { URL, fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const copyright = "Copyright (c) 2026 TokenJunction LLC. All rights reserved.";

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
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

describe("project gates", () => {
  it("pins Node, npm, and exact devDependencies", () => {
    const pkg = JSON.parse(read("package.json"));
    assert.equal(process.version, "v22.23.4");
    assert.equal(read(".nvmrc").trim(), "22.23.4");
    assert.equal(pkg.engines.node, "22.23.4");
    assert.equal(pkg.packageManager, "npm@10.9.9");
    assert.equal(pkg.private, true);
    assert.equal(pkg.license, "UNLICENSED");
    assert.equal(pkg.scripts.lint, "eslint . --max-warnings=0");
    assert.match(pkg.scripts.test, /--statements=90/);
    assert.match(pkg.scripts.test, /--branches=80/);
    assert.match(pkg.scripts.test, /--lines=80/);
    assert.match(pkg.scripts.test, /--functions=80/);
    for (const version of Object.values(pkg.devDependencies)) {
      assert.match(version, /^\d+\.\d+\.\d+$/);
    }
    assert.equal(pkg.dependencies, undefined);
  });

  it("keeps the CI workflow read-only and SHA-pinned", () => {
    const workflow = read(".github/workflows/ci.yml");
    assert.match(workflow, /pull_request:/);
    assert.match(workflow, /branches:\n\s+- main/);
    assert.match(workflow, /permissions:\n\s+contents: read/);
    assert.equal(workflow.includes("contents: write"), false);
    assert.equal(workflow.includes("secrets."), false);
    assert.equal(workflow.includes("persist-credentials: false"), true);
    assert.match(
      workflow,
      /actions\/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5\.1\.0/,
    );
    assert.match(
      workflow,
      /actions\/setup-node@a0853c24544627f65ddf259abe73b1d18a591444 # v5\.0\.0/,
    );
    assert.match(workflow, /npm ci/);
    assert.match(workflow, /npm test/);
    assert.match(workflow, /npm run lint/);
    assert.match(workflow, /npm run build/);
    assert.match(workflow, /SOURCE_DATE_EPOCH: "315532800"/);
  });

  it("puts the copyright header on every JavaScript source file", () => {
    const files = [
      ...javascriptFiles(join(root, "src")),
      ...javascriptFiles(join(root, "test")),
      ...javascriptFiles(join(root, "scripts")),
      join(root, "eslint.config.js"),
    ];
    assert.ok(files.length >= 4);
    for (const filePath of files) {
      const source = readFileSync(filePath, "utf8");
      assert.equal(source.startsWith(`// ${copyright}`), true, filePath);
    }
    const schema = JSON.parse(read("schema/connector-manifest.schema.json"));
    assert.equal(schema.$comment, copyright);
    assert.equal(read(".github/workflows/ci.yml").includes(copyright), true);
  });
});
