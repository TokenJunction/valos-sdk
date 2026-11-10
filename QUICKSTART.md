<!-- Copyright (c) 2026 TokenJunction LLC. All rights reserved. -->
# SDK quickstart

This repository provides local connector-manifest validation. It does not execute connectors, authenticate users, make AI requests, or handle payments. It is not published to npm.

Use the Node.js and npm versions specified in `.nvmrc` and `package.json`. From a reviewed checkout:

```sh
npm ci
npm run lint
npm test
npm run build
```

The existing runtime test command enforces coverage thresholds. A successful run is evidence only for the checkout actually tested. Do not infer OpenSSF badge completion from a green build.

```js
import { validateManifest } from './src/index.js';

const result = validateManifest({
  schemaVersion: 1,
  name: 'example',
  version: '0.1.0',
  description: 'Local validation example',
  entry: './connector.mjs',
  capabilities: ['health'],
});

if (!result.ok) {
  for (const problem of result.errors) {
    console.error(problem.path, problem.message);
  }
}
```

`parseManifest` accepts JSON text. Both validation functions return `{ ok, errors }`, not the parsed manifest. TypeScript declarations describe this API; they do not replace runtime validation or narrow unknown input into a trusted manifest.

Run the additive compile-time checks with:

```sh
npm exec --yes --package=typescript@5.9.3 -- tsc --strict --noEmit --module NodeNext --moduleResolution NodeNext --target ES2022 type-tests/public-api.ts
```

This command downloads the exact compiler version through npm; it is not yet part of the repository lockfile. The typecheck workflow runs against the pull-request merge checkout.

No license grant is added by this change. The existing UNLICENSED status remains an unresolved OpenSSF eligibility gate. No secrets or wallet data are needed for these examples.
