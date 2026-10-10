# api-inventory — PORTAL-UI-REBUILD-001 (đo 2026-10-10)

Mục đích: Dawn chốt (1) chỉ nối màn có API đủ chức năng, (2) không bắt người dùng gõ UUID — mọi ô ID đổi thành picker.
Chỉ đọc code; không chạy build/test. Mọi dòng có file:line; chỗ không chắc ghi `[ASSUMED]`.

Ký hiệu đường dẫn (gốc `ticket/`):
- `K` = `dev-infra/kong/kong.yml` (Kong dev, số = dòng `- name:` của route). `I` = `gateway-infra/k8s/base/gateway-public-ingress.yaml`; `IS` = `gateway-infra/k8s/base/gateway-auth-sensitive-ingress.yaml` (số = dòng `- path:`).
- `sales/` = `sales/internal/transport/http/`; `auth/` = `auth/internal/transport/http/`; `org/` = `org/internal/transport/http/`; `prod/` = `production/internal/transport/http/`; `inv/` = `inventory/internal/transport/http/`.
- BFF = `portal/app/api/...`. Lưu ý: BFF gọi thẳng service, không qua Kong (`portal/lib/api/sales-bff.ts:4-6`, `auth-journey-bff.ts:6-7`), nên cột Kong chỉ ảnh hưởng e2e/`kong-check.sh` (C4) và client ngoài portal.

## Phát hiện chặn (đọc trước)

- R1 `[ASSUMED]` Khách không gọi được `sales`: mọi handler sales đòi `p.BranchID` khác rỗng (`sales/sales.go:70`), mà ADR-024 chốt "Khách = user đã kích hoạt ... không tạo membership CUSTOMER" (`platform-docs/docs/adr/ADR-024-kien-truc-mvp.md:28`) và token khách chỉ có org/branch sau `POST /auth/org-context` (`auth/context_profile.go:191`, `auth/internal/application/session/context.go:86`). Test live dùng token có `branch_id` (`sales/integration/sales_http_live_test.go:484`). Cần 1 probe: đăng nhập khách rồi `GET /sales/products`; nếu 403 `branch context required` thì toàn bộ màn store là THIẾU.
- R2 `GET /sales/catalog` và `/sales/catalog/{id}` chỉ có trong spec (`sales/.aidlc/specs/order-lifecycle.md:66-67`), không có trong `sales/internal/transport/http/router.go:19-28`. Plan ghi "API store có sẵn: GET /sales/catalog" là sai với code.
- R3 `POST /sales/orders` chỉ nhận `cart_ref` + `branch_ref` (`sales/internal/service/service.go:218-221`); spec có người nhận/địa chỉ/thanh toán (`order-lifecycle.md:90`). Đơn chỉ có `CREATED|CANCELLED`, không có `order_code`, `items`, khách (`sales/internal/store/models.go:46-58`). Màn checkout, bảng đơn, record đơn của preview không có dữ liệu để hiển thị.
- R4 Route Kong `/orgs/` tồn tại (`K:351`) nhưng org không có handler nào cho `/orgs/*`: `org/internal/bootstrap/http.go:71-90` + `org/platform.go:129-150` không đăng ký. Spec `org-admin.md:30-34`, `employee-onboard.md:38` chỉ là hợp đồng.

## Bảng A — API cho các màn UI

Cột: màn | method path | service | handler | Kong | BFF portal | test BE | verdict.

### A1. Store / khách

