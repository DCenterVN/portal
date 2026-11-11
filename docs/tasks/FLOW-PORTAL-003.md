# FLOW-PORTAL-003

Status: IMPLEMENTED_PORTAL · sửa người giao SALES và đọc contract FLOW-SALES-002; chưa xác minh tích hợp DEV.

## CONTEXT

Worktree `portal-flow-fix`, nhánh `feat/FLOW-PORTAL-001`. Giữ nguyên PORTAL-001 `668ddc0`, PORTAL-002 `3518091`; không thực hiện git ghi.
Contract đọc từ `sales/docs/specs/order-lifecycle.md` §4, A3–A7, BR-12 và `sales/api/openapi.public.yaml` ShipOrderRequest, ConfirmPaymentRequest, OrderReasonRequest.
Mẫu `features/production/orders-view.tsx`, `use-production-orders.ts`, menu `lib/navigation.ts`, BFF huỷ đơn và checkout locations của PORTAL-002.

## REQUIRED

- Sáu BFF POST confirm, pack, ship, deliver, delivery-failure, payments/confirm dùng forwardSales, giữ JSON và Idempotency-Key.
- `/sales/orders` và mục Đơn hàng trong Bán hàng gate `sales:order:read`, route dùng phiên nhân viên. List/detail/cancel nhân viên không gửi branch_id.
- Bảng mã đơn, người nhận, SĐT, tổng VND, thanh toán, trạng thái tiếng Việt, ngày dd/mm/yyyy; Select mở danh sách lọc khi click; bấm dòng xem sheet.
- Chi tiết người nhận, địa chỉ tỉnh/xã giải tên bằng locations, dòng món và lịch sử khi API có dữ liệu. Không lấy UUID làm nhãn.
- Các bước xác nhận COD, xác nhận chuyển khoản có mã giao dịch, đóng gói, chọn người giao, giao thành công/thất bại và huỷ theo trạng thái/quyền.
- RHF + zod kiểm dữ liệu; khoá đồng bộ chống bấm đôi, key giữ theo đơn/action/payload khi retry; thành công cập nhật dòng/toast, lỗi giữ dialog/dữ liệu/message server.

## CONSTRAINT

Chỉ thay đổi worktree này, không dependency mới, không sửa sales/org, không commit/push. TMPDIR=/home/dawn/work/ticket/.cache.
View render; hook sở hữu tải đơn, chi tiết, locations, người giao và mutation. Tái sử dụng apiFetch, decodePlatform, useLoadedList, SWR, mutationHeaders và UI có sẵn. Tất cả file mới dưới 400 dòng, không thêm comment.
Worktree không có component DataTable: dùng bộ Table của console production. mutationHeaders có sẵn ở production-http nhận thêm key tuỳ chọn, hành vi caller cũ giữ nguyên; schema đường khách sales.ts cũng đọc các field mới optional.

## ACTION

1. Đọc vòng đời, schema, operation registry, console và API thành viên; thêm test đỏ do thiếu module/action/BFF.
2. Thêm BFF cùng client staff-orders riêng; không gọi getOrderDisplay/cancelOrder của khách.
3. Thêm hook, bảng, sheet, dialog; người giao lấy `companyMemberships`, phân trang và lọc ACTIVE + SALES + branch_id tại `features/sales/use-sales-orders.ts`. Dialog "Giao đơn", ô "Người giao" hiện tên/email, gửi user_id qua driver_ref. Tự chọn `useAccess().scope.userId` nếu có trong list; rỗng hiện "Chi nhánh chưa có nhân viên bán hàng để giao" và chặn gửi.
4. Kiểm thử forward path/method/body/key, status × payment × permission, render nút/menu, driver_ref, chặn bấm đôi, lý do/mã ngân hàng, retry giữ dữ liệu/key và list/get/cancel không branch_id.
5. Chạy toàn bộ vitest, lint, typecheck, app gates và frame-lock. Kết quả cuối ghi trong OUTPUT.

## OUTPUT

- BFF ở `app/api/sales/orders/[id]/`; trang `app/(console)/sales/orders/page.tsx`; UI/hook/tests ở `features/sales/orders*`, `order-details.test.tsx`, `order-actions.ts`, `order-dialog.tsx`, `use-sales-orders.ts`; API `lib/api/staff-orders.ts`, `lib/api/sales.ts`; schema `lib/order-detail.ts`, bảng/lịch sử chung `components/order-details.tsx`, màn khách `features/products/order-detail-view.tsx`; menu/route ở navigation.ts và fetcher.ts.
- Tự động: `TMPDIR=/home/dawn/work/ticket/.cache pnpm vitest run` qua 126 file / 1.867 test, gồm 58 test FLOW-PORTAL-003 và toàn bộ gate app/*.test.ts. `pnpm lint` và `pnpm typecheck` qua. `node scripts/frame-lock.mjs`: khớp 97 file, không cần --write. `git diff --check` sạch.
- FLOW-SALES-002: schema dùng chung đọc payment_method COD/BANK_TRANSFER/CASH, payment_status PENDING_COD/INITIATED/SUCCESS/FAILED, items có sku_code/sku_name/variant_label/quantity/unit_price_vnd/line_total_vnd và state_history from_state/to_state/created_at. Các field optional để chạy với Sales cũ. Thiếu payment_method ẩn cả hai nút xác nhận; CASH không hiện xác nhận COD/chuyển khoản.
- Sheet nhân viên và trang chi tiết khách dùng chung `components/order-details.tsx`: bảng tên món, phần, SL, đơn giá, thành tiền VND; lịch sử chuyển trạng thái tiếng Việt dd/mm/yyyy HH:mm theo Asia/Ho_Chi_Minh. Test cả schema và render hai màn. Chưa xác minh end-to-end DEV.
- Nút Đã giao/Giao thất bại chỉ hiện ở DELIVERING với quyền route và assigned_driver_ref bằng user hiện tại; nếu API thiếu/null thì hiện theo quyền, giữ nguyên message server 403. Hook cũng chặn gọi action của người khác. User id lấy `useAccess().scope.userId` tại `features/sales/use-sales-orders.ts:35`; scope trả từ `lib/access-boundary.tsx:17`, được gán `profile.id` tại `features/console/console-frame.tsx:62`. Không gọi API mới.
- Chênh contract cần chủ Sales xác nhận: OPERATIONS.cancelOrder dùng sales:order_cancellation:create trong khi BR-12 ghi sales:order:update. UI theo registry như yêu cầu; không sửa registry/backend.
- Trang lấy tối đa 100 đơn theo page_size hiện có của Sales; endpoint hiện không trả cursor cho phần đơn cũ hơn.

## Tham khảo

- ERPNext `erpnext/selling/doctype/sales_order/sales_order.py:453`: lấy ý tách xác nhận đơn và tác động giữ hàng; bỏ credit limit, coupon và chứng từ liên công ty.
- ERPNext `erpnext/stock/doctype/delivery_note/delivery_note.py:480`: lấy ý kiểm đóng gói trước ghi nhận giao, cập nhật tiến độ sau server xác nhận; bỏ billing/return invoice và quyền duyệt tài chính.
- Không sao chép trạng thái hoặc mutation ERPNext; toàn bộ transition, quyền và tồn kho do contract Sales/org quyết định.
