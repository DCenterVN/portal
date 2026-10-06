# Food flow department screens — FLOW-001 / S4-portal

Status: DRAFT

Source: [FLOW-001 plan Design (a), (b), (c), PORTAL-FLOW-001 U1–U9](/mnt/win_d/feature/ticket/.aidlc/runs/FLOW-001/plan.md). Dawn approved OD-1..OD-9 defaults on 2026-10-07 with `--accept-assumed`; they are rules. This slice specifies screens/BFF composition only; routes and contract extensions below are planned, not runtime evidence.

## Usecase

Actors: nutrition, warehouse, accountant, kitchen, QA and catalog manager with real org grants in one branch; anonymous customer reading a lot QR. Input: approved target/plan revision, dishes and integer EA portions per variant, immutable BOM/UOM/yield policy, linked receipt facts, money evidence, actual consumption and output/QC ACKs.

1. Nutrition chooses meals/dishes and variants, enters portions, previews material requirements and submits a revision-specific request. Request submission precedes price approval; waiting for pricing does not block procurement.
2. Warehouse receives the request and fulfills its lines through existing inbound receiving/QC screens. Receipt lines retain request/line refs; accepted request is distinct from received, approved and allocated stock.
3. Accountant checks receipt quantities and integer VND money/evidence against exact source revisions. Sales records CHECKED or DISCREPANCY; production permits allocation only with applicable current CHECKED evidence.
4. Warehouse accepts/allocates eligible raw lots; kitchen starts production and records actual consumed lines, declared loss and actual output. Inventory ACK is authoritative; residual reservation is released and genealogy uses actual sources.
5. QA completes finished QC under approved expiry/re-inspection policy. Receipt plus matching applied release ACK, eligible shelf placement and label are required before sale. Manager controls product/variant catalog transitions independently of each output lot.
6. Existing sales checkout sells the specific variant/lot once and retains lot/trace binding. Customer scans its lot QR without login; source data remains readable after depletion, suspension or retirement.

Rules: make ahead and sell at one branch; no preorder/transfer/AI planning/new finance service. Portal owns UI and BFF, auth owns sessions, org owns final permission/scope decisions, and backend services own business transitions. Never derive success from a client boolean, optimistic badge or HTTP timeout. Submitted BOM/request snapshots and order variant/price snapshots remain immutable. Exact decimal strings/UOM policies for quantities, integer EA portions and int64 VND money; NET applies yield once, GROSS does not divide; UTC timestamps and Asia/Ho_Chi_Minh business dates. Raw loss included in consumption must not be deducted again. Shelf placement uses the backend's one ledger model, without a second stock decrement.

### Contract owners (read-only dependencies)

| Reference | Owning contract |
|---|---|
| N | [production nutrition-material-request](../../production/.aidlc/specs/nutrition-material-request.md): plan/BOM snapshot, requirement preview, request operation/ACK; existing target/food-plan routes remain production OpenAPI authority |
| P | [production actual-production-trace](../../production/.aidlc/specs/actual-production-trace.md): completion, actual genealogy, output, finished QC and public trace |
| I | [inventory material-request-fulfillment](../../inventory/.aidlc/specs/material-request-fulfillment.md): request/receipt-line correlation, authoritative receipt facts; inbound receiving/QC remains INVENTORY-INBOUND-001 ownership |
| C | [inventory production-actual-consume](../../inventory/.aidlc/specs/production-actual-consume.md): actual consume, residual release, output receipt/release ACK and redacted lot facts; shelf/reservation remains INVENTORY-SALES-STOCK-001 ownership |
| L | [sales product-lifecycle](../../sales/.aidlc/specs/product-lifecycle.md): product 1:N variants, transitions, per-output projection and checkout eligibility |
| R | [sales flow-reconciliation](../../sales/.aidlc/specs/flow-reconciliation.md): immutable receipt-money decision and CHECKED revision gate |
| O | [org flow-permissions](../../org/.aidlc/specs/flow-permissions.md): action keys, actor grants, branch scope and separation of duties |

