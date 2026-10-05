Task PORTAL-AUTH-SPLIT-001 — fix review #4 finding R4-1 (Chặn). Repo /mnt/win_d/feature/ticket/portal, branch portal-auth-split; uncommitted work is the task itself — no commit/stash/reset/branch switch.
Read: .aidlc/runs/PORTAL-AUTH-SPLIT-001/review-4-codex-sol.md (R4-1), plan.md Design, then proxy.ts, lib/fetcher.ts (CONSOLE_ROUTES), lib/api/auth-journey-bff.ts, app/api/auth/staff/{login,switch-org,switch-branch}/route.ts.

Problem: proxy.ts only checks session cookies exist, so a customer-only or platform-only session opens /console (and every CONSOLE_ROUTES page) and gets the console shell with empty contexts.

Design (decided by coordinator; keep it this small):
- A server-issued marker cookie `portal_plane=employee` (httpOnly, Secure when the existing cookies are Secure — mirror their flags, SameSite=Lax, Path=/, same max-age as the refresh cookie) is SET by the BFF only when an employee context is verified by org: successful staff login that lands on /console, or a successful staff switch-org / switch-branch.
- EVERY login through auth-journey-bff (customer login, staff login incl. platform landing) first CLEARS the marker, then sets it only in the employee case above. Platform landing (/platform/companies) and customer login never set it.
- proxy.ts: for CONSOLE_ROUTES (lib/fetcher.ts), a session without `portal_plane=employee` → redirect to /staff/switch-org?redirect=<path> if the user may still pick a context, otherwise keep it simple: redirect to /staff/switch-org (that page already rejects non-employees via the BFF). /staff/*, /platform/* and customer routes are unchanged.
- The marker is a UI gate only; data authorization stays in org (say so in a one-line comment).

TDD: first add failing tests — proxy.test.ts: customer session + /console → redirect; platform session (no marker) + /console and /branches → redirect; employee marker → next. app/api/auth/staff/bff.test.ts / lib/api/auth-journey-bff.test.ts: staff login to /console sets marker; platform landing does not and clears an old one; customer login clears it; switch-org/branch success sets it, failure does not. Run npm test red, then implement, then green.
Only these files: proxy.ts, proxy.test.ts, lib/api/auth-journey-bff.ts, lib/api/auth-journey-bff.test.ts, app/api/auth/staff/bff.test.ts, and the staff switch/login route files if they set cookies themselves. Anything else → stop and report.
Gates (sandbox cannot bind ports, so skip build): npm test (all), npm run lint, npm run typecheck. Report files changed, test names added, red count, green counts.
