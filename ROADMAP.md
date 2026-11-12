<!-- Copyright (c) 2026 TokenJunction LLC -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Roadmap

What the project intends to do over the next twelve months, and what it is
deliberately not doing yet. Dates are intentions, not commitments; scope is
adjusted in public through pull requests to this file.

## Where things stand (0.1.x)

The library validates a connector manifest and returns structured errors. It is
`"private": true`, has zero runtime dependencies, and is held at 100% statement
and branch coverage by its own test suite. Releases are signed and carry SLSA
provenance. It is **not published to npm** and has no external users yet.

## 0.2 — Freeze the schema (Q1 2027)

- Declare `schemaVersion: 1` stable. After this point, changes to the manifest
  schema follow the deprecation policy below.
- Publish the schema as a standalone artefact that non-JavaScript connectors can
  validate against.
- Add a `valos-sdk validate <file>` command so a connector author does not have
  to write code to check a manifest.

## 0.3 — Make contribution viable (Q2 2027)

- A second maintainer, so that review and release no longer depend on one person.
- A connector authoring guide, written from the schema rather than from the
  validator's internals.
- Decide whether to publish publicly. That decision includes a licence review
  and a name check, and is not assumed here.

## 1.0 — Stability (second half of 2027)

- A semver guarantee on the exported functions and on `schemaVersion: 1`.
- An external security review of the validator, published alongside the release.

## Deprecation policy

Once 0.2 ships, a field or function is removed only after it has been marked
deprecated in a minor release and has remained so for at least one minor
version. Error message wording may change in a patch release; error `path`
values may not.

## Explicitly not planned

- A general-purpose JSON Schema validator. This library validates one schema,
  which is why it has no dependency on one.
- A hosted service, accounts, or telemetry. The SDK is a library and stays one.
