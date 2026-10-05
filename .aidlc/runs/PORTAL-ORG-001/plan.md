# Plan: Organization branches and employee administration

- **Task ID**: `PORTAL-ORG-001`
- **Mode**: `hard`
- **Story**: US-UI-002
- **Sprint**: 02
- **Issue**: 

## Scope
- Outcome: branch/member screens stop presenting fabricated data; every change is backed by an allow-listed Org API and scoped to the authenticated organization/branch; 0 cross-tenant reads or writes.
- Decision: REUSE Org public endpoints and the shared service BFF; EXTEND portal Org BFF allow-lists and replace fake branch/member/role data with contract-backed UI states.
- Impact (codebase-memory, project `mnt-win_d-feature-ticket`, indexed 2026-09-05): `BranchesPage` passes `SAMPLE_BRANCHES` (`app/branches/page.tsx:1-8`, `features/branches/branches-view.tsx:21-44`); `MembershipsView` falls back to five sample employees and performs invite/status updates in local state (`features/memberships/memberships-view.tsx:43-109,115-173`); `RolesView` contains hardcoded roles/permissions and its save only flips local success (`features/roles/roles-view.tsx:43-95,236-283`). Org API sources are `../org/.aidlc/specs/org-admin.md`, `employee-onboard.md`, `role-matrix.md`, and `../org/api/openapi.public.yaml`.
- This task covers portal BFF/UI only. Customer storefront and employee operations are separate plans. Do not change Org backend in this run.

## Requirements
- FR-1 Organization boundary. AC-1: every request uses the organization and branch context from the authenticated session; modifying URL/body IDs cannot access another tenant. AC-2: missing or malformed context, 401/403/404/409/503, and network errors fail closed with contextual UI errors.
- FR-2 Branches. AC-3: show only API-confirmed branch data and allow creation only when `org:branch:create` is present; no `SAMPLE_BRANCHES` or fallback branch. API does not currently publish a list-branches operation, so no fake full branch directory is permitted.
- FR-3 Memberships. AC-4: list API-confirmed memberships for the current org, search/filter on returned fields, and show explicit loading/empty/error/success states. AC-5: membership status/role mutations are offered only when the corresponding action key is present and payload follows `org-admin.md`; preserve edits on 400/403/409.
- FR-4 Canonical roles. AC-6: remove the static permission editor; org users cannot edit company role matrices. Read-only company matrix may use `/org/company/role-matrix` only with `org:company:read`; no fake role catalogue or local-only Save success.
- FR-5 Employee onboarding boundary. AC-7: never display an invitation as successful unless the backend returns a confirmed result. `POST /orgs/{org_id}/employees` exists in `employee-onboard.md` but not current Org OpenAPI/router; this run cannot implement or call it.
- FR-6 Accessibility/i18n. AC-8: Vietnamese default, English catalog, keyboard/focus, ≥44px controls, 390px/1440px layout, and four visible data states.
- Out of scope: changing Org/Auth service contracts, adding branch-list or employee-invite endpoints, editing role matrices, and cross-service data writes.

## Technical definition
- Contracts: `../org/.aidlc/specs/org-admin.md`, `../org/.aidlc/specs/employee-onboard.md`, `../org/.aidlc/specs/role-matrix.md`, `../platform-docs/standards/frontend.md`.
- Published Org operations: `POST /orgs/{org_id}/branches`; `GET|POST /orgs/{org_id}/memberships`; `PATCH /orgs/{org_id}/memberships/{membership_id}`; `PUT /orgs/{org_id}/memberships/{membership_id}/roles`; `GET /org/company/role-matrix?org_id=...`. Use existing Org auth and authorization as final authority.
- BFF must allowlist method/path/query/body and forward through `lib/api/service-bff.ts`; browser never calls Org directly. Do not accept arbitrary service URLs or trust role names for guards.
- The current OpenAPI has paths/responses but no request schemas for org-admin operations, and omits branch-list/employee-invite routes. Treat missing shapes as blockers; derive no DTO from UI assumptions.

## UX
- Branch page states whether the authenticated context contains branches and can create only through a confirmed API. If list API is absent, label the limitation rather than showing sample branches.
- Membership table and edit form use API-returned member/branch/status/role values. The role matrix route becomes read-only/redirected; no toggles suggesting Org users can edit permissions.
- Keep Đồng xanh design tokens and next-intl. Capture 390px/1440px loading/empty/error/success screens after fixtures exist.

## Design
- Add `lib/api/org-admin-bff.ts` allow-list plus `app/api/orgs/[...path]/route.ts`; add `lib/api/org-admin.ts` for typed client functions. Feature hooks own data for branches/memberships; app routes compose views.
- No DB/migration/event changes. Request/response DTOs must come from the Org service spec/OpenAPI; current omissions are explicit blockers.
- Fail-closed: client capabilities only control visibility; Org checks all actions and tenant scope. Do not cache mutations or show optimistic success for 400/403/409.

