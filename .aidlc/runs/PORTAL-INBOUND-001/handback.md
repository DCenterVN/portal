## Done

- S1: Thêm 4 BFF POST receive, quantity-variances, evidence-uploads và finalize. Mỗi file một hàm POST gọi forwardInventory, encode tham số đường dẫn; không chuyển byte file qua BFF. Typecheck S1 PASS.
- S2: Client dùng inventoryRequest/inventoryMutation, schema zod cho cả 4 response; tái sử dụng fileSHA256 và uploadDocument. Test được viết và chạy đỏ trước client, sau đó xanh 11/11. Kiểm đường dẫn, body, key qua hai lần gửi và lỗi mạng, response sai bị từ chối.
- S3: Route và màn nhận theo thẻ từng dòng. Đọc lịch sử tối đa 10 trang, lấy tên NCC/nguyên liệu bằng client sẵn có. Có loading/empty/error, quyền, lượng tối đa 3 số lẻ, mã lô, HSD sau hôm nay, nhiệt độ, hai ô ảnh bắt buộc, preview và lỗi/retry tại ô. Giữ File trong RAM, dùng lại chứng từ dòng trước bằng một upload mới thuộc dòng/attempt mới. Dòng thành công hiện Đã nhận cùng lượng thực nhận.
- S4: Ảnh QUANTITY_VARIANCE xuất hiện trước receive nếu lượng dòng khác dự kiến, đúng guard backend. Sau khi các dòng đã nhận, tổng lệch >5% hiện giải thích bắt buộc và ảnh để ghi quantity-variances; có trạng thái thành công và retry giữ key/body. Chuẩn hóa KG/G, L/ML khi tính tổng; không cộng khác dimension.
- S5: Nút Nhận hàng ở phiếu DRAFT/IN_PROGRESS trong lịch sử NCC; nút Nhận hàng ngay sau create dùng receipt.id và supplier từ lần tạo. Cả hai kiểm quyền cập nhật, dùng Link với buttonVariants của UI kit.

### Verification

- RED: `ESBUILD_BINARY_PATH=$HOME/.local/share/esbuild/esbuild-0.21.5 npx vitest run lib/api/goods-receipt-receive.test.ts` thất bại vì client chưa tồn tại, trước khi viết client.
- GREEN: `ESBUILD_BINARY_PATH=$HOME/.local/share/esbuild/esbuild-0.21.5 npx vitest run lib/api/goods-receipt-receive.test.ts features/inventory --no-cache`: **105/105 test**, **14/14 file PASS**; riêng S2 **11/11**.
- `npm run typecheck`: **PASS**, exit 0.
- `node node_modules/eslint/bin/eslint.js app lib features`: **PASS**, exit 0.
- `git diff --check`: **PASS**.
- Các lệnh được chạy qua `rtk proxy`. Vitest cần `--no-cache` vì node_modules là symlink tới cây dependency chỉ đọc; không dùng /tmp. Lần chạy mặc định báo EROFS khi ghi results.json, đã chạy lại không cache.
- Test cũ của supplier hiển thị cảnh báo next-intl ENVIRONMENT_FALLBACK thiếu timeZone, không làm fail test; không sửa ngoài phạm vi.
- Bằng chứng tự động: 3/3 nhóm kiểm tra được yêu cầu PASS. Chưa chạy E2E/MinIO thật: 0 ca; chưa có điểm đánh giá UI bằng trình duyệt. Không tính các phần này là PASS.

## Files changed

Đúng 13 file của S1–S5, cộng báo cáo handback được yêu cầu riêng:

1. app/api/inventory/goods-receipts/[id]/receive/route.ts
2. app/api/inventory/goods-receipts/[id]/quantity-variances/route.ts
3. app/api/inventory/goods-receipts/[id]/evidence-uploads/route.ts
4. app/api/inventory/goods-receipts/[id]/evidence-uploads/[uploadId]/finalize/route.ts
5. lib/api/goods-receipt-receive.ts
6. lib/api/goods-receipt-receive.test.ts
7. app/(console)/inventory/goods-receipts/[id]/receive/page.tsx
8. features/inventory/goods-receipt-receive.tsx
9. features/inventory/use-goods-receipt-receive.ts
10. features/inventory/receipt-evidence-field.tsx
11. features/inventory/supplier-receipts-view.tsx
12. features/inventory/goods-receipt-form.tsx
13. features/inventory/use-goods-receipt.ts
14. .aidlc/runs/PORTAL-INBOUND-001/handback.md

Không sửa inventory/Kong, không thêm dependency, không git add/commit. Symlink môi trường node_modules đang hiện untracked, không thuộc thay đổi triển khai và không đưa vào commit.

## Decisions