| # | màn | method path | service | handler | Kong | BFF portal | test BE | verdict |
|---|---|---|---|---|---|---|---|---|
| A1 | Catalog `(store)/products` | GET /sales/products?query&page_size&cursor | sales | `sales/sales.go:165` (reg `router.go:20`) | `K:534`, `I:348` | `app/api/sales/products/route.ts:8` | `integration/sales_http_live_test.go:96,108` | THIẾU API catalog cho khách: `/sales/catalog` chưa có (R2); list không lọc `status`/`sellable`/`sku_kind` (`sales/internal/store/sku.sql.go:41`) nên lộ DRAFT + nguyên liệu; không có ảnh/danh mục (`models.go:9-27`); khách bị 403 (R1) |
| A2 | Chi tiết SP `(store)/products/[id]` | GET /sales/products/{product_id} | sales | `sales/sales.go:179` | `K:542`, `I:348` | `app/api/sales/products/[id]/route.ts:4` | `sales_http_live_test.go:154` (chỉ id sai) | THIẾU cùng A1; không có danh sách biến thể theo sản phẩm (chỉ có `parent_product_ref`, `models.go:21`) |
| A3 | Giỏ: thêm món + xem giỏ `(store)/cart` | POST /sales/carts/{cart_id}/items ; GET /sales/carts/{cart_id} | sales | `sales/sales.go:236`, `:264` (giỏ tự tạo `service.go:190`) | `K:481`, `I:313` | `app/api/sales/carts/[cart_id]/items/route.ts`, `.../[cart_id]/route.ts` | `sales_http_live_test.go:179,198,224` | THIẾU khách không có branch context (R1); dòng giỏ không trả tên SP (chỉ `sku_ref`,`price_snapshot_vnd`, `models.go:40-45`) |
| A4 | Giỏ: sửa SL / xoá món | PATCH/DELETE /sales/carts/{id}/items/{item_id} | sales | KHÔNG CÓ (`router.go:23-24` chỉ có 2 route; spec `order-lifecycle.md:68-69`) | THIẾU | THIẾU | không | CHƯA CÓ API — để Dawn |
| A5 | Đặt hàng / checkout `(store)/cart` | POST /sales/orders | sales | `sales/sales.go:283` | `K:489`, `I:320` | `app/api/sales/orders/route.ts:4` | `sales_http_live_test.go:215,271` | THIẾU người nhận, địa chỉ (tỉnh/xã), phương thức thanh toán trong request/đơn (R3) + R1 |
| A6 | Danh sách đơn của khách `(store)/orders` | GET /sales/orders?page_size | sales | `sales/sales.go:306` | `K:489`, `I:320` | `app/api/sales/orders/route.ts:8` | không có test chạm `ListOrders` (grep `sales_http_live_test.go`, `*_test.go` = 0) | THIẾU test BE; trả `items` không có cursor/lọc trạng thái; đơn thiếu mã/ngày giao (R3); R1 |
| A7 | Chi tiết đơn khách + huỷ `(store)/orders/[id]` | GET /sales/orders/{id} ; POST /sales/orders/{id}/cancel | sales | `sales/sales.go:320`, `:338` | `K:497`, `I:320` | `app/api/sales/orders/[id]/route.ts`, `.../[id]/cancel/route.ts` | `sales_http_live_test.go:226-254` | THIẾU dòng hàng/địa chỉ/thanh toán trong đơn (R3) + R1 |
| A8 | Đăng ký khách `(auth)/register` | POST /auth/register | auth | `auth/register.go:28` (reg `auth/internal/bootstrap/http.go:233`) | `K:148`, `IS:39` | `app/api/auth/register/route.ts` | `auth/register_test.go:10` | ĐỦ — giao Anti nối |
| A9 | Kích hoạt + gửi lại `(auth)/activate` | POST /auth/activate ; POST /auth/activate/resend | auth | `auth/activate.go:28`, `:49` | `K:29`, `K:36`, `I:26` | `app/api/auth/activate/route.ts`, `.../activate/resend/route.ts` | `auth/http_handlers_test.go:1045` | ĐỦ — giao Anti nối |
| A10 | Đăng nhập khách (popup + `(auth)/login`) | POST /auth/web/login | auth | `auth/web_auth.go:63` | `K:169`, `IS:46` | `app/api/auth/login/route.ts` | `auth/http_handlers_test.go`, `auth/web_auth_test.go` | ĐỦ — giao Anti nối |
| A11 | Làm mới + đăng xuất | POST /auth/web/refresh ; POST /auth/web/logout | auth | `auth/web_auth.go:131`, `:183` | `K:183`, `K:176`, `I:110`, `I:103` | `app/api/auth/refresh/route.ts`, `.../logout/route.ts` | `auth/web_auth_test.go:79` | ĐỦ — giao Anti nối |
| A12 | Me khách (xem, avatar menu header) `(store)/me` | GET /auth/me | auth | `auth/context_profile.go:58` | `K:64`, `I:54` | `app/api/auth/me/route.ts:5` | `auth/context_profile_test.go` | ĐỦ — giao Anti nối |
| A13 | Me khách (sửa hồ sơ) | PATCH /auth/profile | auth | `auth/context_profile.go:97` | `K:120`, `I:89` | THIẾU (`app/api/auth/me/route.ts` chỉ export GET) | `auth/context_profile_test.go:99` | ĐỦ — giao Anti nối (cần BFF) |
| A14 | Quên / đặt lại mật khẩu | POST /auth/password/forgot ; /reset | auth | `auth/password_recovery.go:33`, `:65` | `K:106`, `K:113`, `IS:25`, `IS:32` | `app/api/auth/forgot/route.ts`, `.../reset/route.ts` | `auth/http_handlers_test.go` | ĐỦ — giao Anti nối |
| A15 | Yêu thích (tim trên card, "Yêu thích (N)") | wishlist | sales | KHÔNG CÓ (plan: grep `wishlist` trong `sales/` = 0; task `SALES-WISHLIST-001` chưa mở) | THIẾU | THIẾU | không | CHƯA CÓ API — để Dawn |
| A16 | Truy xuất nguồn gốc `(store)/traceability/[code]` | GET /public/traceability/{trace_code} | production | `prod/traceability.go:23` (reg `prod/router.go:17`) | `K:471`, `I:306` | `app/api/public/traceability/[trace_code]/route.ts` | `production/integration/production_workflow_live_test.go` | ĐỦ — giao Anti nối |
| A17 | Địa chỉ checkout (tỉnh/xã) | GET /locations/vn/provinces, /provinces/{code}/communes, /search | integration | `integration/internal/bootstrap/http.go:25,39,53` | `K:200,207,193,214`, `I:166,159,173` | THIẾU (không có `app/api/locations`) | `integration/internal/bootstrap/http_test.go:21` | ĐỦ — giao Anti nối (cần BFF); dùng được sau khi A5 nhận địa chỉ |

