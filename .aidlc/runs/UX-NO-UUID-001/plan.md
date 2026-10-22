# Plan: UX-NO-UUID-001

- **Task ID**: `UX-NO-UUID-001`
- **Mode**: `hard`
- **Story**: US-001
- **Sprint**: 01
- **Issue**:

## Scope
- Outcome: người dùng portal không bao giờ nhập hoặc thấy UUID; chọn thực thể bằng tên/mã nghiệp vụ (R16, Dawn 21/10, nợ D-246). Số ô nhập UUID trên portal = 0, số chỗ in `*_ref`/id thô = 0, có test chặn tái phạm.
- Decision: REUSE `components/ui/entity-picker.tsx` + client API có sẵn trong `lib/api/*`; REMOVE ô nhập/hiển thị UUID.
- Impact: 7 view (D-246) + test cạnh từng view; không đổi BE/OpenAPI/BFF route.

## Requirements
- FR-1 Giá sàn (`features/sales/pricing-floor-view.tsx:110-114`): Product/Variant/BOM/Price book chọn qua EntityPicker theo tên/mã; ref policy/price version lấy từ response, không có ô nhập.
  - AC-1: Given FOOD_DEV/OWNER mở màn giá sàn When chọn sản phẩm bằng gõ một phần tên Then variant/BOM/bảng giá lọc theo sản phẩm đó và preview chạy, không ô nào có label/placeholder chứa UUID.
- FR-2 Kệ (`features/inventory/shelves-view.tsx:99`): chọn lô thành phẩm đã QC đạt qua picker hiển thị mã lô/tên sản phẩm.
  - AC-2: Given có lô APPROVED When mở form đưa lên kệ Then chọn lô trong danh sách, không nhập tay UUID.
- FR-3 Hiển thị: `targets-view.tsx:160` (branch_ref), `orders-view.tsx:34` (order.id, cart_ref), `order-detail-view.tsx:37` (cart_ref), `memberships-view.tsx:105` (user_id), `audit-view.tsx:97,101` (target_id, contract_ref) thay bằng tên/mã nghiệp vụ/ngày giờ; không có thì bỏ cột.
  - AC-3: Given dữ liệu thật When render các màn trên Then không có chuỗi khớp `/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/` trong text hiển thị.
- FR-4 Chặn tái phạm: test quét `features/**/*.tsx` + `components/**/*.tsx` báo lỗi khi có `label`/`placeholder` chứa UUID/ID hoặc JSX in thẳng `{x.*_ref}` / `{x.id}` / `{x.*_id}`.
  - AC-4: thêm lại `placeholder="UUID lô"` vào 1 view → test đỏ.
- Ngoài phạm vi: BE/OpenAPI/BFF mới. Thiếu endpoint danh sách để làm picker → ghi handoff + nợ, không tự thêm BE.

## Technical definition
- Quyết định: UUID là khoá nội bộ (hệ thống nối dữ liệu, dev tra log/DB), không phải dữ liệu người dùng — Dawn 21/10, luật R16 `plans/261020-fooddev-set/codex-rules.md`.
- Chỉ đổi lớp FE (`features/*`), theo `platform-docs/standards/frontend.md`; dùng client có sẵn trong `lib/api/*`, không thêm BFF route, không sửa OpenAPI/BE.
- NFR: bảo mật — không lộ id nội bộ ra DOM text; hiệu năng — picker tải danh sách 1 lần/màn (limit ≤100, có ô tìm), không gọi theo từng dòng; khả dụng — API danh sách lỗi thì hiện ErrorState/thông báo, không rơi về ô nhập tay.

## UX
- Mẫu chọn: `components/ui/entity-picker.tsx` — gõ một phần tên/mã → chọn option; chọn cha thì lọc con (sản phẩm → biến thể → BOM/phiên bản).
- Hiển thị: tên / mã nghiệp vụ (sku_code, target_code, mã lô) / ngày giờ `vi-VN` / trạng thái; không có thì bỏ cột, không thay bằng id rút gọn.
- Giá sàn: chuỗi chọn Sản phẩm → Biến thể → Công thức (BOM + phiên bản) → Bảng giá; policy/price version tự giữ từ response vừa tạo.
- Kệ: picker "Lô thành phẩm đã QC đạt" hiện mã lô + tên sản phẩm + ngày.
- Đơn hàng: tiêu đề = ngày giờ đặt + trạng thái + tổng tiền; bỏ "Giỏ <cart_ref>".
- Thành viên: tên hiển thị/email; Audit: tên/mã đối tượng nếu response có, không thì bỏ dòng id.
- Token màu/khoảng cách giữ nguyên, không đổi design system.

