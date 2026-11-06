# Employee UX contract

Status: amended proposal; prior review outdated, pending human plan approval. Owner: portal. Existing backend semantics unchanged.

## Usecase
| ID | User outcome | Acceptance |
|---|---|---|
| UC1 | Login/reauthenticate and inspect password | AC-1, AC-2 |
| UC2 | Choose production target/product/material/lot by business identity | AC-3..5 |
| UC3 | Price named related entities; discover authorized staff accounts | AC-6, AC-7; missing lookup contracts block completion |
| UC4 | Understand canonical role × business action permissions | AC-8, AC-9, AC-12 |
| UC5 | Review responsive built employee preview | AC-10, AC-11, AC-13 |
Canonical AC definitions: [plan](../runs/PORTAL-EMPLOYEE-UX-001/plan.md#requirements).

## API
| Existing method/path | Portal client/BFF contract | Permission/source |
|---|---|---|
| GET /api/auth/context | user/active_context/contexts/permissions; implicit branch | live probes; active context authoritative |
| GET /api/sales/products | code/status/message/data envelope; unwrap data.items | lib/api/sales.ts:38; live probes |
| GET/POST /api/production/targets | data.items / ProductionTarget | lib/api/production.ts:109-126; existing BFF/auth |
| GET/POST /api/production/targets/{id}/food-plans | data.items / FoodProductPlan; selected target ID | lib/api/production.ts:138-152 |
| GET /api/production/orders | ProductionOrder[] via data.items | lib/api/production.ts:188; insufficient alone for stock eligibility |
| POST shelf placement | finished_lot_ref, branch_ref, shelf_code, placed_quantity, uom | lib/api/production.ts:255; inventory:shelf_placement:create |
| GET /org/company/role-matrix | Record<role_code,action[]> via org company BFF | contracts/org.public.yaml:205; org:company:read; read-only |
| GET /platform/companies/{root}/role-matrix | same record via existing platform BFF | contracts/org.public.yaml:128; platform:role_matrix:read |
| PUT /platform/companies/{root}/role-matrix/roles/{role} | {actions:string[]}; replaces complete role set | contracts/org.public.yaml:138; platform:role_matrix:update |
| GET platform companies | existing paginated company list; labels name/code | lib/api/platform-client.ts:19; useCompanyOptions |
| Inventory lot/material lookup | proposed portal BFF only after exact upstream path/query/DTO/action probe | portal GET currently404; unresolved D1 |
| Variant/BOM/price-book/auth-account discovery | no verified contract; prerequisite task/file amendment | unresolved D2; no fabricated endpoint |
No guessed API or upstream mutation is permitted. Backend endpoints remain authorization authority.

All new user-facing label/error strings use next-intl with vi/en locale parity. Human labels do not replace canonical wire values.

## DTO
| Model | Existing fields relevant to choice/presentation |
|---|---|
| Product | id, name, sku_code, uom normalized from uom_code, status |
| ProductionTarget | id, target_code, title, branch_ref, status, lines[].product_ref/target_quantity/uom |
| ProductionOrder | id, order_code, branch_ref, finished_lot_ref, status, finished_lot_expires_at; not stock truth |
| FoodProductPlan create | product_ref, variant_sku_code, planned_quantity,uom,serving_size,components[].sku_ref/quantity/uom |
| Matrix | Record<string,string[]>; preserve unknown role/action keys unchanged |
| Option presentation | visible business name/code + safe business distinguishing detail; backend-generated immutable id submitted internally; never ordinary visible/editable/create field |
Granted-action union is not a complete action catalogue. Confirm authoritative catalogue source before declaring all permissions represented; preserve protected validated advanced add-action path and unknown keys. No fabricated approval order.

Sources: lib/api/sales.ts:3, lib/api/production.ts:3-70, lib/api/platform-contract.ts:21.

## DB
| Change | Contract |
|---|---|
| None | Portal gains no database/migration or cross-service FK. Source services own records and eligibility. |

## Events
| Change | Contract |
|---|---|
| None | No new Kafka event/envelope; UI uses existing request/response flows. |

## Errors
| Existing result | UX |
|---|---|
| 401 | Existing session/login handling; no credential bypass |
| 403 | Explain missing permission/context; no action or fake success |
| 404 lookup/unknown entity | Unavailable/dependency or stale entity state; no manual UUID fallback |
| 409 mutation | Keep backend conflict semantics; preserve draft and explain failure |
| Network/5xx | Inline error + deliberate retry; never fabricate options |
| Valid empty list | No data and guided next action; distinct from failed load |
No new backend error codes. Error message handling reuses existing clients/response infrastructure.

## UUID audit
| Field/location | Treatment |
|---|---|
| targets product; food-plan target/product | real named target/product choices with membership relationship |
| food-plan material; shelf finished lot | inventory contract prerequisite and eligible choice |
| pricing product/variant/BOM/version/price book | dependent lookup prerequisite; policy/version response IDs remain internal |
| platform audit MAIN | existing company name/code choices; preserve underlying root UUID |
| platform staff account | auth discovery prerequisite; do not treat existing staff list as catalog of all grantable users |
| support request company | already names/codes via useCompanyOptions; preserve fail-closed behavior/pagination warning |
| crypto.randomUUID idempotency keys | internal valid use, unaffected |
Order/QC selection uses existing records, not a newly introduced manual reference field. Audit findings: research and live probes linked above.

## Verification contract
S15 owns vi/en message keys before consumers; actual localized reveal/matrix/lookup state behavior is tested in consumer slices. Responsive acceptance covers375/768/1024/1440px light/dark plus390px reproduction, Tab/Enter/Space/focus and applicable Esc dismissal; loading/empty/success/error PNG evidence per changed screen. Zero console errors and HTTP >=500 responses on accepted workflows. Budgets remain mobile LCP<=2.5s, accessibility>=90, First Load JS<=200KB; missing metrics remain unverified and real INP requires interaction. Browser checklist uses mcp__cua_repl actual receipts plus manual_test_anchor.py/explicit manual_test.py --anchor command provenance as defined in canonical plan; npm test is not browser E2E.

## Amended usecases and API boundaries
| Usecase | Contract |
|---|---|
| UC6 customer login | AC-15: existing POST /api/auth/login, standard Dialog + reused LoginForm over public landing; /login compatibility entry, safe local customer return target; /api/auth/staff/login remains separate audience |
| UC7 theme | AC-16: client light/dark persisted state with prepaint boot and denied-storage fallback; no database/event |
| UC8 logout | AC-17/18: existing POST /api/auth/logout → /auth/web/logout; preserve actual upstream revoke/error/Retry-After semantics; audit cookie owner attributes before successful expiry; no unconditional success or arbitrary auth mutation |
| UC9 immutable identity | AC-14: backend generates identity; business create/update permission gates still work; missing names never render UUID as normal label |
| UC10 measured performance | AC-19: cold dev compile separated from isolated production LCP/CLS/real interaction INP and actual API concurrency; no fabricated waterfall or unsupported speed claim |

Concrete visual/state mockup: [proposal](../../plans/261008-0800-employee-ux/research/customer-modal-theme-logout.md). Modal initial/loading/error/success/close/back states, theme prepaint/storage-denied states and logout pending/error/success are contractual. API errors remain existing statuses/codes, no new DB/events. Auth already-expired logout result and cookie Path/Domain/Secure/HttpOnly/SameSite must be verified before implementation; status401 is not automatically success. Browser acceptance includes four distinct state PNGs per changed screen,375/768/1024/1440 light/dark,Tab/ShiftTab/Esc,0 console/server errors and0>=500 acceptance responses. Intentional injected failures are separate evidence, never accepted workflow results.

Additional amended invariants: UUIDs including truncated profile identifier/organization fallback never become normal user labels; legitimate authorized business editing stays available. Theme html data-theme overrides OS media and agrees with .dark/prepaint/hydration; generated CSS unchanged. Scoped account provider uses server NEXT_LOCALE and only required namespaces, not fullscreen CustomerAuthShell/all-message global hydration. Shared safeLanding policy is extracted pure for BFF/client with hostile return/cross-audience tests. Successful logout clears portal_plane owner attributes; pending modal dismissal cannot erase eventual authenticated session truth, and account header revalidates.

Audience means form/endpoint, not forbidden user identity: customer form→customer BFF, employee form→staff BFF; same account may legitimately have both roles. S20 includes AC-2 customer login password reveal. Existing cart/idempotency internal client UUID generation follows current API contract; strict backend-only cart issuance needs a verified upstream contract and separately approved scope, never a guessed endpoint.

Rejected v1 archived visual reference (not approved): [login-preview.html](../../plans/261008-0800-employee-ux/research/login-preview.html), planning-only/no authentication. Logout client inspects Response success rather than assuming apiFetch throws; existing logout exclusion from automatic refresh remains intact.

## UI/UX Pro Max visual redo contract
AC-20 extends existing S2/S16/S20/S22 files/tests and S15 locale inventory; no new production component or dependency is implicitly authorized. Existing Lucide SVG close/eye/theme/cart/menu controls are icon-only with localized names, appropriate state semantics,44px targets/focus and optional hover+focus tooltip. No emoji or redundant adjacent visible state text; login/register/logout actions retain meaningful text. Neutral pristine login has no fake error/EmptyState banner; request-driven pending/error/success remains truthful. Existing brand tokens/Quicksand/Nunito and full responsive/auth/matrix/theme/logout/performance scope remain unchanged.
[New brief](../../plans/261008-0800-employee-ux/research/ui-ux-pro-max-brief.md) is proposed markdown input for required Stitch upload→design-system generation. Authentication blocks that pipeline; no Stitch provenance or competing MASTER.md is invented. [Old preview](../../plans/261008-0800-employee-ux/research/login-preview.html) is rejected/archive reference only. Fresh design screens and manual visual review under AC-11 precede production UI approval.