### A2. CRM (nhân viên)

| # | màn | method path | service | handler | Kong | BFF portal | test BE | verdict |
|---|---|---|---|---|---|---|---|---|
| A18 | Dashboard số liệu `(console)/console` | không có API tổng hợp (`portal/app/api/console/route.ts:15-19` tự ghi "chưa có API service-health/audit feed") | - | KHÔNG CÓ | THIẾU | THIẾU | không | CHƯA CÓ API — để Dawn |
| A19 | Ngữ cảnh + quyền (khung console, `LiveConsole`) | GET /auth/me ; GET /org/access-contexts/me ; GET /org/permissions/me | auth, org | `auth/context_profile.go:58`; `org/access_contexts.go:34`; `org/permissions_me.go:31` | `K:64`, `K:295`, `K:337` | `app/api/auth/context/route.ts`, `app/api/console/route.ts`, `app/api/org/[...path]/route.ts` | `org/access_contexts_test.go:16` ; `auth/context_profile_test.go` | ĐỦ — giao Anti nối |
| A20 | Đăng nhập nhân viên `(employee-auth)/staff/login` | POST /auth/web/login (BFF nhận `identifier`) | auth | `auth/web_auth.go:63` | `K:169`, `IS:46` | `app/api/auth/staff/login/route.ts` | `auth/http_handlers_test.go` | ĐỦ — giao Anti nối |
| A21 | Chọn công ty / chi nhánh `staff/switch-org`, `switch-branch` | GET /org/access-contexts/me ; POST /auth/org-context | org, auth | `org/access_contexts.go:34`; `auth/context_profile.go:191` | `K:295`, `K:92` | `app/api/auth/staff/switch-org/route.ts`, `.../switch-branch/route.ts` | `auth/context_profile_test.go:268` | ĐỦ — giao Anti nối |
| A22 | Nhận lời mời nhân viên `staff/invite/accept` | POST /auth/invite/accept | auth | `auth/invite.go:57` (reg `auth/internal/bootstrap/http.go:237`) | THIẾU: không có route ở `K` lẫn `I`/`IS` (`grep invite` = 0) | `app/api/auth/staff/invite/accept/route.ts` | `auth/invite_test.go` | THIẾU Kong route `/auth/invite/accept` |
| A23 | Bảng đơn (Table) `sales/orders` | GET /sales/orders?page_size | sales | `sales/sales.go:306` | `K:489`, `I:320` | `app/api/sales/orders/route.ts:8` | không có test chạm `ListOrders` | THIẾU test BE + lọc trạng thái/ngày/khách, cursor, `order_code`, tên khách (R3) |
| A24 | Record đơn `sales/orders/[id]` | GET /sales/orders/{id} | sales | `sales/sales.go:320` | `K:497` | `app/api/sales/orders/[id]/route.ts` | `sales_http_live_test.go:226-232` | THIẾU dòng hàng, người nhận, địa chỉ, thanh toán, lịch sử trạng thái (R3; bảng `order_state_history` có nhưng không có route đọc) |
| A25 | Đơn: huỷ | POST /sales/orders/{id}/cancel | sales | `sales/sales.go:338` | `K:497` | `app/api/sales/orders/[id]/cancel/route.ts` | `sales_http_live_test.go:237-254` | ĐỦ — giao Anti nối |
| A26 | Đơn: xác nhận / đóng gói / giao / đã giao / giao thất bại / xác nhận thanh toán | POST /sales/orders/{id}/confirm, pack, ship, deliver, delivery-failure, payments/confirm | sales | KHÔNG CÓ (chỉ spec `order-lifecycle.md:70-76`; `router.go:25-28`) | THIẾU (K:497 cho phép POST nhưng không có handler) | THIẾU | không | CHƯA CÓ API — để Dawn |
| A27 | Danh sách SP CRM `products` | GET /sales/products | sales | `sales/sales.go:165` | `K:534` | `app/api/sales/products/route.ts:8` | `sales_http_live_test.go:96,108` | ĐỦ — giao Anti nối (nhân viên có branch context) |
| A28 | Tạo SP (Form) `sales/products/new` | POST /sales/products (Idempotency-Key) | sales | `sales/sales.go:146` | `K:534` | `app/api/sales/products/route.ts:9` | `sales_http_live_test.go:123,285` ; `sales_authz_test.go:62` | ĐỦ — giao Anti nối |
| A29 | Kích hoạt SP | POST /sales/products/{id}/activate | sales | `sales/sales.go:217` | `K:542` | `app/api/sales/products/[id]/activate/route.ts` | `sales_http_live_test.go:164` | ĐỦ — giao Anti nối |
| A30 | Sửa SP | PATCH/PUT /sales/products/{id} | sales | KHÔNG CÓ (`router.go:19-22`) ; `K:542` chỉ GET,POST | THIẾU | THIẾU | không | CHƯA CÓ API — để Dawn |

