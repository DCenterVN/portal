# PORTAL-AUTH-SPLIT-001 — review fix round 1

## Where it started

Branch `portal-auth-split`; the existing uncommitted implementation is the baseline. Coordinator accepted R1–R4 from `review-1-codex-sol.md`. Used the approved `plan.md` and the explicit review-fix scope. No SDLC engine, commit, push, or arch-baseline edit was performed. This report is the only `.aidlc` file written during this round.

Graph discovery was attempted: project listing succeeded, but search/coverage calls were rejected by automatic approval review under the never-approval policy. Direct bounded source reads/searches supplied the evidence instead. Applied surgical-patch; handoff context is consolidated here within the authorized report scope.

## Decisions locked + what shipped

### R1 — JSON and same-origin gate

Files: `lib/api/auth-journey-bff.ts`, `lib/api/auth-review-fix.test.ts`, `lib/api/auth-journey-bff.test.ts`, `app/api/auth/bff.test.ts`, `app/api/auth/staff/bff.test.ts`.

Searched `proxy.ts`, `lib/`, and `app/api/` for Origin/Fetch Metadata/CSRF handling. Existing refresh/logout handlers forward cookie CSRF tokens; no reusable origin gate was found in those sources. One check now lives in shared `readFields`, used by both login journeys, every customer mutation, invite acceptance, and staff context switching. It requires media type `application/json` (charset permitted) plus exact Origin equality with `new URL(req.url).origin`. Only when Origin is absent may `Sec-Fetch-Site: same-origin` or `none` substitute. Rejection uses the existing 403 `FORBIDDEN`, before upstream calls or cookies. Same-origin context switching retains missing-session 401 precedence over DTO validation.

Red→green tests:

- `R1 rejects untrusted POST before upstream or cookie`: nine handler instances failed before implementation, then passed. Covers independent content-type/origin failures, opaque/wrong origins, missing provenance, and all shared POST operations.
- `R1 permits absent Origin with %s metadata and JSON charset`: positive controls pass for `same-origin` and `none`.
- `R1 cross-site text/plain %s login cannot replace a session`: added direct customer/employee attack reproductions with valid attacker credentials and real handlers. Removing the guard produced 200 for both; restoring it produced 403, zero upstream calls, zero cookies.

Mutation: replaced `if (!json || !sameOrigin) return forbidden();` with `void json; void sameOrigin;`. Focused `-t R1` run exited 1: **11 failed, 2 passed, 14 skipped**. Assertion failures include the reproduced 200 responses. Restored the source in `finally`.

### R2 — actual invite success envelope

Files: `lib/api/auth-journey-bff.ts`, `lib/api/auth-review-fix.test.ts`, `app/api/auth/staff/bff.test.ts`.

Invite acceptance now reuses `decodePlatform` to validate the success envelope, validates `data.status === "activated"`, and publishes only `{status:"activated"}`. Replaced the existing flattened success fixture with `{code:200,status:"success",message:"OK",data:{status:"activated",…}}`.

Checked other projections against the real handlers:

| Projection | Actual Go source | Wire shape / result |
| --- | --- | --- |
| login | `../auth/internal/transport/http/web_auth.go:117–128` | `response.JSON` with raw `WebLoginResponse`; current raw decoding is correct |
| me | `../auth/internal/transport/http/context_profile.go:82–94` | `response.JSON` with raw `UserProfileResponse`; current raw decoding is correct |
| org-context | `../auth/internal/transport/http/context_profile.go:214` | `response.JSON` with raw `SwitchOrgResponse`; current raw decoding is correct |
| access-contexts | `../org/internal/transport/http/access_contexts.go:92` | `response.JSON` with raw array; current array decoding is correct |
| platform/me | `../org/internal/transport/http/platform.go:68,117` | `response.Success`; existing `decodePlatform` is correct |
| invite accept | `../auth/internal/transport/http/invite.go:67`, `../platform-go/response/response.go:40` | `response.Success`; fixed to unwrap `data` |

