# Portal UI E2E smoke — 2026-09-28

## Method

- Browser: Playwright Chromium installed temporarily under `/tmp/portal-ui-e2e`; no dependency or application code changed.
- Base URL: `http://localhost:3000` (the local dev server returned 403 for JavaScript chunks on the `127.0.0.1` hostname; `localhost` loaded all assets).
- Viewports: desktop 1440×900 and mobile 390×844.

## UI results

- `/`, `/login`, and `/register`: HTTP 200; expected page headings rendered.
- Password visibility toggle: PASS.
- Register link from login: PASS; navigates to `/register`.
- Invalid email: browser form validation blocks it, PASS.
- Horizontal overflow: none on login/register at 390px or register at 1440px, PASS.
- Unauthenticated `/products`, `/roles`, `/console`, `/branches`, `/memberships`, `/platform/companies`, and `/company`: each redirects to `/login` and preserves its `redirect` query, PASS.
- Browser page errors and HTTP responses ≥400 on the `localhost` run: 0.

Screenshots: `evidence/home-1440.png`, `evidence/login-1440.png`, `evidence/login-390.png`, `evidence/register-1440.png`, `evidence/register-390.png`.

This smoke test covers public auth UI and logged-out route behavior. It does not establish an authenticated customer, employee, or owner session, and it does not cover the full shopping, employee-workspace, or organization-admin journey. Those UI journeys need their pages plus isolated accounts before they can pass browser E2E.

## Supplemental HTTP integration baseline (not UI E2E)

- The normal `npm test -- tests/integration/portal-backend.it.test.ts` invocation dropped arguments and ran 29 unit test files (144 tests passed); it did not run integration tests.
- Direct Vitest execution of `tests/integration/portal-backend.it.test.ts` against Portal/Auth: 5 passed, 4 failed. Activation URL did not match `PORTAL_IT_BASE`, activation returned 400, login returned 403, and an existing expected-failure route test unexpectedly passed. The customer session was not established, so that route-test result is inconclusive.

## Follow-up

1. Add repeatable Playwright/Chromium setup to the approved Portal plan.
2. Provide isolated customer, employee, and owner accounts so browser E2E can exercise authenticated UI flows.
3. Fix the HTTP integration harness separately if that suite remains required.
4. Org branch-directory and employee-invitation flows remain unavailable through the current published Org API.

## Authenticated route sweep — local QA employee

- Logged in through the visible Portal login form with the isolated local QA employee (`VT-21`). No backend code or persistent business data was changed.
- Swept 27 existing page routes in Chromium at 1440×900: 26 returned HTTP 200; `/traceability/DEMO` returned HTTP 500 (`This page couldn’t load`). Some protected routes redirected to login or home based on the current session/context.
- `/console` rendered but reported 0 effective Org action keys. `/products` and `/products/demo` rendered an error state because `/api/sales/products*` returned 403 `branch context required`.
- `/branches`, `/memberships`, and `/roles` rendered the current sample/static UI values. They are not evidence of live Org data or mutations.
- `/platform/*` rendered “Không thể xác minh quyền truy cập” for this employee account. Company pages prompted to choose a MAIN context; this account cannot verify the owner journey.
- Route screenshots are in `../PORTAL-EMPLOYEE-001/evidence/ui-review/` and `../PORTAL-EMPLOYEE-001/evidence/`.

## Coverage boundary

This is a browser route/UI smoke sweep, not exhaustive UI validation. It did not verify every loading/empty/error/success state, every interaction, all viewports for every page, or authenticated platform-admin and Org-owner journeys. The full customer/employee/org business journeys are not yet proven.

## Employee mobile sweep — 390×844

- Checked 13 employee/organization routes for horizontal overflow: `/console`, `/branches`, `/memberships`, `/roles`, `/me`, `/inventory/shelves`, `/production/food-plans`, `/production/orders`, `/production/qc`, `/production/targets`, `/sales/pricing`, `/products`, `/company`.
- Result: **13/13 overflow**. On `/console`, document width was 452px for a 390px viewport. The visible overflow comes from the fixed-width account/context controls in the shared header.
- Mobile screenshots: `../PORTAL-EMPLOYEE-001/evidence/ui-review/console-mobile.png`, `memberships-mobile.png`, and `roles-mobile.png`.
