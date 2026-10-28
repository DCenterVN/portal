# FOODDEV-V2-001 fields

## Usecase
[spec-fooddev-v2 §4–6](/home/dawn/work/ticket/plans/261028-fooddev/spec-fooddev-v2.md#4-luật-bản-rút-gọn-đánh-số-theo-v2). AC-6: MaterialPicker({onSelect}) giữ interface, EntityPicker tìm không dấu tên/mã, nhóm cha/con từ inventory. Tạo tại chỗ tự chọn kết quả, 409 cho dùng existing. AC-7: checklist đợt1, không hiện UUID. AC-5: ≥1 gia vị COT/NUOC_CHAM/GIA_VI_THEM removable=false, thiếu báo "Món cần ít nhất một gói gia vị không được bỏ". Không bắt buộc tinh bột/đạm, cho bỏ.

| Màn | Ô | Loại / nguồn |
|---|---|---|
| Bộ chọn | Nhóm cấp1/cấp2 | LIST cây inventory, con lọc theo cha |
| Bộ chọn | Nguyên liệu | LIST EntityPicker sales, group_codes là mọi lá của cha |
| Tạo nguyên liệu | Tên | INPUT1..150 |
| Tạo nguyên liệu | Mã | AUTO server NL-xxxxxx |
| Tạo nguyên liệu | Nhóm cha/con, đơn vị | LIST bắt buộc, KG/L/EA |
| Tạo nguyên liệu | Dị ứng | LIST Chưa biết mặc định hoặc Đã khai báo +14 mã |
| Tạo nguyên liệu | Kiêng/chế độ ăn/tháng | LIST tập hiện có, tháng1..12 |
| Gói | Mã gói | AUTO từ tên +4 ký tự, chỉ đọc |
| Gói | Chế độ nhiệt | LIST CHILLED mặc định/FROZEN/AMBIENT |
| Set | Khẩu phần | LIST1/2/3/4/6 người |
| Set | Hashtag | INPUT có gợi ý system_hashtags và tag đã tải |
| Thực đơn | Mã set | LIST theo sản phẩm, sửa chỉ đọc |
| Thực đơn | Khẩu phần, số suất/kit | AUTO từ set |
| Thực đơn | Set món | LIST EntityPicker, bỏ ô tìm +nút |
| Chỉ tiêu | Slug | AUTO từ tên không dấu gạch nối |
| Chỉ tiêu | Đơn vị | AUTO suất, gửi EA |

## API
| method | path | request | responses |
|---|---|---|---|
| POST | /api/sales/skus | CreateRawMaterialRequest | 201, 400, 401, 403, 409, 422, 503 |

Chuyển Idempotency-Key, cùng body replay, khác body409. GET sales thêm group_codes/ungrouped. Không có ô giá tạo nguyên liệu.

## DTO
Body {name,uom_code,material_group_code,allergens:null|[],avoidance_flags:[],diet_flags:null|[],season_months:null|[]}; response như GET có material_group_code, conflict existing {id,code,name}.

## DB
Không DB portal.

## Events
Không event mới.

## Errors
| code | when |
|---|---|
| validation_failed | 422 sai field hoặc thiếu gia vị không bỏ |
| duplicate_resource | 409 tên trùng, đề nghị dùng existing |
| data_scope_denied | 403 thiếu quyền |