Red→green tests:

- `R2 accepts real invite envelope then rejects replay without a session`: real success fixture returned 503 before fix, now 200; the subsequent mocked backend replay rejection remains 400/no cookie.
- `R2 rejects invalid invite success %j`: flattened `{status:"activated"}` incorrectly returned 200 before fix, now 503; malformed envelope/status controls also pass.
- Existing `accepts exact invite DTO via invite purpose endpoint; never password reset; no credentials/cookies`: corrected fixture failed before fix and passes afterward.

Mutation: bypassed envelope decoding and validated top-level `status` again. Focused `-t R2` run exited 1: **2 failed, 2 passed, 23 skipped**. Real success regressed to 503; flattened success incorrectly returned 200. Mutation restored.

### R3 — actual console routes share one employee classifier

Files: `lib/fetcher.ts`, `proxy.ts`, `proxy.test.ts`, `lib/fetcher.test.ts`, `app/(auth)/legacy-context.test.ts`.

Extracted `CONSOLE_ROUTES` from the actual `app/(console)` page tree, not `mocks/console.ts`. `isEmployeeRoute` in the client-safe fetcher module is shared by proxy and failed-refresh handling. The route registry covers every current console page and descendants, `/staff/*`, `/platform/*`, and legacy `/switch-branch`/`/switch-org`. An exact-equality test reads the authoritative page tree and fails if the registry drifts. A new page requires updating this registry; the test enforces that update. Customer `/orders`, `/me`, `/products/*`, and `/checkout` retain customer login.

The existing legacy page redirects already target `/staff/switch-branch` and `/staff/switch-org`; production page edits were unnecessary. Added tests invoking those actual page functions.

Red→green tests:

- `R3 unauthenticated %s uses staff login`: 13 failing real URL instances became green; includes branches, memberships, roles, inventory/shelves, all production pages, sales/pricing, platform, and both legacy aliases. `/console` was already correct.
- `R3 failed refresh from %s uses staff login`: the same 13 failing real URL instances became green.
- `R3 route registry equals authoritative console route group`: exact page-tree/registry equality passes.
- `R3 customer %s uses customer login`: customer controls pass.
- `R3 legacy page redirects into staff journey`: both unchanged legacy pages pass.

Mutation: replaced the shared classifier's route set with `["/staff", "/console"]`. Ran `proxy.test.ts lib/fetcher.test.ts -t R3`; exit 1: **26 failed, 7 passed, 44 skipped**. Mutation restored. Legacy page tests were added afterward as checks of the existing redirects.

### R4 — preserve real machine-readable error codes

Files: `lib/api/auth-journey-bff.ts`, `lib/api/auth-review-fix.test.ts`.

Shared public error projection now reads `errors.error_code` from the real platform-go error envelope (`../platform-go/response/response.go:89`), publishes it as the existing public `error`, and preserves message/retry metadata. Invite, verified-context lookup, and context switch errors use shared `upstreamError`; login/profile/platform/staff-decision errors already use it. Customer mutation forwarding uses the same public projection. Standard enveloped errors are projected through an explicit public field list, excluding credential-bearing data. HTTP status and Retry-After survive; upstream cookies do not.

Red→green test: `R4 preserves real error envelope at %s`, ten instances: login, customer operation, invite, context listing, org lookup, explicit switch, profile, platform, staff contexts, automatic staff switch. All ten failed before the fix, then passed. Fixtures include `{code,status:"error",message,errors:{error_code},retryable}` plus credential bait; assertions exercise status, code, message, retry header, redaction, and no cookies.

Mutation: changed `error: data.errors.error_code` back to `error: data.error`. Focused `-t R4` run exited 1: **10 failed, 17 skipped**. Mutation restored.

## Verification

Initial red run, before production fixes: four files, **48 failed / 90 passed**, including every accepted finding. First focused green run after fixes: six files, **231 passed / 0 failed**. Final restored-source full suite: **44 files / 682 passed / 0 failed**, exit 0.

