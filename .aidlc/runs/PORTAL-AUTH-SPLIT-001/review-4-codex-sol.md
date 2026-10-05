# Review #4 — PORTAL-AUTH-SPLIT-001
Verdict: BLOCKED

## Findings

| id | severity (Chặn/Nên/Tuỳ) | file:line | problem | concrete repro | fix |
|---|---|---|---|---|---|
| R4-1 | Chặn | `proxy.ts:19`; `features/console/console-frame.tsx:56`; `app/api/auth/context/route.ts:77` | Login landing does not enforce the employee-console boundary. Any session cookie passes the proxy; empty employee contexts still produce a successful console session and render console children. | Log in as platform-only through `/staff/login`, then navigate directly to `/console`. Reproduced with current handlers and valid upstream contracts: proxy **200**, `/api/console` **200**, `contexts=[]`, `permissions=[]`; `fetchConsoleSession()` reports no error. Customer login produces the same result. This demonstrates console access, not backend business permissions. | Require server-verified ACTIVE EMPLOYEE eligibility for console routes and console BFF access. Deny customer-only/platform-only accounts before rendering console content. Add regression tests for direct navigation after both login journeys. |

## Checked and fine

- **typedRoutes / invite alias:** `app/(employee-auth)/invite/accept/page.tsx:5` safely encodes the token into a fixed destination; `as Route` introduces no runtime redirect vulnerability. Real Next redirect and typecheck passed.
- **D2 landing / platform denial:** `lib/api/auth-journey-bff.ts:87` verifies platform eligibility before employee selection and returns `/platform/companies`; customer-only staff login returns 403. Platform UI also checks eligibility at `features/platform/workspace.tsx:58`. Employee-console bypass is R4-1.
- **D-141:** `lib/fetcher.ts:17` preserves the machine code; `features/employee-auth/login-form.tsx:27` shows the customer link only for **403 + FORBIDDEN**, excluding 429/401/500 and other codes.
- **D-142 / i18n:** `features/employee-auth/invite-form.tsx:26` and `features/customer-auth/login-form.tsx:31` use catalog messages and fallback keys. Real forms/client/FetchError checks passed in both `vi` and `en`; upstream message text was absent.
- **Login/session boundary:** `lib/api/auth-journey-bff.ts:98`, `:124`, `:131` reject ineligible staff before publishing cookies and await temporary-session logout with its cookie/CSRF. Context listing/switching independently reject customer-only/platform-only accounts at `:186`.
- **Login CSRF:** `lib/api/auth-journey-bff.ts:49` accepts `Sec-Fetch-Site: same-origin`, or configured public Origin when metadata is absent; cross-site, same-site, missing provenance and foreign Origin were rejected before upstream calls.
- **Token/cookie leakage:** `lib/api/auth-journey-bff.ts:62`, `:126`, `:172` restrict cookies and response projections; no credential logging found in changed auth code. Invite URL token preservation is explicitly required by the plan.
- **Open redirects:** `lib/api/auth-journey-bff.ts:34` normalizes and restricts landing paths; client-supplied redirect fields are rejected at `:59`. External, encoded, backslash and cross-plane probes passed.
- **Error allowlist:** `lib/api/auth-journey-bff.ts:12` projects explicit fields; malformed bodies become sanitized errors at `:74`. Nested credential bait and upstream cookies were excluded.
- **Tests:** `features/auth-boundary.test.ts:87` exercises negative AST fixtures; `lib/api/auth-review-fix.test.ts:69` uses the real Next adapter. BFF tests mock upstream dependencies, while recent feedback tests exercise real clients. They miss the direct-console case in R4-1.
- **Fresh verification:** 207 in-memory assertions passed; typecheck with incremental output disabled, ESLint without cache, and `git diff --check` passed. No files written. Upstreams were mocked; no full Vitest or live-backend run claimed.