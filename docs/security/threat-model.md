# Threat model and assurance case

This is the security assurance case for the public repository `TokenJunction/valos-sdk`. It describes the trust boundaries, assets, threats, mitigations that exist in this repository, and the gaps. Statements this change did not verify are marked **unverified**.

The repository, as of the parent commit `5ae82406912a4f39db3e72d05bf7a9d32d782321` plus this change, contains documentation and CI scripts. The README describes it as the ValhallaOS SDK, setup scripts, and docs. There is no SDK runtime, no network client, no trading code, no DNS code, and no wallet implementation in the tree. There is no published release.

## Security requirements

1. A vulnerability report can be sent in private, and the public documentation says how.
2. Material that must stay private does not land on `main`: private-product source, `.env` files, private keys, tokens, owner email addresses, wallet secrets, or sourcemaps in a published archive.
3. Release assets for a published GitHub Release are signed without a long-lived signing key stored in the repository or in GitHub Actions secrets.
4. Dependency changes and JavaScript/Actions sources are scanned before they are relied on.
5. Encryption added to this repository later uses AES-256-GCM. The tree does not implement encryption today. 3DES, RC4, single DES, and Node's legacy `createCipher` / `createDecipher` APIs are rejected in source files by `scripts/leak-guard.mjs`.

## Assets

| Asset | Where it lives | Notes |
| --- | --- | --- |
| Public source and docs | This git repository | World-readable. Integrity matters. |
| Future release archive | GitHub Release, after one exists | None exist today. |
| Customer API keys and wallet secrets | Customer environment | No code in this repository reads them. |
| Private-product source | Outside this repository | Must not be copied here. |
| Release-signing identity | Short-lived GitHub Actions OIDC token | No maintainer private key is stored for releases. |
| GitHub account that can push | Owner `TokenJunction` and any collaborators | Who has write access is **unverified**. |

## Trust boundaries

```text
public internet
    |
    |  read-only
    v
GitHub.com  ----  TokenJunction/valos-sdk (public git, Issues, Actions, Releases)
    |
    |  write: owner and collaborators (membership unverified)
    v
GitHub-hosted Actions runner
    |
    |  OIDC, only on the release workflow
    v
Fulcio / Rekor and GitHub artifact attestations

Customer machine  (no setup script is shipped yet)
    |
    x  no code path in this repository accepts the customer's keys
```

Boundaries that do not exist yet, because the code does not exist:

- An SDK process talking to a network API.
- A boundary between customer-supplied API keys and this code.
- A build that emits JavaScript sourcemaps.

## Threats and the mitigations that exist

| Threat | Mitigation that exists in this repository | Limit |
| --- | --- | --- |
| Public issue discloses a vulnerability | [SECURITY.md](../../SECURITY.md) points reporters at GitHub private vulnerability reporting. The API reported that feature enabled on 2026-11-10. | Response time is a target, not a measured result. No advisory exists. |
| Private-product source or its repository slug is committed | `scripts/leak-guard.mjs` fails CI when the slug or the repository name appears in a tracked path or file. | It matches names. It cannot recognize unlabeled copied source. |
| `.env`, private keys, tokens, or wallet secrets are committed | The leak guard fails on those filenames and on high-confidence secret shapes. Gitleaks v8.30.1 fails the build as well. `.gitignore` ignores `.env` files (except `.env.example`), key filenames, and `*.map`. | Ignore rules do not stop `git add -f`. CI is the check. Bypass is possible until branch protection is on. Branch protection is **unverified**. |
| An owner email address is committed | The leak guard fails on email addresses other than `users.noreply.github.com`, `noreply.github.com`, and the `example.com` / `example.org` / `example.net` documentation domains. The real addresses are not stored in the guard. | A secret written without an `@` is a different rule. |
| A sourcemap ships in git or in the release archive | Tracked `*.map` files fail the leak guard. `scripts/prepare-release-archive.mjs` fails if `git archive` output contains a `.map` path. | No package is published to npm. `package.json` is `"private": true`. |
| A malicious or vulnerable dependency | `package-lock.json` lists npm dependencies. The count is zero. Dependabot is configured for `npm` and `github-actions`. Dependency review runs on pull requests. | There is nothing to patch until a dependency is added. Whether GitHub's dependency graph is enabled is **unverified**. |
| A compromised GitHub Action tag | Actions in `.github/workflows/` are pinned to full commit SHAs. Workflow permissions start at `{}` and each job sets the scopes it uses. Workflows do not reference `secrets.*` and do not use `pull_request_target`. | The runner image label `ubuntu-24.04` is not pinned by digest. **Unverified** against a future runner-image compromise. |
| A tampered release archive | On `release: published`, Cosign keyless signs the archive and `SHA256SUMS`. `actions/attest-build-provenance` records SLSA build provenance. Verification steps are in [signed-releases.md](signed-releases.md). | No release has run. Signatures do not exist yet. This mitigation is **unverified** until the first release workflow succeeds. |
| A release tag with a hostile name | `parseReleaseTag` allowlists `v<major>.<minor>.<patch>` plus an optional prerelease suffix before the name is used in a path. | That is the only external input the scripts parse. |
| Weak cipher added to source | The leak guard fails source files that name 3DES, RC4, single DES, or Node's legacy cipher helpers. | No encryption code exists, so this is a guardrail, not a property of a cryptographic protocol. |
| elizaOS code copied without its MIT notice | `scripts/license-notice-check.mjs` fails code files that name elizaOS unless the same file keeps an MIT notice. | No elizaOS code is in the tree. See [licensing.md](licensing.md). |

