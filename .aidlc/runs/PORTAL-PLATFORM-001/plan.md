# Plan: UI nền tảng và quản trị công ty Đồng xanh

- **Task ID**: `PORTAL-PLATFORM-001`
- **Mode**: `hard`
- **Story**: US-UI-001
- **Sprint**: 01
- **Status**: Claude nhận lại từ codex 2026-09-28 (codex để khung rỗng). Amendment bên dưới thêm S0 bộ UI kit → cần Dawn approve lại.

## Scope
- Outcome đề xuất để Dawn duyệt: hoàn thành 8/8 nhóm luồng trong handoff qua BFF; 0 truy cập sai scope/công ty; 100% màn hình mới có bằng chứng desktop 1440 và mobile 390.
- Decision: EXTEND transport, auth redirect và UI primitives hiện có; CREATE các màn hình platform/company.
- Nguồn yêu cầu: [handoff 2026-09-28](/home/dawn/Dawn-Brain/inbox/2026-09-28-handoff-portal-platform-ui.md:15).
- Repo duy nhất thay đổi: portal, nhánh main theo handoff. Không sửa backend, gateway, DB, policy hoặc baseline.
- Ngoài phạm vi: D-061..065, 2FA, khách mua hàng, sửa toàn bộ shell cũ, merge/push backend.
- Impact đã đọc trực tiếp: `lib/api/service-bff.ts:16` có forwardService (cookie → Bearer, Idempotency-Key, no-store); `lib/fetcher.ts:56` có refresh/retry; `features/auth/home-for.ts:26` hiện chỉ phân biệt membership; `proxy.ts:13` chỉ kiểm cookie; `contracts/README.md:1` yêu cầu snapshot. Graph search không có kết quả, metadata index 2026-09-05; không coi graph là bằng chứng không có code.
- Baseline trước task có sửa ở next-env.d.ts, vitest.config.ts, tests/ và bookkeeping task khác. Không ghi đè, không nhận các thay đổi đó là kết quả của task này.

## Requirements
Các FR/AC dưới đây là thiết kế đề xuất thực hiện sau approve, dựa trên handoff và spec org §6–21.

- FR-1: Chọn mặt phẳng và bảo vệ mọi route/action bằng quyền org trả về.
  - AC-1: `/platform/me` thành công → đọc actions; chỉ action tương ứng mở màn hình/nút. Không so role name để quyết định quyền, kể cả sửa ma trận và break-glass.
  - AC-2: Khách không có platform_staff/membership bị chặn mọi màn hình mới; nền tảng không cần membership. User có cả hai scope chọn được cả hai, không hợp quyền giữa scope.
  - AC-3: `/platform/me` 404 là không có platform context; 403/503/network/malformed không được coi là allow. Quyền MAIN lấy `/org/permissions/me?org_id=MAIN&branch_id=MAIN`; đổi công ty xóa dữ liệu/quyền cũ trước khi tải. Cookie chỉ là đăng nhập, không là quyền.
- FR-2: Công ty: danh sách, onboard, chi tiết.
  - AC-4: GET companies phân trang; POST onboard gửi đầy đủ trường theo DTO nguồn, gồm contract_ref, owner_email, owner_display_name và modules; không gửi owner_user_id/performed_by_user_id. Giữ Idempotency-Key cho retry cùng nội dung, khóa submit khi pending.
  - AC-5: Chi tiết hiển thị id MAIN cùng module/ma trận lấy từ API hiện có; reload URL trực tiếp hoạt động; id không tồn tại hiện 404; không gọi GET company detail không tồn tại.
- FR-3: Module công ty.
  - AC-6: Action platform:module:manage mới được PUT status/contract_ref/starts_at/ends_at; CORE không có thao tác tắt; backend 400 vẫn hiện lỗi. Đọc lại dữ liệu sau ghi; không đánh dấu thành công khi request thất bại.
- FR-4: Ma trận theo công ty.
  - AC-7: platform:role_matrix:read mở xem; platform:role_matrix:update mở thay toàn bộ actions của role; kiểm công ty khác không đổi; 400 action của module chưa mua và 404 role lạ hiển thị đúng, không mất bản nháp.
