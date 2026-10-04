# Review — PORTAL-SHELL-001

- Reviewer: claude (opus-5.5) + fresh-context ecc:code-reviewer, ecc:typescript-reviewer, ecc:security-reviewer. Worker: codex.
- Scope: `dc4ff95` (S0–S5a) + uncommitted working tree on `8569b90` (S5b–S13), snapshotted into worktree `portal-shell-001-review-and-ship` (staged). PORTAL-PLATFORM-001 (`fa71638`) excluded.
- Verdict: **BLOCKED**

## Independent re-run (snapshot)
- `npm test`: 36 files / 204 tests PASS. `npm run typecheck`: PASS.
- `npm run lint`: **FAIL**. `app/(store)/page.tsx:3` unused `Building2`. The verification receipt omits lint, but AGENTS.md "Check" requires it.

## Findings (verified in code)
1. **HIGH**. `features/store/store-frame.tsx:10-15`: `resolveStoreUser` reads `payload.name`. The auth service `/auth/me` returns `display_name` (`auth/internal/transport/http/dto/profile_dto.go:17`; `lib/auth/client.ts` `UserProfile`). Every logged-in customer renders as a guest ("Đăng nhập"). ConsoleFrame reads `display_name` correctly. Unit tests use hand-written `{name}` payloads, so they cannot catch it.
2. **HIGH**. Lint red (above). The repo check fails.
3. **MEDIUM (spec gap)**. `app/layout-gate.test.ts` lacks AC-1(a) (every `page.tsx` under the 5 roots), (b) (`@/components/layout` imported only by layouts/frames/workspace) and (c) (no `@/components/navbar` import). See plan.md:59-62.
4. **MEDIUM (spec gap)**. TC-5 is missing (plan.md:247). `console-frame.test.ts` does not assert that every `CONSOLE_NAV` href has a `page.tsx`. Related: `mocks/console.ts` has no entry for `/branches`, `/memberships` or `/roles`, so those console pages are unreachable from the sidebar.
5. **MEDIUM (a11y regression)**. `features/platform/workspace.tsx:55,128`: Gate loading/blocked/denied, CompanyPicker and the Suspense fallback changed `<main>` → `<div>`. They render outside ConsoleShell, so those screens now have no main landmark.
6. **MEDIUM**. `features/console/console-frame.tsx:40-49`: every failure (401, 5xx, network, bad JSON) collapses to `EMPTY_SESSION`. An expired session shows "Tài khoản / Chưa chọn chi nhánh", the same as a valid session with no branch. A context 5xx discards a valid profile (`||`). `features/store/store-frame.tsx:19-27` does the same: 5xx → guest.
7. **LOW**. `mocks/console.ts:28` `CONSOLE_STATUS` is a hard-coded "Hệ thống đang hoạt động" with a live dot.
8. **LOW**. `app/(store)/layout.tsx` JSON-LD `JSON.stringify` without `<` escaping. Values are static today.
9. **LOW**. `components/layout/console-sidebar.tsx:43` `<nav>` has no `aria-label`.

Pre-existing / out of scope (noted, not blocking): `sanitizeRedirectUrl` does not reject control chars (`lib/auth/client.ts:142`); proxy public list makes `/products` login-only; `workspace.tsx` `revalidateOnFocus` + error → blocked (PLATFORM-001).

## Mutation checks (12/18 killed = 67%)
Runner: `ESBUILD_BINARY_PATH=/tmp/esbuild node node_modules/vitest/vitest.mjs run <path>` on a scratch copy. Baseline green.

| ID | Mutation | Test | Result |
|---|---|---|---|
| M01 | PageShell `<div>`→`<main>` | layout-gate | KILLED |
| M02 | `backdrop-blur` in toast | layout-gate | KILLED |
| M03 | `@/mocks/console` import in branches-view | layout-gate | KILLED |
| M04 | `../../mocks/console` relative import | layout-gate | **SURVIVED** |
| M05 | raw `<button>` in features | layout-gate | KILLED |
| M06 | `<Button className="bg-red-500">` | layout-gate | KILLED |
| M07 | `<Button onClick={() => 1} className="bg-red-500">` | layout-gate | **SURVIVED** (`(?!>)` stops at `=>`) |
| M08 | `<Button className={"bg-red-500"}>` | layout-gate | **SURVIVED** |
| M09 | `SAMPLE_` constant | layout-gate | KILLED |
| M10 | console ignores active branch | features/console | KILLED |
| M11 | console drops `!ok` check | features/console | **SURVIVED** |
| M12 | context endpoint → `/api/auth/me` | features/console | KILLED |
| M13 | store treats non-200 as user | features/store | KILLED |
| M14 | store drops `!ok` check | features/store | **SURVIVED** |
| M15 | ConsoleShell drops `<main>` | components/layout | KILLED |
| M16 | StoreShell drops `<main>` | components/layout | KILLED |
| M17 | destructive variant uses primary bg | components/ui/button | **SURVIVED** |
| M18 | `<main>` in root layout | layout-gate | KILLED |

## Required to unblock
1. StoreFrame: read `display_name`, and add a test using the real `UserProfile` shape.
2. Remove the unused `Building2`. Add `npm run lint` to the verification checks.
3. Gate: add AC-1(a)(b)(c). Match mock imports by path (`/mocks/`), not alias only. Make the Button-override check survive `=>` and `{"…"}`.
4. Add TC-5 (nav href → `page.tsx`). Decide whether branches/memberships/roles belong in the nav.
5. workspace.tsx: give the non-shell gate screens a `<main>`, or wrap them in a shell, and allowlist that in the gate.
6. Tests for the non-OK branches of both frames (kills M11, M14).
Then re-run `sdlc.py verify`, re-review, and `gate pr`.
