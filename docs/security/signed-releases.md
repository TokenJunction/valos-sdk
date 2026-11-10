# Signed releases

No GitHub Release has been published. The workflow below runs when a maintainer publishes one. Until that run succeeds, this repository has no signed release asset and no provenance attestation to verify.

## What gets signed

`.github/workflows/release.yml` builds a source archive with `git archive` of the tagged commit. There is no compiled SDK and no npm publish step. `package.json` is `"private": true`.

The workflow uploads these release assets:

| Asset | Role |
| --- | --- |
| `valos-sdk-<version>.tar.gz` | Source archive of the tagged commit |
| `SHA256SUMS` | SHA-256 of that archive |
| `*.sigstore.json` | Cosign keyless signature bundles |
| GitHub artifact attestation | SLSA build provenance for the `.tar.gz` |

The tag must match `v<major>.<minor>.<patch>` with an optional prerelease suffix. The release notes in the GitHub Release are written by the person who publishes it. They need to be a human summary, and they need to name any CVE fixed in that release. `git log` is not release notes.

## How the signature is produced

Signing is Sigstore keyless. Cosign (`v3.1.4`, installed by `sigstore/cosign-installer` pinned to commit `756fe2d284c7292c4e9b62c8a28f1e5629c59532`) asks Fulcio for a short-lived certificate. The identity is the GitHub Actions OIDC token for this workflow. The workflow does not store a signing key and does not read a repository secret.

The certificate identity is:

```text
https://github.com/TokenJunction/valos-sdk/.github/workflows/release.yml@refs/tags/<tag>
```

The OIDC issuer is `https://token.actions.githubusercontent.com`.

Build provenance is `actions/attest-build-provenance` pinned to commit `4d101475d8b20a2381f78447822ac1eab6504dd8` (`v4.2.2`). That action writes a SLSA build-provenance attestation into GitHub's attestation store. This repository does not call `slsa-framework/slsa-github-generator`: that reusable workflow is selected by a mutable tag so verifiers can recognize the builder, which conflicts with pinning every action in this repository to a commit SHA.

## Verify a release

Install Cosign v3.1.4 or a newer v3 release, then replace `<tag>` and `<version>` (`<version>` is `<tag>` without the leading `v`):

```bash
cosign verify-blob \
  --bundle "valos-sdk-<version>.tar.gz.sigstore.json" \
  --certificate-identity "https://github.com/TokenJunction/valos-sdk/.github/workflows/release.yml@refs/tags/<tag>" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  "valos-sdk-<version>.tar.gz"

cosign verify-blob \
  --bundle SHA256SUMS.sigstore.json \
  --certificate-identity "https://github.com/TokenJunction/valos-sdk/.github/workflows/release.yml@refs/tags/<tag>" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  SHA256SUMS

sha256sum -c SHA256SUMS
```

There is no project-owned public key file. The public verification material is the Fulcio certificate inside the bundle, the Rekor transparency-log entry, and the identity above. Reject a bundle whose identity or issuer does not match.

Verify the GitHub attestation (it exists only after a release workflow run):

```bash
gh attestation verify "valos-sdk-<version>.tar.gz" --repo TokenJunction/valos-sdk
```

Git tags are not signed by a maintainer key. The initial commit on `main` carries a signature that this workspace could not verify (`git verify-commit` reported `Can't check signature: No public key`). Signed git tags are not part of the current release process.