### A3. Màn console hiện có `portal/app/(console)/`

| # | màn | method path | service | handler | Kong | BFF portal | test BE | verdict |
|---|---|---|---|---|---|---|---|---|
| A31 | `/branches` | spec: POST /orgs/{org_id}/branches (`org-admin.md:30`); nội bộ: GET /internal/operator/branches (service-auth) | org | không có handler công khai (R4); nội bộ `org/internal/bootstrap/http.go:89` | `K:351` (route treo, không handler) | THIẾU; view nhận `initialBranches={[]}` (`app/(console)/branches/page.tsx:9`) | không | CHƯA CÓ API — để Dawn |
| A32 | `/memberships` | spec: GET/POST /orgs/{org}/memberships, PATCH, PUT roles (`org-admin.md:31-34`); POST /orgs/{org}/employees (`employee-onboard.md:38`) | org | KHÔNG CÓ (R4) | `K:351` (treo) | THIẾU; `initialEmployees={[]}` (`memberships/page.tsx:9`) | không | CHƯA CÓ API — để Dawn |
| A33 | `/roles` (ma trận, chỉ xem) | GET /org/company/role-matrix | org | `org/platform.go:144` → `roleMatrix` `:212` | `K:316`, `I:201` | `app/api/org/[...path]/route.ts` | `org/platform_e2e_test.go` | ĐỦ — giao Anti nối (chỉ đọc; sửa quyền là việc của nền tảng, A41) |
| A34 | `/inventory/shelves` | GET, POST /inventory/shelf-placements | inventory | `inv/reservations.go:50`, `:27` (reg `inv/router.go` dòng `shelf-placements`) | `K:261`, `I:138` | `app/api/inventory/shelf-placements/route.ts:4,8` | không (grep `shelf-placements` trong `inventory/**/*_test.go` = 0) | THIẾU test BE chạm 2 handler này; thiếu API list lô thành phẩm cho picker (B1) |
| A35 | `/production/targets` | GET, POST /production/targets ; POST .../{id}/approval | production | `prod/targets.go:89,24,55` | `K:455`, `K:463`, `I:299` | `app/api/production/targets/route.ts`, `.../[id]/approval/route.ts` | `production/integration/production_workflow_live_test.go` | ĐỦ — giao Anti nối |
| A36 | `/production/food-plans` | GET/POST /production/targets/{id}/food-plans ; POST /production/food-plans/{id}/review, publish, resume-handoff | production | `prod/food_plans.go:56,24,110,136,162` | `K:463`, `K:431`, `I:285` | `app/api/production/targets/[id]/food-plans/route.ts`, `.../food-plans/[id]/{review,publish,resume-handoff}/route.ts` | `production_workflow_live_test.go` | ĐỦ — giao Anti nối (PUT sửa plan `prod/food_plans.go:74` chưa có BFF) |
| A37 | `/production/orders` | GET /production/orders ; POST .../{id}/acceptance, lot-allocations, start, completion | production | `prod/orders.go:29,82,114,146,185` | `K:440`, `K:447`, `I:292` | `app/api/production/orders/route.ts`, `.../[id]/{acceptance,lot-allocations,start,completion}/route.ts` | `production_workflow_live_test.go` | ĐỦ — giao Anti nối (failure `prod/orders.go:225` chưa có BFF) |
| A38 | `/production/qc` | POST /production/finished-goods-qc-inspections/{order_id}/complete | production | `prod/qc.go:24` | `K:424`, `I:278` | `app/api/production/finished-goods-qc-inspections/[id]/complete/route.ts` | `production_workflow_live_test.go` | ĐỦ — giao Anti nối |
| A39 | `/sales/pricing` | POST /sales/products/{pid}/variants/{vid}/pricing-preview ; POST /sales/price-books/{id}/versions + approval ; POST /sales/price-floor-policies (+versions, approval) | sales | `sales/price_floor.go:169,215,258,58,94,124` (reg `router.go:32-38`) | `K:527,505,512,519`, `I:327,334,341` | `app/api/sales/products/[id]/variants/[variant_id]/pricing-preview/route.ts` + 5 route price-books/price-floor-policies | chỉ `sales_authz_test.go:83` (403 của CreatePolicy); 6/7 handler không có test chạm | THIẾU test BE chạm handler; không có API list policy / price book / variant cho picker (B8-B11); `GET /sales/price-floor-policies/{id}/history` (`price_floor.go:147`) chưa có BFF |