- FR-5: Hỗ trợ có thời hạn.
  - AC-8: Xin quyền có root_branch_id, reason, ticket_ref; grant pending không được hiển thị đang có quyền. STANDING/OWNER_APPROVED 24 giờ và trạng thái revoked/expired dựa dữ liệu backend, không dựa đồng hồ UI để cấp quyền.
  - AC-9: Chỉ action platform:support_access:break_glass mở thao tác; lý do bắt buộc; trước submit hiện rõ “4 giờ”. Riêng endpoint này trả 409 → “Công ty đã dùng break-glass trong 24 giờ qua, hãy xin OWNER duyệt”. Không tự retry mutation 409.
  - AC-10: Danh sách grant của tôi có phân trang, không hiển thị grant của người khác; phản ánh trạng thái sau xin quyền và khi tải lại.
- FR-6: Nhân sự nền tảng.
  - AC-11: platform:staff:manage mới được list/cấp/thu hồi. Gửi user_id và role theo DTO; role là dữ liệu form, không là guard. Thu hồi admin cuối cùng trả 409 hiện “Không thể thu hồi quản trị viên nền tảng cuối cùng”; grant trùng 409 có thông báo riêng theo thao tác.
- FR-7: Audit nền tảng.
  - AC-12: platform:audit:read mới xem được, lọc root_branch_id/action/since/until và phân trang; không có thao tác sửa/xóa; không hiển thị hoặc suy dựng before/after bị backend loại bỏ.
- FR-8: Công ty của tôi và hỗ trợ OWNER ở MAIN.
  - AC-13: org:company:read cho xem module/ma trận, không có nút sửa hai tài nguyên đó. org:support_access:approve cho đặt standing_support_consent, duyệt/thu hồi grant; mọi request mang org_id MAIN, backend quyết định cuối cùng.
  - AC-14: Công ty B không thể đọc/duyệt grant công ty A dù sửa URL; sau duyệt hiệu lực 24 giờ, sau revoke tải lại trạng thái; 409 grant hết hạn/thu hồi hiện lỗi đúng. Audit công ty luôn theo MAIN đang chọn.
  - AC-15: Chưa có API đọc consent → hiện “Chưa xác định”, không tự gán false. Form chọn rõ Bật/Tắt và xác nhận trước PUT; chỉ hiển thị giá trị đã xác nhận sau response thành công. Reload trở về chưa xác định nếu backend chưa cung cấp giá trị.
- FR-9: UI Đồng xanh và trạng thái đầy đủ.
  - AC-16: Mọi màn hình có loading, empty, error, success; 403/404/409/503 hiển thị theo ngữ cảnh, giữ dữ liệu nhập phù hợp; 401 qua refresh/login có sẵn, 400 hiện validation, lỗi mạng/502 vẫn chặn truy cập.
  - AC-17: Token màu hiện có, vùng bấm ≥44px, keyboard/focus/Esc; next-intl provider cục bộ cho workspace mới, vi mặc định và messages vi/en. Layout/page là Server Component, fetch chỉ trong lib/api hoặc lib/fetcher.
- FR-10: Contract và bằng chứng.
  - AC-18: D-078: contracts/org.public.yaml trùng snapshot org commit đã pin; README ghi repo/branch/SHA, ngày, hạn chế schema. DTO/fixture phải đối chiếu source, không suy đoán từ description OpenAPI.
  - AC-19: Unit, typecheck, lint, arch/spec, integration live và UI đều có receipt; mỗi màn hình có ảnh 4 trạng thái × 2 viewport (1440/390), thêm lỗi đặc thù 409/503; thiếu ảnh hoặc live chưa chạy thì BLOCKED delivery.

## Technical definition
- Hợp đồng: [platform-plane spec](../../../../org/.aidlc/specs/platform-plane.md), đặc biệt §20–21 bổ sung API UI và org_id MAIN; [frontend rules](../../../../platform-docs/standards/frontend.md).
- Pin nguồn org: `platform-plane-001` tại `6c1c0132f2b246726231547e99d30c61ee31eceb`. OpenAPI `api/openapi.public.yaml:73–276`, handler `internal/transport/http/platform.go:125–358` là nguồn đối chiếu route/body/paging; spec là contract nghiệp vụ.
- ADR-026 được spec/handoff nhắc là nháp nhưng đường dẫn tham chiếu không tồn tại cả working tree và branch platform-plane-001 của platform-docs. Không tuyên bố đã đọc/được phê duyệt ADR này. Dùng quyết định trong spec hiện có; nếu ADR được bổ sung làm thay đổi thiết kế, cập nhật plan và xin duyệt lại trước slice bị ảnh hưởng.
- NFR: fail closed; không cache quyền platform/grant; không ghi token/PII trong browser logs; request sai tenant phải bị org từ chối. Không tin role/permission do browser tự gửi.
- NFR: a11y ≥90, mobile LCP ≤2.5s, First Load JS ≤200kB theo frontend standard. Healthy flow có 0 console errors/5xx; các ca fault injection ghi riêng, không tính lỗi 503 chủ động là healthy run.
- npm theo handoff và AGENTS.md, ưu tiên hơn hướng dẫn pnpm cũ trong AI_CONTEXT.md. `ESBUILD_BINARY_PATH=/tmp/esbuild` khi unit.

