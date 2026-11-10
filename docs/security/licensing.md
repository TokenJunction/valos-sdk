# Licensing status

This file records what is in the repository. It does not choose a license.

## This repository

- GitHub's license detection for `TokenJunction/valos-sdk` is `null` (API check on 2026-11-10).
- There is no `LICENSE`, `COPYING`, or `LICENSES/` file.
- No source file carries an SPDX license identifier.
- `package.json` sets `"private": true` so npm will refuse to publish the tree. That is a publish guard. It is not a license.
- OpenSSF Best Practices project 16539, on the public badge page, shows no selected FLOSS license and the text "No license location file found." This change does not edit badge answers.

Passing criteria `floss_license` and `license_location` stay unmet until the copyright holder adds an OSI-approved, FSF-free, Debian-good, or Fedora-good license at a standard path (`LICENSE`, `COPYING`, or `LICENSES/`).

## elizaOS

A search of this repository found no file that names elizaOS and no code identified as copied from it. There is no MIT notice here to preserve, because there is no inherited elizaOS code.

`scripts/license-notice-check.mjs` fails CI if a tracked code file names elizaOS and that same file lacks an MIT notice (`SPDX-License-Identifier: MIT` or the MIT sentence "Permission is hereby granted"). Markdown under `docs/` is not treated as inherited code.

## Private product

The private product is described by its maintainers as all-rights-reserved. That is not an OSI license. This public repository does not contain that product's source. The leak guard rejects the private repository's name and slug if they show up in a tracked file. Copying all-rights-reserved code into this tree would conflict with any later OSI license for the public SDK.

Whether the public SDK should use MIT, Apache-2.0, another OSI license, or stay unlicensed is a decision for the copyright holder. This change leaves that decision open.