- DTO service đã chuyển sang `inventory/internal/application/dto.go`, package vẫn là service; đường dẫn `internal/service` trong brief không tồn tại. Đã đọc JSON tag thật cùng wire override tại `internal/transport/http/goods_receipts.go`.
- Body receive: `goods_receipt_line_id`, `receive_attempt_ref`, `evidence_refs`, `supplier_lot_code`, `sku_ref`, `initial_quantity`, `expiry_date`, `received_temperature_celsius`, `uom`. Lượng và nhiệt độ là JSON number; expiry_date là RFC3339 với offset +07:00. Không gửi các trường nội bộ json:"-".
- Body presign theo `internal/transport/http/dto/receipt_evidence.go`: `goods_receipt_line_id`, `receive_attempt_ref`, `purpose`, `content_type`, `size_bytes`, `sha256`; không gửi inspection_ref cho receive. Response: `upload_id`, `upload_url`, `form_fields`, `expires_in` đúng 300. Upload multipart POST dùng nguyên helper uploadDocument. Finalize lấy upload ID từ path, gửi `{}`; handler không cần body chứa upload_id. Response: `media_ref`, `sha256`, `content_type`, `size_bytes`, `status` FINALIZED.
- Body variance: `receive_attempt_ref`, `evidence_refs`, `expected_quantity`, `actual_quantity`, `explanation`. Hai lượng là JSON number. Chỉ gửi ảnh QUANTITY_VARIANCE thuộc một attempt, có thể dùng lại ảnh đã gửi cùng dòng receive.
- Mỗi dòng giữ attempt UUID v4 trong RAM. Sau lần gửi chưa rõ kết quả, khóa trường/ảnh, giữ nguyên body và Idempotency-Key khi retry. Lỗi 400/403/404/422 cho sửa lại; body đổi mới sinh key mới. Không xóa/nới test cũ; hai props điều hướng mới của view form là optional để giữ API tương thích caller cũ, runtime hook luôn cung cấp.
- Theo brief/plan, chọn tệp chạy presign → upload → finalize ngay để đủ ảnh mới bật nhận dòng. Đây là ngoại lệ đã được yêu cầu rõ so với UP-13 tải khi submit. File/preview chỉ ở RAM, object URL được revoke khi thay/unmount.
- ReceiptDateInput được tái sử dụng cho ngày dự kiến trên đầu màn. HSD từng dòng dùng cùng parseReceiptDate/formatReceiptDate với Field/TextInput và ID riêng, tránh nhãn Ngày dự kiến nhập và ID cố định của component cũ bị lặp.
- Chỉ hiện đối soát >5% khi mọi dòng đã có lượng nhận để không coi các dòng đang chờ nhận là giao thiếu. Tổng đã nhận vẫn hiện trong suốt quá trình. Các dòng lịch sử có actual_quantity >0 được coi là đã nhận trong màn một lần nhận mỗi dòng này.

## Left over

- S6 và xác minh trình duyệt/MinIO/Kong/DEV chưa làm, đúng phạm vi S1–S5. Chưa chứng minh lô thực tế hoặc chống tạo lô trùng trên backend qua E2E. Không tạo e2e/goods-receipt-receive.spec.ts.
- Cần inventory xử lý PDF: `internal/domain/receipt_evidence.go`, CheckReceiveEvidence cho PDF DELIVERY_DOCUMENT đi vào `continue` trước khi tăng have[purpose], sau đó vẫn bắt have[DELIVERY_DOCUMENT] >=1. Theo đọc code, receive chỉ có ảnh hàng + PDF sẽ bị từ chối dù presign/finalize cho phép PDF. Portal giữ accept PDF theo plan và hiện nguyên lỗi validation_failed; chưa sửa backend ngoài phạm vi.
- Guard backend yêu cầu ảnh lệch cho mọi lượng dòng khác dự kiến và explanation cho mọi variance khác 0; UI lấy ảnh sớm theo guard, còn mục giải thích cấp phiếu theo ngưỡng >5% của plan. Cần đối chiếu tiếp ở S6 nếu luồng QC yêu cầu đối soát cả lệch <=5%.
- Phiếu cũ hơn 10 trang chưa đọc được tới khi có GET detail RD-3b. Màn này không hỗ trợ chia nhiều đợt nhận cho cùng dòng lịch sử đã có actual_quantity >0.
- Kiểm tra sáng/tối, 375px, bàn phím, lỗi 403/409/503 và upload thực tế còn thuộc nghiệm thu UI/E2E; bộ unit hiện tại không thay thế việc này.

### Tham khảo

- Đã đọc `~/refs/erpnext/erpnext/stock/doctype/purchase_receipt/purchase_receipt.py`, phần validate và mapping received_qty/qty.
- Lấy cách tách lượng dự kiến với lượng nhận theo từng nguyên liệu và kiểm đơn vị trước khi ghi nhận.
- Lấy ý tưởng kiểm trạng thái phiếu và điều kiện chất lượng trong luồng nhận, giữ backend inventory làm nơi quyết định.
- Bỏ rejected warehouse, putaway rule, stock posting và các nghiệp vụ ERP khác vì không thuộc S1–S5; không sao chép code hoặc thêm dependency.
