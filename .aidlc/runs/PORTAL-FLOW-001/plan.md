# Plan: FLOW-001 child: portal delta

- **Task ID**: `PORTAL-FLOW-001`
- **Mode**: `hard`
- **Story**: US-FLOW-001
- **Sprint**: 05
- **Issue**:

## Scope
Child của [FLOW-001 đã được Dawn duyệt 7/10](/mnt/win_d/feature/ticket/.aidlc/runs/FLOW-001/plan.md), thực hiện đúng U1–U9 theo thứ tự của epic. OD-1..OD-9 defaults là rules; DRAFT của child chỉ nghĩa chưa được duyệt cook, không mở lại quyết định epic.

- Outcome: dinh dưỡng → kho → kế toán → bếp/QA → product/variants → khách → QR, bằng BFF và màn hình thật; TC-E-500 chứng minh 500 EA, request100/50/10 kg, actual L1/L2/L3, 500 bán một lần, suất501 bị chặn, undeclared variance=0 theo từng SKU/UOM.
- Decision: REUSE + EXTEND các clients/BFF/views hiện có. Portal logic/tests/routes = codex; components/animation = antigravity; BE và quyền do các child service của codex sở hữu, không viết BE trong repo portal.
- Reuse bắt buộc: INVENTORY-INBOUND-001 và PORTAL-INBOUND-001 cho receiving/QC; INVENTORY-SALES-STOCK-001 cho stock/shelf/reservation; SALES-ORDER-001 cho checkout/payment; ROLE-CATALOG-001, ORG-RBAC-V2-001, ORG-INBOUND-PERMISSIONS-001 cho grants. Không tạo CRUD/ledger/role/seed thay thế; nếu inbound UI đã có owner, chỉ compose/link.
- Ngoài scope: AI/forecast, preorder/transfer, provider settlement/statutory ledger, đổi auth/session/authorization engine, DB portal cho flow, migration/backend refactor, Kafka producer/consumer trong portal. Phiên này chỉ spec fix + plan + handback, không runtime/code/infra/push.
- Impact: typed client → flow model → BFF/view → route; business authority ở owner service. Graph-first project `mnt-win_d-feature-ticket`, generation2026-09-05, query portal trả0; coverage missing/not_tracked cho inventory/features/routes/tests. Evidence bên dưới dùng source trực tiếp trong worktree này, không coi graph0 là proof.

## Requirements
FR/AC của child cụ thể hóa epic, giữ các state/guard của owner; mỗi FR có ít nhất một Given/When/Then oracle.

- FR-1 Preview/request trước chờ giá. AC-1: Given BOM version100%, 500 EA và 0.200/0.100/0.020 kg; When preview/submit tại revision đã duyệt; Then request100/50/10 kg với line refs ổn định; WAITING_PRICE_APPROVAL vẫn submit được. NET90% chia yield đúng1 lần, GROSS không chia; thiếu policy block; đổi BOM không sửa snapshot cũ.
- FR-2 Fulfillment qua inbound reuse. AC-2: Given accepted request; When kho nhận/QC thật; Then UI tách required/received/eligible/shortage và refs/revisions; partial/QC FAIL/expiry không hiện đủ hàng; accepted không là received/reserved. Warehouse không thấy CostVND/EvidenceRefs của privileged facts.
- FR-3 Kế toán + allocation gate. AC-3: Given source receipts/cost/evidence hiện hành; When ACCOUNTANT đối chiếu; Then CHECKED chỉ mở allocation tại đúng request revision + snapshot hash/watermark; DISCREPANCY/missing evidence/stale source/UNKNOWN khóa; record không xác nhận NCC đã được trả tiền. POST replay đọc cùng reconciliation ref, GET ref đã biết, không invent list/preview API.
- FR-4 Actual completion/ACK. AC-4: Given reserve10kg, actual8kg gồm loss1kg; When bếp hoàn tất; Then source hữu ích7 + loss1, consume8/release2, genealogy đúng ACK; retry10 cùng completion/output/key không tạo lô/stock mới. 202/mất ACK vẫn pending; input actor/role không là quyền.
- FR-5 Finished QC/shelf readiness. AC-5: Given output receipt; When QA PASS nhưng inventory chưa applied ACK, thiếu policy/evidence, expired hoặc chưa placement/label; Then không SELLABLE; correction có quyền tạo revision mới, giữ expiry/audit; stale PASS không mở HELD. Shelf là vị trí cùng lot balance, không trừ tồn lần hai.
- FR-6 Lifecycle độc lập. AC-6: Given product1:N variants; When manager đổi state đúng expected_version/reason; Then đúng transition table L, RETIRED terminal, parent suspend chặn tất cả; M eligible vẫn bán khi L HELD; reserved available0 không là DEPLETED; sellout không đổi catalog state. Giá/QC/stock được recheck tại checkout reuse.
- FR-7 Public QR. AC-7: Given finished lot đã bán hết/suspend/retire; When anonymous đọc code; Then vẫn exact actual raw set L1/L2/L3, supplier public name/code, received_at, inbound/finished QC; không distractor/cost/private evidence/actor/PII trong HTML/hydration/log. Unknown/malformed404 khác dependency503, không login redirect.
- FR-8 Actor/scope/recovery. AC-8: Given real org grants nutrition/warehouse/accountant/kitchen/QA/manager và customer auth; When direct HTTP/UI/wrong branch/expired token/customer internal/SoD; Then owner kiểm đúng action/scope, deny không mutation, không dùng OWNER cho tất cả. Payload khác cùng key409; pending chỉ advance sau matching owner ACK.
- FR-9 UI/state/evidence. AC-9: Given từng màn thay đổi; When loading/empty/error/success và business blocked; Then bốn trạng thái rõ, action khóa có lý do, tiến trình refresh tự động, edits giữ khi409; role/label selectors, 375/768/1024/1440 light/dark/keyboard/reduced-motion; ảnh4 states/màn, a11y≥90, mobile LCP≤2.5s, First Load JS≤200kB, healthy console errors/5xx=0. TC-E-500 và mutations bỏ actual guard/dedup/đổi distractor phải đỏ.

