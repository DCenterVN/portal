# FC-3 Vai trò lấy từ catalog của org

Trạng thái: DONE (chờ org FC-2 merge để chạy thật)

## CONTEXT
org FC-2 (`org-fc2`): `GET /org/company/roles` trả `{items:[{code,name,description,sort_order,protected,branch_types}]}` sắp theo `sort_order, code`; chỉ ADMIN có `protected=true`. Portal đang cứng: `ROLE_INFO`, `current === "ADMIN"`, `!== "ADMIN"`, `lockedCodes=["ADMIN"]`, `roles.includes("ADMIN")`.

## REQUIRED
1. Màn đã tải catalog (vai trò, thêm nhân viên, phân công, nhân viên) lấy tên/mô tả/thứ tự từ catalog; khoá theo `protected`.
2. "Viewer là admin": ưu tiên khoá hành động nếu không đổi hành vi, không thì một hằng chung.
3. Mã vai trò lạ: hiện mã thô, không bỏ.
4. Trang viewer có thể thiếu `org:role:read` (tài khoản, đầu trang, console, audit, bảng nhân viên chi nhánh): không gọi catalog, dùng bản đồ tên tối thiểu `ROLE_INFO` trong `lib/permission-labels.ts`. Không thêm endpoint backend.
5. Chép `org-fc2/api/openapi.public.yaml` vào `lib/contracts/org.public.yaml`.

## CONSTRAINT
Không comment, file ≤400 dòng, không dependency mới, không commit.

## ACTION
Sửa `lib/api/platform-client.ts` (schema thêm description, sort_order, protected), `lib/role-catalog.ts` (`protected`, `job` từ description, `catalogRoleName`), `roles-view`, `holders-panel`, `add-staff-dialog`, `assignment-row`, `memberships-view`, `person-detail`.

## OUTPUT
Kết quả bên dưới.

## Kết quả
- Mục 1: roles-view lấy thứ tự, tên, mô tả từ catalog; cảnh báo bỏ quyền `org:` theo `protected`; add-staff lọc `!protected`; assignment-row lọc và khoá theo `protected`; chip ở memberships-view dùng tên catalog.
- Mục 2: GIỮ kiểm tra theo vai trò (`scope.roles.includes(ADMIN_ROLE)`) ở `memberships-view`, `person-detail` vì đổi sang `org:role:update` làm đổi hành vi (người có quyền sửa vai trò chưa chắc được gán vai trò protected). Dùng một hằng `ADMIN_ROLE` trong `lib/permission-labels.ts`.
- Mục 3: `catalogRoleName` và `roleName` trả mã thô khi không có tên; vai trò lạ trong ma trận vẫn hiện.
- Mục 4: các trang không đọc catalog vẫn dùng `roleName` với `ROLE_INFO` làm bản dự phòng.
- Mục 5: snapshot đã chép.

## Câu hỏi mở
- org nên trả tên vai trò trong `/permissions/me` hay `/auth/me`? Hiện trang tài khoản, console, audit, bảng nhân viên chi nhánh phải dùng bản đồ tên cứng.