## UX
- Platform workspace: Công ty → chi tiết/module → ma trận; menu Hỗ trợ, Nhân sự, Audit. Menu chỉ chứa action được org trả về.
- Company workspace: Công ty của tôi → module/ma trận chỉ xem + consent; Yêu cầu hỗ trợ + audit công ty. Hiển thị MAIN đang tác động; deep link phải kiểm quyền lại.
- Thiết kế: tái dùng Button/Input/Dialog/Table/Page primitives; shell mới nhận nav/data qua props, không import feature/data hooks. Feature workspace lắp provider dịch và permission boundary; tránh sửa shell cũ chứa nợ brand ngoài phạm vi.
- Form nguy hiểm xác nhận công ty + thao tác; break-glass hiển thị thời lượng và lý do; lỗi role=alert, loading aria-busy, empty dùng EmptyState. Giữ focus và tránh dialog lồng dialog.
- Bằng chứng: 8 route màn hình (companies, company detail/modules, role matrix, support, staff, platform audit, my company, company support); audit công ty là tab của màn hỗ trợ, tổng 8 route mới. Chụp riêng tab/các form onboard, module, consent, ma trận và break-glass.

## Design
- Browser → `/api/platform/*` hoặc `/api/org/*` → lib/api forwarder → org qua base URL phía server (live dùng Kong :8000). Không browser→org, không URL upstream tùy ý. Catch-all BFF có allow-list chính xác method/path/query, từ chối path lạ/traversal và method ngoài contract.
- Tái dùng forwardService để gửi cookie access_token thành Bearer, Idempotency-Key và no-store. GET và approve/revoke không body dùng bodyPolicy=none. Giữ status/body upstream; helper đang trả 502 khi network failure, UI xử lý fail closed cả 502 lẫn 503, không cần đổi helper toàn cục.
- `lib/api/platform-contract.ts`: DTO được đối chiếu source pin, decoder response.Success/Created envelope, action_keys của permissions khác actions của platform/me, page items/page/limit (không bịa total). Dữ liệu thiếu/sai schema là lỗi chặn, không grant mặc định.
- `lib/api/platform-client.ts`: typed BFF calls qua apiFetch/fetcher; không tự ghép quyền từ role. Features chỉ gọi transport này, UI primitives nhận props.
- BFF platform allow-list: GET me; GET/POST companies; GET modules/matrix; PUT module và role-matrix/roles/{role_code}; GET/POST staff + POST revoke; GET/POST support-access + POST break-glass; GET audit-logs. Exact path theo OpenAPI pin.
- BFF org allow-list: GET permissions/me; GET company/modules, role-matrix, support-access, audit-logs; PUT company/settings; POST support-access/{id}/approve hoặc revoke. company requests luôn có org_id; permissions luôn có org_id và branch_id. Không tự gọi internal service authorization bằng token giả.
- Company detail dùng id trong URL, modules/matrix làm nguồn có thật; không scan hết danh sách để tìm id và không tạo GET company/{id}. Tên chỉ hiện khi có dữ liệu xác thực; fallback label là id.
- Login gọi platform/me qua BFF trước chọn home: 200 actions hợp lệ → platform workspace; 404 → logic employee/customer hiện có; lỗi khác không đưa vào protected route. Redirect có sẵn vẫn phải qua guard route đích.
- Không DB migration/event mới. Backend mutations vẫn sở hữu audit, thời gian DB và authorization; portal không tự ghi audit thành công thay backend.