## Technical definition
Có sẵn nghĩa code/contract được đọc, không là live verification; gap được remap ở U1/U2 trước code. Không có quyền cook từ child này.

### Exists vs gap (source worktree portal)
| Evidence file:line | Exists / gap → slice |
|---|---|
| `lib/api/production.ts:3`, `:18`, `:36`, `:109`, `:138`, `:165`, `:187` | Có target/plan/publish/order; numbers cho BOM/quantity và errors→[] ở:111/:189 chưa đáp ứng exact decimal và unavailable riêng → U4 |
| `lib/api/production.ts:103`, `:224`, `:236` | Mỗi mutation tạo key mới; completion chỉ actual_output_quantity/input_lot_refs/role_code; QC chưa revision/policy/applied ACK → U4; giữ stable identity qua retry |
| `features/production/orders-view.tsx:38`, `:43`, `:78`, `:90`; `features/production/qc-view.tsx:175` | Fetch ngoài lib, role fallback, dùng planned để complete và fallback actual→planned; bỏ khỏi flow mới, không giả actual/QC → U7 |
| `lib/api/sales.ts:3`, `:66`, `:127`, `:137`; `features/products/product-detail-view.tsx:23` | Có activation/cart/order; Product chưa1:N variants/RETIRED/history, thiếu lifecycle/reconciliation → U4/U5/U8; checkout tiếp tục reuse |
| `lib/api/inventory-bff.ts:9`; `lib/api/production.ts:248`, `:255` | Có fixed inventory proxy và shelf clients; chưa `lib/api/inventory.ts` trong bounded `lib/api` inventory; không có flow-model/lifecycle-model và flow tests trong listing `features/tests` → U2/U4 |
| `lib/api/production-bff.ts:9`; `lib/api/service-bff.ts:19`, `:27`, `:41`, `:57` | Reuse fixed-target access-token forwarding, key passthrough và response status; transport catch502, chưa bounded timeout/redaction/audit policy FLOW → U5b/U6; giữ owner business502, map transport503 có kiểm regression |
| `app/api/production/orders/[id]/completion/route.ts:6`; `app/api/public/traceability/[trace_code]/route.ts:6` | Completion thin BFF và public requireAuth=false có sẵn; phải enforce new DTO/allowlist và lỗi404/503 → U6 |
| `app/(store)/traceability/[code]/page.tsx:13`; `features/traceability/trace-view.tsx:82`; `lib/api/production.ts:72` | Public page có thật, trace mới chỉ material/supplier_code thiếu lot/date/QC-rich sources và error distinction → U6/U8 |
| `proxy.ts:6`, `:31`; `lib/fetcher.ts:2`, `:23`, `:73` | Proxy mở `/traceability`/`/api/public`; giữ. Console routes chưa new paths, public apiFetch vẫn có401 refresh; U6b/U9b thêm exact route/exemption, không broaden proxy auth |
| `vitest.config.ts:4`, `:14`; `tests/integration/portal-backend.it.test.ts:13`, `:32`, `:39`; `package.json:11`, `:35` | Reuse HTTP/cookie capture helper behavior; existing integration skipIf, chỉ chọn khi arg `tests/integration`; U2 sửa selection cho flow.it, fail env/zero tests, không copy Skip. `npm test` dùng sh -c không forward args trong package.json:11; invocation một arg biến nó thành $0, nên selector không tới Vitest. Vitest có sẵn, Playwright chưa dependency → U2/U3 |
| `components/ui/dialog.tsx:14`, `:39`; bounded `components/ui` listing | Có dialog/focus stack, state/table/field/toast; chưa Sheet/icons raw SVG ở checkout này → U7 prerequisites; không fork overlay stack |

