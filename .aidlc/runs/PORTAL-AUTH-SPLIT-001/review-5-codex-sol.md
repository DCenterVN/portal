# Review #5 — PORTAL-AUTH-SPLIT-001
Verdict: BLOCKED

## Findings

| id | severity (Chặn/Nên/Tuỳ) | file:line | problem | concrete repro | fix |
|---|---|---|---|---|---|
| R5-1 | Chặn | `proxy.ts:28`; `app/api/console/route.ts:5`; `app/api/auth/context/route.ts:77` | R4-1 is partially fixed: console pages require the marker, but the console BFF still accepts non-employee sessions. | Using cookies issued by customer login or platform-only staff login: `/console` returns **307**, but `/api/console` passes the proxy and returns **200**, with `contexts=[]` and `permissions=[]`. Reproduced with real handlers and mocked upstream contracts. This establishes console BFF access, not business-data authorization bypass. | Enforce verified employee-context eligibility at the console BFF boundary. Add login→direct-BFF regression tests expecting **403** for customer-only/platform-only sessions. |
| R5-2 | Nên | `lib/api/auth-journey-bff.ts:71`; `lib/api/auth-journey-bff.test.ts:82`; `app/api/auth/staff/bff.test.ts:80` | Marker flags do not mirror refresh: `SameSite=Lax` is hardcoded while auth issues `SameSite=Strict`. Tests labelled “mirroring” explicitly expect the mismatch. | Supply a refresh cookie with `HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=86400` during verified employee login: `portal_plane` receives **SameSite=Lax**. Successful context switching reproduces the same mismatch. | Match the refresh cookie’s SameSite policy, including the no-rotation case. Assert equality against the refresh contract rather than hardcoding `lax`. |

## Checked and fine

- **R4-1 page navigation:** `proxy.ts:22`, `proxy.ts:28` deny customer-only, platform-only and dual-role sessions awaiting selection; verified employees reach console routes.
- **Marker issuance/clearing:** `lib/api/auth-journey-bff.ts:119`, `:146`, `:217`, `:226` clear old markers across successful/failed login paths and issue employee markers only after verified context-switch success; failed switches issue none.
- **Marker/session requirement:** `proxy.ts:22` rejects a marker without session cookies. HttpOnly, Secure, Path and issued refresh Max-Age checks passed at `lib/api/auth-journey-bff.ts:70`; SameSite is R5-2.
- **typedRoutes/invite alias:** `app/(employee-auth)/invite/accept/page.tsx:5` encodes tokens into a fixed staff destination; `as Route` introduces no runtime redirect target.
- **D2/platform separation:** `lib/api/auth-journey-bff.ts:97` verifies platform eligibility and lands at `/platform/companies`; `:108` denies customer-only staff login. `features/platform/workspace.tsx:58` gates platform content.
- **D-141:** `lib/fetcher.ts:17` preserves machine codes; `features/employee-auth/login-form.tsx:27` exposes the customer link only for **403 + FORBIDDEN**.
- **D-142/i18n:** `features/employee-auth/invite-form.tsx:26`, `features/customer-auth/login-form.tsx:27`, `messages/en.json:123`, `messages/vi.json:123` use localized fallback feedback; upstream text was absent in real-form probes across both locales.
- **Wrong journey/session revocation:** `lib/api/auth-journey-bff.ts:108`, `:150`, `:197` deny ineligible staff and await temporary-session logout with its cookie/CSRF before returning.
- **Login CSRF:** `lib/api/auth-journey-bff.ts:48` accepts same-origin metadata or configured public Origin when metadata is absent; hostile/missing provenance fails before upstream calls.
- **Token/cookie leakage:** `lib/api/auth-journey-bff.ts:63`, `:143`, `:191` allowlist cookies and response fields; no credential logging found in reviewed auth code. Invite-token URL preservation follows the plan.
- **Open redirects:** `lib/api/auth-journey-bff.ts:34`, `:58` restrict landing paths and reject client redirect fields; `features/employee-auth/switch-context.tsx:18`, `:29` never consume `?redirect=`.
- **Error projection:** `lib/api/auth-journey-bff.ts:12`, `:81` exclude nested credential bait and upstream cookies; malformed errors become sanitized failures.
- **Tests/verification:** `features/auth-boundary.test.ts:87` exercises negative fixtures; `lib/api/auth-review-fix.test.ts:78` uses the real Next adapter. Fresh probes passed **430 boundary assertions + 144 UI assertions**, with dependencies substituted rather than reviewed units. Flag-oracle weakness is R5-2. `git diff --check` passed; no files written, build, ports or live-backend run.