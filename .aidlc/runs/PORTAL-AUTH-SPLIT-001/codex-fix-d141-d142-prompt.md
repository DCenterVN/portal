Task PORTAL-AUTH-SPLIT-001 — follow-up fix D-141 + D-142 before PR. Repo: /mnt/win_d/feature/ticket/portal (branch portal-auth-split, uncommitted work is the task itself — do not commit, stash, reset or switch branch).

Read only: portal/AGENTS.md, .aidlc/runs/PORTAL-AUTH-SPLIT-001/plan.md (sections Design + Slices), then the files below.

D-141 (link sai journey): features/employee-auth/login-form.tsx:30 renders the "customerLogin" link (/login) under EVERY error, e.g. 429 "Quá nhiều yêu cầu". Show it only when the error is the wrong-journey rejection (HTTP 403 FORBIDDEN from the staff login BFF, see lib/api/auth-journey-bff.ts). Check features/customer-auth/login-form.tsx for the mirror case (staff link on customer screen) and apply the same rule.

D-142 (raw upstream text): forms render err.message from the API client, so auth's English text ("invalid or expired token") reaches a Vietnamese UI. Sites: features/employee-auth/{login-form,invite-form,switch-context}.tsx, features/customer-auth/{login-form,reset-form,register-form,activate-view}.tsx. Fix at the root, once: the client (lib/api/employee-auth.ts, lib/api/customer-auth.ts, or the shared fetcher they use) must expose the public error code/status it already projects; forms choose a next-intl message by code and fall back to their existing generic key. Never render upstream message text. Reuse existing message keys in messages/vi.json + en.json; add a key only when none fits (both files). Do not add a new error code.

Rules:
- TDD: first add failing tests (journey.test.tsx of each feature, or the existing client tests) for: 429 on staff login → no customer link + Vietnamese rate-limit text; 403 wrong journey → link shown; upstream English message → not rendered. Run `npm test` red, then fix, then green.
- Change only files listed in the plan's Files planned (all of the above are). If you need another file, stop and say so.
- No new helpers when one exists (grep lib/ first). Code shape: early return, short functions.
- Gates, all must pass: npm test (≥ 693 passed), npm run lint, npm run typecheck, npm run build. Use `npm`, not pnpm (NTFS).
- Do not edit .aidlc/ receipts, do not run sdlc.py approve/review, no commits.

End with: files changed, tests added (names), the four gate results with counts.
