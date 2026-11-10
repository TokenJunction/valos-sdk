<!-- Copyright (c) 2026 TokenJunction LLC. All rights reserved. -->

# Building

The SDK is plain JavaScript. The build produces an npm package tarball with `npm pack`. It does not run a compiler, and it does not emit sourcemaps. No native binaries are produced, so compiler and linker variables such as `CC` and `CFLAGS` are not used.

## Pinned toolchain

| Tool | Version | Where it is pinned |
| --- | --- | --- |
| Node.js | 22.23.4 | `.nvmrc`, `package.json` `engines.node` |
| npm | 10.9.9 | `package.json` `packageManager` (the npm bundled with Node.js 22.23.4) |

`.npmrc` sets `engine-strict=true`, so npm refuses to install with a different Node.js version. Dev dependencies are exact versions in `package.json` and locked in `package-lock.json`.

Check the tools:

```bash
node --version   # v22.23.4
npm --version    # 10.9.9
```

## Install

From a clean checkout, install only from the lockfile:

```bash
npm ci
```

`npm ci` is the install used locally for verification and in CI. It fails if `package.json` and `package-lock.json` disagree.

## Commands

```bash
npm run lint
npm test
export SOURCE_DATE_EPOCH=315532800
npm run build
```

`npm test` runs `node --test` under c8 and fails if coverage is below the thresholds in `package.json` (statements 90, branches 80, lines 80, functions 80). Coverage is measured for `src/**/*.js`.

`npm run lint` runs `eslint . --max-warnings=0`.

## Reproducible pack

`npm run build` runs `scripts/reproducible-build.js`, which:

1. Sets `SOURCE_DATE_EPOCH` (default `315532800` when the variable is unset), `TZ=UTC`, and `LC_ALL=C`, and passes that environment to both packs.
2. Runs `npm pack --ignore-scripts` twice into two empty directories.
3. Rejects the tarball if any entry ends in `.map` or contains `node_modules`.
4. Prints the SHA-256 of each tarball and exits non-zero if they differ.

Verify two builds yourself:

```bash
export SOURCE_DATE_EPOCH=315532800
npm pack --ignore-scripts --pack-destination /tmp/valos-pack-a
npm pack --ignore-scripts --pack-destination /tmp/valos-pack-b
sha256sum /tmp/valos-pack-a/*.tgz /tmp/valos-pack-b/*.tgz
```

The two hashes match for the same Node.js version, npm version, and source tree. CI job `reproducible-build` runs `npm run build` with `SOURCE_DATE_EPOCH=315532800` on every pull request and every push to `main`.

npm 10.9.9 writes the tarball with portable metadata: owner and group `0`, mode `0644`, and a fixed entry time of `1985-10-26T08:15:00.000Z` (`pacote`'s pack timestamp). It does not read `SOURCE_DATE_EPOCH` in this release. The variable is still set, which is the reproducible-builds convention, and both packs in one run share it. If a later npm release honors `SOURCE_DATE_EPOCH`, the two hashes still match because they use one value. The clock is not part of the archive, so packing again later yields the same SHA-256.

The packed files are `package.json`, `README.md`, `src/`, and `schema/`. Tests and CI config stay in the repository and are not part of the tarball. No sourcemaps are generated or packed.

## Install and uninstall

`npm pack --ignore-scripts` writes `valos-sdk-0.1.0.tgz` (gitignored). Install and remove it with npm:

```bash
npm install ./valos-sdk-0.1.0.tgz
npm uninstall valos-sdk
```

The package is `private` and is not published to the npm registry. `npm run build` checks reproducibility and deletes its temporary tarballs. People changing the SDK install the toolchain, tests, and linter with `npm ci`.