Links deliberately use the requested repository-relative `../../<svc>/.aidlc/specs/...` form; service specs remain the authority for schemas, DB/events and response codes. Portal does not duplicate their DTO/DB contracts or call cross-service DBs.

## Screens

Routes are browser URLs (route groups omitted). Each numbered screen uses the call rows below; all data screens also use the shared loading/error behavior in UX.

| Screen / actor | Route and feature owner | Calls / permission keys | Success, empty and business-blocked states | Backend owner |
|---|---|---|---|---|
| S1 Nutrition targets | `/production/targets`; `features/production/targets-view.tsx` | T1–T3; `production:target:read`, `production:target:create`, `production:target:approve` | Approved target/day/branch and portion goal; empty “Chưa có kế hoạch sản lượng” with granted create action; unapproved target explains review prerequisite | N; existing production target contract |
| S2 Nutrition meals/dishes → material request | `/production/food-plans/{id}`; `features/production/food-plans-view.tsx` | N1–N7; `production:food_plan:read/create/update/review/publish`; `production:material_requirement:read`, `production:material_request:create` | Dish/product identity, M/L portion inputs, BOM version/basis/yield/UOM and requirement lines. Empty “Chưa chọn món”; missing policy/BOM blocks preview/submit with field hint. PENDING request auto-refreshes same operation; ACCEPTED shows request/line refs, not received stock. Pricing wait has separate indicator and does not disable request submission | N; L owns generated product/variant identity |
| S3 Warehouse request receiving/fulfillment | `/inventory/material-requests`; `features/inventory/flow-request-view.tsx`; compose existing inbound screens | W1–W5; `inventory:material_request:read`, `production:order:read`, `inventory:goods_receipt:create/receive`; inbound QA controls require separate `inventory:qc:complete`, `inventory:lot:qc_decision` grants | Request lines show requested/received/eligible/shortage quantities and linked receipt refs/revisions. Empty “Chưa có yêu cầu nguyên liệu”; partial delivery, QC fail/quarantine, expired lots and unmapped lines stay explicit. No zero substitution or allocation shortcut | I + existing inbound; C owns allocation eligibility |
| S4 Accountant receipt-money check | `/sales/flow-reconciliations`; `features/sales/flow-reconciliation-view.tsx` | A1–A2; `sales:flow_reconciliation:read`, `sales:flow_reconciliation:create` | Request/facts revisions/hash, decimal quantity by SKU/UOM, integer VND costs and evidence comparisons; empty “Chưa có đối chiếu” keeps allocation closed. CHECKED opens only exact current revision gate; DISCREPANCY shows explanation/line variance; stale CHECKED prompts a new revision; dependency UNKNOWN closes gate. Record is not supplier payment or QC approval | R; I owns source receipt facts |
| S5 Warehouse acceptance/allocation | `/production/orders/{id}` allocation section; `features/production/orders-view.tsx` | K1–K3; `production:order:read/accept/allocate` | Order and live eligible allocation ACK; empty “Chưa phân bổ lô”. Shortage, QC/expiry or absent/stale CHECKED disables allocation with reason. No client override; already allocated state comes from backend | N/P compose; C owns reservation/stock, R owns CHECKED |
| S6 Kitchen actual consume/output | `/production/orders/{id}` completion section; `features/production/orders-view.tsx` | K1, K4–K5; `production:order:read/start/complete` | Show reserved and actual separately; actual line quantity/UOM, loss quantity/UOM/reason and backend actor, integer output EA per variant, stable completion/output refs. Empty “Chưa có lệnh sản xuất”; no live allocation blocks start. Pending consume/output ACK is processing; incomplete actual evidence prevents completion. Reserve10/use8 exposes consume8/release2 | P; C owns consume and output receipt ACK |
| S7 QA finished output | `/production/qc`; `features/production/qc-view.tsx` | K1, Q1; `production:order:read`, `production:qc:decide` | WAITING_QC/HELD/PASS pending release/SELLABLE show decision and applied revisions separately. Empty “Chưa có lô chờ kiểm”; missing policy/evidence remains HELD. Authorized correction appends revision and preserves expiry/audit. QA PASS without release ACK does not show sellable | P + C; O owns QA separation |
| S8 Product and variant management | `/products/{id}`; `features/products/product-detail-view.tsx` | L1–L3; `sales:product:read`, `sales:product:lifecycle`, `sales:variant:lifecycle`; activation additionally requires `sales:product:activate` | Parent product, M/L variant config/price and per-lot progress shown separately. Empty “Chưa có biến thể” links to granted nutrition config, not raw SKU conversion. Illegal transition/RETIRED/stale version stays blocked. M eligible can sell while L is HELD; missing price/QC/stock shows reason per variant | L; R/P/C supply facts |
| S9 Warehouse shelf and QR labels | `/inventory/shelf-placements`; reuse existing inventory view | W6–W7; `inventory:shelf_placement:read/create` | Placement/label attached to eligible finished lot; empty “Chưa có lô lên kệ”. Missing receipt/release ACK or label prevents sale readiness; no stock subtraction computed by portal | C + existing sales-stock/shelf contract |
| S10 Public QR | `/traceability/{code}`; `app/(store)/traceability/[code]/page.tsx` → `features/traceability/trace-view.tsx` | QR1; anonymous, no membership/action grant | Actual raw lot codes, supplier public name/code, received_at, inbound QC and finished QC summaries. 404 “Không tìm thấy mã truy xuất”; 503 distinct “Chưa tải được nguồn truy xuất” with retry. No auth redirect or empty fabricated trace. Sold-out/suspended/retired lot still reads | P; C supplies redacted receipt/lot facts |