### A4. `portal/app/platform/` và `portal/app/company/` (BFF chung `app/api/platform/[...path]/route.ts`, `app/api/org/[...path]/route.ts`)

| # | màn | method path | service | handler | Kong | BFF portal | test BE | verdict |
|---|---|---|---|---|---|---|---|---|
| A40 | `/platform/companies` (danh sách + onboard) | GET, POST /platform/companies | org | `org/platform.go:165`, `:171` (reg `:130-131`) | `K:368`, `I:250` | `app/api/platform/[...path]/route.ts` | `org/platform_e2e_test.go:113-116` | ĐỦ — giao Anti nối |
| A41 | `/platform/companies/[id]` module + `/role-matrix` | GET, PUT /platform/companies/{root}/modules[/{code}] ; GET, PUT .../role-matrix[/roles/{role}] | org | `org/platform.go:183,188,212,217` (reg `:132-135`) | `K:376`, `I:250` | như trên | `org/platform_e2e_test.go` | ĐỦ — giao Anti nối |
| A42 | `/platform/staff` | GET, POST /platform/staff ; POST /platform/staff/{user}/revoke | org | `org/platform.go:230,236,248` | `K:391`, `K:399`, `I:264` | như trên | `org/platform_e2e_test.go` | ĐỦ — giao Anti nối (ô User ID xem B3) |
| A43 | `/platform/support-access` | GET, POST /platform/support-access ; POST .../break-glass | org | `org/platform.go:257,269` | `K:406`, `K:414`, `I:271` | như trên | `org/platform_e2e_test.go` | ĐỦ — giao Anti nối |
| A44 | `/platform/audit` | GET /platform/audit-logs | org | `org/platform.go:314` | `K:361`, `I:243` | như trên | `org/platform_e2e_test.go` | ĐỦ — giao Anti nối |
| A45 | `/company` (công ty của tôi: module, role-matrix, settings, audit) | GET /org/company/modules, role-matrix, audit-logs ; PUT /org/company/settings | org | `org/platform.go:183,212,314,299` (reg `:144-148`) | `K:309,316,302,323`, `I:187-208` | `app/api/org/[...path]/route.ts` | `org/platform_e2e_test.go` | ĐỦ — giao Anti nối |
| A46 | `/company/support-access` | GET /org/company/support-access ; POST /org/support-access/{grant}/approve, revoke | org | `org/platform.go:263,284` (reg `:147,149-150`) | `K:330`, `K:344`, `I:215,229` | như trên | `org/platform_e2e_test.go` | ĐỦ — giao Anti nối |