### Constraints / dependencies
- [Frontend](/mnt/win_d/feature/ticket/platform-docs/standards/frontend.md): fetch chỉ lib/api hoặc lib/fetcher; pages là Server Component composition; không cross-feature imports; models own pure logic, no business authority; early-return, nesting≤2–3, functions~40lines. Shared generated types không hand-edit.
- [backend-go](/mnt/win_d/feature/ticket/platform-docs/standards/backend-go.md) và [platform-go API](/mnt/win_d/feature/ticket/platform-go/docs/API.md) áp dụng BE prerequisites P/I/S/O: reuse idgen.UUIDv7, apperror/response, serviceauth.AuthorizerClient, database/pgtest, messaging Envelope, outbox.SaveTx/RelayWorker, resilience. Không duplicate helper hoặc stock/finance models trong portal.
- BE local multi-row writes + operation/history/inbox/outbox trong ONE ACID tx, lỗi rollback hết; actor/user lock trước nếu có rồi aggregate/children sorted IDs. Remote I/O ngoài tx; no cross-DB FK/join/direct Kafka dual-write. Goroutines chỉ existing named relay/consumer workers trong child P7/P9/I8/S7, không goroutines mới cho sequential flow/portal. Quan hệ remote là soft refs.
- Quantity decimal strings+UOM, output EA nguyên, VND int64 không qua float/unsafe Number; nếu JSON int64 vượt JS safe integer thì reject rõ trước decode/mutation, không round im lặng. BOM NET/GROSS/yield/rounding explicit versioned, UTC/Asia_Ho_Chi_Minh. Không client suy receipt facts hoặc actual genealogy từ BOM.
- P1/I1/S1/O1 contract freeze → U2 RED → U4 typed logic. U5/U6 live integration đợi P5/P6/P8, I4–I7, S4/S5/S6 và O3/O4 đúng grants. U9 đợi P9/I8/S7 relays + real child e2e và inbound/checkout prerequisites, không yêu cầu vòng dependency để bắt đầu logic.
- Hạ tầng từ dev-infra read-only: `docker-compose.yml:22,60,125` Postgres/Kafka/Kong; `scripts/e2e-db.sh:2` reset DB `_e2e`; `docker-compose.e2e.yml:4` hiện chỉ auth/org overrides. Coordinator phải cung cấp stack production/inventory/sales + workers trỏ DB/topic cô lập, không DB dev. Portal không chỉnh infra repo.