## Calls and permissions

Browser calls only fixed portal BFF paths. In this table `/api` is the browser endpoint prefix; backend paths have no `/api`. `id`/`production_order_id`, `code`/`trace_code` are explicit typed parameter mappings, not alternate business identities. Each row's method applies to both sides. BFF operation registry must map every protected action to an exact O key; UI locks absent grants and backend rechecks scope. No wildcard key, role-name/OWNER fallback, user-supplied target URL or browser service JWT.

Exact keys are aligned with O (including its DRAFT delta keys). Grants must be implemented/verified by the approved org child. Warehouse never receives private receipt cost/evidence facts; QA inbound controls are visible only with separate QA grants, and accounting/QA permissions are not granted to kitchen/warehouse by this screen.

| Call | Method | Browser BFF path → backend path | Permission key / authority | Contract |
|---|---|---|---|---|
| T1 | GET | `/api/production/targets` → `/production/targets` | `production:target:read` | N / existing targets |
| T2 | POST | `/api/production/targets` → `/production/targets` | `production:target:create` | N / existing targets |
| T3 | POST | `/api/production/targets/{id}/approval` → `/production/targets/{target_id}/approval` | `production:target:approve` | N / existing targets |
| N1 | POST | `/api/production/targets/{id}/food-plans` → `/production/targets/{target_id}/food-plans` | `production:food_plan:create` | N |
| N2 | GET | `/api/production/food-plans/{id}` → `/production/food-plans/{food_plan_id}` | `production:food_plan:read` | N |
| N3 | PUT | `/api/production/food-plans/{id}` → `/production/food-plans/{food_plan_id}` | `production:food_plan:update` | N |
| N4 | POST | `/api/production/food-plans/{id}/review` → `/production/food-plans/{food_plan_id}/review` | `production:food_plan:review` | N |
| N5 | GET | `/api/production/food-plans/{id}/material-requirements` → `/production/food-plans/{food_plan_id}/material-requirements` | `production:material_requirement:read` | N |
| N6 | POST | `/api/production/food-plans/{id}/material-requests` → `/production/food-plans/{food_plan_id}/material-requests` | `production:material_request:create` | N; production calls internal inventory, never browser |
| N7 | POST | `/api/production/food-plans/{id}/publish` or `/resume-handoff` → corresponding `/production/food-plans/{food_plan_id}/publish` or `/resume-handoff` | `production:food_plan:publish` | N; service-only sales handoff |
| W1 | GET | `/api/production/orders` → `/production/orders` for existing order/request handoff refs | `production:order:read`; request/fulfillment projection additionally requires `inventory:material_request:read` | P/I; dedicated safe request-read contract is a prerequisite, no private receipt-facts adapter |
| W2 | POST | `/api/inventory/goods-receipts` → `/inventory/goods-receipts` | `inventory:goods_receipt:create` | I + inbound |
| W3 | POST | `/api/inventory/goods-receipts/{id}/receive` → `/inventory/goods-receipts/{goods_receipt_id}/receive` | `inventory:goods_receipt:receive` | I + inbound |
| W4 | POST | `/api/inventory/inbound-qc-inspections/{id}/complete` → `/inventory/inbound-qc-inspections/{inspection_id}/complete` | `inventory:qc:complete` | I + inbound |
| W5 | POST | `/api/inventory/inventory-lots/{id}/qc-decisions` → `/inventory/inventory-lots/{lot_id}/qc-decisions` | `inventory:lot:qc_decision` | I + inbound |
| W6 | GET | `/api/inventory/shelf-placements` → `/inventory/shelf-placements` | `inventory:shelf_placement:read` | C + existing shelf |
| W7 | POST | `/api/inventory/shelf-placements` → `/inventory/shelf-placements` | `inventory:shelf_placement:create` | C + existing shelf |
| A1 | GET | `/api/sales/flow-reconciliations/{id}` → `/sales/flow-reconciliations/{reconciliation_id}` | `sales:flow_reconciliation:read` | R |
| A2 | POST | `/api/sales/flow-reconciliations` → `/sales/flow-reconciliations` | `sales:flow_reconciliation:create` | R |
| K1 | GET | `/api/production/orders` or `/{id}` → `/production/orders` or `/{production_order_id}` | `production:order:read` | P / existing orders |
| K2 | POST | `/api/production/orders/{id}/acceptance` → `/production/orders/{production_order_id}/acceptance` | `production:order:accept` | N/P |
| K3 | POST | `/api/production/orders/{id}/lot-allocations` → `/production/orders/{production_order_id}/lot-allocations` | `production:order:allocate`; current CHECKED and eligible stock required server-side | C/P/R |
| K4 | POST | `/api/production/orders/{id}/start` → `/production/orders/{production_order_id}/start` | `production:order:start` | P |
| K5 | POST | `/api/production/orders/{id}/completion` → `/production/orders/{production_order_id}/completion` | `production:order:complete` | P; inventory consume/finished receipt remain internal service operations |
| Q1 | POST | `/api/production/finished-goods-qc-inspections/{id}/complete` → `/production/finished-goods-qc-inspections/{production_order_id}/complete` | `production:qc:decide` | P; C owns applied release |
| L1 | GET | `/api/sales/products/{id}` → `/sales/products/{product_id}` | `sales:product:read` | L / existing products |
| L2 | POST | `/api/sales/products/{id}/lifecycle` → `/sales/products/{id}/lifecycle` | `sales:product:lifecycle`; to ACTIVE also `sales:product:activate` | L |
| L3 | POST | `/api/sales/products/{id}/variants/{variant_id}/lifecycle` → `/sales/products/{id}/variants/{variant_id}/lifecycle` | `sales:variant:lifecycle`; to ACTIVE also `sales:product:activate` | L |
| QR1 | GET | `/api/public/traceability/{trace_code}` → `/public/traceability/{trace_code}` | Anonymous allowlisted operation; no session/org/customer dependency | P |

