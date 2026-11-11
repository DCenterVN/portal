# FLOW-E2E-001 / FLOW-E2E-002

## Điểm bắt đầu

Tiếp tục worktree portal-flow-fix và giữ các thay đổi chưa commit của FLOW-E2E-001. DEV qua Kong 8000; portal 3002. Các vai WAREHOUSE, CUSTOMER và SALES đăng nhập UI riêng, không dùng ADMIN trong vòng mua.

## Quyết định và nguyên nhân

- Nhập bổ sung qua phiếu nhập dở, dùng trực tiếp `upload`, `quality`, `png`, `PNG` của `seed_mon_an.py`. Hai ảnh khác SHA256, attempt `uuid5(NAMESPACE_URL, "SEED-MON-002/" + receipt_line_ref)`. Receive thành công, QC nguyên liệu APPROVED. Lỗi 422 trước đó không còn tái hiện với payload này.
- Chuẩn bị lô mới bằng `seed_trace_demo.main`, `--new`, `TRACE_PREPARE_ONLY=1`, `TRACE_QUANTITY=3`. Script chuẩn bị nằm trong `.cache`, không lưu trong repo.
- Hộp thoại thành công vốn có nhưng giỏ bị tải lại khi `setCartId("")` đổi dependency của `reload`; loading/error thay toàn bộ CartView và che hộp thoại. `reload` dừng khi `completed.current`, giữ mã đơn hiển thị sau checkout. Giữ assert dialog chứa chính mã đơn server trả về.
- Chọn chi nhánh chờ response `/api/public/branches`, combobox enabled, listbox visible và option thực sự tải xong. Không sleep cứng.
- SALES có quyền giao đơn nhưng không có `org:membership:read`, portal cũ chặn ngay giao diện. Khi không đọc được danh sách thành viên, chỉ lấy hồ sơ chính mình bằng `/api/auth/me` và cho chọn chính mình. Khi có quyền đọc thành viên, giữ danh sách SALES đang hoạt động của chi nhánh. Service vẫn kiểm tra quyền và người được gán. Test kiểm tra người khác bị từ chối, không gọi API danh sách thành viên trong nhánh tự giao.
- Inventory FEFO giữ lô cũ trước lô mới; kệ của lô đó được trừ theo `placed_at,id` trong `inventory-flow-fix/internal/store/reservation_shelves.go`. Thay giả định sai “lô mới luôn còn 2” bằng snapshot tất cả kệ, đúng một kệ giảm 1, catalog SKU giảm 1 và stock chi nhánh giảm 1. Kịch bản vẫn lên kệ mới đúng 3 và khách thấy tăng 3, không thay đổi dữ liệu cũ để ép chọn lô mới.
- Nhãn kệ SELLING được sửa thành “Đang bán”, EMPTY/REMOVED cũng có nhãn riêng.
- Giữ các sửa UI trước đó: chọn chi nhánh mua hàng, công khai danh sách chi nhánh từ cấu hình server, số tồn trên trang món, nhãn kệ tiếng Việt, mô tả đơn hàng cho khách.

## File chính

`e2e/flow-purchase/flow-purchase.spec.ts`, `playwright.config.ts`, `app/api/public/branches/route.ts`, `app/api/public/branches/route.test.ts`, `features/products/store-branch-picker.tsx`, `features/products/catalog-view.tsx`, `features/products/product-detail-view.tsx`, `features/products/orders-view.tsx`, `features/products/use-cart.ts`, `features/inventory/shelves-view.tsx`, `features/sales/use-sales-orders.ts`, `features/sales/order-dialog.tsx`, `features/sales/orders-flow.test.ts`, `frame.lock.json`.

## Kiểm tra

- `pnpm vitest run`: PASS, 127 file, 1.874 test.
- `pnpm lint`: PASS. Đã chuyển báo cáo e2e sinh từ lần trước ra `.cache` để lint chỉ quét source.
- `node scripts/frame-lock.mjs`: PASS, khớp 97 file.
- `pnpm exec next build --webpack`: PASS.

Log bốn lệnh ở `.cache/flow-002-{vitest,lint,build}.log`; frame-lock trả exit 0 trực tiếp.

## Tiếp nối

Chạy cuối PASS 13/13 bước, Playwright 1 passed, 44,2 giây. Chứng cứ `.cache/e2e/flow-purchase-20261111-2224/` có `KICH-BAN.md`, ba video vai, `trace.zip`, 13 ảnh, `lot.json`, `steps.json`, `verification.json`, `network-errors.json` rỗng. Đã mở ảnh xác nhận mã đơn và rà giao diện hành trình.

| Bước brief | Kết quả |
|---|---|
| a. Kho | PASS, lô QC_PASSED mới lên kệ 3, mã TRC-20261111-dc737d7e |
| b. Khách | PASS, chọn chi nhánh, tồn 42→45, thêm 1, form COD đủ, dialog DH-261111-00015 |
| c. SALES | PASS, xác nhận, đóng gói, chọn chính mình giao, đã giao |
| d. Khách xem đơn | PASS, Đã giao, dòng món và đủ lịch sử trạng thái |
| e. API | PASS, kệ FEFO TRC-20261111-7940f419 giảm 3→2, catalog 45→44, tồn chi nhánh 46→45, COD SUCCESS, reservation CONSUMED |

Mã lô mới `01a1cb34-1dc7-774a-9493-e910b3284730`. Lô mới còn 3 vì service xuất FEFO lô cũ; đây là điều chỉnh giả định kiểm thử, không ép service xuất lô mới. Không còn lỗi service chặn vòng mua. Đã xoá năm thư mục `flow-purchase-20261111-17*` sau khi có bản PASS. Portal 3002 được tắt qua đúng phiên tiến trình đã mở. Không git ghi, không SQL, không thêm dependency, không sửa service/dev-infra.
