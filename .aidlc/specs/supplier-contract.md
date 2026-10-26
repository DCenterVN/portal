# Portal NCC → hợp đồng → tạo phiếu (US-SUPPLIER-001)

Trạng thái: PROMOTED S2 của SUPPLIER-CONTRACT-001 theo plan được duyệt. Đây là contract đích; chưa xác nhận runtime/E2E. Giữ các operation PRICE và supplier hiện hữu ngoài delta đã duyệt.

Đích: portal/.aidlc/specs/supplier-contract.md. Spec portal dùng Usecase/API, không Go DTO giả.

## Usecase

Chốt UI ngày24/10: bảng portal dùng shadcn/ui Table/Data Table và custom theo token/shell hiện hữu. Bộ chọn nhóm nguyên liệu là multi-select category có sẵn, không text input hoặc tạo category trong form NCC; lưu mã/ID, hiển thị tên. Cột Bảng giá mở trực tiếp tab hợp đồng của đúng NCC; lỗi thiếu giá ở phiếu nhập có nút quay lại bảng giá của NCC đang chọn. Bước Nháp/Áp dụng trên thanh luồng có thể bấm để điều hướng, không tự áp dụng. Giữ ngày/nguyên liệu/số lượng đang nhập khi quay lại từ bảng giá.

Giữ ConsoleShell. List/detail NCC (mã, tên, trạng thái), create/edit/suspend; tab hợp đồng trong detail có list/version/line prices/documents và nút theo trạng thái gọi POST versions hiện có: nháp có Lưu nháp + Áp dụng bảng giá; đã áp dụng chỉ Ngừng dùng (nhập lý do, xác nhận) + Lập hợp đồng mới; không nút sửa trên hợp đồng đã áp dụng/đã ngừng; một file chính, không trang documents/approval riêng. Các tên/mã tra qua EntityPicker, serializeValue=false; UUID chỉ opaque route/API, không label/input DOM. Page `/inventory/goods-receipts/new` có supplier/material/UOM/date, giá hợp đồng read-only và lỗi thiếu coverage mỗi dòng. Không nhập unit_cost tùy ý. Ngày/line đổi thì invalidate preview; dependency lỗi fail closed. POST backend luôn quyết cuối cùng.

Role × CRUDIE từ useAccess().can và org; route roots employee plane, sửa broad /inventory match thành /inventory/shelves để không nhầm quyền. Deep link/refresh/forged API/revoke đều kiểm. Không check role name hoặc mặc định ADMIN làm người duyệt. Không role fallback khi permissions loading/error.

BFF dùng fixed supplier/agreements/contracts paths, forward cookie principal + Idempotency-Key + If-Match. decodePlatform đúng envelope; no-store. Chỉ metadata đi BFF; presigned POST bytes trực tiếp Kong. FileRAM chọn/hủy không presign; submit→POST→finalize; retry giữ state, không upload lại đã finalized. GET download authorized/no-store, không ghi URL/token vào logs.

State rỗng/loading/error; label tiếng Việt; keyboard focus, inline errors và reduced motion. Không đổi shell/layout/framework. Material lookup dùng sales getMaterials, không dùng reference_price. Mocks chỉ portal/mocks. E2E live không mock; tên dữ liệu ngắn như Bột gạo QA7K, không UUID. Receive/QC/ảnh receipt là follow-up, không màn giả.

## API

| method | path | request | responses |
|---|---|---|---|
| GET | /inventory/suppliers | - | 200, 400, 401, 403, 422, 500, 503 |
| GET | /inventory/suppliers/{supplier_id} | - | 200, 400, 401, 403, 404, 500, 503 |
| POST | /inventory/suppliers/{supplier_id}/agreements | SupplierAgreementRequest | 201, 400, 401, 403, 404, 409, 422, 500, 503 |
| GET | /inventory/suppliers/{supplier_id}/agreements | - | 200, 401, 403, 404, 422, 500, 503 |
| POST | /inventory/goods-receipts | CreateGoodsReceiptRequest | 201, 400, 401, 403, 404, 409, 422, 500, 503 |

Lưu nháp/Áp dụng/Ngừng dùng = POST /inventory/suppliers/{supplier_id}/agreements/{agreement_id}/versions với SupplierAgreementRequest status DRAFT/ACTIVE/SUSPENDED (+status_reason), If-Match và Idempotency-Key. Bảng là upstream contracts consumed, không biến path upstream thành page URL; portal BFF prefix `/api/inventory`. Các operations PATCH/suspend/versions/documents giữ contract của 3 spec inventory nháp kèm theo và snapshot inventory.public.yaml. Generated registry dùng uigen operations, không sửa tay.

## Errors

| code | when |
|---|---|
| STATE_CONFLICT | reload trạng thái, giữ form, báo hợp đồng đã áp dụng không sửa được hoặc trùng kỳ, không tự đổi giá |
| VALIDATION_FAILED | lỗi tại field/dòng hợp đồng/ngày |
| FORBIDDEN | quyền bị thu hồi, không tiếp tục mutation |
| UNAVAILABLE | báo chưa tải được dữ liệu, cho retry, không fallback giá |
| MEDIA_VALIDATION_FAILED | báo lỗi file/MIME/size |
| MEDIA_CHECKSUM_MISMATCH | yêu cầu chọn/upload lại file đúng |

Giữ alias wire operations PRICE, normalize ở API boundary như client hiện hữu, không đổi error protocol toàn app.