## Files planned
- components/ui/state.tsx
- components/ui/field.tsx
- components/ui/button.tsx
- components/ui/table.tsx
- components/ui/dialog.tsx
- components/ui/tabs.tsx
- components/ui/keyboard.test.ts
- components/navbar.tsx
- contracts/org.public.yaml
- contracts/README.md
- lib/api/platform-contract.ts
- lib/api/platform-contract.test.ts
- lib/api/platform-bff.ts
- app/api/platform/[...path]/route.ts
- lib/api/platform-bff.test.ts
- lib/api/company-bff.ts
- app/api/org/[...path]/route.ts
- lib/api/company-bff.test.ts
- features/platform/access.ts
- features/platform/access.test.ts
- lib/api/platform-client.ts
- lib/api/platform-client.test.ts
- features/platform/access-boundary.tsx
- features/auth/home-for.ts
- features/auth/home-for.test.ts
- components/layout/platform-shell.tsx
- features/platform/workspace.tsx
- app/platform/layout.tsx
- messages/vi.json
- messages/en.json
- app/platform/companies/page.tsx
- features/platform/companies-view.tsx
- features/platform/company-onboard-form.tsx
- features/platform/use-companies.ts
- features/platform/companies.test.ts
- app/platform/companies/[id]/page.tsx
- features/platform/company-detail-view.tsx
- features/platform/company-modules.tsx
- features/platform/use-company.ts
- features/platform/company-modules.test.ts
- app/platform/companies/[id]/role-matrix/page.tsx
- features/platform/role-matrix-view.tsx
- features/platform/use-role-matrix.ts
- features/platform/role-matrix.test.ts
- app/platform/support-access/page.tsx
- features/platform/support-view.tsx
- features/platform/support-request-form.tsx
- features/platform/use-support.ts
- features/platform/support.test.ts
- app/platform/staff/page.tsx
- features/platform/staff-view.tsx
- features/platform/use-staff.ts
- features/platform/staff.test.ts
- app/platform/audit/page.tsx
- features/platform/audit-view.tsx
- features/platform/use-audit.ts
- features/platform/audit.test.ts
- app/company/page.tsx
- features/platform/my-company-view.tsx
- features/platform/use-my-company.ts
- features/platform/my-company.test.ts
- app/company/support-access/page.tsx
- features/platform/company-support-view.tsx
- features/platform/use-company-support.ts
- features/platform/company-support.test.ts
- app/company/layout.tsx
- tests/integration/platform-plane.it.test.ts
- tests/integration/company-support.it.test.ts
- .aidlc/runs/PORTAL-PLATFORM-001/ui-cases.md
- .aidlc/runs/PORTAL-PLATFORM-001/anti_check.py
- .aidlc/runs/PORTAL-PLATFORM-001/evidence

## Tests planned
| TC | AC | Layer | Command / evidence |
|---|---|---|---|
| TC-1 | 1–3, 16 | unit guard + redirect | `ESBUILD_BINARY_PATH=/tmp/esbuild npm test -- features/platform/access features/auth/home-for` |
| TC-2 | 4–15, 18 | contract + BFF + feature units | `ESBUILD_BINARY_PATH=/tmp/esbuild npm test` |
| TC-3 | 17–18 | architecture/spec/types | `npm run typecheck`; `npm run lint`; `python3 ~/agent_skills/sdlc/engine/archcheck.py`; `python3 ~/agent_skills/sdlc/engine/speccheck.py` |
| TC-4 | 1–15 | live BFF/backend, Claude | `ESBUILD_BINARY_PATH=/tmp/esbuild npm test -- tests/integration` |
| TC-5 | 16–19 | browser/e2e/UI evidence | cases in ui-cases.md, then `python3 .aidlc/runs/PORTAL-PLATFORM-001/anti_check.py` |

TC-2 tests real rejection paths: no token, permission denied, wrong scope, other MAIN, stale/revoked grant, missing body, wrong types, boundary CORE, malformed envelope, 409 per operation, 503/no cached allow, unsupported BFF method/path. Unit includes distinct actions/action_keys envelopes and page bounds. No test deletion/skips to pass.
TC-4 writes isolated fixtures using supported provision/onboard APIs, then reads back company modules, role changes, grant/revoke and audit. Credentials supplied by runner, never committed; avoid the global last-admin mutation in a shared stack. Dedicated fixture environment required for last-admin and break-glass cooldown cases.
Approval readiness: cấu trúc plan đã kiểm tra được; test kit chưa đủ điều kiện verified-env của sdlc-plan. Claude phải bổ sung/chạy seed-reset và ghi bằng chứng trước khi Dawn chốt approval theo skill; phiên này dừng ở tài liệu theo yêu cầu người dùng. Không chạy approve hoặc tự bỏ yêu cầu này.

