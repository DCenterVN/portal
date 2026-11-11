# FLOW-PORTAL-002

Status: DONE theo contract sales hiện tại · 2026-11-11. Khách huỷ CONFIRMED chưa được sales cho phép, xem ACTION.

## CONTEXT

- Worktree `portal-flow-fix`, nhánh `feat/FLOW-PORTAL-001`; giữ nguyên thay đổi nút nấu và sản lượng của FLOW-PORTAL-001.
- Plan `platform-docs/planning/sprints/261110-flow-fix/plan.md` §2 D7, D10, D15.
- Checkout cũ chỉ gửi `cart_ref`, thiếu branch, channel, payment và địa chỉ nên sales trả 422. Giỏ chưa có form; list/detail/cancel chưa gửi branch của giỏ.

## REQUIRED

- BFF GET public cho tỉnh và xã theo integration; lỗi luôn JSON.
- Bấm Đặt hàng mở form RHF + zod, Field và shadcn; EntityPicker hiện tên tỉnh/xã và gửi mã, xã theo tỉnh.
- Người nhận, điện thoại VN 10 số, tỉnh, xã, địa chỉ bắt buộc; ghi chú tuỳ chọn; COD mặc định hoặc BANK_TRANSFER; ONLINE, branch của giỏ, shipping_fee_vnd = 0.
- Một key giữ qua retry, chặn double click đồng bộ; chỉ clearCart sau HTTP 201 và decode thành công; lỗi giữ form và thông báo thiếu hàng.
- List/detail/cancel kèm branch_id; detail/cancel BFF giữ toàn bộ query; nút huỷ theo quyền chuyển trạng thái của khách trong sales.
- Test đỏ rồi xanh, toàn bộ Vitest, lint, gate app/*.test.ts, frame-lock; báo cáo task.

## CONSTRAINT

- Chỉ sửa worktree portal. Sales/integration chỉ đọc. Không lệnh git ghi, không thêm dependency, không thêm comment trong code.
- View render, hook gọi API; tái sử dụng useCart, getCart, apiFetch, mutationHeaders, decodePlatform, forwardService/serviceUrl, safeMessage và components/ui/patterns.
- Không UUID trên UI. TMPDIR=/home/dawn/work/ticket/.cache.

## ACTION

- Sales payload và validation: `sales/internal/service/order_checkout.go:25–37,77–97`.
- Integration không có `docs/specs/` tại checkout này; contract public ở `integration/api/openapi.public.yaml:6–49`.
- Integration route thật: `integration/internal/bootstrap/http.go:29–35` GET `/locations/vn/provinces`, `:43–49` GET `/locations/vn/provinces/{code}/communes`; không auth middleware. `:94–101` encode raw payload, không envelope. `internal/domain/location/location.go:10–16` định nghĩa `code`, `name`, `parent_code`, `unit_type`, `level`.
- BFF dùng INTEGRATION_INTERNAL_URL rồi INTEGRATION_SERVICE_URL qua serviceUrl, GET requireAuth=false; proxy cho phép `/api/locations`; phản hồi HTML/JSON lỗi hoặc mạng lỗi được xử lý thành JSON.
- Form trong Dialog, có trạng thái tải/rỗng/lỗi và retry cho tỉnh/xã, tìm theo tên, tự chọn khi chỉ có một mục; đổi tỉnh xoá xã. Lỗi trường khi blur/submit; chặn đóng lúc gửi, ConfirmDialog khi bỏ dữ liệu đã sửa.
- Hook dùng ref chặn gửi đồng thời và giữ key; giữ dữ liệu sau lỗi. Thông báo out_of_stock giữ message tiếng Việt có tên món từ server; message tiếng Anh chung của sales được đổi thành câu thiếu hàng. safeMessage loại UUID.
- clearCart xoá items/cart_id, giữ cart_branch cho xem đơn sau checkout. getCart tái sử dụng getCartBranch; list/detail/cancel gửi query branch_id; BFF giữ query và Idempotency-Key.
- Điểm lệch REQUIRED 4: `sales/internal/transport/http/order_transition.go` đăng ký route và guard; quyền huỷ thực tế ở `sales/internal/domain/order.go:94–97` chỉ cho CUSTOMER huỷ AWAITING_PAYMENT. CONFIRMED → CANCELLED dành cho SALES/CS_AGENT, phải có lý do theo dòng 101. Vì không sửa sales và phải theo state machine, khách chỉ thấy nút huỷ AWAITING_PAYMENT; PACKED và CONFIRMED không hiện. Đã hỏi hướng xử lý qua câu hỏi bất đồng bộ và thông báo lựa chọn bám contract hiện tại.
- Test đỏ ban đầu: 10/10 test mới thất bại, chứng minh thiếu payload, không validation, double click 2 request, retry đổi key, mất branch và clearCart trên HTTP 200.
- Tham khảo: mẫu nội bộ `components/patterns/entity-picker.tsx`, `features/products/use-activate-product.ts`, `features/inventory/supplier-agreement-form.tsx`. Tái sử dụng picker/Form/Dialog/ConfirmDialog; không thêm thư viện hoặc sao chép helper.
- Cập nhật test cũ theo form checkout và HTTP 201; fixture CREATED chuyển sang AWAITING_PAYMENT, kiểm nút huỷ theo trạng thái thực tế.

## OUTPUT

- Sửa `lib/api/sales.ts`, `features/products/use-cart.ts`, `cart-view.tsx`, `orders-view.tsx`, `order-detail-view.tsx`, `proxy.ts` và hai route sales detail/cancel.
- Thêm `features/products/checkout-form.tsx`, `lib/api/locations.ts`, `lib/api/locations-bff.ts`, hai route locations, `features/products/checkout.test.tsx`, `lib/api/locations-bff.test.ts` và task này.
- Sửa test liên quan trong `features/products/products.test.tsx`, `app/rebrand.test.ts`.
- `pnpm vitest run`: PASS, 122 file, 1806 test; không treo và không bỏ qua test vì sandbox.
- `pnpm vitest run app/*.test.ts`: PASS; xem log `/home/dawn/work/ticket/.cache/flow-portal-002-gates.log`.
- `pnpm lint`: PASS. `pnpm typecheck`: PASS. `git diff --check`: PASS.
- `node scripts/frame-lock.mjs`: PASS, khớp 97 file; không cần --write.
- Cảnh báo Vitest có sẵn về PORTAL_CLIENT_IP_SOURCE và next-intl timeZone. Chưa kiểm thử browser/DEV hoặc upstream integration đang chạy; contract và request được xác minh qua mã nguồn và mock transport.
- Không commit/push, không sửa sales/integration, không thay đổi phần production của FLOW-PORTAL-001.
