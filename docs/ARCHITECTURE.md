<!-- Copyright (c) 2026 TokenJunction LLC -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Architecture

`valos-sdk` is one small library with no runtime dependencies. This document
describes what it is made of and why, so that a change can be judged against the
design rather than against the current code.

## Shape

```
schema/connector-manifest.schema.json     the contract, shipped in the package
              |
              v
src/validate-manifest.js                  reads it, validates against it
              |
              v
src/index.js                              re-exports the public surface
```

Three exported functions, no classes, no state:

| Export | Purpose |
| --- | --- |
| `parseManifest(text)` | Takes manifest text, returns a result. Handles malformed JSON. |
| `validateManifest(value)` | Takes an already-parsed value, returns a result. |
| `connectorManifestSchema()` | Returns a deep clone of the JSON schema. |

## Data flow

1. The schema file is read **once**, at module load, with
   `readFileSync(new URL("../schema/…", import.meta.url))`. A missing schema is
   therefore a load-time failure, not a per-call surprise.
2. `parseManifest` runs `JSON.parse` inside a `try`. A syntax error becomes a
   normal `{ ok: false }` result rather than an exception the caller must catch.
3. `validateManifest` walks the value in a fixed order: object check, required
   keys, unknown keys, then each known key in schema order.
4. Errors accumulate. Validation does not stop at the first problem, so a caller
   can show every fault in one pass instead of one per edit.
5. The result is `{ ok: true }` or `{ ok: false, errors }`, where each error is
   `{ path, message }` and `path` is a JSON Pointer such as `/capabilities/0`.

`connectorManifestSchema` returns `structuredClone(schema)` so a caller cannot
mutate the module's copy and change what later calls validate against.

## Why a hand-written validator instead of a JSON Schema library

The schema is fixed and small, and the library runs inside connectors that may
ship into constrained environments. Adding `ajv` would add a runtime dependency
and its supply chain to validate eight fields.

The trade-off is stated plainly: **only the JSON Schema keywords this manifest
uses are implemented** — `type`, `required`, `additionalProperties`, `const`,
`enum`, `minItems`, `minLength`, `maxLength`, and `pattern`. If the schema grows
a keyword, the validator must grow with it, and the schema is the source of
truth for which keywords are in play.

## Security posture

- The **schema is trusted**; the **manifest is untrusted**. Patterns are compiled
  from the schema, never from input.
- Validation is pure: no file reads, no network, no evaluation of manifest
  content, no `require` of anything the manifest names. An `entry` value is
  checked as a string against a pattern and is never resolved to a path.
- Length limits are reported as errors but do not short-circuit, so a very long
  string is still matched against the (trusted, anchored) pattern. Patterns must
  stay anchored and free of nested quantifiers; a catastrophic pattern would be
  a denial of service reachable from input. This is a property to check whenever
  the schema changes.
- Prototype pollution is not reachable through the validator: it reads with
  `Object.hasOwn` and never assigns input keys onto a shared object.

## Packaging

`package.json` limits the tarball to `src/` and `schema/`, so tests, tooling and
docs never ship. `"private": true` blocks publishing outright. The build packs
twice with a pinned `SOURCE_DATE_EPOCH` and compares hashes; see
[docs/BUILDING.md](BUILDING.md).

## Testing

`test/validate-manifest.test.js` covers behaviour; `test/project-gates.test.js`
guards the toolchain pins, the CI workflow's permissions and action SHAs, and the
licence header on every source file. The coverage gate (90% statements, 80%
branches) runs as part of `npm test`, so a change that is not exercised fails CI.