Final checks actually executed (shell commands routed through `rtk proxy`):

- `ESBUILD_BINARY_PATH=$HOME/.local/share/esbuild/esbuild-0.21.5 npm test`: exit 0, 682 passed, 0 failed.
- `npm run lint`: exit 0.
- `npm run typecheck`: exit 0.
- `python3 .aidlc/runs/PORTAL-REBRAND-001/testkit/check-brand.py`: exit 0, `brand gate: 0 errors (all)`.
- `python3 /home/dawn/agent_skills/sdlc/engine/archcheck.py`: exit 0, `56 violations, 56 baselined, 0 new, 0 stale`; baseline was not edited.
- `git diff --check`: exit 0.

Intermediate typecheck identified a test header-union type error; corrected with a typed header list. A later legacy test used an unavailable Vitest matcher; replaced with supported call-argument/count assertions. Final lint, typecheck, and full tests were rerun after both corrections.

Temporary evidence: `/tmp/auth-review-red.log`, `/tmp/auth-review-green.log`, `/tmp/auth-review-final-tests.log`, `/tmp/auth-mutation-R1.log` through `/tmp/auth-mutation-R4.log`, `/tmp/auth-review-mutation-summary.log`. All four final mutation runs exited 1 because behavioral assertions failed, not because compilation failed. Each mutation was restored before final validation.

## Key files for next session

`lib/api/auth-journey-bff.ts`, `lib/api/auth-review-fix.test.ts`, `lib/fetcher.ts`, `proxy.ts`, `proxy.test.ts`, `lib/fetcher.test.ts`, `app/(auth)/legacy-context.test.ts`, `app/api/auth/staff/bff.test.ts`, `app/api/auth/bff.test.ts`, `lib/api/auth-journey-bff.test.ts`.

## Running state

None. Implementation remains uncommitted on `portal-auth-split`; no commit/push performed.

## Deferred + open questions

No live backend/browser execution or real consumed-token replay was run. Invite replay coverage supplies the real error envelope through mocked upstream fetch; it does not verify backend persistence. Existing D3 staff recovery dependency remains unchanged. Console registry freshness is enforced by the page-tree test rather than runtime filesystem access in the browser.

## Pick up here

Coordinator can review the uncommitted fixes and this evidence. No new plan approval is requested in this accepted review round.

## Round 2 (review-2 R2-1, R2-2) — codex sol medium implemented, stopped at "model at capacity"; finished and checked by Claude 2026-10-04

- R2-1: `lib/api/auth-journey-bff.ts` readFields — same-origin decided by `Sec-Fetch-Site === "same-origin"`; when absent, `Origin` must equal `NEXT_PUBLIC_SITE_URL` origin (dev default http://localhost:3000). req.url / Host / X-Forwarded-Host are not used. Content-Type must be application/json. Reject = 403 FORBIDDEN "Yêu cầu không hợp lệ" (Claude: was reusing the staff-permission message), no upstream call, no cookie.
- R2-2: `publicError` returns an explicit allowlist (error, message, retryable, retry_after_ms, errors.fields[{field,message}]); upstream objects are never spread.
- Claude fix: `lib/api/auth-review-fix.test.ts` dynamic `import("node:module")` broke typecheck (TS2339) → static `import {createRequire} from "node:module"`.
- Tests: `lib/api/auth-review-fix.test.ts` describe "Round 2" (real Next adapter with listener URL https://localhost:3000, Host portal.test / portal.internal:3000 → 200).
- Mutations (Claude, full `npm test`, restored byte-identical):
  - M1 missing Sec-Fetch-Site → allow: 11 failed / 693 — KILLED
  - M2 accept `same-site`: 2 failed / 693 — KILLED
  - M3 spread upstream body into error projection: 19 failed / 693 — KILLED
- Final: npm test 693/693 · lint exit 0 · typecheck exit 0 · brand gate 0 errors · archcheck 0 new, 0 stale.