Test kit [env](testkit/env.md), [happy request](testkit/happy.http), [errors](testkit/errors.md) records contract cases. Live setup/seed has not been executed in this planning-only turn; Claude must verify it before claiming integration PASS. No fabricated live evidence.
TC-5 performance protocol (Claude/Anti runner, S16): `npm run build` rồi `npm run start` với stack healthy; đăng nhập bằng fixture cô lập. Dùng Lighthouse CLI có sẵn của runner và Chrome profile fixture đã đăng nhập, ghi rõ phiên bản Chrome/Lighthouse trong evidence. Với mỗi URL màn hình ở UX (id công ty lấy từ fixture), chạy `lighthouse <URL> --only-categories=accessibility,performance --form-factor=mobile --output=json --output-path=<evidence/route.lighthouse-runN.json> --chrome-flags="--headless --user-data-dir=<fixture-profile>" --disable-storage-reset`; kiểm final URL không bị redirect login. Giữ mobile throttling mặc định, chạy 3 lần mỗi route, dùng LCP trung vị ≤2500ms và a11y mỗi lần ≥0.90; giữ toàn bộ JSON. Lưu build stdout và network HAR cold-load, tổng transferred JS cho route ≤200 KiB; nếu Next build không xuất First Load JS thì ghi rõ HAR là phép đo thay thế để reviewer xét, không tuyên bố build đã đo chỉ số đó. anti_check.py phải fail khi thiếu report/sai route/vượt ngưỡng; chạy negative self-check thiếu ảnh, ảnh trùng hoặc quá ngưỡng trước positive run. Evidence có viewport/state/route manifest, ảnh form/tab và kích thước vùng bấm ≥44px, keyboard/light-dark kết quả riêng.

After approval: `next --task PORTAL-PLATFORM-001` → one slice → engine `verify --task PORTAL-PLATFORM-001 --cwd . unit="..."` (plus relevant checks) → Claude review/mutation-check → `done S<n> --task PORTAL-PLATFORM-001`. Final verify uses named integration/e2e/spec/arch/build/unit checks; engine writes receipts. No done/review PASS for pending live or screenshots.

