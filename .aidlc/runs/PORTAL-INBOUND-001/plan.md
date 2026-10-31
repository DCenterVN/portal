# Plan: Nhận hàng phiếu nhập kèm ảnh bằng chứng

- **Task ID**: `PORTAL-INBOUND-001`
- **Mode**: `hard`
- **Story**: US-INBOUND-UX-001
- **Sprint**: 01
- **Issue**: 
- **Người lập**: Claude Opus 31/10 (Dawn: "cho triển khai fix"). Code: codex gpt-6.1-sol medium qua Orca, mỗi slice một lượt, tuần tự (cùng repo).

## Scope
- Outcome: từ phiếu **Nháp** đến lô đã vào kho (`RECEIVED → UNDER_QC`) hoàn toàn trên portal, **mỗi dòng có ≥1 ảnh hàng + ≥1 chứng từ giao hàng**, 0 lần dán UUID, 0 lần tăng tồn trùng khi bấm lại. Trước: portal chỉ tạo được phiếu nháp (`features/inventory/use-goods-receipt.ts:84`), không có màn nhận hàng.
- Decision: CREATE màn nhận hàng + BFF; REUSE backend inventory đã có đủ API (`inventory/internal/transport/http/router.go:70-75`), Kong đã mở `/inventory/goods-receipts/` (`dev-infra/kong/kong.yml:241-243`).
- Impact: chỉ portal. Không đổi inventory, Kong, org.
- Ngoài phạm vi: màn QC đầu vào (`/inventory/inbound-qc-inspections/*`) → task sau `PORTAL-INBOUND-QC-001`; xem/tải lại ảnh đã nộp (`evidence/{media_ref}/download`); `GET /inventory/goods-receipts/{id}` (spec `inbound-read.md` còn mở RD-3b, chưa code).

## Requirements
Hợp đồng backend: [inbound-receiving.md](../../../../inventory/.aidlc/specs/inbound-receiving.md), [inbound-trace-storage.md](../../../../inventory/.aidlc/specs/inbound-trace-storage.md). Luật ảnh: `inventory/internal/domain/receipt_evidence.go:96-106`.
- FR-1: mở phiếu cần nhận.
- AC-1: Tab lịch sử nhập của NCC, phiếu `DRAFT`/`IN_PROGRESS` có nút "Nhận hàng" → `/inventory/goods-receipts/<id>/receive?supplier=<sid>`; tạo phiếu xong có nút "Nhận hàng ngay" tới cùng màn. Màn hiện tên nguyên liệu, lượng dự kiến, đơn vị; không UUID.
- FR-2: nhận từng dòng.
- AC-2: Mỗi dòng nhập: mã lô NCC (bắt buộc), lượng thực nhận (>0, ≤3 số lẻ), HSD (sau hôm nay), nhiệt độ nhận (°C). Nút "Nhận dòng này" tắt cho đến khi đủ trường + đủ ảnh. Thành công → dòng chuyển "Đã nhận", hiện lượng thực nhận.
- FR-3: ảnh bắt buộc.
- AC-3: Mỗi dòng có 2 ô: "Ảnh hàng thực nhận" (JPEG/PNG/WebP, purpose `DELIVERED_GOODS`) và "Chứng từ giao hàng" (ảnh JPEG/PNG/WebP, purpose `DELIVERY_DOCUMENT`; PDF không thay được ảnh chứng từ bắt buộc — `../inventory/.aidlc/specs/inbound-trace-storage.md:122`, backend không đếm PDF `receipt_evidence.go:96-98`; ô PDF bổ sung để task sau). Chọn file → presign → upload → finalize → hiện "Đã tải lên" + ảnh xem trước; lỗi tải hiện tại ô, cho chọn lại. Thiếu một trong hai → không nhận được.
- FR-4: bấm lại an toàn.
- AC-4: Mỗi lần nhận dòng có một `receive_attempt_ref` (UUID v4 sinh ở client, giữ trong RAM cho đến khi thành công) và một `Idempotency-Key` cố định theo body; bấm lại / mạng lỗi rồi gửi lại → cùng key, backend trả kết quả cũ, không tạo lô thứ hai.
- FR-5: lệch số lượng.
- AC-5: Khi tổng thực nhận lệch tổng dự kiến >5% (luật R-5 `inbound-receiving.md:116`), màn hiện mục "Ghi lệch số lượng": giải thích (bắt buộc) + ≥1 ảnh `QUANTITY_VARIANCE` → `POST quantity-variances`. Lỗi `validation_failed` từ backend hiện nguyên thông điệp.
- FR-6: lỗi đúng chuẩn.
- AC-6: 403 → "Bạn cần quyền cập nhật phiếu nhập"; 409 `state_conflict` (NCC hết điều kiện, phiếu đã hoàn tất) → hiện thông điệp + nút tải lại; 503 → nút thử lại; không nuốt lỗi.

