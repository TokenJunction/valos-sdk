import assert from "node:assert/strict";
import test from "node:test";
import { parseReleaseTag, sourcemapsInListing } from "./prepare-release-archive.mjs";

test("release tags are an allowlist", () => {
  assert.equal(parseReleaseTag("v0.1.0"), "0.1.0");
  assert.equal(parseReleaseTag("v1.2.3-rc.1"), "1.2.3-rc.1");
  for (const tag of ["", "1.2.3", "v1", "v1.2", "v1.2.3\n", "main", "../v1.2.3"]) {
    assert.throws(() => parseReleaseTag(tag));
  }
});

test("sourcemap names in an archive listing are rejected", () => {
  const listing = "valos-sdk-0.1.0/README.md\nvalos-sdk-0.1.0/dist/app.js.map\n";
  assert.deepEqual(sourcemapsInListing(listing), ["valos-sdk-0.1.0/dist/app.js.map"]);
  assert.deepEqual(sourcemapsInListing("valos-sdk-0.1.0/README.md\n"), []);
});