## Design
- Component: tái dùng `EntityPicker`; không tạo picker mới trừ khi `EntityPicker` thiếu prop thật sự cần (ghi lý do).
- Nguồn dữ liệu (đã tra OpenAPI trên main):
  - Sản phẩm: `GET /sales/products` (`sales/api/openapi.public.yaml:8`), client `lib/api/sales.ts:38 getProducts`.
  - Biến thể: `GET /sales/products/{product_id}/variants` (`sales/api/openapi.public.yaml:1026`, op `getSalesproductsproductidvariants`) — thêm hàm client gọi op này.
  - Bảng giá: không có ô chọn. Theo FOODDEV-BE-DEBT-001 OD-1, 1 bảng giá = 1 biến thể; server tự lấy `price_book_ref = output_sku_ref`, lịch sử giá đọc `GET /sales/price-books/{variant_id}/versions`. Trước khi BE-DEBT S6 merge: ẩn phần đề xuất giá, hiện "Chưa có dữ liệu bảng giá".
  - BOM/phiên bản: `GET /production/boms?output_sku_ref=<variant>` (FOODDEV-BE-DEBT-001 S5), hiện `bom_code · v<version>`, chọn sẵn bản `BOM_ACTIVE`. Trước khi S5 merge: ẩn ô + disable preview, hiện "Chưa có danh sách công thức".
  - Lô thành phẩm cho kệ: `GET /production/orders` (`production/api/openapi.public.yaml:92`, `lib/api/production.ts:187 getOrders`) lọc lệnh đã QC đạt có `finished_lot_ref` (`lib/api/production.ts:49`) → option hiện mã lệnh + tên sản phẩm + hạn dùng.
- State: id được chọn giữ trong state nội bộ, chỉ gửi trong request body; không render.
- Lỗi: API danh sách lỗi → ErrorState của picker, nút submit disable.
- DB/API/events: không đổi.

## Files planned
- features/sales/pricing-floor-view.tsx
- features/inventory/shelves-view.tsx
- features/production/targets-view.tsx
- features/production/targets-view.test.tsx
- features/products/orders-view.tsx
- features/products/order-detail-view.tsx
- features/products/products.test.tsx
- features/memberships/memberships-view.tsx
- features/platform/audit-view.tsx
- features/platform/audit-view.test.tsx
- features/sales/pricing-floor-view.test.tsx
- features/inventory/shelves-view.test.tsx
- features/memberships/memberships-view.test.tsx
- lib/ux-no-uuid.test.ts
- features/platform/audit.test.ts
- components/ui/entity-picker.tsx
- lib/api/production.ts
- lib/api/sales.ts
- features/products/cart-view.tsx
- app/rebrand.test.ts
- app/ui-rules-baseline.txt
- frame.lock.json

## Tests planned
| TC | AC | layer | command |
|---|---|---|---|
| TC-1 pricing_floor_pick_by_name | AC-1 | vitest | `node node_modules/vitest/vitest.mjs run features/sales/pricing-floor-view.test.tsx` |
| TC-2 shelves_pick_lot | AC-2 | vitest | `... features/inventory/shelves-view.test.tsx` |
| TC-3 no_uuid_rendered (mỗi view 1 case, fixture có UUID, assert không hiện) | AC-3 | vitest | test cạnh từng view |
| TC-4 repo_scan_no_uuid | AC-4 | vitest | `... lib/ux-no-uuid.test.ts` |
| Mutation (Claude) | AC-4 | — | thêm lại placeholder UUID → TC-4 đỏ; trả lại `{order.cart_ref}` → TC-3 đỏ |

## Slices
- [ ] S1: Giá sàn chọn theo tên (files: features/sales/pricing-floor-view.tsx, features/sales/pricing-floor-view.test.tsx; test: node node_modules/vitest/vitest.mjs run features/sales/pricing-floor-view.test.tsx)
- [ ] S2: Kệ chọn lô theo mã lô (files: features/inventory/shelves-view.tsx, features/inventory/shelves-view.test.tsx; test: node node_modules/vitest/vitest.mjs run features/inventory/shelves-view.test.tsx)
- [ ] S3: Bỏ UUID hiển thị ở chỉ tiêu/đơn/thành viên/audit (files: features/production/targets-view.tsx, features/production/targets-view.test.tsx, features/products/orders-view.tsx, features/products/order-detail-view.tsx, features/products/products.test.tsx; test: node node_modules/vitest/vitest.mjs run features/production/targets-view.test.tsx features/products/products.test.tsx)
- [ ] S4: Thành viên + audit + test quét toàn repo (files: features/memberships/memberships-view.tsx, features/memberships/memberships-view.test.tsx, features/platform/audit-view.tsx, features/platform/audit-view.test.tsx, lib/ux-no-uuid.test.ts; test: node node_modules/vitest/vitest.mjs run --exclude "e2e/**" && pnpm typecheck && pnpm lint)