## Technical definition
- [frontend.md](../../../../platform-docs/standards/frontend.md), [ui-ux.md](../../../../platform-docs/standards/ui-ux.md), [file-upload.md](../../../../platform-docs/standards/file-upload.md) (luật UP-xx: presign → upload thẳng MinIO → finalize; file không đi qua BFF).
- Quyền: `inventory:goods_receipt:update` (receive, variance, evidence), `inventory:supplier:read` (đọc phiếu). Kiểm bằng `useAccess().can` như `use-goods-receipt.ts:18`.
- Reuse, cấm viết lại: `forwardInventory` (`lib/api/inventory-bff.ts:9`); `inventoryRequest`/`inventoryMutation` (`lib/api/suppliers`); SHA-256 + upload form (`lib/api/agreement-documents.ts:23-30`); `getSupplierHistory` (`lib/api/supplier-history`); `getContractMaterials` để lấy tên; UI `Field`, `TextInput`, `Button`, `Table`, `ErrorState`, `Skeleton`, `ReceiptDateInput` (`features/inventory/receipt-date-input.tsx`). Ô chọn file theo mẫu `features/inventory/supplier-photo-field.tsx`.
- Giới hạn file: ảnh và PDF đều ≤5 MB (`MaxReceiptEvidenceBytes = 5 * 1024 * 1024`, `inventory/internal/domain/receipt_evidence.go:16`); màn này không nhận PDF (xem AC-3). Trong một lần nhận, 2 file trùng SHA-256 bị từ chối (`receipt_evidence.go:76-79`).

## UX
- Một màn, các dòng phiếu xếp dạng thẻ (mobile được), mỗi thẻ: tên + dự kiến | 4 ô nhập | 2 ô ảnh | nút nhận. Đầu màn: NCC, ngày dự kiến, trạng thái. Cuối màn: tổng dự kiến/thực nhận + mục lệch (chỉ khi cần).
- Chữ hiển thị tiếng Việt, ngày `dd/mm/yyyy`, số dùng dấu phẩy thập phân như `supplier-receipts-view.tsx:19`.

## Design
- **Đọc phiếu**: chưa có `GET /inventory/goods-receipts/{id}` → hook gọi `getSupplierHistory(supplier, { cursor })` lần lượt tối đa 10 trang, dừng khi thấy `id`; không thấy → `EmptyState` "Không tìm thấy phiếu trong chi nhánh đang làm việc". Comment `ponytail:` ghi trần + cách nâng cấp (đổi sang GET detail khi inventory làm RD-3b).
- **BFF** (mỗi file 1 hàm `POST` gọi `forwardInventory`, như `app/api/inventory/suppliers/[id]/photo/presign/route.ts`):
  - `app/api/inventory/goods-receipts/[id]/receive/route.ts` → `/inventory/goods-receipts/{id}/receive`
  - `app/api/inventory/goods-receipts/[id]/quantity-variances/route.ts`
  - `app/api/inventory/goods-receipts/[id]/evidence-uploads/route.ts`
  - `app/api/inventory/goods-receipts/[id]/evidence-uploads/[uploadId]/finalize/route.ts`
- **Client** `lib/api/goods-receipt-receive.ts`: `presignReceiptEvidence(receipt, { goods_receipt_line_id, receive_attempt_ref, purpose, content_type, size_bytes, sha256 }, key)`, `finalizeReceiptEvidence(receipt, upload, key)` → `media_ref`, `receiveReceiptLine(receipt, body, key)`, `recordQuantityVariance(receipt, body, key)`. Schema zod theo DTO `inventory/internal/transport/http/dto/receipt_evidence.go:5-25`; body receive theo `service.ReceiveGoodsRequest` (`inventory/.aidlc/specs/inbound-receiving.md:47`) — codex đọc tag JSON thật trong `inventory/internal/service` trước khi viết; lượng gửi là JSON number (wire `json.RawMessage`, `goods_receipts.go:24-27`).
- **Màn**: `app/(console)/inventory/goods-receipts/[id]/receive/page.tsx` → `features/inventory/goods-receipt-receive.tsx` (view) + `use-goods-receipt-receive.ts` (state, mỗi dòng: fields, attempt ref, 2 danh sách media_ref, trạng thái) + `receipt-evidence-field.tsx` (một ô chọn file, nhận `purpose`, `accept`).
- **Liên kết**: `supplier-receipts-view.tsx` thêm nút "Nhận hàng" cho DRAFT/IN_PROGRESS; `goods-receipt-form.tsx` thêm "Nhận hàng ngay" sau khi tạo (cần `receipt.id` + `supplier` từ `createGoodsReceipt`, `use-goods-receipt.ts:91`).

## Files planned
- app/api/inventory/goods-receipts/[id]/receive/route.ts
- app/api/inventory/goods-receipts/[id]/quantity-variances/route.ts
- app/api/inventory/goods-receipts/[id]/evidence-uploads/route.ts
- app/api/inventory/goods-receipts/[id]/evidence-uploads/[uploadId]/finalize/route.ts
- lib/api/goods-receipt-receive.ts
- lib/api/goods-receipt-receive.test.ts
- app/(console)/inventory/goods-receipts/[id]/receive/page.tsx
- features/inventory/goods-receipt-receive.tsx
- features/inventory/use-goods-receipt-receive.ts
- features/inventory/receipt-evidence-field.tsx
- features/inventory/supplier-receipts-view.tsx
- features/inventory/goods-receipt-form.tsx
- features/inventory/use-goods-receipt.ts
- lib/fetcher.ts
- e2e/goods-receipt-receive.spec.ts