## Slices
- [x] S0: Một bộ UI kit dùng chung cho mọi màn hình mới: Skeleton/EmptyState/ErrorState/InlineAlert, Field/TextInput/Select/Textarea/Checkbox, TablePager, ConfirmDialog, Button size touch 44px (files: components/ui/state.tsx, components/ui/field.tsx, components/ui/button.tsx, components/ui/table.tsx, components/ui/dialog.tsx; test: npm run typecheck && npm run lint)
- [x] S0c: Tabs WAI-ARIA dùng chung + test bàn phím cho dialog/tabs (files: components/ui/tabs.tsx, components/ui/keyboard.test.ts; test: npm test)
- [x] S0b: Navbar toàn cục (chi nhánh mẫu cứng, D-064) không hiện trên /platform và /company (files: components/navbar.tsx; test: npm run typecheck)
- [x] S1: Contract D-078, DTO fixtures và kiểm tra envelope (files: contracts/org.public.yaml, contracts/README.md, lib/api/platform-contract.ts, lib/api/platform-contract.test.ts; test: npm test -- lib/api/platform-contract)
- [x] S2: BFF platform allow-list và chuyển tiếp token (files: lib/api/platform-bff.ts, app/api/platform/[...path]/route.ts, lib/api/platform-bff.test.ts; test: npm test -- lib/api/platform-bff)
- [x] S3: BFF công ty MAIN và quyền theo scope (files: lib/api/company-bff.ts, app/api/org/[...path]/route.ts, lib/api/company-bff.test.ts; test: npm test -- lib/api/company-bff)
- [x] S4: Guard quyền, client và trạng thái lỗi dùng chung (files: features/platform/access.ts, features/platform/access.test.ts, lib/api/platform-client.ts, lib/api/platform-client.test.ts, features/platform/access-boundary.tsx; test: npm test -- features/platform/access lib/api/platform-client)
- [x] S5: Điều hướng login có mặt phẳng nền tảng (files: features/auth/home-for.ts, features/auth/home-for.test.ts; test: npm test -- features/auth/home-for)
- [x] S6: Shell Đồng xanh, navigation theo quyền và bản dịch cục bộ (files: components/layout/platform-shell.tsx, features/platform/workspace.tsx, app/platform/layout.tsx, messages/vi.json, messages/en.json; test: npm run typecheck && npm run lint)
- [x] S7: Danh sách và onboard công ty (files: app/platform/companies/page.tsx, features/platform/companies-view.tsx, features/platform/company-onboard-form.tsx, features/platform/use-companies.ts, features/platform/companies.test.ts; test: npm test -- features/platform/companies)
- [x] S8: Chi tiết công ty và bật tắt module (files: app/platform/companies/[id]/page.tsx, features/platform/company-detail-view.tsx, features/platform/company-modules.tsx, features/platform/use-company.ts, features/platform/company-modules.test.ts; test: npm test -- features/platform/company-modules)
- [x] S9: Ma trận công ty và thay action theo role (files: app/platform/companies/[id]/role-matrix/page.tsx, features/platform/role-matrix-view.tsx, features/platform/use-role-matrix.ts, features/platform/role-matrix.test.ts; test: npm test -- features/platform/role-matrix)
- [x] S10: Xin hỗ trợ, break-glass và grant của tôi (files: app/platform/support-access/page.tsx, features/platform/support-view.tsx, features/platform/support-request-form.tsx, features/platform/use-support.ts, features/platform/support.test.ts; test: npm test -- features/platform/support)
- [x] S11: Cấp và thu hồi nhân sự nền tảng (files: app/platform/staff/page.tsx, features/platform/staff-view.tsx, features/platform/use-staff.ts, features/platform/staff.test.ts; test: npm test -- features/platform/staff)
- [x] S12: Audit nền tảng có lọc và phân trang (files: app/platform/audit/page.tsx, features/platform/audit-view.tsx, features/platform/use-audit.ts, features/platform/audit.test.ts; test: npm test -- features/platform/audit)
- [x] S13: Công ty của tôi: lắp guard/provider ở layout trước màn hình module, ma trận và consent (files: app/company/page.tsx, features/platform/my-company-view.tsx, features/platform/use-my-company.ts, features/platform/my-company.test.ts, app/company/layout.tsx; test: npm test -- features/platform/my-company)
- [x] S14: Duyệt thu hồi hỗ trợ và audit công ty (files: app/company/support-access/page.tsx, features/platform/company-support-view.tsx, features/platform/use-company-support.ts, features/platform/company-support.test.ts; test: npm test -- features/platform/company-support)
- [x] S15: Kiểm tra live do Claude chạy với dữ liệu cô lập (files: tests/integration/platform-plane.it.test.ts, tests/integration/company-support.it.test.ts; test: npm test -- tests/integration)
- [x] S16: Kiểm tra UI và bằng chứng mọi màn hình (files: .aidlc/runs/PORTAL-PLATFORM-001/ui-cases.md, .aidlc/runs/PORTAL-PLATFORM-001/anti_check.py, .aidlc/runs/PORTAL-PLATFORM-001/evidence; test: python3 .aidlc/runs/PORTAL-PLATFORM-001/anti_check.py)

## Risks / rollback
- Backend not merged/live: contract/unit work can proceed after approval; live integration waits for backend merge + dev stack. Do not call the feature delivered until Claude's live and UI receipts exist.
- OpenAPI lacks DTO schemas, ADR reference missing: pin/source-check fixtures in S1; discrepancies stop dependent slices for spec clarification, never invent fields/error codes. Snapshot alone is not a generated complete type contract.
- Consent lacks GET: AC-15 makes uncertainty explicit. To show actual current value after reload requires backend contract change and a separately authorized backend task.
- Changing home-for overlaps PORTAL-AUTH-UI-001: preserve approved redirect behavior and current edits, run its regressions. Do not touch current dirty vitest config/tests or claim their work.
- Scope exceeds one session: 16 sequential slices, at most 5 exact files per slice; evidence/ is the sole directory scope because every generated screenshot/report there belongs to this task. No production directory-wide allowance.
- Rollback: revert task-owned commits in dependency reverse order; portal has no DB migration. Backend mutations already accepted require compensating domain actions (module/role restoration, revoke grant); a UI revert cannot undo those records. Keep audit history.