Sales, after authorized A2, reads `GET /internal/inventory/material-requests/{request_id}/receipt-facts` with its service JWT; this is a service-only dependency, not a portal browser endpoint. Accountant sees its scoped reconciliation response through A1/A2. An initial live-facts preview would require a sales-owned, accountant-authorized read contract before adding a BFF.

Warehouse request discovery composes the source-plan/order handoff's accepted request refs and existing receiving navigation. I currently specifies receipt-facts only, not a public request-list API; a standalone paginated queue needs an owner-approved read contract before implementation. A1 reads a known reconciliation ref; no unowned sales reconciliation-list endpoint is assumed. Existing checkout remains SALES-ORDER-001, including authenticated customer identity; only QR is anonymous.

## API

Portal-owned draft BFF additions from U5/U6  are listed here. Request schema names refer to the linked owner, not a duplicated DTO. Pass through owner status/code meaning and safe correlation IDs; public output is strictly redacted. Existing reused BFF operations in Calls retain their existing contracts.

| method | path | request | responses |
|---|---|---|---|
| GET | /api/production/food-plans/{id}/material-requirements | - | 200, 400, 401, 403, 404, 409, 503 |
| POST | /api/production/food-plans/{id}/material-requests | SubmitMaterialRequest | 200, 202, 400, 401, 403, 404, 409, 503 |
| POST | /api/sales/flow-reconciliations | FlowReconciliationRequest | 201, 200, 400, 401, 403, 409, 422, 503 |
| GET | /api/sales/flow-reconciliations/{id} | - | 200, 400, 401, 403, 404, 503 |
| POST | /api/sales/products/{id}/lifecycle | ProductLifecycleRequest | 200, 400, 401, 403, 404, 409, 422, 503 |
| POST | /api/sales/products/{id}/variants/{variant_id}/lifecycle | VariantLifecycleRequest | 200, 400, 401, 403, 404, 409, 422, 503 |
| POST | /api/production/orders/{id}/completion | ProductionCompletionRequest | 200, 202, 400, 401, 403, 404, 409, 502, 503 |
| GET | /api/public/traceability/{trace_code} | - | 200, 404, 503 |

