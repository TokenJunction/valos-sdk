import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { evaluateNotices, hasMitNotice, upstreamMarker } from "./license-notice-check.mjs";

test("checker source does not contain the upstream marker", () => {
  const src = readFileSync(new URL("./license-notice-check.mjs", import.meta.url), "utf8");
  assert.equal(src.includes(upstreamMarker()), false);
});

test("code that names the upstream project must keep an MIT notice", () => {
  const marker = upstreamMarker();
  const missing = evaluateNotices([
    { path: "src/copied.js", text: `// from ${marker}\nexport const x = 1;\n` },
  ]);
  assert.equal(missing.length, 1);
  assert.equal(missing[0].rule, "missing-mit-notice");

  const spdx = evaluateNotices([
    {
      path: "src/copied.js",
      text: `// SPDX-License-Identifier: MIT\n// from ${marker}\n`,
    },
  ]);
  assert.deepEqual(spdx, []);

  const classic = evaluateNotices([
    {
      path: "src/copied.js",
      text: `Permission is hereby granted, free of charge, to any person.\n// ${marker}\n`,
    },
  ]);
  assert.deepEqual(classic, []);
  assert.equal(hasMitNotice("SPDX-License-Identifier: MIT"), true);
});

test("markdown and docs may name the upstream project", () => {
  const marker = upstreamMarker();
  const findings = evaluateNotices([
    { path: "docs/security/licensing.md", text: `No ${marker} code is in this repo.\n` },
    { path: "README.md", text: marker },
  ]);
  assert.deepEqual(findings, []);
});
