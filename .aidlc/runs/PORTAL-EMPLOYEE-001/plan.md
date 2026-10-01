# Plan: Employee branch workbench

- **Task ID**: `PORTAL-EMPLOYEE-001`
- **Mode**: `hard`
- **Story**: US-UI-002
- **Sprint**: 02
- **Issue**: 

## Scope
- Outcome: employees land in the correct branch workspace, see only actions granted by Org for the active branch, and can reach all currently implemented employee modules; 0 role-name checks and 0 cross-branch reads/writes initiated by the UI.
- Decision: REUSE current `/api/console`, auth switch-branch route, Sales/Inventory/Production BFFs, and operational pages; EXTEND a branch-aware employee shell and capability navigation. No backend service edits.
- Impact (codebase-memory, project `mnt-win_d-feature-ticket`, indexed 2026-09-05): `LiveConsole` reads `/api/console` (`features/console/live-console.tsx:1-25`); operational pages use `permissions` action strings, e.g. `features/inventory/shelves-view.tsx:31-57` and `features/production/orders-view.tsx:34-42,148-178`; `/switch-branch` calls the existing auth context. Graph coverage has known parse gaps in some existing feature files; source was checked directly for the cited ranges.
- Scope includes current employee modules: sales/catalog management, inventory, production/QC, pricing, traceability, and branch context. New sales lifecycle commands are excluded where no public route contract exists. Customer checkout and org administration are separate tasks.

## Requirements
- FR-1 Branch context and audience boundary. AC-1: after login, one employee branch opens directly; multiple branches require explicit selection; only `EMPLOYEE` contexts are selectable for employee work. AC-2: a successful switch updates the active branch before reloading data; failed switch preserves the prior context and shows an error. AC-3: a customer session cannot open `/roles` or `/console`; Portal redirects to the correct customer landing using authenticated context, without treating this UI guard as backend authorization.
- FR-2 Capability-based navigation. AC-4: navigation and operation buttons are derived from action keys returned by Org; no role-name checks or locally invented permission matrix. AC-5: missing, malformed, 403, 503, or network permission responses fail closed and hide/disable protected actions.
- FR-3 Existing work modules. AC-6: employee reaches all currently implemented Sales, Inventory, Production/QC, and traceability routes from one workspace; each route uses the active branch supplied by the authenticated context and its backend API remains final authorization authority.
- FR-4 Complete UI states. AC-7: each workspace and data screen has loading, empty, error, and success states; 401 uses existing refresh/login; 409/422 retain entered values.
- FR-5 Responsive/accessibility. AC-8: keyboard navigation/focus works, controls ≥44px, layouts work at 390px and 1440px, strings use next-intl.
- Out of scope: new backend operations, changing role catalogue, broad redesign of module screens, or exposing platform operator routes to employees.

## Technical definition
- Contracts: `../org/.aidlc/specs/authorization-check.md`, `../org/.aidlc/specs/role-matrix.md`, `../sales/.aidlc/specs/order-lifecycle.md`, `../platform-docs/standards/frontend.md`.
- Reuse `/api/console` as the server-backed access-context source; reuse existing `app/api/auth/switch-branch` and service BFF routes. Do not trust a browser-supplied branch as authorization; the backend rechecks every action.
- Client capability checks are UX only and use action keys. Server/API authorization stays with Org and each domain service. Avoid role-name predicates and local role-to-action tables.
- No DB/event changes. Preserve existing data clients, error mapping, and auth refresh transport.

## UX
- Flow: login → employee home or branch chooser → branch-scoped dashboard → allowed module → action result/error. Show current organization and branch prominently; branch switch is explicit and confirms after success.
- Reuse Đồng xanh tokens, current primitives, loading/empty/error patterns, and local vi/en catalogs. Do not reuse platform shell for employee scope.
- Evidence: desktop 1440px/mobile 390px for dashboard, branch switch, and every changed module state, with keyboard and light/dark checks.

## Design
- Add an employee workspace shell and navigation registry keyed by canonical action strings. The registry maps routes to capabilities; it contains no role names and is tested for missing/unknown actions.
- Keep app pages as server route composition and feature hooks as the only data owners. No `fetch` outside `lib/api`/`lib/fetcher`.
- Existing API entry points reused: `/api/console`, `/api/auth/context`, `/api/auth/switch-branch`, `/api/sales/*`, `/api/inventory/*`, `/api/production/*`, and `/api/public/traceability/*`. No new API contract is introduced by this task.
- Errors remain scoped to the active branch; clear SWR/client state after successful branch switch. Never show prior-branch data during a pending switch.

## Files planned
- app/console/page.tsx
- features/console/live-console.tsx
- components/layout/employee-shell.tsx
- features/employee/navigation.ts
- features/employee/navigation.test.ts
- app/switch-branch/page.tsx
- app/api/auth/switch-branch/route.ts
- app/api/auth/bff.test.ts
- features/inventory/shelves-view.tsx
- features/production/targets-view.tsx
- features/production/food-plans-view.tsx
- features/production/orders-view.tsx
- features/production/qc-view.tsx
- features/sales/pricing-floor-view.tsx
- features/traceability/trace-view.tsx
- messages/vi.json
- messages/en.json
- .aidlc/runs/PORTAL-EMPLOYEE-001/ui-cases.md
- .aidlc/runs/PORTAL-EMPLOYEE-001/anti_check.py
- .aidlc/runs/PORTAL-EMPLOYEE-001/evidence/
- .aidlc/runs/PORTAL-EMPLOYEE-001/testkit/env.md
- .aidlc/runs/PORTAL-EMPLOYEE-001/testkit/happy.http
- .aidlc/runs/PORTAL-EMPLOYEE-001/testkit/errors.md
- tests/e2e/employee-workspace.spec.ts
- tests/e2e/customer-employee-boundary.spec.ts
- .aidlc/runs/PORTAL-EMPLOYEE-001/testkit/happy.md

