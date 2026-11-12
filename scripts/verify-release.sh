#!/usr/bin/env bash
# Copyright (c) 2026 TokenJunction LLC
# SPDX-License-Identifier: Apache-2.0
#
# Verify a downloaded valos-sdk release: checksum, Sigstore signature and SLSA
# provenance. Usage: verify-release.sh <version> [directory]

set -euo pipefail

VERSION="${1:-}"
DIR="${2:-.}"
REPO="TokenJunction/valos-sdk"
IDENTITY='^https://github\.com/TokenJunction/valos-sdk/\.github/workflows/release\.yml@refs/tags/v.*$'
ISSUER='https://token.actions.githubusercontent.com'

if [ -z "$VERSION" ]; then
  echo "usage: $0 <version> [directory]" >&2
  echo "example: $0 0.1.0 ./downloads" >&2
  exit 2
fi

VERSION="${VERSION#v}"
TGZ="$DIR/valos-sdk-$VERSION.tgz"
BUNDLE="$TGZ.bundle"

for f in "$TGZ" "$BUNDLE" "$DIR/SHA256SUMS"; do
  if [ ! -f "$f" ]; then
    echo "missing: $f" >&2
    echo "run: gh release download v$VERSION --repo $REPO --dir $DIR" >&2
    exit 1
  fi
done

echo "== checksum =="
( cd "$DIR" && sha256sum -c SHA256SUMS )

echo "== Sigstore signature =="
if ! command -v cosign >/dev/null 2>&1; then
  echo "cosign not installed; skipping signature check" >&2
  echo "install: https://docs.sigstore.dev/cosign/installation/" >&2
  exit 1
fi
cosign verify-blob \
  --bundle "$BUNDLE" \
  --certificate-identity-regexp "$IDENTITY" \
  --certificate-oidc-issuer "$ISSUER" \
  "$TGZ"

echo "== SLSA provenance =="
if ! command -v gh >/dev/null 2>&1; then
  echo "gh not installed; skipping provenance check" >&2
  exit 1
fi
gh attestation verify "$TGZ" --repo "$REPO"

echo
echo "OK: valos-sdk $VERSION verified (checksum, signature, provenance)"
