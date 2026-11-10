// Public repository script. No license has been selected.
// See docs/security/licensing.md.
//
// Builds the source archive a GitHub Release workflow signs.
// There is no compiled SDK artifact in this repository.

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function sourcemapsInListing(listing) {
  return listing.split("\n").filter((line) => line.endsWith(".map"));
}

export function parseReleaseTag(tag) {
  if (typeof tag !== "string" || tag.length === 0 || tag.length > 64) {
    throw new Error("release tag is missing or too long");
  }
  if (!/^v[0-9]+\.[0-9]+\.[0-9]+(?:[-.][A-Za-z0-9.]+)?$/.test(tag)) {
    throw new Error("release tag must look like v1.2.3");
  }
  return tag.slice(1);
}

export function prepareReleaseArchive(root, tag) {
  const version = parseReleaseTag(tag);
  const dist = path.join(root, "dist");
  mkdirSync(dist, { recursive: true });
  const archiveName = `valos-sdk-${version}.tar.gz`;
  const archivePath = path.join(dist, archiveName);
  execFileSync(
    "git",
    [
      "archive",
      "--format=tar.gz",
      `--prefix=valos-sdk-${version}/`,
      `-o`,
      archivePath,
      "HEAD",
    ],
    { cwd: root, stdio: "inherit" },
  );
  const listing = execFileSync("tar", ["-tzf", archivePath], {
    cwd: root,
    encoding: "utf8",
  });
  const maps = sourcemapsInListing(listing);
  if (maps.length > 0) {
    throw new Error("release archive contains a sourcemap");
  }
  const hash = execFileSync("sha256sum", [archivePath], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  const sumsPath = path.join(dist, "SHA256SUMS");
  writeFileSync(sumsPath, `${hash.split(/\s+/)[0]}  ${archiveName}\n`);
  return { archivePath, sumsPath, archiveName, version };
}

function main() {
  const tag = process.env.RELEASE_TAG;
  const root = process.cwd();
  const built = prepareReleaseArchive(root, tag);
  console.log(built.archiveName);
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entry === fileURLToPath(import.meta.url)) {
  main();
}