## Bảng B — Ô nhập ID thô trong portal

Quét `portal/features`, `portal/app`, `portal/components` (bỏ `*.test.*`): label/placeholder chứa UUID/ID/ref, hoặc state/name kết thúc `_id`, `_ref`, `Ref`, `Id`. Danh sách đã biết đều xác nhận đúng dòng; thêm B8-B13.

| # | file:line | trường | thực thể | API list để làm picker | hiển thị cho người dùng | verdict |
|---|---|---|---|---|---|---|
| B1 | `features/inventory/shelves-view.tsx:99` (state `:30`) | `finished_lot_ref`, placeholder "UUID lô thành phẩm" | lô thành phẩm đã QC đạt | KHÔNG CÓ. `GET /inventory/inventory-lots` (`inv/stocks.go:22`, `K:246`) chỉ trả lô NGUYÊN LIỆU (`inventory/internal/service/query_service.go:20` gọi `ListRawMaterialLots`); lô thành phẩm chỉ có đường nội bộ `POST /internal/inventory/finished-goods-receipts` (`inv/router.go` nhóm Internal) | mã lô / trace code, SKU, SL còn, hạn dùng | CHỜ BE — thiếu API list lô thành phẩm (lọc QC=APPROVED, chưa lên kệ) |
| B2 | `features/platform/audit-view.tsx:51` | `root_branch_id`, placeholder "UUID" | công ty (chi nhánh MAIN) | `GET /platform/companies` — `org/platform.go:165` (reg `:130`), `K:368`, BFF `app/api/platform/[...path]`, test `platform_e2e_test.go`. Đã có hook `features/platform/use-companies.ts` và mẫu `Select` ở `support-request-form.tsx:66` | tên công ty + mã (`code`) | SỬA NGAY — picker từ GET /platform/companies |
| B3 | `features/platform/staff-view.tsx:134` | `user_id`, placeholder "UUID tài khoản" | tài khoản người dùng | KHÔNG CÓ công khai. Auth chỉ có `GET /internal/operator/users` (service-auth, `auth/internal/bootstrap/http.go:271`, không có route Kong); `GET /platform/staff` (`org/platform.go:136`) chỉ liệt kê người đã có quyền nền tảng | email + tên hiển thị | CHỜ BE — thiếu API tìm user theo email/tên (ví dụ `GET /platform/users?query=`) |
| B4 | `features/production/targets-view.tsx:94` | `line.product_ref` (nhãn "Product UUID") | sản phẩm/SKU của chỉ tiêu | `GET /sales/products?query&page_size&cursor` — `sales/sales.go:165`, `K:534`, BFF `app/api/sales/products/route.ts:8`, test `sales_http_live_test.go:96`. Không có filter `sku_kind` (`sku.sql.go:41`) nên lọc phía client theo `sku_kind` `[ASSUMED: đúng loại là sản phẩm bán, không phải RAW_MATERIAL — xem sales/internal/domain/sku.go:15-17]` | `sku_code` + `name` + `temperature_regime` | SỬA NGAY — picker từ GET /sales/products |
| B5 | `features/production/targets-view.tsx:87` | `branchRef` — ô khoá hiển thị UUID chi nhánh (nhãn "Chi nhánh từ phiên đăng nhập") | chi nhánh | `GET /org/access-contexts/me` — `org/access_contexts.go:34` (có `branch_name`, `org_name`), `K:295`; portal đã đọc `/api/auth/context` (`targets-view.tsx:33`) | tên chi nhánh (giữ UUID ẩn) | SỬA NGAY — hiển thị tên từ GET /org/access-contexts/me |
| B6 | `features/production/food-plans-view.tsx:94` | `productRef` ("Product UUID thuộc target") | sản phẩm thuộc chỉ tiêu | `GET /production/targets` — `prod/targets.go:89`, `K:455`, BFF `app/api/production/targets/route.ts:8`; `lines[].product_ref` đã nằm trong chỉ tiêu (`lib/api/production.ts:11`), tên lấy qua `GET /sales/products/{id}` (`sales/sales.go:179`) | tên SP + SL mục tiêu trong chỉ tiêu | SỬA NGAY — picker từ GET /production/targets (dòng chỉ tiêu) + GET /sales/products/{id} |
| B7 | `features/production/food-plans-view.tsx:102` | `component.sku_ref` ("Material SKU UUID") | nguyên liệu (SKU RAW_MATERIAL) | `GET /sales/products?query` — `sales/sales.go:165`; lọc client `sku_kind=RAW_MATERIAL` (`domain/sku.go:15`) `[ASSUMED]` nguyên liệu nằm trong bảng `sku` của sales | `sku_code` + `name` + `uom_code` | SỬA NGAY — picker từ GET /sales/products (đề xuất thêm `?sku_kind=` ở BE sau) |
| B8 | `features/production/food-plans-view.tsx:86` (nhánh `!targetId`) | `target_id` lấy từ URL `?target_id=` (`app/(console)/production/food-plans/page.tsx:11`) | chỉ tiêu sản xuất | `GET /production/targets?status=APPROVED` — `prod/targets.go:89` (lọc `status`, `branch_ref`), `K:455`, BFF có | `target_code` + tiêu đề + kỳ | SỬA NGAY — picker từ GET /production/targets |
| B9 | `features/sales/pricing-floor-view.tsx:110` | `productRef` ("Product UUID") | sản phẩm | `GET /sales/products` — `sales/sales.go:165` | `sku_code` + `name` | SỬA NGAY — picker từ GET /sales/products |
| B10 | `features/sales/pricing-floor-view.tsx:111` | `variantRef` ("Variant UUID") | biến thể (SKU có `parent_product_ref`) | KHÔNG CÓ filter: `ListSKUs` chỉ lọc `query`, `temperature_regime` (`sales/internal/store/sku.sql.go:41`) dù SKU có `parent_product_ref` (`models.go:21`) | `variant_label` / `sku_code` + khối lượng | CHỜ BE — thiếu API list biến thể theo sản phẩm (`?parent_product_ref=`) |
| B11 | `features/sales/pricing-floor-view.tsx:112-113` | `bomRef` ("BOM UUID") + `bomVersion` | BOM đã publish | KHÔNG CÓ. Production không có route BOM (`prod/router.go:32-56`); `bom_ref` chỉ có trong kết quả publish (`production/internal/service/service.go:427`), `FoodProductPlan` không chứa `bom_ref`/`variant_sku_ref` (`production/internal/store/models.go` struct plan) | mã BOM + phiên bản + SP đầu ra | CHỜ BE — thiếu API đọc BOM (hoặc thêm `bom_ref`, `bom_version`, `variant_sku_ref` vào plan PUBLISHED) |
| B12 | `features/sales/pricing-floor-view.tsx:114` | `priceBookRef` ("Price book UUID") | sổ giá | KHÔNG CÓ. Không có thực thể/route sổ giá: id do client tự đặt trong `POST /sales/price-books/{price_book_id}/versions` (`sales/price_floor.go:215-222`) | tên sổ giá | CHỜ BE — thiếu API list/tạo sổ giá |
| B13 | `features/sales/pricing-floor-view.tsx:33,36,37` (ẩn, điều khiển nút "Duyệt") | `priceVersionRef`, `policyRef`, `policyVersionRef` — chỉ có sau khi vừa tạo trong phiên (gán ở `:72,:82,:98`), tải lại trang là mất | phiên bản giá / policy / phiên bản policy | KHÔNG CÓ route list: service có `ListPolicies` (`sales/internal/service/price_floor_service.go:456`) nhưng `router.go:32-38` không đăng ký; chỉ có `GET .../history` (`price_floor.go:147`, chưa có BFF) | trạng thái + hệ số + người tạo | CHỜ BE — thiếu API list policy / phiên bản giá chờ duyệt |

