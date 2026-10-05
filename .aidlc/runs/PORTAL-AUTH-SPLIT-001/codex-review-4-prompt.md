Independent code review #4 of PORTAL-AUTH-SPLIT-001 (portal, branch portal-auth-split, uncommitted working tree = the change). READ-ONLY: do not edit any file.

Context (read only these first): portal/AGENTS.md; .aidlc/runs/PORTAL-AUTH-SPLIT-001/plan.md (Requirements, Design, D2 decision 2026-10-05); review-3-codex-sol.md (previous PASS) and review-fix-report.md; handback.md.
Diff: `git diff HEAD` plus untracked files from `git status --porcelain` (ignore .aidlc/).

Since review #3 these changed — review them hardest:
1. app/(employee-auth)/invite/accept/page.tsx `as Route` (typedRoutes).
2. D2: platform staff log in at /staff/login → /platform/companies (lib/api/auth-journey-bff.ts ~87-90). Verify a platform-only account can never reach the employee console and a customer can never reach staff/platform.
3. D-141/D-142 fix: lib/fetcher.ts, features/{employee,customer}-auth/*, messages/*.json — customer link only on 403 FORBIDDEN; no upstream message text rendered; i18n fallback.

Then the whole change for: auth/session boundary (wrong journey → 403 + temp session revoked), CSRF on login (Sec-Fetch-Site / Origin == NEXT_PUBLIC_SITE_URL), token/cookie leakage (URL, logs, error bodies), open redirect via next_path, error projection allowlist, tests that are tautological or mock the unit under test.

Output: write NOTHING to disk; print the report in this exact shape:
# Review #4 — PORTAL-AUTH-SPLIT-001
Verdict: PASS | PASS_WITH_RISK | BLOCKED
## Findings
| id | severity (Chặn/Nên/Tuỳ) | file:line | problem | concrete repro | fix |
## Checked and fine
(one line per area above, with file:line evidence)
Only real, reproducible problems count; style nits go to Tuỳ. Out of scope (do not report): D-144 client IP rate limit, mobile acceptance, D-140 platform login page, D-143 staff recovery.
