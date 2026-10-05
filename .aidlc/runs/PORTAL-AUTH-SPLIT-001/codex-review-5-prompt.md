Independent code review #5 of PORTAL-AUTH-SPLIT-001 (portal, branch portal-auth-split, uncommitted working tree = the change). READ-ONLY: do not edit any file.

Context (read only these first): portal/AGENTS.md; .aidlc/runs/PORTAL-AUTH-SPLIT-001/plan.md (Requirements, Design, D2 decision 2026-10-05); review-3-codex-sol.md (previous PASS) and review-fix-report.md; handback.md.
Diff: `git diff HEAD` plus untracked files from `git status --porcelain` (ignore .aidlc/).

Since review #3 these changed — review them hardest:
1. app/(employee-auth)/invite/accept/page.tsx `as Route` (typedRoutes).
2. D2: platform staff log in at /staff/login → /platform/companies (lib/api/auth-journey-bff.ts ~87-90). Verify a platform-only account can never reach the employee console and a customer can never reach staff/platform.
3. D-141/D-142 fix: lib/fetcher.ts, features/{employee,customer}-auth/*, messages/*.json — customer link only on 403 FORBIDDEN; no upstream message text rendered; i18n fallback.

Then the whole change for: auth/session boundary (wrong journey → 403 + temp session revoked), CSRF on login (Sec-Fetch-Site / Origin == NEXT_PUBLIC_SITE_URL), token/cookie leakage (URL, logs, error bodies), open redirect via next_path, error projection allowlist, tests that are tautological or mock the unit under test.

Output: write NOTHING to disk; print the report in this exact shape:
# Review #5 — PORTAL-AUTH-SPLIT-001
Verdict: PASS | PASS_WITH_RISK | BLOCKED
## Findings
| id | severity (Chặn/Nên/Tuỳ) | file:line | problem | concrete repro | fix |
## Checked and fine
(one line per area above, with file:line evidence)
Only real, reproducible problems count; style nits go to Tuỳ. Out of scope (do not report): D-144 client IP rate limit, mobile acceptance, D-140 platform login page, D-143 staff recovery.

Review #4 (.aidlc/runs/PORTAL-AUTH-SPLIT-001/review-4-codex-sol.md) was BLOCKED on R4-1 (console reachable by customer-only / platform-only sessions). It has been fixed with a server-issued httpOnly marker cookie `portal_plane=employee` set only after org-verified employee context (staff console login, staff switch-org/branch success), cleared on every login, required by proxy.ts for CONSOLE_ROUTES. Verify first and hardest:
- R4-1 repro from review #4 now fails for customer-only and platform-only, including dual-role before choosing an employee context; employee still reaches console.
- Marker cannot be obtained or kept by a non-employee: every login path clears it; failed switch never sets it; marker flags mirror the refresh cookie (httpOnly, Secure, SameSite, Path, Max-Age).
- Marker alone without a session does not open console; no new open redirect via the ?redirect= param.
Then confirm the review #4 "Checked and fine" items still hold.
Note: the sandbox cannot bind ports; do not run next build. Fresh gates were run by the coordinator outside the sandbox: 7/7 PASS incl. build, npm test ≥747.
