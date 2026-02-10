# Security Automation Baseline

This repository uses automated screening to reduce manual security burden.

## Implemented In-Repo

- CI quality checks (`.github/workflows/ci.yml`)
- Security workflow (`.github/workflows/security.yml`)
  - Dependency Review (PRs)
  - CodeQL
  - Semgrep
  - gitleaks secret scanning
- Dependabot updates (`.github/dependabot.yml`)
- PR screening checklist (`.github/pull_request_template.md`)
- Structured issue intake (`.github/ISSUE_TEMPLATE/*`)

## Required GitHub Settings (UI)

Configure branch protection / ruleset on `main`:

1. Require pull request before merging.
2. Require status checks to pass.
3. Include these required checks:
   - `build` (from CI workflow)
   - `Dependency Review`
   - `CodeQL`
   - `Semgrep`
   - `Secret Scan (gitleaks)`
4. Dismiss stale approvals on new commits.
5. Restrict who can bypass branch protections.
6. Disable force pushes.

## Operating Model

- Treat failed security checks as merge blockers.
- Prefer small PRs to improve auditability.
- Require linked issue/discussion for non-trivial changes.
- Enforce tests for behavior changes.
