<!-- Copyright (c) 2026 TokenJunction LLC -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Governance

## Who decides

`valos-sdk` is maintained by TokenJunction LLC. The project has one active
maintainer, who is the final decision maker when consensus is not reached.

| Role | Who | Responsibility |
| --- | --- | --- |
| Maintainer | TokenJunction LLC | Reviews and merges pull requests, cuts releases, holds repository admin rights |
| Contributor | Anyone | Proposes changes by pull request, reports bugs, reviews others' work |

The maintainer account is an organisation, not a personal account, so access
does not disappear with an individual's departure.

## How decisions are made

Ordinary changes use **lazy consensus**: a pull request that passes CI, has no
unresolved objection, and is not contradicted by an existing decision is merged
without a formal vote.

A change needs an explicit maintainer decision when it:

- breaks the public API or the manifest schema
- adds a runtime dependency
- changes the licence or the contribution terms
- relaxes a CI gate or a coverage threshold

Those decisions are recorded in the pull request itself, where they stay
searchable. There is no separate mailing list or off-repository decision
process, so nobody has to be in the room to know what was decided.

## Becoming a maintainer

Contributors who have landed several substantive changes and reviewed others'
work are invited to become maintainers. There is no application form; the
invitation comes from the existing maintainer after observing the work.

## Access and continuity

- Repository administrator rights are held by the TokenJunction organisation
  owner, with two-factor authentication required.
- Releases are produced by a tag push, and the signing identity is the CI
  workflow rather than a person, so a release does not depend on one machine or
  one private key. The procedure is in [docs/RELEASING.md](docs/RELEASING.md).
- Package publishing is blocked in code: `package.json` sets `"private": true`,
  so an accidental `npm publish` fails regardless of who runs it.

**Known gap.** One maintainer is a bus factor of one. The project targets a bus
factor of two — two people able to review, merge and release — and reaching that
is an open action, not something this document can assert. Until a second
maintainer exists, the continuity measures above reduce the damage from an
absence but do not remove the risk.

## Changing this document

Governance changes are proposed as pull requests like any other change, and
require an explicit maintainer decision as described above.
