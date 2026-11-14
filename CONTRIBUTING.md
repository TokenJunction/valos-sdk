<!-- Copyright (c) 2026 TokenJunction LLC -->
<!-- SPDX-License-Identifier: MIT -->

# Contributing

Changes are proposed as GitHub pull requests against `main`. Discussion happens on the pull request or in [GitHub issues](https://github.com/TokenJunction/valos-sdk/issues).

## Pull request gates

Every pull request must pass all of the following before it can be merged. Continuous integration runs them on every pull request and on every push to `main`:

- `npm test` — the Node.js test suite, including the coverage gate. Statement coverage must be at least 90%. Branch, line, and function coverage must each be at least 80%. The run fails below those thresholds.
- `npm run lint` — ESLint with `--max-warnings=0`. Any warning or error fails the build.
- `npm run build` — the reproducible build. It packs the package twice with `SOURCE_DATE_EPOCH` set and fails if the SHA-256 hashes differ or if the tarball contains a sourcemap.
- `dco` — every commit carries a `Signed-off-by` line that matches its author's email address. See [Developer Certificate of Origin](#developer-certificate-of-origin).
- `npm run check:notices` — verifies the MIT licence, copyright/SPDX headers and the `NOTICE` file have not been removed or altered.

Install dependencies with `npm ci` (Node.js 22.23.4, npm 10.9.9). Do not rely on a floating `npm install` for review or CI.

## Developer Certificate of Origin

Every commit in a pull request must carry a `Signed-off-by` line naming the commit author. The `dco` workflow checks every non-merge commit between the pull request base and head, and fails when one is missing or names a different address. A pull request with an unsigned commit cannot be merged.

Sign off on the commit you just made:

```bash
git commit --amend -s
```

Sign off on every commit already on your branch, then update the pull request:

```bash
git rebase --signoff main
git push --force-with-lease
```

To stop having to remember, sign everything in this repository automatically:

```bash
git config --local format.signoff true
```

The trailer takes the form:

```
Signed-off-by: Your Name <you@example.com>
```

The address must match `user.email`, which should be an address verified on your GitHub account. A rebase rewrites the committer while keeping the original author, and `--signoff` uses the committer, so the check accepts a sign-off naming either the author or whoever committed it. That is what makes it possible to sign off commits that were created through the GitHub API.

By adding the line you certify the [Developer Certificate of Origin 1.1](https://developercertificate.org/): that you wrote the change or have the right to submit it under the project's licence, and that you understand the contribution and its record are public. There is no separate CLA to sign.

Bots such as Dependabot are exempt, and merge commits are not checked, so a bot pull request does not fail for lacking a sign-off no human wrote.

## Tests for new functionality

As major new functionality is added, tests for that functionality MUST be added to the automated test suite in `test/`. Bug fixes MUST add a regression test when the failure can be reproduced in the suite. A change that adds behavior without tests does not meet this policy.

The connector manifest validator was added together with `test/validate-manifest.test.js`, which exercises the accepted manifest and the rejected inputs.

## Coding standard

JavaScript is written as ES modules. The enforced style is ESLint 10 with [`@eslint/js` recommended rules](https://eslint.org/docs/latest/use/configure/configuration-files) plus the project rules in [`eslint.config.js`](eslint.config.js): `eqeqeq`, `curly`, `no-var`, `prefer-const`, and `no-console` in `src/`. CI runs `eslint . --max-warnings=0`, so the standard is applied automatically and warnings are treated as errors.

Every source file carries the copyright line. New or edited source files also carry the SPDX identifier:

```
Copyright (c) 2026 TokenJunction LLC
SPDX-License-Identifier: MIT
```

This project is licensed under the MIT License. Contributions are accepted under the same license (inbound = outbound), as described in [LICENSE](LICENSE). The copyright and permission notice is preserved in [NOTICE](NOTICE). Keep the copyright notice on every source file and retain the `SPDX-License-Identifier: MIT` header wherever it is present.

Do not commit secrets, credentials, or sourcemaps. The build rejects `.map` files in the package tarball.

## Readable source

This is a public source repository, not a distribution of obfuscated code. Keep `src/`, `test/` and `scripts/` readable. Do not commit minified, packed or obfuscated source into them; minification belongs only in release or build output. The licence and notice checks enforce the legal notices, not a code-hiding step.
