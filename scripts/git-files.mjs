// Public repository script. No license has been selected.
// See docs/security/licensing.md.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

export function listTracked(root) {
  const out = execFileSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "buffer",
  });
  return out.toString("utf8").split("\0").filter(Boolean);
}

export function readTracked(root) {
  return listTracked(root).map((rel) => {
    const normalized = rel.replaceAll("\\", "/");
    const buf = readFileSync(path.join(root, rel));
    return { path: normalized, text: buf.toString("latin1") };
  });
}
