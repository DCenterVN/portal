# Plan: PORTAL-INVENTORY-UX-001

## Tóm tắt 1 màn hình
- Mục tiêu duy nhất: cải thiện chọn dữ liệu, bảng dòng nhập và thông tin NCC với hành vi giá hiện tại.
- Picker mở khi bấm/focus; bảng con + tổng tiền; ngày dd/mm/yyyy; list NCC đủ nhóm/liên hệ/badge; hồ sơ có chip.
- 9 slice, 31 file, tối đa 5 file/slice; giữ ID cũ, bỏ S7 để không nhầm bàn giao lượt 1.
- Mọi slice trong task này hoàn tất được mà không chờ backend giá nullable, Q5/Q6 hay ánh xạ SKU→nhóm.
- Giữ giá read-only và điều kiện hợp đồng/price_line_ref hiện tại; không mở giá tay hoặc POST giá mới.
- S9 kiểm luồng UX với fixture giá hiện hữu, xanh 1 lần rồi ổn định 3/3 và hồi quy repo 1 lượt theo R33.
- Phần giá chuyển sang 5 slice dự kiến của PORTAL-RECEIPT-PRICE-001 sau INVENTORY-PRICE-NULLABLE-001.
- Rủi ro còn lại: 7 caller picker, file trùng SUPPLIER-UX-002, frame lock và môi trường QA.
- Câu hỏi Dawn: 0; coordinator bàn giao owner file và runtime >3003 trước cook/e2e.
- Trạng thái: plan-r2 chưa approve; lần này chỉ sửa tài liệu trong run và đầu ra DONE được brief chỉ định.

- **Task ID**: PORTAL-INVENTORY-UX-001
- **Mode**: hard
- **Story**: US-INVENTORY-UX-001
- **Sprint**: 01
- **Issue**: /home/dawn/work/ticket/plans/261026-supplier-ux/codex-plan-inventory-ux-r2.md
- Repo: `/home/dawn/work/ticket/.cache/worktrees/price-a/portal`.
- Sprint theo ACTIVE PORTAL-CATALOG-SPLIT-001 và SUPPLIER-UX-002; không đổi ACTIVE/board trong lượt chỉ được ghi run.

## Scope
- EXTEND EntityPicker, ngày và bố cục phiếu nhập, list/hồ sơ NCC. REUSE Table/Badge/Field/Button, SupplierCategoryGroups, i18n, draft và idempotency.
- Giữ trang riêng `/inventory/goods-receipts/new`, list NCC và hồ sơ NCC. Form nhiều dòng theo P-8/UX-04.
- Giữ nguyên nguồn giá, lookup/resolver, điều kiện valid và payload hiện tại. Không thay client/BFF/types/contracts/generated, schema draft hay quy tắc chọn tập SKU.
- Bỏ toàn bộ phần giá mới khỏi Requirements, Slices và Files planned. Task sau chỉ là đề xuất cuối tài liệu, không phải điều kiện PASS của task này.
- Files planned là phạm vi code đề xuất sau duyệt. Lượt r2 chỉ ghi run này và file DONE theo brief; không sửa backlog/code, không approve/commit/push, không chạm :3000–3003.
- Tiền kiểm và file giao thoa: [impact.md](impact.md). Audit graph/caller lượt 1 được giữ làm nguồn, không nhận là index vừa refresh.

