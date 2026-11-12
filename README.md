<!-- Copyright (c) 2026 TokenJunction LLC -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# valos-sdk

Public connector SDK for ValhallaOS. It validates a connector manifest against [`schema/connector-manifest.schema.json`](schema/connector-manifest.schema.json). The manifest names the connector, its entry module, and an allowlist of operations (`read`, `write`, `subscribe`, `health`).

Licensed under the [Apache License 2.0](LICENSE). The package is marked `"private": true`, so an accidental `npm publish` is still blocked.

## Requirements

- Node.js 22.23.4 (see [`.nvmrc`](.nvmrc) and `engines` in [`package.json`](package.json))
- npm 10.9.9 (`packageManager`)

## Build, test, and lint

Install from the lockfile:

```bash
npm ci
```

Lint. Warnings fail the command (`--max-warnings=0`):

```bash
npm run lint
```

Run the test suite and the coverage gate:

```bash
npm test
```

`npm test` fails if statement coverage is under 90%, or if branch, line, or function coverage is under 80%.

Build a reproducible package tarball twice and compare SHA-256:

```bash
export SOURCE_DATE_EPOCH=315532800
npm run build
```

The two hashes are printed and must match. The tarball contains no sourcemaps. Details are in [docs/BUILDING.md](docs/BUILDING.md). Pull request rules are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Validate a manifest

```js
import { parseManifest } from "./src/index.js";

const result = parseManifest(jsonText);
if (!result.ok) {
  for (const problem of result.errors) {
    process.stderr.write(`${problem.path} ${problem.message}\n`);
  }
}
```

`validateManifest` checks an already-parsed value. `connectorManifestSchema` returns a clone of the JSON schema. A manifest object has `schemaVersion` (`1`), `name`, `version` (`MAJOR.MINOR.PATCH`), `description`, `entry` (a relative `.js` or `.mjs` path), and `capabilities`.

## Feedback

Bug reports and enhancement requests go to [GitHub issues](https://github.com/TokenJunction/valos-sdk/issues). Changes are proposed as pull requests. See [CONTRIBUTING.md](CONTRIBUTING.md).