Public unknown/malformed code has 404; upstream dependency/network failure has 503. Protected BFF transport failures map to 503, without leaking internal URLs/tokens. Org denial is 403; missing/expired session is 401. No automatic mutation replay with a new key: preserve Idempotency-Key/operation_id, canonical payload, expected plan/source/aggregate revisions and stable completion/output identity. Same key/different payload conflicts. 202 means durable pending, never success toast or a replacement operation. Refresh/query or explicit retry uses the same identity; state advances only on owner ACK.

## Product and variant state presentation

L owns the transition guards/history and state machine; the screen renders permitted server transitions, current version, reason and prerequisite evidence. Product states: DRAFT, ACTIVE, SUSPENDED, RETIRED. Variant states: DRAFT, READY, ACTIVE, SUSPENDED, RETIRED. READY is configuration/price readiness, not finished QC. RETIRED is terminal. Resume preserves child states; parent SUSPENDED blocks sale of every variant without rewriting them. Variant correction passes through READY before reactivation. Each transition submits expected_version and required reason; stale version returns 409 and refreshes the record before another attempt.

Physical progress is a separate per-output-lot projection: PLANNED, REQUESTED, ALLOCATED, IN_PRODUCTION, WAITING_QC, SELLABLE, HELD, DEPLETED. Each badge links to its owner refs/revisions. Same variant can contain SELLABLE and HELD lots. Display IN_STOCK/OUT_OF_STOCK/UNKNOWN separately; zero available due to reservation is not proof of DEPLETED. Sellout changes neither product nor variant catalog state. Checkout rechecks parent/variant, price, QC/provenance, expiry, label/shelf and stock; ACTIVE never bypasses them. QR remains stable after every catalog/physical transition.

## UX and implementation boundaries

Follow [frontend rules](/mnt/win_d/feature/ticket/platform-docs/standards/frontend.md). The requested `platform-docs/standards/ui-ux.md` is absent in that checkout; use the existing [UI/UX rules](/home/dawn/orca/workspaces/platform-docs/feature-docs-001/standards/ui-ux.md) read-only for this DRAFT and reconcile its location in the child plan.