## Requirements
| FR | Yêu cầu và nguồn | AC đo được |
|---|---|---|
| FR-1 | Chọn từ list rõ ràng. P-5, UX-07 | AC-1: click input/focus/chevron mở list khi ready; tên+mã 2 dòng; tìm không dấu theo tên+mã; chỉ chọn option mới phát ID, không chấp nhận text tự do. |
| FR-2 | Validation và keyboard. P-5, UX-04/06/07 | AC-2: không lỗi required trước blur thật/invalid submit; click chevron/option không gây lỗi thoáng qua. ↑↓/Home/End/Enter/Esc/Tab đúng; Enter chọn không submit. Loading/error không cho chọn stale items; lỗi dưới field, focus lỗi đầu. |
| FR-3 | Bảng con/tổng tiền. P-8, UX-07 | AC-3: desktop 6 cột Nguyên liệu/ĐVT/SL/Đơn giá/Thành tiền/xoá. 1–100 dòng, không xoá dòng cuối. Với giá hiện hữu 25.000 và 10.000, 2,5×25.000 + 1×10.000 = 72.500 VND. Thiếu giá hiện dấu trống + tổng Chưa đủ giá, không coi là 0. |
| FR-4 | Ngày Việt Nam. P-8, UX-06.8 | AC-4: mọi locale browser đều hiện 27/10/2026; chặn 31/02/2026; nhận 29/02/2028, chặn 29/02/2027. ISO payload giữ YYYY-MM-DDT12:00:00+07:00, mặc định hôm nay Asia/Ho_Chi_Minh. |
| FR-5 | Danh mục chọn hiện tại. P-5 | AC-5: NCC chỉ ACTIVE; nguyên liệu vẫn từ lookup hiện hữu và chỉ chấp nhận option thật. Đổi NCC/SKU/ngày bỏ preview/refs cũ theo hành vi hiện tại; không thêm bộ lọc nhóm hay đòi API ánh xạ SKU→nhóm. |
| FR-6 | Bảo toàn hành vi giá. P-8, brief r2 | AC-6: đơn giá read-only, giữ valid bắt price_line_ref/coverage và refs/payload hiện tại. Không hợp đồng/ngoài kỳ/lookup lỗi vẫn chặn như hiện tại; chưa chọn NL không hiện cảnh báo thiếu giá sớm. Không có ô giá tay, lý do Q5 hoặc gợi ý Q6. |
| FR-7 | E2E web ổn định. R32/R33 | AC-7: e2e web stable 3/3. Sau full suite task xanh 1 lần, chạy lại thêm 3 lượt liên tiếp với --repeat-each=3 --retries=0 --workers=1, tái dùng storageState; thêm full e2e/integration repo 1 lượt. Flaky là chưa xong; báo X/Y x3, screenshot lỗi và DONE stable 3/3 hoặc flaky <ca>. |
| FR-8 | List đủ thông tin thật. P-1/P-7, UX-07 | AC-8: 6 cột Mã/Tên/Nhóm NL cha/Liên hệ tên+SĐT/Trạng thái badge/icon Bảng giá. ≤2 chip cha +N, đọc đủ bằng focus/hover. Thiếu liên hệ có Chưa cung cấp. Không có count API thì không hiện số bảng giá. |
| FR-9 | Mặc định ACTIVE/phân trang. P-1 | AC-9: request đầu status=ACTIVE; đổi lọc reset cursor; giữ debounce 250ms và bỏ response cũ. Empty có lọc có Xoá lọc về mọi trạng thái; rỗng thật có Thêm theo quyền. Không giả tổng từ số dòng trang hiện tại. |
| FR-10 | Nhóm hồ sơ dạng chip. P-2.4/P-6 | AC-10: cha là nhãn, con là chip, không mã/UUID thô. Chưa khai và nhóm cũ cần migrate khác câu; taxonomy loading/error/retry không che khối hồ sơ khác. |
| FR-11 | Quyền/nháp/tính nhất quán. P-8, L-4/L-28 | AC-11: thiếu quyền không mutation; giữ draft supplier/date/sku/quantity theo branch và ISO ngày. Response cũ bị bỏ; retry cùng body giữ key, đổi body đổi key; double click 1 POST theo contract hiện tại. |
| FR-12 | Responsive/a11y/states. P-1/P-5/P-8, UX-06/07 | AC-12: viewport 375/768/1024/1440 sáng+tối không tràn trang; bảng cuộn riêng, popup không bị cắt. Icon có name+tooltip; đủ loading/empty/error/no-match/success; busy khoá toàn form. Browser dùng chromium desktop headless kể cả khi đổi viewport hẹp. |

Ngoài phạm vi: mọi thay đổi giá và ánh xạ SKU→nhóm ở mục Việc sau; ảnh/receive/QC, số hoá đơn/chống trùng, xếp hạng, tạo nhanh NCC, taxonomy editor, KPI/timeline/thanh toán. Không kéo thêm hành trình ngoài tạo nháp hiện tại.

## Technical definition
- P-x là mục Px của [erpnext-ui-patterns.md](/home/dawn/work/ticket/platform-docs/reference/erpnext-ui-patterns.md); L-x của [erpnext-supplier-logic.md](/home/dawn/work/ticket/platform-docs/reference/erpnext-supplier-logic.md). Đây là nguồn được giao, không claim đã chạy ERPNext.
- Quyết định UI theo P-5 picker, P-8 child table/ngày/tổng, P-1 list, P-2/P-6 chip hồ sơ, P-7 link Bảng giá. Chỉ lấy phần bố cục của P-8; behavior giá giữ theo AC-6.
- Chuẩn [ui-ux.md](/home/dawn/work/ticket/platform-docs/standards/ui-ux.md), [frontend.md](/home/dawn/work/ticket/platform-docs/standards/frontend.md). Tái dùng primitive shadcn-style của repo, không cài dependency mới.
- Giữ token/frame, Badge semantic có chữ, số tabular-nums. icons.tsx chỉ chevron/check/trash SVG cần dùng; tooltip bằng cơ chế focus/hover hiện hữu, không xây thư viện mới.
- NFR: file code mới/sửa ≤400 dòng, hàm khoảng 40 dòng, nesting ≤3, FE-21..27 và type có tên. pnpm theo AI_CONTEXT.md; unit minWorkers=1/maxWorkers=2; web workers=1.
- Thành tiền chỉ là hiển thị dự kiến từ giá hiện hữu. SL tối đa 3 số lẻ; tính số nguyên phần nghìn, round từng dòng về đồng rồi cộng, chặn overflow. Giá thiếu khác giá 0; không cộng SL của các UOM khác nhau. Backend vẫn quyết tiền cuối cùng.
- R33 tại [codex-rules.md](/home/dawn/work/ticket/plans/261020-fooddev-set/codex-rules.md): không retry để xanh, không waitForTimeout/tăng timeout bừa; sửa nguyên nhân rồi chạy lại chuỗi xanh 1 + ổn định 3/3 + hồi quy.

## UX
Ba màn giữ bề mặt hiện có; mô tả dưới đây chỉ thay UX với hợp đồng giá hiện tại.