## Tests planned
- TC-1 | AC-3, AC-4 | unit | `npx vitest run lib/api/goods-receipt-receive.test.ts` (đúng path BFF, body, Idempotency-Key giữ nguyên khi gửi lại, schema từ chối response sai)
- TC-2 | toàn bộ | type+lint+build | `npx tsc --noEmit && npm run lint && npx next build --webpack`
- TC-3 | AC-1..AC-5 | e2e DEV, chromium headless workers=1 | `npx playwright test e2e/goods-receipt-receive.spec.ts`: tạo phiếu 1 dòng → nhận với 2 ảnh PNG khác nhau (hàng + chứng từ) → dòng "Đã nhận"; bấm lại không tạo lô thứ hai (kiểm `GET /inventory/inventory-lots`)
- Không viết unit test cho component (luật 11/10 "không test thừa").

## Slices
- [ ] S1: 4 route BFF nhận hàng/lệch/ảnh (files: app/api/inventory/goods-receipts/[id]/receive/route.ts, app/api/inventory/goods-receipts/[id]/quantity-variances/route.ts, app/api/inventory/goods-receipts/[id]/evidence-uploads/route.ts, app/api/inventory/goods-receipts/[id]/evidence-uploads/[uploadId]/finalize/route.ts; test: npx tsc --noEmit)
- [ ] S2: client nhận hàng + ảnh, dùng lại SHA-256/upload (files: lib/api/goods-receipt-receive.ts, lib/api/goods-receipt-receive.test.ts; test: npx vitest run lib/api/goods-receipt-receive.test.ts)
- [ ] S3: màn nhận hàng từng dòng kèm 2 ô ảnh (files: app/(console)/inventory/goods-receipts/[id]/receive/page.tsx, features/inventory/goods-receipt-receive.tsx, features/inventory/use-goods-receipt-receive.ts, features/inventory/receipt-evidence-field.tsx; test: npx tsc --noEmit && npm run lint)
- [ ] S4: mục lệch số lượng >5% (files: features/inventory/goods-receipt-receive.tsx, features/inventory/use-goods-receipt-receive.ts; test: npx tsc --noEmit && npm run lint)
- [ ] S5: nút "Nhận hàng" ở lịch sử NCC và sau khi tạo phiếu (files: features/inventory/supplier-receipts-view.tsx, features/inventory/goods-receipt-form.tsx, features/inventory/use-goods-receipt.ts; test: npx vitest run features/inventory)
- [ ] S5b: chứng từ chỉ nhận ảnh (spec inbound-trace-storage.md:122); đăng ký route nhận hàng vào CONSOLE_ROUTES (`lib/fetcher.ts:2`, proxy.test/fetcher.test đang đỏ); bỏ `rounded-2xl` theo ui-rules-gate; Link dùng route có kiểu thay chuỗi (files: features/inventory/goods-receipt-receive.tsx, lib/fetcher.ts, features/inventory/goods-receipt-form.tsx, features/inventory/supplier-receipts-view.tsx; test: npm test && npm run typecheck && npm run lint)
- [ ] S6: e2e DEV tạo → nhận → kiểm lô (files: e2e/goods-receipt-receive.spec.ts; test: npx playwright test e2e/goods-receipt-receive.spec.ts)

## Risks / rollback
- NCC trên DEV thiếu HĐ + CNATTP VERIFIED còn hạn → receive 409 (đúng luật OD-3). S6 phải chọn NCC đủ điều kiện; thiếu thì báo, không sửa DB.
- Đọc phiếu bằng lịch sử NCC: phiếu cũ hơn 10 trang không mở được → chấp nhận tới khi có GET detail.
- Rollback: revert nhánh `portal-inbound-001`; không có migration.

## Open decisions
- [CLOSED] `createGoodsReceipt` trả `id` (`lib/api/goods-receipts.ts:16` `receiptSchema.id`); `supplier` có sẵn trong state hook (`use-goods-receipt.ts:22`).
- [CLOSED] Chứng từ giao hàng dùng chung nhiều dòng: presign gắn `goods_receipt_line_id` + `receive_attempt_ref` (`inventory/internal/transport/http/dto/receipt_evidence.go:6-7`) nên mỗi dòng tải lên một bản riêng; trùng SHA-256 chỉ bị chặn trong cùng một lần nhận (`receipt_evidence.go:73-79`), DB không có ràng buộc unique theo hash (`inventory/migrations/20261024000003_receipt_evidence.sql:20-22,42-45` chỉ là index thường). UI có "Dùng chứng từ của dòng trước": giữ `File` trong RAM và tự tải lại cho dòng mới.
