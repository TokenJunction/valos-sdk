// Copyright (c) 2026 TokenJunction LLC
// SPDX-License-Identifier: Apache-2.0

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { URL, fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const epoch = process.env.SOURCE_DATE_EPOCH || "315532800";
const directories = [];

function cleanup() {
  for (const directory of directories) {
    rmSync(directory, { recursive: true, force: true });
  }
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  cleanup();
  process.exit(1);
}

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function packOnce() {
  const directory = mkdtempSync(join(tmpdir(), "valos-sdk-pack-"));
  directories.push(directory);
  const result = spawnSync(
    "npm",
    ["pack", "--ignore-scripts", "--json", "--pack-destination", directory],
    {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        SOURCE_DATE_EPOCH: epoch,
        TZ: "UTC",
        LC_ALL: "C",
        npm_config_update_notifier: "false",
      },
    },
  );
  if (result.error) {
    fail(`npm pack failed to start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    fail(`npm pack exited ${result.status ?? "unknown"}`);
  }
  const info = JSON.parse(result.stdout);
  const filename = info[0]?.filename;
  if (typeof filename !== "string" || filename.length === 0) {
    fail("npm pack did not report a tarball filename");
  }
  return join(directory, filename);
}

function listEntries(tarball) {
  const result = spawnSync("tar", ["-tzf", tarball], { encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? "");
    fail("unable to list tarball entries");
  }
  return result.stdout.split("\n").filter((line) => line.length > 0);
}

function writeOut(text) {
  try {
    process.stdout.write(text);
  } catch (error) {
    if (error.code !== "EPIPE") {
      throw error;
    }
  }
}

process.stdout.on("error", (error) => {
  if (error.code !== "EPIPE") {
    throw error;
  }
});

const first = packOnce();
const second = packOnce();
const entries = listEntries(first);
for (const entry of entries) {
  if (entry.endsWith(".map") || entry.includes("node_modules")) {
    fail(`build output contains a forbidden path: ${entry}`);
  }
}

const hashA = sha256(first);
const hashB = sha256(second);
if (hashA !== hashB) {
  fail("reproducible build mismatch");
}
writeOut(`SOURCE_DATE_EPOCH=${epoch}\n`);
writeOut(`build1 sha256 ${hashA}\n`);
writeOut(`build2 sha256 ${hashB}\n`);
writeOut("tarball entries:\n");
for (const entry of entries) {
  writeOut(`  ${entry}\n`);
}
writeOut("reproducible build: match\n");
cleanup();