### Picker dùng chung
- Nhãn + ô tìm + chevron; focus mở list, selected có check; tên đậm/mã dòng 2. Giữ props value/onChange/filter/maxOptions/serializeValue/name. P-5, UX-07.
- Gõ sửa nhãn sau chọn invalidate ID cũ. Blur không tự chọn mục đầu; Esc chỉ phục hồi nhãn nếu selection còn hợp lệ. Không tự tạo bản ghi từ query. P-5, UX-04.
- Required sau blur ra ngoài cụm/invalid submit; không sau pointer xuống chevron/option. Loading, empty, no-match, error+Thử lại phân biệt. aria-expanded phản ánh panel kể cả empty; sửa oracle no-match expanded=false hiện có. P-5, UX-06/07.
- Pointer chọn giữ/trả focus input; chevron type=button. Enter/Esc không submit. Panel theo token, không bị scroll bảng cắt. UX-04/07.

### Tạo phiếu nhập
- Tiêu đề + mô tả tạo nháp cho hàng dự kiến nhận, chưa ghi tăng tồn. Đầu phiếu NCC/ngày, branch từ context. P-8, UX-04.
- Bảng 6 cột AC-3, ĐVT/đơn giá chỉ đọc; trước chọn NL thì ĐVT/giá/thành tiền là dấu trống. Field có nhãn số dòng. P-8, UX-06/07.
- Xoá icon có tooltip Xoá dòng N; dòng cuối khoá kèm giải thích; xoá xong focus dòng kế hoặc Thêm dòng. Thêm dòng cuối bảng, chặn 100 có lý do. P-8, UX-07.
- Sau bảng là Số dòng + Tổng tiền dự kiến/Chưa đủ giá. Cuối có 1 CTA Tạo phiếu nhập, hint còn thiếu, busy Đang tạo phiếu. P-8, UX-06.
- Text dd/mm/yyyy + inputMode numeric, parser lịch và ISO roundtrip; không dựa locale native date. Lỗi sau blur, không xây calendar tổng quát. P-8, UX-06.8.
- Viewport 375/768 cuộn bảng riêng với hint Vuốt ngang để xem đơn giá và thành tiền. Desktop 1024/1440 đủ 6 cột, dropdown không clipping. P-8, UX-07.
- Loading skeleton đầu phiếu+hàng; empty NCC có lối về NCC. Chưa chọn NCC khoá NL kèm Chọn NCC trước. Giữ tập SKU lookup hiện tại; no-match khác empty. P-5, UX-06.
- Giữ nhãn và giải thích giá do bảng giá/hợp đồng đang áp dụng quyết định; thiếu coverage có lối về bảng giá NCC. Không bỏ guard bắt hợp đồng. AC-6, P-8.
- Error giữ draft, 409 yêu cầu xem lại; 403 đóng mutation; success xoá draft đúng branch. Giữ retry/key và payload hiện tại. P-8, UX-05/06.

### Danh sách/hồ sơ NCC
- Toolbar search co giãn, status ACTIVE mặc định, 1 CTA theo quyền; 6 cột AC-8. Icon link ?tab=agreements có tooltip Mở bảng giá của {NCC}; không count giả. P-1/P-7, UX-03/07.
- Chip cha từ taxonomy inventory và leaf codes của NCC, dedupe, 2 chip +N đọc đủ tên qua focus/hover. Lookup taxonomy một lần mỗi màn, không N+1. Chưa khai/legacy khác câu. Đây là dữ liệu NCC đã có, không cần ánh xạ SKU. P-1/P-6.
- Liên hệ 2 dòng tên/SĐT tel:, bấm tel không mở hồ sơ; status chữ+màu, bấm badge lọc và reset cursor. Email/địa chỉ ở hồ sơ, thiếu hiện Chưa cung cấp. P-1/P-2/P-4.
- Skeleton/empty/error trong khung 6 cột; empty có lọc có Xoá lọc, rỗng thật CTA Thêm theo quyền. Cursor giữ nguyên. P-1, UX-06/07.
- Tái dùng SupplierCategoryGroups cha nhãn/con chip, giữ leaf selection. Không viết lại tree hay thêm KPI/timeline. P-2/P-6, L-1/L-7.

## Design
- Tách hook/container từ form hiện tại; ghép receipt-date-input + receipt-lines-table; receipt-lines là tính tổng/validate hiển thị thuần. Route giữ export/permission guard. S4 chỉ chuyển bố cục, không có phần B. P-8.
- API hiện hữu và BFF auth/no-store giữ nguyên. Không sửa lib/api/goods-receipts.ts, supplier-agreements.ts (trừ S9c: chuẩn hoá document_ref rỗng; S9d: bỏ dataset_mode khỏi dòng trong agreementInput), inventory/types.ts hay contracts/registry; chỉ tiêu thụ contract đang có.
- Draft schema giữ supplier/date/sku/quantity theo branch; text ngày được chuyển về ISO như cũ trước lưu/gửi. Giá không lưu mới vào draft; preview không biến thành giá authoritative.
- Supplier list dùng contact_name/contact_phone/material_category_codes API đã trả, taxonomy tree hiện hữu; không endpoint count/KPI mới, không suy từ sales.category_ref.
- S8 chỉ bổ sung spec UI picker/ngày/bảng/tổng/list/chip và chuỗi vi/en. Spec hiện có [.aidlc/specs/supplier-contract.md](.aidlc/specs/supplier-contract.md) giữ quy tắc read-only/coverage và toàn bộ API/DTO/errors hiện tại.
- Snapshot/generated nếu có lỗi nền phải trả owner xử lý riêng, không đưa thay đổi giá/snapshot vào task này để chữa suite. E2E task dùng bộ dữ liệu hợp đồng/giá hiện tại đang hoạt động.

