# FOOD_DEV set and packages, FOODDEV-PACK-001

## Usecase
FOOD_DEV tạo product DRAFT theo tên, target APPROVED rồi set nhiều nguyên liệu qua picker server, không nhập UUID. Một kit N suất, tổng suất nguyên = kit × servings_per_set; lưu/reload và sửa với revision server. PREPARATION không hiện thao tác review/publish/resume. WAREHOUSE có trang nhu cầu chỉ đọc, mọi quyền menu/API hỏi org, không so tên role.
Picker q/category gồm con/month/include_unknown/price_min/price_max/price_uom/cursor/limit dùng sales catalog. Hiển thị chưa có dữ liệu mùa khi scope toàn NULL, NULL khác quanh năm. Giá bán seed tham khảo theo KG/L/EA, thiếu quy cách không chọn được. Bảng kho có tổng đầy đủ và số dòng ẩn sau filter; không tạo PO/receipt/lot, không ghi to_buy khi chưa đọc tồn. 403/409/503 hiển thị rõ, không biến lỗi thành danh sách rỗng. E2E hai QA thật qua BFF/Kong, tên ngẫu nhiên và giữ dữ liệu/history; finally chỉ restore grants.

PACK giữ entry /production/food-plans, thêm tab Set, Gói+công thức, Thực đơn và bảng Nhu cầu. Menu dùng food_plan:read, mỗi tab/action dùng permission endpoint từ org; WAREHOUSE đọc/evaluate, không write, backend403 không đổi DB.
1. Chọn family/gói/raw bằng tên qua entity-picker server, không nhập UUID. Set editor6 ô, default/đổi/bỏ theo cờ; tags counter3..8 unique, reserved bị từ chối. POST draft rồi PUT full replace; resume khi thiếu options. Hashtag tính sẵn read-only; mở chi tiết gọi production evaluate và hiển thị UNKNOWN riêng.
2. Search set chỉ tên không dấu/tags AND/category gồm con/month/pagination server. Không search diet/allergen. FE-14 loading/empty/error/retry ngay từ đầu ở từng tab và chi tiết, peer lỗi không thành [].
3. Gói PRODUCED_VARIANT/sellable=false, raw labels whitelist và công thức 1EA, yield/steps/time; không có recipe hiện rõ. Optimistic token do server cấp: expected_updated_at, expected_version, expected_revision; 409 giữ dữ liệu nhập và reload/retry.
4. Plan nhập % từng ô theo tên, tổng100% chính xác, null chỉ ô removable; serialize ratio decimal string scale<=6. planned_quantity tổng suất, kit×servings_per_set chỉ nhân một lần. Lưu/reload snapshot/version; quantity nhu cầu đúng3 số lẻ làm tròn lên sau cộng, giữ nguồn giá/mùa/revision.
5. BFF mới /api/food-packs/[...path] allowlist method+path, chỉ base sales/production cấu hình server. Giữ cookie→Bearer/query/body/status/tokens/decimal string, thêm DELETE; cấm host/internal path tuỳ ý. Evaluate là quyền đọc, không đòi write. Không Idempotency-Key cho PACK mới. Typed operations chỉ sinh bằng uigen, không sửa tay; các API SET-001 giữ BFF cũ.
6. Seed nội bộ FOOD_DEV duyệt lại, chưa duyệt raw giữ UNKNOWN. Không đưa implementation/UUID vào form. Nhãn không là chứng nhận. E1 hai tài khoản thật và oracle bún20/đậu15/rau5/bò10/nấm2KG.

## API
BFF giữ contract sales và production, session xác thực ở server, không tin scope header từ browser.
| method | path | request | responses |
|---|---|---|---|
| GET | /api/sales/skus | - | 200, 400, 401, 403, 422, 503 |
| GET | /api/production/food-plans/{id}/material-requirements | - | 200, 400, 401, 403, 404, 422, 503 |
| GET | /api/production/targets/{id}/material-requirements | - | 200, 400, 401, 403, 404, 422, 503 |

| POST | /api/food-packs/sales/packages | CreatePackageRequest | 201, 400, 401, 403, 404, 409, 422, 503 |
| GET | /api/food-packs/sales/packages | - | 200, 400, 401, 403, 422, 503 |
| GET | /api/food-packs/sales/packages/{id} | - | 200, 400, 401, 403, 404, 422, 503 |
| PUT | /api/food-packs/sales/packages/{id} | UpdatePackageRequest | 200, 400, 401, 403, 404, 409, 422, 503 |
| DELETE | /api/food-packs/sales/packages/{id} | - | 204, 400, 401, 403, 404, 409, 422, 503 |
| POST | /api/food-packs/sales/sets | CreateFoodSetRequest | 201, 400, 401, 403, 404, 409, 422, 503 |
| GET | /api/food-packs/sales/sets | - | 200, 400, 401, 403, 422, 503 |
| GET | /api/food-packs/sales/sets/{id} | - | 200, 400, 401, 403, 404, 422, 503 |
| PUT | /api/food-packs/sales/sets/{id} | ReplaceFoodSetRequest | 200, 400, 401, 403, 404, 409, 422, 503 |
| DELETE | /api/food-packs/sales/sets/{id} | - | 204, 400, 401, 403, 404, 409, 422, 503 |
| GET | /api/food-packs/sales/skus/{id}/labels | - | 200, 400, 401, 403, 404, 422, 503 |
| PATCH | /api/food-packs/sales/skus/{id}/labels | UpdateRawLabelsRequest | 200, 400, 401, 403, 404, 409, 422, 503 |
| POST | /api/food-packs/production/packages/{sku_id}/recipes | CreatePackageRecipeRequest | 201, 400, 401, 403, 404, 409, 422, 503 |
| GET | /api/food-packs/production/packages/{sku_id}/recipes | - | 200, 400, 401, 403, 404, 422, 503 |
| GET | /api/food-packs/production/packages/{sku_id}/recipes/{version} | - | 200, 400, 401, 403, 404, 422, 503 |
| PUT | /api/food-packs/production/packages/{sku_id}/recipes/{version} | UpdatePackageRecipeRequest | 200, 400, 401, 403, 404, 409, 422, 503 |
| DELETE | /api/food-packs/production/packages/{sku_id}/recipes/{version} | RetirePackageRecipeRequest | 204, 400, 401, 403, 404, 409, 422, 503 |
| POST | /api/food-packs/production/sets/{id}/evaluate | EvaluateFoodSetRequest | 200, 400, 401, 403, 404, 409, 422, 503 |

## DTO
Portal dùng schema OpenAPI và operations.generated.ts từ uigen, không khai báo Go DTO hoặc chép tay types. Request/response theo bảng API, giữ decimal strings và optimistic tokens qua BFF. Snapshot do server cấp, không tự dựng BOM refs.

## DB
Portal không sở hữu bảng/cột. Sales tái dùng products/sku/sku_component/catalog_categories; production boms/food_product_plans. Không local DB hoặc bảng set song song.

## Events
Không thêm event/topic. Evaluate/search/requirements chỉ đọc.

## Errors
| code | when |
|---|---|
| validation_failed | 400/422 hiển thị lỗi trường, tỉ lệ/slot/yield/tags không hợp lệ |
| data_scope_denied | 403 thiếu quyền/scope, không hiện editor write cho kho |
| resource_not_found | 404 dữ liệu không còn trong scope |
| state_conflict | 409 token/version/revision cũ, giữ form và yêu cầu reload |
| service_unavailable | 503 sales/org lỗi, error/retry không thành danh sách rỗng |
| dependency_unavailable | 503 production peer lỗi, không hiện nhãn/tổng thiếu |
