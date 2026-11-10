# Security policy

## Supported versions

This repository is pre-1.0. No version has been published. GitHub reported zero releases for `TokenJunction/valos-sdk` on 2026-11-10.

| Line | Security fixes |
| --- | --- |
| `main` | In scope |
| Tagged releases | None exist |
| Any other branch, tag, or fork | Out of scope |

## Reporting a vulnerability

Report suspected vulnerabilities in private. Do not open a public GitHub issue for a security report.

1. Open a draft advisory: <https://github.com/TokenJunction/valos-sdk/security/advisories/new>
2. Describe the affected commit or branch, the impact, and how you reproduced it.
3. Keep the report in the private advisory. Maintainers will reply there.

Private vulnerability reporting is turned on. `GET /repos/TokenJunction/valos-sdk/private-vulnerability-reporting` returned `{"enabled": true}` on 2026-11-10. If that page is unavailable, a repository admin needs to keep **Private vulnerability reporting** enabled under Settings → Code security.

GitHub Security Advisories are the private channel. This policy does not publish a personal email address.

## Response process

This is the process maintainers intend to follow. The times below are targets. They are not a claim that a report has already been handled in that time.

1. A human maintainer sends an initial response on the private advisory. Target: within 14 days of the report.
2. The maintainer confirms the report, rejects it, or asks for more detail.
3. Confirmed issues are fixed on `main`. When a release exists, the fix ships in a signed release. See [docs/security/signed-releases.md](docs/security/signed-releases.md).
4. The advisory is published when a fix is available. The reporter is credited in that advisory unless the reporter asks to stay anonymous.

On 2026-11-10 the GitHub API returned an empty security-advisory list for this repository. There is no measured response time, and there is no reporter to credit.

## What to report

Report a problem that crosses a trust boundary described in [docs/security/threat-model.md](docs/security/threat-model.md). That includes committed secrets, private-product source showing up in this public repository, a malicious change to a script a user would run, or a compromise of the release-signing workflow.

This repository does not run a network service and does not ship a runtime SDK yet. Product questions that are not vulnerabilities belong in a public GitHub issue.
