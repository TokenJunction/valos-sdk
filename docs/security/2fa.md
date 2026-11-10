# Account protections an admin has to turn on

This repository cannot change GitHub account or branch settings from a pull request. The checks below are the settings an admin still has to enable. Anything this document did not verify is marked unverified.

Observed on 2026-11-10:

- `GET /users/TokenJunction` returned `"type": "User"` and `"name": "ValhallaOS"`. The owner is a user account, not an organization.
- `GET /repos/TokenJunction/valos-sdk/private-vulnerability-reporting` returned `{"enabled": true}`.
- Branch protection could not be read. The API responded `403 Resource not accessible by integration`. That is unverified, not a finding that protection is off.
- `security_and_analysis` came back `null` on the repository object. This token cannot show whether secret scanning, Dependabot, or the dependency graph are enabled. Those items are unverified.
- Whether the owner account has two-factor authentication enabled is unverified. This change cannot see account security settings.

## 1. Two-factor authentication

OpenSSF `require_2FA` needs every person who can change this repository, or who can read private vulnerability reports, to use two-factor authentication. `secure_2FA` needs a cryptographic factor. SMS by itself does not meet `secure_2FA`.

There is no organization, so the organization control does not exist yet:

- Organization → Settings → Authentication security → **Require two-factor authentication for everyone in your organization**

While the owner is the user `TokenJunction`, an admin does this instead:

1. Sign in as the owner and open <https://github.com/settings/security>.
2. Enable two-factor authentication with a security key or an authenticator app (TOTP). Add SMS only as a backup if GitHub requires a second method, and do not leave SMS as the only factor.
3. Open <https://github.com/TokenJunction/valos-sdk/settings/access>. Every collaborator with a role above Read needs the same kind of two-factor authentication. Remove anyone who has not confirmed that.
4. This user-owned repository cannot technically force collaborators to enroll. Treat write access as a manual allowlist. To make the organization switch enforce it, transfer the repository to an organization and turn on the organization setting named above. Transferring is an owner decision; this pull request does not do it.

## 2. Branch protection on `main`

Use a ruleset (Settings → Rules → Rulesets → New branch ruleset) or classic branch protection (Settings → Branches → Add classic branch protection rule) for the default branch `main`.

Set the ruleset to **Active**, target **Include default branch**, and leave the bypass list empty.

Turn these rules on:

- Restrict deletions
- Block force pushes
- Require a pull request before merging
  - Required approvals: 1
  - Dismiss stale pull request approvals when new commits are pushed
  - Require approval of the most recent reviewable push
- Require status checks to pass before merging, and require the branch to be up to date. Add these checks once they have run on `main`:
  - `Tests`
  - `Gitleaks`
  - `Analyze (javascript)`
  - `Analyze (actions)`
  - `Dependency review`
  - `Scorecard analysis`
- Require signed commits, if every committer has an SSH or GPG signing key. This is feasible and it is not turned on by this pull request. The existing initial commit's signature was not verified in the workspace that prepared this change.
- Do not enable "Require review from Code Owners" until a `CODEOWNERS` file exists. There is no `CODEOWNERS` file.

Classic protection uses the same controls under the names "Require a pull request before merging", "Require approvals", "Dismiss stale pull request approvals when new commits are pushed", "Require status checks to pass before merging", "Require signed commits", "Do not allow bypassing the above settings", and "Do not allow force pushes" / "Do not allow deletions".

## 3. Code security settings

Open Settings → Code security for this repository and turn on:

- Dependency graph
- Dependabot alerts
- Dependabot security updates
- Secret scanning
- Secret scanning push protection
- Private vulnerability reporting (already enabled; leave it enabled)
- Code scanning (the CodeQL workflow in this repository uploads results; an admin may still need to enable the code scanning feature the first time)

`.github/dependabot.yml` only takes effect after the dependency graph is available. Whether it is available was unverified on 2026-11-10.

## 4. What this pull request already contains

The pull request adds CI that fails on secret-shaped content, a dependency-review workflow, CodeQL, OpenSSF Scorecard, and a release workflow that signs with Sigstore. Those workflows do not replace the admin settings on this page. A direct push to `main` skips them until branch protection requires the checks.