## Phát sinh khi làm (21/10, cần Dawn approve lại)
- `components/ui/entity-picker.tsx`: thêm `serializeValue` (mặc định true, form cũ giữ nguyên; kệ đặt false để không có hidden input chứa id) và `maxOptions` (kệ = 20).
- `lib/api/production.ts`: `getOrders({forPicker:true})` lọc `status=QC_PASSED`, ném lỗi HTTP để tách lỗi với rỗng; lời gọi cũ không đổi.
- `lib/api/sales.ts`: `getOrderDisplay` đọc envelope bằng `decodePlatform` (R14); `getOrders/getOrder` cũ đọc body phẳng nên mất dữ liệu.
- `app/rebrand.test.ts`, `app/ui-rules-baseline.txt` (chỉ xoá 2 dòng hết vi phạm), `frame.lock.json` (script `frame-lock.mjs --write`, 1 hash entity-picker): gate cũ theo hành vi mới.
- Rebase 21/10 22:55 lên portal `origin/main` `45cddef` (nhánh dựng nhầm trên `c98f22d` cũ 15 commit): origin đã xoá `features/platform/audit-view.test.tsx` → case `audit_no_uuid` chuyển sang `features/platform/audit.test.ts`. Màn thành viên origin dùng DTO chỉ có id/role/status → bỏ cột id, chưa có tên/email (nợ BE). Lint `next.config.mjs:3` `process` no-undef có sẵn trên origin/main, ngoài phạm vi → check lint của task chỉ chạy trên file task.
- Nợ BE mới: lệnh sản xuất chưa trả tên sản phẩm; `GET /production/orders` chưa có limit/phân trang; audit DTO chưa có tên người làm/đối tượng.

## Sửa sau review 21/10 khuya (cần Dawn approve lại)
Review [review-ux-no-uuid.md](../../../../../work/ticket/plans/261021-ui-handoff/review-ux-no-uuid.md) BLOCKED; Dawn chốt sửa trong task:
- `features/products/cart-view.tsx` (mới vào plan): sau khi đặt hàng, toast + dialog hiện `order_code` (`DH-YYMMDD-NNNNN`, sales `internal/store/models.go:94` đã trả) thay `order.id`; thiếu `order_code` thì bỏ dòng mã. Test trong `products.test.tsx`.
- Màn đơn (`orders-view.tsx`, `order-detail-view.tsx`): hiện `order_code` để phân biệt hai đơn giống nhau.
- `lib/api/sales.ts`: xoá `getOrders`/`getOrder` cũ không còn ai gọi (R11).
- `features/platform/audit-view.tsx`: hiện lại `contract_ref` (mã hợp đồng giấy, không phải UUID).
- `lib/ux-no-uuid.test.ts`: quét thêm chuỗi trong `toast.*(…)`, template có `.id}`/`_id}`/`_ref}` trong text/title/aria, `.slice(0, 8)` trên id, và cả `app/**`. File ngoài plan còn vi phạm → allowlist kèm D-246.
- Ghi nợ, không làm: khối "Huỷ đơn" so `CREATED` trong khi sales tạo đơn ở `AWAITING_PAYMENT`; nhãn enum tiếng Anh còn in thẳng; màn thành viên cần tên/email (D-255).

## Risks / rollback
- Picker cần endpoint danh sách chưa có (variant/BOM/price book/lô) → không chặn task: ghi nợ BE, ô đó tạm ẩn kèm thông báo "chưa có dữ liệu để chọn", không quay lại ô nhập UUID.
- Rollback: revert nhánh `ux-no-uuid-001`.

## Open decisions
<!-- tag every claim without file:line as ASSUMED, in square brackets, until resolved -->
- Đã chốt 21/10 tối: API danh sách BOM + lịch sử bảng giá làm ở FOODDEV-BE-DEBT-001 (S5, S6); slice S1 giá sàn chạy sau khi BE-DEBT merge, các slice khác chạy ngay. Không quay lại ô nhập UUID. Lô thành phẩm lấy từ `GET /production/orders`.