## Secure design principles

Applied to the scripts and workflows that exist:

- **Economy of mechanism.** Each workflow has one job family: CI tests and secret scanning, CodeQL, dependency review, Scorecard, or release signing.
- **Fail-safe defaults.** Workflow permissions are empty, then raised per job. The leak guard exits non-zero when a rule matches. An unknown release tag is rejected.
- **Complete mediation.** Mediation on merge is **not** established. GitHub Actions runs only when a workflow is triggered. An admin must require the checks on `main`. That setting was **unverified**.
- **Open design.** This document, `SECURITY.md`, and the CI rules are public. Security does not depend on hiding those rules.
- **Separation of privilege.** Release signing uses the workflow's OIDC identity. The default git checkout does not persist credentials (`persist-credentials: false`).
- **Least privilege.** The release job is the only job with `contents: write`, `id-token: write`, and `attestations: write`. Other jobs request `contents: read`, plus `security-events: write` where they upload analysis results.
- **Least common mechanism.** Workflows do not share a long-lived credential. None is defined in the repository.
- **Psychological acceptability.** Reporting is the GitHub advisory form linked from `SECURITY.md`, not a custom channel.

## Common implementation weaknesses

| Weakness | Status in this repository |
| --- | --- |
| Injection into a script from a GitHub event field | Release tag and ref are passed through environment variables and checked against an allowlist before they are used in a filename. |
| Broken access control on `main` | **Gap.** Branch protection and required reviews are an admin checklist in [2fa.md](2fa.md). Not verified. |
| Cryptographic failure in product code | No product cryptography is implemented. Release signing uses Sigstore (Fulcio, Rekor, Cosign), which this repository does not reimplement. |
| Sensitive data in the tree | Leak guard, Gitleaks, and `.gitignore`, with the limits in the table above. |
| Vulnerable and outdated components | No npm dependencies. Monitoring is configured and has an empty set to monitor. |
| Identification and authentication failures | No application login. GitHub account 2FA is an admin control and is **unverified**. |
| Security logging and monitoring | GitHub Actions logs and code-scanning uploads exist once workflows run. There is no separate application audit log. **Gap** for a future SDK runtime. |
| Server-side request forgery and related web flaws | No network client is implemented. Not applicable to the current tree. |

## Argument

The security requirements that match the current tree are the public reporting path, the CI guards against committed secrets and private-product names, SHA-pinned workflows with job-scoped permissions, and a release workflow that can sign a future source archive without a stored key.

The argument does not extend to a running SDK. Input validation, hardening of a production process, TLS choices, and dynamic analysis of product code have no implementation to point at. Claiming those would be false. They are gaps until the code exists.

The argument also depends on GitHub settings this pull request cannot change. Those are listed in [2fa.md](2fa.md) and in the gaps below.

## Gaps

- No human security review is recorded. See the table at the end of this file.
- Write access, two-factor authentication, branch protection, required reviews, signed-commit enforcement, secret scanning, and the dependency graph were **unverified** with the token available to this change.
- The owner is a GitHub user, not an organization, so organization-wide 2FA enforcement cannot be switched on in place.
- No OSI license is selected. See [licensing.md](licensing.md).
- No release has been signed. The signing workflow is untested in GitHub Actions until the first published release.
- Runner images are pinned to the `ubuntu-24.04` label, not to an image digest.
- The leak guard does not detect private source that omits the private repository's name.
- There is no application, so there is no application allowlist for customer input, no runtime hardening, and no dynamic analysis of product behavior.
- There is no SBOM of third-party components, because the npm tree has no dependencies and there is no compiled build.
- Git tags are not signed by a maintainer key.
- A direct push can skip CI until an admin requires the status checks.

## Security review record

Gold on the OpenSSF Best Practices badge asks for two unaffiliated human reviewers. AI reviews, bot reviews, and the author of an automated change do not count toward those two unaffiliated human reviewers. Criterion `security_review` also stays unmet until a human records a review that considers the security requirements and the security boundary in this document.

Leave the rows blank until that human review happens. Do not enter an AI assistant, a bot, or a coding agent.

| Date (UTC) | Reviewer | Affiliation | Independent of the maintainers | Scope | Findings | Record |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