Đã xét, không tính là ô ID thực thể (giữ nguyên): `features/platform/support-request-form.tsx:85` `ticket_ref` (mã ticket CSKH ngoài hệ thống, tuỳ chọn); `features/platform/company-onboard-form.tsx:17` + `company-modules.tsx:118` `contract_ref` (số hợp đồng do người dùng biết); `features/platform/role-matrix-view.tsx:101` action key; `features/inventory/shelves-view.tsx:114` `shelf_code` (mã kệ người dùng biết, chưa có master data kệ); `features/inventory/shelves-view.tsx:31` `branchRef` (lấy từ phiên, không phải ô nhập). Chỗ hiển thị UUID thô chưa phải ô nhập nhưng nên dùng tên: `features/memberships/memberships-view.tsx:234`, `features/platform/audit-view.tsx:100,103`.

## Mục C — Tổng

Đếm verdict (dòng):

| Bảng | ĐỦ — giao Anti nối | THIẾU | CHƯA CÓ API — để Dawn | CHỜ BE | SỬA NGAY |
|---|---|---|---|---|---|
| A (46 dòng) | 28 | 11 | 7 | - | - |
| B (13 dòng) | - | - | - | 6 | 7 |

ĐỦ trong A: A8-A14, A16, A17, A19-A21, A25, A27-A29, A33, A35-A38, A40-A46. Trong đó thiếu BFF: A13, A17. 11 dòng THIẾU: A1-A3, A5-A7 (chuỗi sales của khách, phụ thuộc R1/R2/R3), A22, A23, A24, A34, A39. 7 dòng CHƯA CÓ API: A4, A15, A18, A26, A30, A31, A32.