## Tests planned
- TC-1 / AC-1,2 / unit+integration / `npm test -- features/employee/navigation app/api/auth/bff`
- TC-2 / AC-3,4,5 / unit / `npm test -- features/employee/navigation proxy`
- TC-3 / AC-6,7 / unit+integration / `npm test -- features/production features/inventory features/sales features/traceability tests/integration`
- TC-4 / AC-8 / UI evidence / `python3 .aidlc/runs/PORTAL-EMPLOYEE-001/anti_check.py`
- TC-5 / all / build+type+lint / `npm run build && npm run typecheck && npm run lint`
- TC-6 / contract / spec / `cd ../org && python3 ~/agent_skills/sdlc/engine/speccheck.py .aidlc/specs/authorization-check.md .aidlc/specs/role-matrix.md`
- TC-7 / employee UI E2E / `PORTAL_E2E_BASE=http://127.0.0.1:3000 npm run test:e2e -- tests/e2e/employee-workspace.spec.ts`; use Chromium to sign in as an isolated employee, switch branch, and open permitted Sales/Inventory/Production/traceability screens against existing services.
- TC-8 / customer-vs-employee UI E2E / same browser suite; prove a signed-in customer is sent to the customer landing when opening employee-only routes.

## Slices
- [ ] S1: Employee dashboard shell with current branch and permission summary (files: app/console/page.tsx, features/console/live-console.tsx, components/layout/employee-shell.tsx, features/employee/navigation.ts, features/employee/navigation.test.ts; test: npm test -- features/employee/navigation)
- [ ] S2: Branch chooser and switch behavior preserve active context on failure (files: app/switch-branch/page.tsx, app/api/auth/switch-branch/route.ts, app/api/auth/bff.test.ts; test: npm test -- app/api/auth/bff)
- [ ] S3: Align existing operational routes with capability navigation and active-branch states (files: features/inventory/shelves-view.tsx, features/production/targets-view.tsx, features/production/food-plans-view.tsx, features/production/orders-view.tsx, features/production/qc-view.tsx; test: npm test -- features/inventory features/production)
- [ ] S4: Apply the same route boundary to pricing and traceability (files: features/sales/pricing-floor-view.tsx, features/traceability/trace-view.tsx; test: npm test -- features/sales/pricing-floor features/traceability)
- [ ] S5: Localized UI evidence and regression (files: messages/vi.json, messages/en.json, .aidlc/runs/PORTAL-EMPLOYEE-001/ui-cases.md, .aidlc/runs/PORTAL-EMPLOYEE-001/anti_check.py, .aidlc/runs/PORTAL-EMPLOYEE-001/evidence/; test: python3 .aidlc/runs/PORTAL-EMPLOYEE-001/anti_check.py)
- [ ] S6: Employee browser E2E workspace journey (files: tests/e2e/employee-workspace.spec.ts, .aidlc/runs/PORTAL-EMPLOYEE-001/testkit/env.md, .aidlc/runs/PORTAL-EMPLOYEE-001/testkit/happy.md, .aidlc/runs/PORTAL-EMPLOYEE-001/testkit/errors.md; test: PORTAL_E2E_BASE=http://127.0.0.1:3000 npm run test:e2e -- tests/e2e/employee-workspace.spec.ts)
- [ ] S7: Verify customer boundary in the rendered UI (files: proxy.ts, proxy.test.ts, tests/e2e/customer-employee-boundary.spec.ts; test: PORTAL_E2E_BASE=http://127.0.0.1:3000 npm run test:e2e -- tests/e2e/customer-employee-boundary.spec.ts)

## Risks / rollback
- Some operational pages already read permissions independently; the shell must share the same returned action set without creating a second authorization source. If an API fails, block mutations and leave existing data visible only within the same branch.
- Existing backend contracts do not expose all order-fulfillment commands as public portal endpoints; do not invent employee confirm/pack/ship routes here. Add those only in a separately approved Sales contract/service task.
- Rollback removes the new shell/navigation and restores current route composition; backend state is not changed.

## Scope constraints
- Employee means all currently implemented portal modules, with no new backend endpoints. `PORTAL-ORG-001` covers branch/member administration.
- E2E is browser-driven against the rendered Portal UI and uses isolated employee/customer accounts on the current local service stack. No service backend changes are in scope; absent fixtures mean BLOCKED, not PASS.
- Employee browser E2E reuses the Playwright/Chromium harness added by `PORTAL-CUSTOMER-001` S7; run that harness slice first.
- Existing `portal-backend.it.test.ts` is HTTP-level integration, not UI E2E. Its baseline setup had activation 400/login 403, so S7 needs a valid signed-in customer before it can verify the route boundary.