## Open decisions
- Dawn approval is pending, as explicitly requested. This turn creates planning artifacts only; no snapshot, production code, tests, live seed or backend writes yet.
- Proposals for approval: outcome metric above, company detail composition (AC-5), unknown consent presentation (AC-15), local next-intl provider, explicit catch-all BFF allow-lists.
- Known prerequisites: ADR-026 source unavailable; live fixture environment/credentials and backend merge handled by Claude/Dawn. These are recorded limits, not completed checks.
- Bootstrap `/home/dawn/Dawn-Brain/START.md` is absent. The explicit user-selected handoff is the scope authority for this run.
- Complete delivery later: handback.md (Done / Files changed / Decisions / Left over), engine handback, independent review, numeric Tier 1/2/3 with receipt paths. Never self-approve.

## Amendment 2026-09-28 (Claude)
- Lý do: Dawn yêu cầu "UI dùng 1 bộ component thống nhất từ đầu đến cuối". Bộ `components/ui` thiếu trạng thái rỗng/tải/lỗi, select/textarea/checkbox,
  phân trang, hộp xác nhận, và Button mặc định 36px < 44px. Thêm vào đúng `components/ui`, không tạo kit riêng trong feature. Mọi màn hình mới chỉ dùng kit này.
- `NextIntlClientProvider` chuyển từ layout (Server Component) vào `features/platform/workspace.tsx` (client): portal không có request config của next-intl,
  bản codex build PASS nhưng mọi trang 500 khi chạy (bắt được bằng smoke live). AC-17 giữ nguyên: provider cục bộ, vi mặc định.
- Test live phát hiện D-095 (backend auth/org): OWNER mới onboard ở trạng thái PROVISIONED, không mật khẩu, không nhận mail → không đăng nhập được. Fixture dùng OWNER đã kích hoạt sẵn (provision tái dùng user có sẵn).
- S16 (ảnh/Lighthouse) giao Anti theo luật "Anti lo UI test"; Claude giữ máy chấm `anti_check.py`.

## Amendment 2 2026-09-28 (Claude, sau review codex BLOCKED)
- Review độc lập (`review.md`) tìm 1 Chặn + 9 Nên. Sửa trong phạm vi AC có sẵn, cần duyệt lại vì thêm 2 file vào kit:
  `components/ui/tabs.tsx` (tab WAI-ARIA dùng chung, thay tab tự viết ở company-support) và `components/ui/keyboard.test.ts` (test focus trap + phím tab).
- Sửa: form xin hỗ trợ bỏ danh sách công ty cache khi tải lại lỗi (Chặn); dialog chung có `role="dialog"` + tên trên cùng phần tử, giữ/trả focus, nút đóng 44px;
  `Field` gắn `aria-invalid`/`aria-describedby`, `TextInput` dựng trên `Input` có sẵn; lỗi theo trường cho form staff/support; `starts_at` cho module (AC-6);
  allow-list query BFF công ty theo từng endpoint; trang rỗng > 1 có nút "Trang trước"; test IT chéo công ty khẳng định đúng 404.
- Ảnh Anti T9M2K4 chụp trước các sửa này → lưu vào `evidence-T9M2K4/`, Anti chạy lại lượt mới trên code đã chốt.
- Để lại (nợ, không sửa ở task này): chọn công ty khi xin hỗ trợ chỉ lấy 100 công ty đầu (cần tìm kiếm/phân trang khi > 100 công ty).
- Vòng 2–3 (`review-2.md`, `review-3.md`): sửa focus dialog (hiệu ứng chỉ chạy khi mở/đóng; giữ opener trước autoFocus; trả focus cả khi unmount; chỉ dialog tầng cao nhất giữ bàn phím),
  chặn xác nhận break-glass khi danh sách công ty lỗi, "Huỷ lịch" cho module hẹn giờ, `Field` gộp aria của caller, test IT đọc lại grant còn chờ trước khi duyệt.
  Hành vi focus khi mount không test được bằng vitest node (không có jsdom, thêm dependency là ngoài plan) → giao Anti bước 16–18 + dòng bàn phím, máy chấm có thêm 3 ảnh luồng.
- D-099 (100 công ty đầu): chờ Dawn chốt giới hạn triển khai MVP; nếu dự kiến > 100 công ty thì mở task tìm kiếm công ty trước khi go-live.