## Files planned
- lib/api/org-admin-bff.ts
- lib/api/org-admin-bff.test.ts
- app/api/orgs/[...path]/route.ts
- lib/api/org-admin.ts
- lib/api/org-admin.test.ts
- app/branches/page.tsx
- features/branches/branches-view.tsx
- features/branches/use-branches.ts
- features/branches/branches.test.ts
- app/memberships/page.tsx
- features/memberships/memberships-view.tsx
- features/memberships/use-memberships.ts
- features/memberships/memberships.test.ts
- features/roles/roles-view.tsx
- app/roles/page.tsx
- messages/vi.json
- messages/en.json
- .aidlc/runs/PORTAL-ORG-001/ui-cases.md
- .aidlc/runs/PORTAL-ORG-001/anti_check.py
- .aidlc/runs/PORTAL-ORG-001/evidence/
- .aidlc/runs/PORTAL-ORG-001/testkit/env.md
- .aidlc/runs/PORTAL-ORG-001/testkit/happy.http
- .aidlc/runs/PORTAL-ORG-001/testkit/errors.md
- tests/e2e/org-admin.spec.ts
- tests/e2e/org-admin-errors.spec.ts
- .aidlc/runs/PORTAL-ORG-001/testkit/happy.md

## Tests planned
- TC-1 / AC-1,2 / BFF unit / `npm test -- lib/api/org-admin-bff`
- TC-2 / AC-3 / unit+integration / `npm test -- features/branches tests/integration`
- TC-3 / AC-4,5 / unit+integration / `npm test -- features/memberships tests/integration`
- TC-4 / AC-6,7 / unit / `npm test -- features/roles`
- TC-5 / AC-8 / UI evidence / `python3 .aidlc/runs/PORTAL-ORG-001/anti_check.py`
- TC-6 / all / build+type+lint / `npm run build && npm run typecheck && npm run lint`
- TC-7 / contract / spec / `cd ../org && python3 ~/agent_skills/sdlc/engine/speccheck.py .aidlc/specs/org-admin.md .aidlc/specs/role-matrix.md`
- TC-8 / organization UI E2E / `PORTAL_E2E_BASE=http://127.0.0.1:3000 npm run test:e2e -- tests/e2e/org-admin.spec.ts`; use Chromium to sign in as an isolated owner, open organization administration, and verify visible API-backed membership/branch states against the running system.

## Slices
- [ ] S1: Allow-listed Org BFF and client with query/body validation (files: lib/api/org-admin-bff.ts, lib/api/org-admin-bff.test.ts, app/api/orgs/[...path]/route.ts, lib/api/org-admin.ts, lib/api/org-admin.test.ts; test: npm test -- lib/api/org-admin)
- [ ] S2: Branch creation and API-backed branch state (files: app/branches/page.tsx, features/branches/branches-view.tsx, features/branches/use-branches.ts, features/branches/branches.test.ts; test: npm test -- features/branches)
- [ ] S3: Membership list and safe status/role changes (files: app/memberships/page.tsx, features/memberships/memberships-view.tsx, features/memberships/use-memberships.ts, features/memberships/memberships.test.ts; test: npm test -- features/memberships)
- [ ] S4: Retire unsupported role editor; use read-only canonical matrix (files: features/roles/roles-view.tsx, app/roles/page.tsx; test: npm test -- features/roles)
- [ ] S5: Localization and UI evidence (files: messages/vi.json, messages/en.json, .aidlc/runs/PORTAL-ORG-001/ui-cases.md, .aidlc/runs/PORTAL-ORG-001/anti_check.py, .aidlc/runs/PORTAL-ORG-001/evidence/; test: python3 .aidlc/runs/PORTAL-ORG-001/anti_check.py)
- [ ] S6: Org administration browser E2E (files: tests/e2e/org-admin.spec.ts, .aidlc/runs/PORTAL-ORG-001/testkit/env.md, .aidlc/runs/PORTAL-ORG-001/testkit/happy.md, .aidlc/runs/PORTAL-ORG-001/testkit/errors.md; test: PORTAL_E2E_BASE=http://127.0.0.1:3000 npm run test:e2e -- tests/e2e/org-admin.spec.ts)
- [ ] S7: Org UI failure states and browser evidence (files: tests/e2e/org-admin-errors.spec.ts, .aidlc/runs/PORTAL-ORG-001/e2e-results.md; test: PORTAL_E2E_BASE=http://127.0.0.1:3000 npm run test:e2e -- tests/e2e/org-admin-errors.spec.ts)

## Risks / rollback
- Without a GET branch-list endpoint, the UI cannot represent every org branch. Without a published employee-invite route/request schema, it cannot create invited employees. Do not use sample or local-only data to conceal either gap.
- Existing OpenAPI omits admin request bodies; pin the source commit and verify exact DTOs before implementing BFF request validation.
- Rollback removes the new Org BFF/UI changes and restores prior routes. The local fake role editor must not be restored as an authorization source.

## Scope constraints
- Backend changes are excluded. The Org API does not publish branch listing or employee invitation; this portal run will not show those actions as completed and will state the limitation clearly.
- E2E is a real-browser test against rendered Portal pages with an isolated owner/org fixture and the current live service stack. Absent fixtures mean BLOCKED, not PASS. Existing HTTP integration tests are supplemental and do not count as UI E2E.
- Org browser E2E reuses the Playwright/Chromium harness added by `PORTAL-CUSTOMER-001` S7; run that harness slice first.
- A full branch directory or invitation workflow requires a separate backend-approved task and is outside this run.