## Files planned
- `tests/integration/portal-backend.it.test.ts`
- `components/ui/page.tsx`
- `components/ui/page.test.tsx`
- `components/layout/console-header.tsx`
- `components/layout/console-shell.test.tsx`
- `lib/api/supplier-agreements.ts`
- `lib/api/supplier-agreements.test.ts`
- `components/ui/entity-picker.tsx`
- `components/ui/entity-picker.test.tsx`
- `components/ui/icons.tsx`
- `features/inventory/receipt-date-input.tsx`
- `features/inventory/receipt-date-input.test.tsx`
- `features/inventory/receipt-lines.ts`
- `features/inventory/receipt-lines.test.ts`
- `features/inventory/receipt-lines-table.tsx`
- `features/inventory/receipt-lines-table.test.tsx`
- `features/inventory/use-goods-receipt.ts`
- `features/inventory/goods-receipt-container.tsx`
- `features/inventory/goods-receipt-form.tsx`
- `features/inventory/goods-receipt-form.test.tsx`
- `app/(console)/inventory/goods-receipts/new/page.tsx`
- `features/inventory/use-suppliers.ts`
- `features/inventory/suppliers-view.tsx`
- `features/inventory/suppliers-view.test.tsx`
- `mocks/supplier-contract.ts`
- `features/inventory/supplier-category-picker.tsx`
- `features/inventory/supplier-category-picker.test.tsx`
- `features/inventory/supplier-detail-view.tsx`
- `features/inventory/supplier-detail-view.test.tsx`
- `.aidlc/specs/supplier-contract.md`
- `messages/vi.json`
- `messages/en.json`
- `.aidlc/runs/PORTAL-INVENTORY-UX-001/tests/playwright.config.ts`
- `e2e/inventory-ux/inventory-ux.spec.ts`
- `e2e/supplier-contract/receipt-gate.spec.ts`
- `e2e/supplier-contract/supplier-contract.spec.ts`
- `e2e/supplier-contract/permissions.spec.ts`
- `frame.lock.json`

## Slices
Giữ ID S1–S6/S8–S10 của lượt 1. S7 cũ thuộc task giá sau, không là slice hiện tại. Mỗi test command dưới đây đầy đủ; không chờ dependency giá. S1/S10 thuộc frame owner FR-13.

