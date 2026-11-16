// Copyright (c) 2026 TokenJunction LLC
// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { it } from "node:test";
import { URL, fileURLToPath } from "node:url";

const checker = fileURLToPath(new URL("../scripts/check-dco.sh", import.meta.url));

it("exempts only exact allowed bot names or emails and checks other sign-offs", () => {
  const directory = mkdtempSync(join(tmpdir(), "valos-dco-"));
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: "Contributor",
    GIT_AUTHOR_EMAIL: "contributor@example.com",
    GIT_COMMITTER_NAME: "Committer",
    GIT_COMMITTER_EMAIL: "committer@example.com",
  };
  function git(args, input, overrides = {}) {
    const result = spawnSync("git", args, {
      cwd: directory, env: { ...env, ...overrides }, input, encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  }
  try {
    git(["init", "--quiet"]);
    const tree = git(["mktree"], "");
    const base = git(["commit-tree", tree], "base\n");
    const cases = [
      ["dependabot[bot]", "unrelated@example.com", true],
      ["github-actions[bot]", "unrelated@example.com", true],
      ["Contributor", "dependabot@users.noreply.github.com", true],
      ["Contributor", "49699333+dependabot[bot]@users.noreply.github.com", true],
      ["Contributor", "github-actions[bot]@users.noreply.github.com", true],
      ["Contributor", "41898282+github-actions[bot]@users.noreply.github.com", true],
      ["Contributor", "DEPENDABOT@USERS.NOREPLY.GITHUB.COM", true],
      ["Contributor", "contributor@example.com", false],
      ["dependabot@users.noreply.github.com", "helper@example.com", false],
      ["somebot", "somebot@users.noreply.github.com", false],
      ["dependabot-helper", "helper@example.com", false],
      ["prefix dependabot[bot] suffix", "helper@example.com", false],
      ["other[bot]", "helper@example.com", false],
      ["Contributor", "dependabot@example.com", false],
      ["Contributor", "prefix-dependabot@users.noreply.github.com", false],
      ["Contributor", "dependabot@users.noreply.github.com.evil.example", false],
      ["Contributor", "prefix-github-actions[bot]@users.noreply.github.com", false],
      ["Contributor", "github-actions[bot]@users.noreply.github.com.evil.example", false],
    ];
    for (const [name, email, exempt] of cases) {
      for (const signoff of [null, email, env.GIT_COMMITTER_EMAIL, "wrong@example.com"]) {
        const message = `change\n${signoff ? `\nSigned-off-by: Contributor <${signoff}>\n` : ""}`;
        const head = git(["commit-tree", tree, "-p", base], message, {
          GIT_AUTHOR_NAME: name, GIT_AUTHOR_EMAIL: email,
        });
        const result = spawnSync("bash", [checker, base, head], {
          cwd: directory, env, encoding: "utf8",
        });
        const passes = exempt || signoff === email || signoff === env.GIT_COMMITTER_EMAIL;
        assert.equal(result.status, passes ? 0 : 1, `${name} <${email}>: ${result.stdout}${result.stderr}`);
        assert.equal(result.stdout.includes("skip (bot)"), exempt);
      }
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