## UX
Pipeline `.aidlc/stage-policy.json` bắt buộc section UX; giữ section có sẵn trong header template bên cạnh các sections DOCS-SHARD-001 để `plan_problems=[]`, không sửa policy. Screen/call/state đầy đủ nằm trong [food-flow](../../specs/food-flow.md#screens), không paste wire contract.

- Nutrition targets/food-plan dùng list+sheet cho dữ liệu ngắn; actual-completion và reconciliation nhiều bước dùng dedicated section+progress; lifecycle reason dùng compact Dialog; kho compose inbound và `/inventory/shelves`; QR public route riêng. Mỗi màn loading Skeleton/aria-busy, contextual EmptyState+granted next action, persistent role=alert ErrorState, real success; denied/stale/ACK pending là trạng thái business riêng, không empty thành công.
- Reuse Field/Table/State/Toast/Dialog; Sheet/icons thiếu là prerequisite U7a/U7b, share overlay focus/Esc/return, không dialog stack mới. Token từ `app/tokens.generated.css`, motion/reduced-motion; next-intl vi/en. Owner antigravity chỉnh components/animation U7/U8, codex xử lý models/routes/test tooling; không đồng thời ghi chung file.
- [UI/UX rules](/home/dawn/orca/workspaces/platform-docs/feature-docs-001/standards/ui-ux.md) là bản có thật đã đọc; `/mnt/win_d/feature/ticket/platform-docs/standards/ui-ux.md` absent. Không copy standard; location tracking OD-14. Preview/reference là contract Screens + UX của spec, không coi mockup/screenshot chưa chụp là evidence.

## Design
Contract là [food-flow](../../specs/food-flow.md); các owner APIs/DTO/events/state tables được LINK, không paste lại. U1 freeze field mapping hiện tại trước U4; backend owner side wins.

- [Production nutrition](/home/dawn/orca/workspaces/production/flow-001/.aidlc/specs/nutrition-material-request.md), [actual/QR](/home/dawn/orca/workspaces/production/flow-001/.aidlc/specs/actual-production-trace.md): procurement riêng pricing wait; useful source+disjoint losses→actual ACK; QC/policy/release revision; public trace allowlist.
- [Inventory request](/home/dawn/orca/workspaces/inventory/flow-001/.aidlc/specs/material-request-fulfillment.md), [consume](/home/dawn/orca/workspaces/inventory/flow-001/.aidlc/specs/production-actual-consume.md): revision query, accepted ACK≠stock; loss included once; shelf location cùng lot; authoritative receipt/release/trace binding.
- [Sales lifecycle](/home/dawn/orca/workspaces/sales/flow-001/.aidlc/specs/product-lifecycle.md), [reconciliation](/home/dawn/orca/workspaces/sales/flow-001/.aidlc/specs/flow-reconciliation.md), [org grants](/home/dawn/orca/workspaces/org/flow-001/.aidlc/specs/flow-permissions.md): distinct catalog/variant/per-output state, monotonic version; current CHECKED gate, separation/private facts; exact action keys, không role fallback.
- U4 models giữ stable operation/revision/key + immutable draft payload; client server-state reads và explicit retry cùng identity, không auto replay với key mới. Missing authority khóa action. Decimal display không tính lại BOM oracle; lifecycle guards render allowed transitions của L, không invent transition.
- U5 routes reuse fixed-target forwarders, authenticated identity và owner authz; GET reconciliation nhận known ref (U5c), không list endpoint. U5b scoped bounded timeout/503/audit metadata, không log raw payload. U6 trace allowlist trước HTML/response, anonymous no refresh/session requirement; mutation business502 giữ nghĩa invalid ACK của P.
- U7/U8 compose models through typed clients, reuse inbound/sales-stock/checkout; U9 pages compose one feature, integration fixtures/epic runner theo source epic. Kho chỉ nhận safe request refs, kế toán dùng scoped known reconciliation/input assertions; initial private facts preview cần owner-approved contract trước khi thêm.

## Files planned
Đây là future cook allowlist, concrete files tương đối portal; phiên này chỉ sửa plan/spec và handback. Không directory wildcard; mọi slice≤5 files kể cả tests/toolchain.

- `.aidlc/specs/food-flow.md`
- `tests/flow/unit.test.ts`
- `tests/flow/backend.it.test.ts`
- `tests/flow/food-flow.spec.ts`
- `playwright.config.ts`
- `vitest.config.ts`
- `package.json`
- `pnpm-lock.yaml`
- `lib/api/production.ts`
- `lib/api/inventory.ts`
- `lib/api/sales.ts`
- `features/production/flow-model.ts`
- `features/products/lifecycle-model.ts`
- `lib/api/service-bff.ts`
- `lib/api/production-bff.ts`
- `lib/api/inventory-bff.ts`
- `lib/api/sales-bff.ts`
- `app/api/production/food-plans/[id]/material-requirements/route.ts`
- `app/api/production/food-plans/[id]/material-requests/route.ts`
- `app/api/sales/flow-reconciliations/route.ts`
- `app/api/sales/flow-reconciliations/[id]/route.ts`
- `app/api/sales/products/[id]/lifecycle/route.ts`
- `app/api/sales/products/[id]/variants/[variant_id]/lifecycle/route.ts`
- `app/api/production/orders/[id]/completion/route.ts`
- `app/api/public/traceability/[trace_code]/route.ts`
- `app/(store)/traceability/[code]/page.tsx`
- `lib/fetcher.ts`
- `lib/fetcher.test.ts`
- `components/ui/sheet.test.tsx`
- `components/ui/sheet.tsx`
- `components/ui/icons.tsx`
- `features/production/targets-view.tsx`
- `features/production/food-plans-view.tsx`
- `features/production/orders-view.tsx`
- `features/production/qc-view.tsx`
- `features/inventory/flow-request-view.tsx`
- `features/sales/flow-reconciliation-view.tsx`
- `features/products/product-detail-view.tsx`
- `features/traceability/trace-view.tsx`
- `messages/vi.json`
- `messages/en.json`
- `app/(console)/inventory/material-requests/page.tsx`
- `app/(console)/sales/flow-reconciliations/page.tsx`

## Tests planned
Checks bên dưới là planned/NOT_RUN, không receipt PASS. Tên checks `unit`, `integration*`, `e2e*` phải được đăng ký tại verify sau approval; lint/arch không thay unit/integration/browser.

| TC | AC | layer/check | Exact command (cwd portal) |
|---|---|---|---|
| TC-U | AC-1..9 | unit | `npm test -- tests/flow/unit.test.ts` |
| TC-I | AC-1..8 | integration-live | `npm test -- tests/flow/backend.it.test.ts` |
| TC-E | AC-1..9 | e2e-live / TC-E-500 | `npm exec --no -- playwright test tests/flow/food-flow.spec.ts` |
| TC-C | all | spec | `python3 ~/agent_skills/sdlc/engine/speccheck.py --lint .aidlc/specs/food-flow.md` |
| TC-R | AC-8,9 | unit/regression/static | `npm test && npm run lint && npm run typecheck && python3 ~/agent_skills/sdlc/engine/archcheck.py` |
| TC-S | AC-9 | unit keyboard/focus | `npm test -- components/ui/sheet.test.tsx` |

### RED/GREEN, live setup and fail-closed preflight
- U2 sửa package.json test script forwarding arguments tới Vitest (hiện sh -c bỏ selectors), đồng thời bổ sung Browser tooling; test entry points must select ≥1 real case and fail missing env; `vitest.config.ts` include flow .it only for explicit integration invocation and exclude Playwright .spec from Vitest. Existing `describe.skipIf` pattern is NOT reused. Integration/e2e tests assert live health/contracts, isolated database identities/topics, actual permissions; no MSW/fetch intercept/mock service tokens/Skip/passWithNoTests. RED must come from target behavior, not missing dependency/import/env. Tooling readiness failure blocks preflight, never counts as TDD RED.
- `PORTAL_IT_BASE` (existing convention) and planned `FLOW_KONG_BASE`, `FLOW_ACTOR_FIXTURE` are required; actor fixture points to protected local runtime config for real departmental/customer sessions and branch, never committed token. Browser base URL goes through Kong portal routing; server URLs stay config-only. Preflight verifies real auth/org/production/inventory/sales/Postgres/Kafka and relays; Kafka topics/schema ACLs ready. A gateway route missing is blocker, not mocked response.
- Coordinator provisions dev-infra isolated stack. After approved isolated reset, reuse `cd /mnt/win_d/feature/ticket/dev-infra && bash scripts/e2e-db.sh reset auth org production inventory sales` only on designated test DBs; existing overlay lacks three flow DB overrides, so explicit coordinator-provided configuration is prerequisite (OD-13). No infra writes/stack resets in this plan-only session.
- TC-I calls live portal BFF→real owner HTTP services backed by isolated Postgres/Kafka; inspect actual committed owner state and event-driven convergence with bounded poll, using dev-infra Kafka tools for duplicate/stale delivery. Backend child integration suites prove multi-row rollback/outbox in real pgtest databases; do not label BFF-only mocks integration. Reuse HTTP cookie capture semantics `tests/integration/portal-backend.it.test.ts:13` and platform live run conventions, with FLOW fail-closed preflight replacing Skip.
- U3 uses pinned `pnpm@9.15.4` to update `pnpm-lock.yaml` on Linux, `pnpm install --frozen-lockfile` to check integrity; runtime commands use npm per epic/AGENTS NTFS exception, no package-lock/yarn.lock. Add Playwright/browser dev tooling at U2b; no tool installs in planning turn.

### Independent assertions / anti-tautology
Future suites có named groups `typed clients`, `flow BFF`, `proxy policy`, `reconciliation read`, `public trace`, `department screens`, `owner contracts`; mỗi filtered invocation bắt buộc chọn ≥1 case. S2 target existing callable APIs/HTTP behavior trước GREEN, không coi missing import của module mới là RED.

- TC-U: typed state render, exact permission keys, pending202, stable key/conflict409, decimal/UOM/unsafe VND, useful7+loss1→actual8/release2, NET/GROSS90%, parent/variant/lot separation; fake response allowed only unit. Component assertions cover locked reasons, explicit unknown vs empty, focus/Esc/reduced-motion. Spy captures real request payload; expected values from independent fixtures, never same model helper as oracle.
- TC-I: real current receipt watermark/hash/CHECKED gate, unauthorized direct BFF403, cross-branch/expired identity, mid-write rollback/outbox via child probes, 10 key/event replays, crash/ACK retry convergence, stale release cannot reopen HELD, public404 vs503 and response redaction. Isolated per-run identities, one effect per owner operation; convergence≤10s only fixture deadline.
- TC-E-500 mirrors epic: APIs/UI create approved plan500 and request100/50/10kg; inbound real supplier/evidence/QC L1/L2/L3 plus distractor; accountant CHECKED; allocate/actual consume; completion500EA F1, QA PASS+inventory applied ACK+shelf/label; activated customer completes500EA via existing sales workflow (split orders if limit), 501st denied. No direct finished-stock/genealogy/order seed; raw eligibility derives from receiving/QC APIs. Anonymous QR verifies exact raw set/supplier/received date/QC after depletion/suspension/retirement and privacy in DOM/hydration.
- Per SKU/UOM independently assert received=consumed+declared_disposal+remaining; consumed=useful_assigned+declared_process_loss; finished_received=sold_consumed+remaining_finished+declared_finished_loss. Do not add kg+EA or use BOM as provenance. Cases M sellable/L held, missing policy/expiry/QC FAIL, money discrepancy, source changed, shortage, same-key changed payload.
- Later mutation checks: drop owner actual-use guard, disable consumer dedup, replace actual raw source with distractor: each isolated mutation must fail targeted tests, restore immediately and rerun GREEN; BE mutation execution belongs owner child, portal runner records results. Healthy browser console/5xx=0; deliberate dependency503 scenario has its own expected error assertions. U9 screenshots four states/màn + budgets are runtime artifacts, not fabricated here.

## Slices
U1–U9 sequence và owner giữ nguyên epic. `S<n>` là engine card ID; U2/U5/U6/U7/U9 tách sub-slices cho gaps cụ thể, không đổi business scope. RED entry trước GREEN tương ứng; slices chung filenames chạy tuần tự, không hai worker cùng ghi. Test commands dưới là exact commands, không TC alias.

- [ ] S1: U1 freeze UX/data/actor contract + owner mismatch log · owner: codex (files: .aidlc/specs/food-flow.md; test: python3 ~/agent_skills/sdlc/engine/speccheck.py --lint .aidlc/specs/food-flow.md)
- [ ] S2: U2a RED behavioral unit/live/browser suites, receipts phải lỗi behavior mục tiêu sau preflight · owner: codex (files: tests/flow/unit.test.ts, tests/flow/backend.it.test.ts, tests/flow/food-flow.spec.ts; test: npm test -- tests/flow/unit.test.ts && npm test -- tests/flow/backend.it.test.ts && npm exec --no -- playwright test tests/flow/food-flow.spec.ts)
- [ ] S3: U2b forward npm test args + test selection/browser tooling trước ghi receipt RED S2, include .it explicit/exclude Playwright khỏi Vitest · owner: codex (files: vitest.config.ts, playwright.config.ts, package.json; test: npm test -- tests/flow/unit.test.ts && npm test -- tests/flow/backend.it.test.ts && npm exec --no -- playwright test tests/flow/food-flow.spec.ts --list)
- [ ] S4: U3 pinned lock integrity, không lock thứ hai · owner: codex (files: pnpm-lock.yaml; test: pnpm install --frozen-lockfile && npm test -- tests/flow/unit.test.ts)
- [ ] S5: U4 GREEN typed clients/models, decimal/useful-loss/stable operations/lifecycle · owner: codex (files: lib/api/production.ts, lib/api/inventory.ts, lib/api/sales.ts, features/production/flow-model.ts, features/products/lifecycle-model.ts; test: npm test -- tests/flow/unit.test.ts -t "typed clients" && npm test -- tests/flow/backend.it.test.ts -t "owner contracts")
- [ ] S6: U5a GREEN requirement/request/reconcile/lifecycle fixed routes · owner: codex (files: app/api/production/food-plans/[id]/material-requirements/route.ts, app/api/production/food-plans/[id]/material-requests/route.ts, app/api/sales/flow-reconciliations/route.ts, app/api/sales/products/[id]/lifecycle/route.ts, app/api/sales/products/[id]/variants/[variant_id]/lifecycle/route.ts; test: npm test -- tests/flow/unit.test.ts -t "flow BFF" && npm test -- tests/flow/backend.it.test.ts -t "flow BFF")
- [ ] S7: U5b GREEN scoped proxy deadlines/transport503/safe audit, existing owner502 retained · owner: codex (files: lib/api/service-bff.ts, lib/api/production-bff.ts, lib/api/inventory-bff.ts, lib/api/sales-bff.ts, tests/flow/unit.test.ts; test: npm test -- tests/flow/unit.test.ts -t "proxy policy" && npm test -- tests/flow/backend.it.test.ts -t "proxy policy")
- [ ] S8: U5c GREEN GET known reconciliation ref, không list API · owner: codex (files: app/api/sales/flow-reconciliations/[id]/route.ts; test: npm test -- tests/flow/unit.test.ts -t "reconciliation read" && npm test -- tests/flow/backend.it.test.ts -t "reconciliation read")
- [ ] S9: U6a GREEN completion DTO/public trace allowlist wiring/404503, page chỉ compose · owner: codex (files: app/api/production/orders/[id]/completion/route.ts, app/api/public/traceability/[trace_code]/route.ts, app/(store)/traceability/[code]/page.tsx; test: npm test -- tests/flow/unit.test.ts -t "public trace" && npm test -- tests/flow/backend.it.test.ts -t "public trace")
- [ ] S10: U6b GREEN public fetch không refresh/session redirect, preserve console recovery · owner: codex (files: lib/fetcher.ts, lib/fetcher.test.ts; test: npm test -- lib/fetcher.test.ts && npm test -- tests/flow/unit.test.ts -t "public trace" && npm test -- tests/flow/backend.it.test.ts -t "public trace")
- [ ] S11: U7a RED shared Sheet keyboard/focus/dirty/reduced-motion trước component · owner: codex (files: components/ui/sheet.test.tsx; test: npm test -- components/ui/sheet.test.tsx)
- [ ] S12: U7b GREEN shared Sheet dùng dialog stack + raw SVG icons nếu chưa được shared UI task cung cấp · owner: antigravity (files: components/ui/sheet.tsx, components/ui/icons.tsx; test: npm test -- components/ui/sheet.test.tsx tests/flow/unit.test.ts)
- [ ] S13: U7c GREEN dinh dưỡng/bếp/QA views, actual form không planned fallback/role quyền · owner: antigravity (files: features/production/targets-view.tsx, features/production/food-plans-view.tsx, features/production/orders-view.tsx, features/production/qc-view.tsx; test: npm test -- tests/flow/unit.test.ts -t "department screens" && npm test -- tests/flow/backend.it.test.ts -t "owner contracts")
- [ ] S14: U8 GREEN kho/kế toán/product/QR views, use codex models và inbound reuse · owner: antigravity (files: features/inventory/flow-request-view.tsx, features/sales/flow-reconciliation-view.tsx, features/products/product-detail-view.tsx, features/traceability/trace-view.tsx; test: npm test -- tests/flow/unit.test.ts -t "department screens" && npm test -- tests/flow/backend.it.test.ts -t "owner contracts")
- [ ] S15: U8 i18n vi/en cho views, không hardcode strings mới · owner: antigravity (files: messages/vi.json, messages/en.json; test: npm test -- tests/flow/unit.test.ts && npm run typecheck)
- [ ] S16: U9a GREEN route composition + epic runner live500, tất cả BE/org ready · owner: codex (files: app/(console)/inventory/material-requests/page.tsx, app/(console)/sales/flow-reconciliations/page.tsx, tests/flow/food-flow.spec.ts, tests/flow/backend.it.test.ts; test: npm test -- tests/flow/unit.test.ts && npm test -- tests/flow/backend.it.test.ts && npm exec --no -- playwright test tests/flow/food-flow.spec.ts)
- [ ] S17: U9b console route family/grant recovery và final real release gates, ảnh/budgets · owner: codex (files: lib/fetcher.ts, lib/fetcher.test.ts, tests/flow/food-flow.spec.ts, tests/flow/backend.it.test.ts; test: npm test && npm run lint && npm run typecheck && npm test -- tests/flow/backend.it.test.ts && npm exec --no -- playwright test tests/flow/food-flow.spec.ts)

Thứ tự cook sau child approval: S1 → S2 tests viết trước → S3/S4 tooling ready → S2 chạy lại ghi RED behavior → S5–S10 GREEN từng target → S11 RED → S12 → S13 → S14 → S15 → S16 → S17. S4 chưa GREEN behavior khi U4 chưa implement: lock integrity có thể xanh, unit còn RED được giữ, không tick complete behavior giả. Live cases chưa có service prerequisite ghi BLOCKED/NOT_RUN, không coi tooling/env failure là RED hoặc tự skip. Independent review → test receipts → ship sau approval riêng; plan-only không mark done/cook/ship.

## Risks / rollback
Rủi ro chính là contract gap, tool selection và reuse ownership; rollback chỉ code/deployment portal, không biến UI rollback thành undo stock.

- BE drafts/transport envelopes còn khác nhau → freeze U1 theo owner và OD dưới, không tự thêm accepted fields, queue/list/privileged preview. 202 không success. Nhận query ref hợp lệ không đồng nghĩa authorized.
- Cũ forwardService catch502/quantity Number/list[]/planned completion/role fallback → targeted RED+regression trong U2/U4/U5b/U7; sửa đúng FLOW scope, không broaden migration/layout/refactor. BFF không trở thành permission authority hoặc finance DB.
- Shared Sheet/icons/i18n và PORTAL-INBOUND ownership có thể vừa được task khác cung cấp → probe source trước U7; reuse, bỏ delta trùng qua approved plan revision, không overwrite worker khác. UI standards location được track riêng, không tự copy/modify external repo.
- Zero-selected integration hiện có + Playwright missing → U2/U3 fix/preflight; missing Kafka/DB/Kong/routes/grants không PASS. Infra overlay auth/org-only cần coordinator mapping đủ services; không chạy reset trên dev DB, không commit secrets/fixtures.
- Rollback: revert slice commit hoặc deploy bản portal trước, vô hiệu hóa entry route mới nếu cần; giữ immutable owner rows/operation keys/outbox/QR history. Không retry bằng key mới, không xoá inbox hoặc compensate stock từ portal. Live bug ở authority dừng thao tác và giao owner correction/audit.

## Open decisions
OD-1..OD-9 của epic đã accepted ngày2026-10-07, không hỏi lại. Chỉ unknown delta dưới đây là [ASSUMED]; defaults là đề xuất, không tự approve. Lệch của owner spec chỉ ghi ở đây, không sửa sibling. Không `orca ask`.

### Lệch với spec khác
Owner specs đang được các worker sửa đồng thời; snapshot audit ghi trong handback. Portal không freeze DTO internal đang lệch, không sửa sibling; P/I/S cần cùng đối chiếu trước U1 contract freeze.

- M-1 request/ACK: inventory material-request-fulfillment:48/:50 hiện thêm FoodPlanRevision/BOMSnapshot vào request, LineIDs vào ACK; production nutrition:29 và outbound mapping vẫn nói không có những fields này. Inventory wire owner wins; P1 cần cập nhật mapper/ACK validation. Portal chỉ dùng production MaterialRequestResponse đã link, không tự định nghĩa inventory ACK.
- M-2 receipt-facts: sales đã sửa flat response/watermark string/thiếu query revision/500 thành nested+int64 theo inventory. Tuy nhiên inventory vừa thêm OrgID/BranchID/Complete và CostSnapshotRef/Revision (:51/:53), sales response DTO:58/:60 + prose vẫn nói chúng không tồn tại. Inventory owner wins; S1 cần map latest owner, không suy private schema ở portal. Đây là moving-contract mismatch, chưa chốt resolved toàn bộ.
- M-3 allocation revision/watermark từng thiếu; inventory production-actual-consume:56 nay có ReconciliationRevision/ReceiptWatermark: resolved phần fields theo owner snapshot. Live current gate và minimal sales→production gate read vẫn prerequisite freeze, không có quyền client tự chứng nhận CHECKED.
- M-4 inventory chưa có warehouse-safe request list/read API, dù org có `inventory:material_request:read`; production order handoff chưa explicit safe fulfillment DTO cho S3. Không dùng private receipt-facts để lấp chỗ. Known-ref compose sau owner freeze; standalone queue chưa được hứa hẹn (OD-10).
- M-5 sales chỉ POST và GET/{reconciliation_id}, không list/initial receipt-preview. U5c thêm BFF GET known ID khớp owner; screen giữ known ref+assertions, không invent backend route (OD-11).
- M-6 actual/trace: inventory consume DTO:60–65 nay có Revision, source ReceiptRef/Revision, receipt ACK TraceCode/ExpiresAt; production actual prose còn nói không có các fields này. Inventory trace facts route:44 là `/internal/inventory/lots/{lot_id}`, không `/internal/traceability/lots/{lot_ref}` trên inventory; production prose còn trộn host/path. Inventory QC facts:69/:70 có structured InboundQC; production PublicTraceSource:70 chỉ InboundQCSummary string và prose còn coi inventory summary string. I wire owner wins cho internal, P public owner wins cho portal: render P's inbound_qc_summary string + structured finished_qc; không invent public fields. P1/I1 phải chốt explicit adapter mapping trước U6/QR live.

### Câu hỏi cho Dawn
| OD | Unknown delta | Recommended default |
|---|---|---|
| OD-10 | [ASSUMED] Request queue lấy safe discovery/correlation DTO từ owner nào, đủ request refs trước pricing/order handoff chưa? | P1/I1 freeze safe read/grant với owner; U8 known-ref receiving compose, không BFF private receipt-facts, không queue/list mới trước approved owner contract |
| OD-11 | [ASSUMED] Accountant preview và tìm reconciliation mới dùng read nào khi sales chỉ POST/GET known ID? | Giữ known reconciliation ref từ POST và scoped GET; input assertions/evidence do accountant, server đọc facts; preview/list là owner delta riêng nếu cần, không invent ở portal |
| OD-12 | [ASSUMED] PORTAL-INBOUND/shared UI task có cung cấp Sheet/icons/request navigation trước U7/U8 không? | Coordinator xác nhận owner/commit; reuse nếu có, chỉ S11/S12 delta thiếu; không sửa inbound UI cùng worker khác |
| OD-13 | [ASSUMED] Đường dẫn stack/test config cô lập và Kong portal route cho 5 services/relay/department principals? | Coordinator cấp env/fixture path và full DB overrides/topics riêng từ dev-infra; test fail-closed khi thiếu, không chạy dev DB/mocks hoặc tự sửa infra |
| OD-14 | [ASSUMED] Bản standard UI/UX nằm worktree platform-docs feature-docs-001, chưa ở workspace canonical; nơi dùng khi cook? | Giữ link read-only hiện có, platform-docs owner promote/remap; portal không tạo standard bản sao |

### Validation / confidence plan-only
- Tier1: spec lint và deterministic `sdlc.plan_problems(load_policy(.), plan)` phải PASS/[]; document file/count/owner/RED-order checks, graph-first rồi source fallback. `hs-run --help` read-only đã probe; user không cho chạy sdlc.py/scaffold/approve nên không ghi harness approval receipt.
- Tier2: independent reviewer chưa chạy; không claim review PASS hay confidence score. Epic decisions đã approved; child vẫn chờ content-bound approval trước cook/test/ship.
- Evidence runtime unit/integration/e2e/browser/mutation/budgets = NOT_RUN trong plan-only; không tick slice, không fabricate 500EA outcome. Header engine giữ nguyên, ACTIVE/trace/state/board user changes untouched.