- [x] S0: mở phạm vi R26 (27/10): integration cũ từ PORTAL-PLATFORM-001 lệch hành vi đã duyệt, chặn verify mọi slice. Cập nhật oracle theo hiện hành, không nới: `/products` là catalog công khai → 200, `/roles` `/console` vẫn 307/308; POST register/activate/login/logout gửi `Origin` same-origin như trình duyệt (guard `lib/api/auth-journey-bff.ts:59-60`), thêm 1 ca thiếu Origin → 403; `it.fails` khách vào `/roles` `/console` đổi thành `it` vì guard đã chặn đúng. Chạy thật với PORTAL_IT_BASE, skip không tính PASS (files: tests/integration/portal-backend.it.test.ts; test: PORTAL_IT_BASE=http://127.0.0.1:3003 rtk proxy pnpm exec vitest run tests/integration --minWorkers=1 --maxWorkers=2)
- [x] S1: Picker click/focus/chevron/query invalidation/a11y, SVG tối thiểu và regression 7 caller giữ API (files: components/ui/entity-picker.tsx, components/ui/entity-picker.test.tsx, components/ui/icons.tsx; test: rtk proxy pnpm exec vitest run --exclude 'e2e/**' --minWorkers=1 --maxWorkers=2 components/ui/entity-picker.test.tsx features/inventory/shelves-view.test.tsx features/inventory/supplier-agreement-form.test.tsx features/production/targets-view.test.tsx features/production/production.test.tsx)
- [x] S2: Ngày dd/mm/yyyy, parser lịch và ISO roundtrip không phụ thuộc locale (files: features/inventory/receipt-date-input.tsx, features/inventory/receipt-date-input.test.tsx; test: rtk proxy pnpm exec vitest run --exclude 'e2e/**' --minWorkers=1 --maxWorkers=2 features/inventory/receipt-date-input.test.tsx)
- [x] S3: Bảng con 6 cột/thêm/xoá/focus/tổng từ giá hiện hữu, thiếu giá, giới hạn 100 dòng (files: features/inventory/receipt-lines.ts, features/inventory/receipt-lines.test.ts, features/inventory/receipt-lines-table.tsx, features/inventory/receipt-lines-table.test.tsx; test: rtk proxy pnpm exec vitest run --exclude 'e2e/**' --minWorkers=1 --maxWorkers=2 features/inventory/receipt-lines.test.ts features/inventory/receipt-lines-table.test.tsx)
- [x] S4: Ghép form/hook/container/route với ngày và bảng; giữ giá read-only/guard contract/draft/quyền/key/payload hiện tại (files: features/inventory/use-goods-receipt.ts, features/inventory/goods-receipt-container.tsx, features/inventory/goods-receipt-form.tsx, features/inventory/goods-receipt-form.test.tsx, app/(console)/inventory/goods-receipts/new/page.tsx; test: rtk proxy pnpm exec vitest run --exclude 'e2e/**' --minWorkers=1 --maxWorkers=2 features/inventory/goods-receipt-form.test.tsx features/inventory/receipt-lines.test.ts lib/api/goods-receipts.test.ts)
- [x] S5: List 6 cột/ACTIVE/states/cursor/fixture nhóm+liên hệ, không đổi fixture giá (files: features/inventory/use-suppliers.ts, features/inventory/suppliers-view.tsx, features/inventory/suppliers-view.test.tsx, mocks/supplier-contract.ts; test: rtk proxy pnpm exec vitest run --exclude 'e2e/**' --minWorkers=1 --maxWorkers=2 features/inventory/suppliers-view.test.tsx lib/api/suppliers.test.ts features/inventory/supplier-agreements-view.test.tsx)
- [x] S6: Chip hồ sơ/renderer chung, giữ tree selection và migration states (files: features/inventory/supplier-category-picker.tsx, features/inventory/supplier-category-picker.test.tsx, features/inventory/supplier-detail-view.tsx, features/inventory/supplier-detail-view.test.tsx; test: rtk proxy pnpm exec vitest run --exclude 'e2e/**' --minWorkers=1 --maxWorkers=2 features/inventory/supplier-category-picker.test.tsx features/inventory/supplier-form.test.tsx features/inventory/supplier-detail-view.test.tsx)
- [x] S8: Spec UI và vi/en cho picker/ngày/bảng/tổng/list/chip, giữ contract giá hiện tại (files: .aidlc/specs/supplier-contract.md, messages/vi.json, messages/en.json; test: rtk proxy python3 -B /home/dawn/agent_skills/sdlc/engine/speccheck.py --lint .aidlc/specs/supplier-contract.md && rtk proxy pnpm exec vitest run --exclude 'e2e/**' --minWorkers=1 --maxWorkers=2 features/inventory/goods-receipt-form.test.tsx features/inventory/suppliers-view.test.tsx features/inventory/supplier-detail-view.test.tsx && rtk proxy pnpm run typecheck)
- [x] S9a: mở phạm vi R26 lượt 3 (27/10, từ S9 lượt UX8): header trang tràn ở 375px (overflow 87–259px, nút Ngừng hợp tác right 462 > 375) và raw button ở list NCC. `PageHeader` dùng chung 27 màn: tiêu đề + actions xuống dòng/wrap khi hẹp, không đổi API props; hồ sơ NCC dùng đúng slot actions; `suppliers-view.tsx:43` đổi về primitive Button. Test đỏ trước (375 không overflow ngang, actions trong viewport), hồi quy các màn dùng PageHeader qua unit có sẵn; frame lock sinh lại ở S10 (files: components/ui/page.tsx, components/ui/page.test.tsx, features/inventory/supplier-detail-view.tsx, features/inventory/suppliers-view.tsx, features/inventory/suppliers-view.test.tsx; test: rtk proxy pnpm exec vitest run --exclude 'e2e/**' --minWorkers=1 --maxWorkers=2 components/ui/page.test.tsx features/inventory/suppliers-view.test.tsx features/inventory/supplier-detail-view.test.tsx app/layout-gate.test.ts app/ui-rules-gate.test.ts)
- [x] S9b: mở phạm vi R26 lượt 4 (27/10, từ S9a lượt UX9): nút tài khoản header nhân viên tràn 4px ở 375px (scrollWidth 379). Dưới breakpoint sm chỉ hiện chữ đầu tròn, ẩn tên/chi tiết; từ sm trở lên giữ nguyên; label aria giữ tên đầy đủ; không sửa `components/ui/popover.tsx`, không che bằng overflow-hidden (files: components/layout/console-header.tsx, components/layout/console-shell.test.tsx; test: rtk proxy pnpm exec vitest run --exclude 'e2e/**' --minWorkers=1 --maxWorkers=2 components/layout/console-shell.test.tsx)
- [x] S9c: mở phạm vi R26 lượt 5 (27/10, từ S9 lượt UX10): inventory trả `document_ref` = nil UUID (00000000-…) khi bảng giá chưa có chứng từ (`inventory/internal/transport/http/dto/supplier_price.go:33` kiểu `uuid.UUID`, nợ D-307), portal coi là có chứng từ nên không cảnh báo, backend từ chối khi áp dụng. Chuẩn hoá tại biên schema `agreementSchema.document_ref`: nil UUID → null, một chỗ cho mọi caller; giữ oracle e2e cảnh báo thiếu chứng từ; comment ponytail trỏ D-307 để gỡ khi inventory trả null (files: lib/api/supplier-agreements.ts, lib/api/supplier-agreements.test.ts; test: rtk proxy pnpm exec vitest run --exclude 'e2e/**' --minWorkers=1 --maxWorkers=2 lib/api/supplier-agreements.test.ts features/inventory/supplier-agreement-form.test.tsx)
- [x] S9d: mở phạm vi R26 lượt 6 (27/10, từ S9 lượt UX11): Ngừng dùng bảng giá trả 400 `MALFORMED_REQUEST` (`json: unknown field "dataset_mode"`), vì `agreementInput` (`lib/api/supplier-agreements.ts:34-38`, dùng ở `features/inventory/use-supplier-agreements.ts:41`) chỉ bỏ `price_line_ref` khỏi dòng, còn giữ `lines[].dataset_mode`. Backend chỉ nhận `dataset_mode` ở cấp gốc (`inventory/internal/transport/http/dto/supplier_price.go:17-25,35`). Bỏ `dataset_mode` khỏi từng dòng như form lưu đã làm (`use-supplier-agreement.ts:70`); giữ `dataset_mode` cấp gốc. Test đỏ trước: payload dòng không có `dataset_mode` và `price_line_ref`; giữ oracle e2e ngừng dùng 201 (files: lib/api/supplier-agreements.ts, lib/api/supplier-agreements.test.ts; test: rtk proxy pnpm exec vitest run --exclude 'e2e/**' --minWorkers=1 --maxWorkers=2 lib/api/supplier-agreements.test.ts features/inventory/supplier-agreement-form.test.tsx)
- [x] S9: E2E UX theo giá hiện tại, sửa selector/ngày/setup dùng storageState theo quyền giữ oracle; xanh 1 lần rồi stable 3/3 R33 và hồi quy full repo 1 lượt. Sửa lượt 7 (27/10, từ UX12): hồi quy đạt khi không có fail mới do task; fail có sẵn ngoài card ghi nợ D-308 (catalog-split:38, fooddev-set:50, rbac:59 APIRequestContext 401 vì cookie Secure qua http; fooddev-pack:81,117 đọc body sau điều hướng), không sửa trong task; bằng chứng bắt buộc: `git diff 306e8a9 --stat` các suite đó và `lib/api/auth-journey-bff.ts` = 0 dòng, chữ ký lỗi khớp D-308; 3 ca inventory-ux ở project desktop thiếu storageState là lỗi trong card, sửa bằng `test.use` state riêng trong spec như supplier-contract (files: .aidlc/runs/PORTAL-INVENTORY-UX-001/tests/playwright.config.ts, e2e/inventory-ux/inventory-ux.spec.ts, e2e/supplier-contract/receipt-gate.spec.ts, e2e/supplier-contract/supplier-contract.spec.ts, e2e/supplier-contract/permissions.spec.ts; test: rtk proxy pnpm exec playwright test --config .aidlc/runs/PORTAL-INVENTORY-UX-001/tests/playwright.config.ts --project chromium --retries=0 --workers=1 && rtk proxy pnpm exec playwright test --config .aidlc/runs/PORTAL-INVENTORY-UX-001/tests/playwright.config.ts --project chromium --repeat-each=3 --retries=0 --workers=1 && rtk proxy pnpm exec playwright test --config .aidlc/runs/PORTAL-INVENTORY-UX-001/tests/playwright.config.ts --project desktop --repeat-each=1 --retries=0 --workers=1 && rtk proxy pnpm exec vitest run tests/integration --minWorkers=1 --maxWorkers=2)
- [x] S10: Frame owner review delta S1/icons rồi sinh lock, regression/gate cuối (files: frame.lock.json; test: rtk proxy node scripts/frame-lock.mjs --write && rtk proxy node scripts/frame-lock.mjs && rtk proxy pnpm test -- --minWorkers=1 --maxWorkers=2 && rtk proxy pnpm run lint && rtk proxy pnpm run typecheck && rtk proxy python3 -B /home/dawn/agent_skills/sdlc/engine/archcheck.py)

Thứ tự: bàn giao file → S1/S2/S3 → S4; S5 → S6; S8 hoàn thiện nội dung của S1–S6 → S9 → S10. S1 kiểm hành vi trực tiếp, frame manifest toàn repo hoàn thiện S10; không nới gate/baseline.
Engine `cmd_done` kiểm verification toàn task tại sdlc.py:830–834, không có tick độc lập bằng unit của slice. Mọi check chỉ phủ phạm vi UX này; không đăng ký check chờ nullable/MAP/Q5/Q6. Chỉ dùng `done` khi receipt PASS mới theo engine, không tick tay hoặc claim unit là PASS toàn task.

## Tests planned
U = `rtk proxy pnpm exec vitest run --exclude 'e2e/**' --minWorkers=1 --maxWorkers=2`. W và chuỗi R33 là lệnh đầy đủ trong S9.

| TC | AC | Layer/oracle | Command |
|---|---|---|---|
| TC-01 | AC-1/2/12 | Unit picker mouse/focus/chevron/query/name+code/invalid/keyboard/controlled/serialize false/stale/no-match/error | U components/ui/entity-picker.test.tsx |
| TC-02 | AC-4 | Unit ngày sai/leap year/empty/ISO/timezone/locale | U features/inventory/receipt-date-input.test.tsx |
| TC-03 | AC-3/6/11 | Unit bảng/helpers/form tổng 72.500/round .5đ/thiếu/0/NaN/overflow/100–101 dòng/key/focus/stale/branch/retry; giá chỉ đọc/coverage không đổi | U features/inventory/receipt-lines.test.ts features/inventory/receipt-lines-table.test.tsx features/inventory/goods-receipt-form.test.tsx |
| TC-04 | AC-8/9/10 | Unit list/hooks/categories/detail ACTIVE/debounce/cancel/cursor/3 cha→2 chip+1/missing/migration/outage/quyền | U features/inventory/suppliers-view.test.tsx features/inventory/supplier-category-picker.test.tsx features/inventory/supplier-detail-view.test.tsx |
| TC-05 | AC-5/6/11 | Regression API/draft/refs/resolver hiện tại, không thay schema/oracle giá | U lib/api/goods-receipts.test.ts lib/api/supplier-agreements.test.ts lib/api/suppliers.test.ts lib/api/material-categories.test.ts lib/api/supplier-contract-bff.test.ts |
| TC-06 | AC-1/2/11 | Regression 7 caller shelves/targets/food-plans/food-sets/packages/agreement/receipt, callback/props/no-autosubmit | Lệnh S1 và S4 |
| TC-07 | AC-1/3/4/5/6/8/9/10/11 | Web list ACTIVE→hồ sơ/chip/Bảng giá; NCC có giá hợp lệ→chọn 2 NL bằng picker→ngày Việt→bảng+tổng→tạo nháp bằng payload hiện tại→reload đọc lại | W lần đầu tại S9 |
| TC-08 | AC-2/6/11/12 | Web no-match 0 POST; thiếu coverage giữ chặn; keyboard/focus/tooltip/double click 1 POST/deny/viewport sáng+tối | W lần đầu tại S9 |
| TC-09 | AC-7 | Full suite task chạy thêm 3 lượt, không retry; full e2e repo và integration repo 1 lượt | Chuỗi R33 S9 |
| TC-10 | AC-1…12 | Full unit/type/lint/arch/frame, spec lint; không nới baseline/oracle | Lệnh S8/S10 |

Config run-local khai báo `chromium` gồm inventory-ux + supplier-contract, và `desktop` gồm toàn bộ `e2e/**`, gồm RBAC/catalog/fooddev/visual. Giữ tên desktop, viewport 1440×900 và screenshot comparison options gốc; updateSnapshots=none. Mỗi project có testDir tuyệt đối trỏ <portal>/e2e và snapshotPathTemplate="{testDir}/visual/baseline/{arg}-{projectName}{ext}" để config lồng thư mục không đổi đường dẫn baseline. Visual/catalog có test phụ thuộc project.name=desktop, không đổi tên này hoặc tạo oracle mới. Cả hai chromium desktop headless, repeatEach mặc định 1/retries 0; không import webServer :3000 của config gốc. BASE_URL cô lập >3003; runner cấp storageState cho từng scope/quyền cần thiết. Ba spec supplier-contract và spec UX mới thay setup login bằng nạp state tương ứng; config storageState đơn thuần không vô hiệu login tường minh trong spec. Task testMatch và các storageState theo quyền chỉ áp dụng project chromium, không áp cho desktop hồi quy vì catalog cần context anonymous và các suite có setup riêng. Không login thêm trong chuỗi 3 lượt; giữ revoke/restore oracle, dùng context từ state đã cấp. Không chạy mobile project; viewport hẹp vẫn chromium desktop.
Trước mỗi lần chạy web/hồi quy kiểm `rtk proxy free -m`, RAM khả dụng ≥3000 MiB; R28 chờ 60s rồi kiểm lại nếu thiếu. Runtime/backend/fixtures hiện hành do coordinator cấp, không cần giá nullable. Mỗi lượt dùng dữ liệu riêng hậu tố ngắn, fixtures contract còn hiệu lực; reset/cleanup qua UI/API, không DB DROP/reset. Không in token/cookie, không dùng DEV thay QA.
Web thao tác như người thật: gõ một phần tên/mã→bấm option; không nhập UUID. TC-07 tạo/read-after-write thật qua BFF/backend với hợp đồng/giá hiện tại, không mock thành công, không POST giá tay/no-refs. TC-08 có ít nhất 1 ca lỗi không tạo phiếu. receipt-gate đổi selector/ngày dd/mm/yyyy và setup auth để dùng state đã cấp, giữ read-only/ngoài kỳ chặn; supplier-contract/permissions đổi selector và setup auth tương tự, giữ kiểm quyền/revoke/restore. Không sửa semantics/oracle giá hoặc bỏ case auth; không gọi helper login trong các lượt repeat.
Chụp screenshot từng bước picker/no-match/2 dòng+tổng/ngày/list/detail, sáng+tối theo AC-12 vào `.aidlc/runs/PORTAL-INVENTORY-UX-001/artifacts/e2e-web/`, phân thư mục theo lượt. Lưu report X/Y lần đầu, X/Y x3, full e2e/integration repo và ca flaky kèm ảnh. Không đổi visual baseline shell/token để xanh; mở ảnh xem trước kết luận.
Chỉ báo hoàn tất khi toàn bộ chuỗi PASS; DONE triển khai sau này có `stable 3/3`, hoặc `flaky <ca>` nếu chưa xong. Flaky sửa gốc bằng chờ đúng điều kiện, không waitForTimeout/retry/tăng timeout bừa. Hồi quy đỏ phải điều tra, không skip hay sửa oracle giá sang hành vi tương lai. Kẹt môi trường >10 phút ghi `chan e2e-web <lý do>` theo R32.
Lượt r2 chỉ kiểm cấu trúc plan và lint spec có sẵn, không chạy unit/e2e/server hay claim PASS sản phẩm.

## Phụ thuộc
| ID | Owner/đầu vào | Điều kiện thực hiện trong task UX |
|---|---|---|
| DEP-OWN | Coordinator SUPPLIER-UX-002 | Bàn giao file trùng, giữ dirty diff. S20 chồng 5 file S4: một owner cho layout hiện tại, không chờ hoặc nhập phần giá tương lai của S20. Không tự sửa/tick task kia. |
| DEP-FRAME | Frame owner FR-13 | Review delta picker/icons, S10 sinh lock bằng tool. Không sửa gate/token/baseline. |
| DEP-WEB | Coordinator runtime | Runtime >3003, account scopes/storageState, fixture giá hiện hữu và fixture toàn repo; RAM ≥3000 MiB. Không yêu cầu API giá mới. |

Nullable, Q5/Q6, SKU→nhóm và snapshot/registry cho hợp đồng giá mới không là điều kiện mở slice/PASS của task này. Lỗi nền đang tồn tại vẫn phải báo đúng và giao owner xử lý trước xác nhận hồi quy xanh; không skip để tránh block giả.

## Risks / rollback
- Giữ dirty diff SUPPLIER-UX-002; không reset/stash/format rộng. So hash ngoài run trước/sau. Không chạy board/new/use/approve/verify/done CLI trong lượt r2 vì ghi ngoài phạm vi.
- Picker ảnh hưởng toàn app: giữ signature và hồi quy 7 caller read-only. Rollback theo slice cùng manifest lock; kiểm guard/payload giá hiện tại không đổi sau tách form.
- Lỗi snapshot byte equality ghi trong audit lượt 1 là lỗi nền cần owner xử lý riêng nếu còn tái hiện; không đổi oracle/snapshot trong task này. Không claim suite nền xanh khi chưa chạy.
- D-INVUX-001 đề xuất: production.test.tsx/app/rebrand.test.ts >400 dòng, chỉ chạy read-only; không trộn tách nợ. D-INVUX-002 đề xuất: tỉnh/phường/quick-entry/KPI ngoài task. Không tự ghi sổ chung.

## Open decisions
- Câu hỏi Dawn = 0. Coordinator chốt owner file S20/frame và runtime theo DEP-OWN/FRAME/WEB; không chặn UX bởi quyết định/contract giá mới. Giữ giới hạn giá hiện tại đúng AC-6 cho tới task giá riêng phát hành.

## Provenance và bàn giao
- Lượt 1 chạy nguyên engine new trong engine-bootstrap/ thuộc run, không đăng ký root; canonical plan vẫn ở đây. Không tạo lại task hay sửa receipt; root ACTIVE giữ nguyên.
- R2 theo brief 27/10: thu 10 slice/36 file thành 9 slice/31 file; S4 chỉ layout, bỏ S7, thu S8/S9, chuyển 5 slice giá dự kiến sang mục cuối. Validation mới tại [validation.md](validation.md).
- Pick up: đọc plan/impact/validation; bàn giao owner rồi thực hiện các slice UX sau duyệt. Không dùng các đề xuất task sau làm check bắt buộc cho task này.

## Việc sau (task riêng)
Đề xuất `PORTAL-RECEIPT-PRICE-001` sau `INVENTORY-PRICE-NULLABLE-001`. Chỉ lập run/Files planned/test kit riêng khi backend/contracts được bàn giao; 5 slice dưới đây không thuộc Slices hoặc Files planned của PORTAL-INVENTORY-UX-001.

| Slice dự kiến | Kết quả | Phụ thuộc | Owner |
|---|---|---|---|
| P1 | Bàn giao hợp đồng nullable: refs cùng có/cùng vắng; tạo/receive/cost MANUAL, bảo toàn ATTP/QC; lưu/đọc lý do Q5 và API giá gần nhất Q6 | INVENTORY-PRICE-NULLABLE-001; SUPPLIER-UX-002 S14a/b/S14→S15a/S15→S16–S18; Q5/Q6 bổ sung không mặc nhiên có từ nullable; snapshot/registry S41b sinh đúng và client S19 bàn giao | inventory backend chủ trì; portal owner BFF/snapshot/generated/client |
| P2 | Ánh xạ SKU→inventory leaf code chính thức, pagination/unmapped/quyền; sau đó lọc nguyên liệu theo nhóm NCC | P1 và contract mapping inventory+sales; không suy từ sales.category_ref/name/UUID | inventory backend chủ trì với sales; portal làm lookup/filter |
| P3 | Client/types/draft tương thích + form hợp đồng tuỳ chọn/giá tay nguyên đồng≥0; gợi ý Q6 có ngày/UOM, không tự điền; vắng giá khác outage/409 | P1/P2 và owner S20 bàn giao; draft cũ thiếu giá không thành 0; không lấy sales.reference_price_vnd | portal |
| P4 | Q5 abs(thực−tham chiếu)>10% bắt lý do không trắng, serialize + reload; 100.000→110.000/90.000 không bắt, 110.001/89.999 bắt; spec/i18n giá mới | P1/P3; inventory xác nhận server enforce, lỗi field, tham chiếu 0 và làm tròn; không nhét lý do vào notes để né contract | inventory backend enforce/persist; portal UI/spec/i18n |
| P5 | E2E POST giá tay/no-refs/read-after-write/Q5/Q6 và migrate oracle read-only đúng thời điểm; R33 stable 3/3 + full repo regression | P1–P4 PASS, runtime có backend mới; plan/Files planned được rà và duyệt riêng | portal, inventory backend hỗ trợ fixture/evidence |

Các file client giá cũ S7, schema draft/giá S4 phần B, giá trong S8 và POST giá mới trong S9 chỉ được đưa vào Files planned của task sau. Owner/coordinator giải quyết file trùng ở thời điểm giao task; không approve hay tạo receipt cho đề xuất này trong lượt r2.