Việc giao Anti ngay (không chờ BE):
1. Nối 28 dòng ĐỦ ở trên (A13, A17 cần thêm BFF).
2. 7 picker SỬA NGAY: B2, B4, B5, B6, B7, B8, B9.

API còn thiếu, đề xuất task BE theo service:

| service | task đề xuất | mở khoá |
|---|---|---|
| sales | `SALES-CATALOG-001`: `GET /sales/catalog`, `/sales/catalog/{id}` (ACTIVE + sellable, không đòi branch cho khách, có ảnh/danh mục/biến thể), filter `sku_kind`, `status`, `parent_product_ref`; kèm route Kong | A1, A2, B10; picker B4/B7 gọn hơn |
| sales | `SALES-ORDER-CHECKOUT-001`: `CreateOrderRequest` thêm người nhận/địa chỉ/thanh toán; `GET /sales/orders` trả `order_code`, `items`, lọc `status`/ngày/cursor; `GET /sales/orders/{id}` trả `items` + `order_state_history`; thêm test chạm `ListOrders` | A5-A7, A23, A24 |
| sales | `SALES-ORDER-STATES-001`: confirm/pack/ship/deliver/delivery-failure/payments (spec `order-lifecycle.md:70-76`) + BFF | A26 |
| sales | `SALES-CART-001`: PATCH/DELETE `/sales/carts/{id}/items/{item_id}`; dòng giỏ trả tên SP | A4, A3 |
| sales | `SALES-PRODUCT-EDIT-001`: PATCH `/sales/products/{id}` + mở `PATCH` ở Kong `K:542` | A30 |
| sales | `SALES-WISHLIST-001` (đã nêu trong plan) | A15 |
| sales | `SALES-PRICING-LIST-001`: list policy + phiên bản chờ duyệt, thực thể sổ giá + list, test handler price_floor | A39, B12, B13 |
| org/auth | quyết định R1: token khách không có branch → sales phải chấp nhận principal khách (ADR-024:28) hoặc cấp context cho khách; probe trước | toàn bộ chuỗi store |
| org | `ORG-ADMIN-API-001`: handler `/orgs/{org}/branches`, `/memberships`, `/employees` theo `org-admin.md:30-34`, `employee-onboard.md:38`; `GET /platform/users?query=` (tìm user theo email/tên) | A31, A32, B3 |
| auth | thêm Kong route `/auth/invite/accept` (`K` + `I`/`IS`) | A22 |
| inventory | `INV-FG-LOTS-001`: `GET /inventory/finished-goods-lots?qc_status=APPROVED&unplaced=true`; test BE cho `shelf-placements` GET/POST | A34, B1 |
| production | `PROD-BOM-READ-001`: thêm `bom_ref`, `bom_version`, `variant_sku_ref` vào plan PUBLISHED hoặc `GET /production/boms` | B11 |
| portal/BFF | thêm BFF: `PATCH /api/auth/profile`, `/api/locations/*`, `GET /api/production/targets/[id]`, `PUT /api/production/food-plans/[id]`, `POST .../orders/[id]/failure`, `GET /api/sales/price-floor-policies/[id]/history` | A13, A17 và các hàm đã có handler |
| dashboard | không có service nào; cần quyết định nguồn số liệu (aggregate từ sales/production) | A18 |
