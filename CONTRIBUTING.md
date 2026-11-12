<!-- Copyright (c) 2026 TokenJunction LLC -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Contributing

Changes are proposed as GitHub pull requests against `main`. Discussion happens on the pull request or in [GitHub issues](https://github.com/TokenJunction/valos-sdk/issues).

## Pull request gates

Every pull request must pass all of the following before it can be merged. Continuous integration runs them on every pull request and on every push to `main`:

- `npm test` — the Node.js test suite, including the coverage gate. Statement coverage must be at least 90%. Branch, line, and function coverage must each be at least 80%. The run fails below those thresholds.
- `npm run lint` — ESLint with `--max-warnings=0`. Any warning or error fails the build.
- `npm run build` — the reproducible build. It packs the package twice with `SOURCE_DATE_EPOCH` set and fails if the SHA-256 hashes differ or if the tarball contains a sourcemap.

Install dependencies with `npm ci` (Node.js 22.23.4, npm 10.9.9). Do not rely on a floating `npm install` for review or CI.

## Tests for new functionality

As major new functionality is added, tests for that functionality MUST be added to the automated test suite in `test/`. Bug fixes MUST add a regression test when the failure can be reproduced in the suite. A change that adds behavior without tests does not meet this policy.

The connector manifest validator was added together with `test/validate-manifest.test.js`, which exercises the accepted manifest and the rejected inputs.

## Coding standard

JavaScript is written as ES modules. The enforced style is ESLint 10 with [`@eslint/js` recommended rules](https://eslint.org/docs/latest/use/configure/configuration-files) plus the project rules in [`eslint.config.js`](eslint.config.js): `eqeqeq`, `curly`, `no-var`, `prefer-const`, and `no-console` in `src/`. CI runs `eslint . --max-warnings=0`, so the standard is applied automatically and warnings are treated as errors.

Every source file starts with:

```
Copyright (c) 2026 TokenJunction LLC
SPDX-License-Identifier: Apache-2.0
```

This project is licensed under the Apache License 2.0. Contributions are accepted under the same license (inbound = outbound), per section 5 of [LICENSE](LICENSE). Keep the `SPDX-License-Identifier: Apache-2.0` header on every source file.

Do not commit secrets, credentials, or sourcemaps. The build rejects `.map` files in the package tarball.
