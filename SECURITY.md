<!-- Copyright (c) 2026 TokenJunction LLC -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |
| < 0.1 | No |

`valos-sdk` is pre-1.0. Only the latest release receives security fixes.

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Use GitHub's private vulnerability reporting on this repository:

<https://github.com/TokenJunction/valos-sdk/security/advisories/new>

If that form is unavailable, email **keene.jos@gmail.com** with `SECURITY` in the subject line. If you prefer, encrypt to the key published at `/security/pgp-key.asc` once it exists.

Please include:

- the version or commit affected
- what the attacker controls, and what they gain
- a minimal reproduction (a manifest and the call that processes it is ideal)
- whether you intend to publish, and on what timeline

## What to expect

| Stage | Target |
| --- | --- |
| Acknowledgement of your report | 3 business days |
| Initial assessment and severity | 14 days |
| Fix or documented mitigation | 90 days for high and critical |

These are targets, not a contract. If a fix will take longer, we will say so and explain why rather than go quiet. We will credit you in the advisory unless you ask us not to.

## Scope

In scope — the manifest validator and its public surface:

- bypassing `additionalProperties: false` or the `required` list
- `entry` path traversal (`..`, absolute paths, symlink tricks)
- ReDoS in `name`, `version` or `entry` patterns
- prototype pollution through parsed manifests
- a manifest that validates but produces an object the caller cannot trust

Out of scope:

- vulnerabilities in `c8`, `eslint` or other dev-only dependencies with no runtime path
- anything requiring the attacker to already control the build or the machine
- the private `valos-core` service, which has its own policy
- reports generated solely by a scanner with no demonstrated impact

## Handling in this repository

- Release artefacts are built in CI, signed with Sigstore and carry SLSA provenance. Verify before use:

  ```bash
  gh attestation verify valos-sdk-0.1.0.tgz --repo TokenJunction/valos-sdk
  cosign verify-blob --bundle valos-sdk-0.1.0.tgz.bundle valos-sdk-0.1.0.tgz
  ```

- Dependency updates are reviewed before merge; dev dependencies are exact-pinned.
- Every source file carries `SPDX-License-Identifier: Apache-2.0`, so the provenance of any copied code is checkable.

## Safe harbour

We will not pursue legal action against researchers who test this project in good faith, stay within the scope above, avoid privacy violations and data destruction, and give us a reasonable chance to fix the issue before public disclosure.