- All S1–S10: loading Skeleton/aria-busy, successful real data, contextual EmptyState with one permitted next action, and persistent ErrorState/InlineAlert with `role="alert"`. Table states stay inside the table frame. 401 recovers session only for console; 403 locks the action with branch/grant reason; 404 distinguishes missing entity; 409 preserves edits and prompts refreshed revision; 400/422 errors appear at fields; 502/503 offers retry without fake data. Public QR uses its own 404/503 wording, never a login prompt.
- Console uses existing ConsoleShell, title/context subtitle, toolbar with one primary action and department navigation controlled by grants. Lists open detail sheets (440px; 560px for child tables); many-step/>12-field reconciliation or actual-completion uses a dedicated route section with automatic step progress. Lifecycle with reason uses compact dialog. No custom overlay implementation or stacked dialogs; OverlayRoot owns Esc, focus trap/return and dirty-form handling.
- Pending buttons show spinner after 300ms, disable duplicate submit and explain missing prerequisites next to locked actions. Beyond 10s, keep background operation progress and notify only on actual completion; 10s is a test convergence deadline, not a production SLA. Do not require manual reload to advance the workflow. Business writes/stock/accounting/QC transitions wait for authoritative ACK rather than optimistic success.
- Use next-intl with Vietnamese default, accessible labels and role selectors, contextual hints for yield/loss/revisions, approved tokens/handwritten SVG icons, existing shared primitives/patterns and motion reduction. Test 375/768/1024/1440, light/dark and keyboard. No private costs/certificates/evidence links/actor PII on QR, including hidden markup, hydration payload or logs; allowlist supplier public identity, dates and QC summaries.
- `app/**/page.tsx` composes one feature screen as a Server Component. Hooks/models/views belong in `features/production`, `features/inventory`, `features/sales`, `features/products`, `features/traceability`. No cross-feature imports; share typed contracts through `lib`. `app/api/**` maps fixed operations/errors/audit, `lib/api/{production,inventory,sales}.ts` owns service clients/fetch and generated `lib/contracts` owns types. Components receive props only, no data hooks/fetch. Public store route and BFF must bypass console session guard while retaining fixed read-only backend targeting.
- Reuse PORTAL-INBOUND-001 screens and org fixed-role grants; implement only uncovered FLOW deltas. Do not introduce second receiving/QC CRUD, stock ledger, permission engine or reconciliation database in portal. Audit protected mutations with safe operation/reason/scope metadata, excluding credentials and sensitive payloads.

## Acceptance and evidence

Child U2–U9 covers unit logic, real BFF/backend integration and browser acceptance; component ownership remains antigravity U7/U8, typed logic/BFF/routes/e2e codex U4–U6/U9. Before code, freeze the O bindings and owner-approved request/reconciliation discovery and initial facts-preview contracts; do not infer endpoints from screen names.

1. AC-1/2/3: actual department principals execute 500 EA planning → 100/50/10 kg request → correlated receipts/QC → exact money evidence → CHECKED. Shortage/QC failure, NET90% vs GROSS and stale source revisions produce their explicit blocked states; DISCREPANCY cannot allocate.
2. AC-4/5: reserve10/use8/release2 uses actual ACK for genealogy; duplicate completion never consumes twice. Missing receipt/release/policy evidence stays HELD. M sellable/L held and parent suspension have independent, correct effects; retired state cannot revive.
3. AC-6/7: reuse checkout and consume 500 once; 501st denied. Sold output trace retains exact L1/L2/L3 set with supplier/date/QC, excluding a distractor lot and private facts. Anonymous browser sees the same QR after depletion; unknown404/dependency503 are distinct.
4. AC-8/9: real org grants, wrong branch/tenant, expired identity, customer/internal denial and QA/accountant separation; operation/event replay10 converges without extra records or stock. TC-E-500 uses APIs through Kong and browser, never direct finished-stock/genealogy/order seeds. Mutating actual-use guard, dedup or provenance source must fail assertions.
5. Each changed route has four distinct state screenshots and accessible role/label browser selectors; accessibility ≥90, mobile LCP ≤2.5s, First Load JS ≤200kB, runtime console errors/5xx=0 in the healthy scenario. Forced dependency-failure scenarios separately verify expected 503 UI.

S4 evidence is document lint only: `python3 ~/agent_skills/sdlc/engine/speccheck.py --lint .aidlc/specs/food-flow.md`. Runtime/unit/integration/browser/arch/migrations NOT_RUN; no claim that TC-E-500 or backend endpoints are implemented. DRAFT awaits child contract freeze/approval and implementation gates.
