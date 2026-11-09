# NUTRITION-N5 — Portal: khách xem và lọc món theo dinh dưỡng, FOOD_DEV nhập dinh dưỡng nguyên liệu

## CONTEXT
- Plan đã duyệt: `/home/dawn/work/ticket/platform-docs/planning/sprints/261109-nutrition/plan.md` (Hành trình bước 1–4, mục "Giao diện món").
- Backend đã chạy trên DEV qua Kong (sales từ worktree `sales-nutri-n1`, production từ `production-nutri-n2`). 25/30 món có snapshot dinh dưỡng; 5 món `nutrition=null`.
- Hợp đồng API (đọc, không sửa): `/home/dawn/work/ticket/.cache/worktrees/sales-nutri-n1/api/openapi.public.yaml`
  - `GET /sales/catalog` có query `kcal_max`, `protein_min`, `label` (khoảng dòng 2300+), item trả dinh dưỡng mỗi suất + nhãn + missing.
  - `GET/PATCH /sales/skus/{id}/nutrition` (dòng ~653), schema `api/nutrition.yaml#/$defs/MaterialNutrition`.
  - Spec: `sales-nutri-n1/docs/specs/catalog-store.md`, `food-material-catalog.md`.
- Màn hiện có: `app/(store)/products/page.tsx`, `app/(store)/products/[id]/page.tsx`, `features/products/{catalog-view,catalog-filters,product-detail-view,use-catalog,use-product-detail}.tsx|ts`, BFF `app/api/public/catalog/**`. Màn nguyên liệu FOOD_DEV: tự tìm (`features/production/material-*`, `app/api/sales/skus`).
- Chuẩn portal: `AGENTS.md` của portal; view chỉ render, hook gọi API; shadcn gốc; RHF + zod + Field; SWR; không UUID trên UI; file ≤ 400 dòng; không comment.

## REQUIRED
1. **Thẻ món (catalog khách):** thêm chip `420 kcal · 38 g đạm` dưới giá/suất và tối đa 2 nhãn (Badge). Món `nutrition=null` hoặc có `missing` → không hiện chip, hiện chữ nhỏ "Chưa đủ dữ liệu dinh dưỡng". Không đổi bố cục thẻ khác.
2. **Bộ lọc** (mở rộng `catalog-filters.tsx`, giữ kiểu hiện có): "Tối đa kcal/suất" (Input số), "Từ g đạm/suất" (Input số), nhãn (ToggleGroup 4 nhãn: Giàu đạm, Ít béo, Ít natri, Nhiều xơ). Truyền thẳng `kcal_max`, `protein_min`, `label` qua BFF tới `/sales/catalog`; giữ trên URL query để chia sẻ được. Có nút "Xoá lọc". Rỗng → empty state có nút xoá lọc.
3. **Chi tiết món:** khối "Dinh dưỡng mỗi suất" — bảng 7 chất (kcal, đạm, béo, tinh bột, xơ, đường, natri; đơn vị đúng), nhãn, dòng "Ước tính từ nguyên liệu sống, chưa gồm dầu ăn tự thêm". Có `components` thì thêm bảng con theo ngăn/gói (tên, g, kcal, đạm, béo, tinh bột). Thiếu dữ liệu → "Thiếu dữ liệu: <tên nguyên liệu>". Chưa làm vệ tinh (task riêng).
4. **FOOD_DEV nhập dinh dưỡng nguyên liệu:** ở màn chi tiết/sửa nguyên liệu (RAW_MATERIAL) thêm mục "Dinh dưỡng / 100 g": 7 ô số + ô nguồn mỗi ô (chọn nguồn theo enum trong schema), `grams_per_ml` / `edible_grams_per_ea` khi UOM là L/EA. Ô trống = null (không gửi 0). GET khi mở, PATCH khi lưu, toast thành công/lỗi đọc đúng mã lỗi. Quyền theo `sales:product:update` (ẩn nút khi không có quyền như màn hiện có).
5. Test vitest cho: hàm dựng query lọc, hiển thị chip/null, schema zod (trống → null, số âm bị chặn). Không thêm test e2e ở lô này.

## CONSTRAINT
- Chỉ sửa repo portal trong worktree này. Không sửa service/Kong. Không thêm dependency (shadcn component chưa có → copy theo cách repo đang làm).
- Không /tmp: `TMPDIR=/home/dawn/work/ticket/.cache`. Script `npm test` copy esbuild vào /tmp — chạy vitest với `ESBUILD_BINARY_PATH` trỏ binary trong node_modules thay vì để script copy.
- Cài deps: `pnpm install --frozen-lockfile` trong worktree (store mặc định). Không commit, không push.
- Không tự thiết kế lại trang: giữ bố cục, chỉ thêm khối nêu trên.

## ACTION
1. Đọc hợp đồng + màn hiện có → ghi 5–10 dòng "Tham khảo/Reuse" (hàm, component dùng lại) vào status.
2. Code 1→4, test 5.
3. Kiểm: `typecheck`, `lint`, vitest, `next build --webpack`.
4. Chạy thật: `next dev` cổng **3002** (Kong DEV CORS chỉ cho 3000/3002/3003), dùng `.env.local` có sẵn + thêm nếu thiếu `SALES_SERVICE_URL/INVENTORY_SERVICE_URL/PRODUCTION_SERVICE_URL/NOTIFICATION_SERVICE_URL` trỏ Kong như `.env.example`. curl BFF `/api/public/catalog?protein_min=30` thấy món lọc đúng. Để server chạy (nohup, log ở `/home/dawn/work/ticket/.cache/portal-n5-dev.log`) cho bước quay video.

## OUTPUT
Cập nhật mục Status cuối file: đã làm gì, file sửa, kết quả 4 lệnh kiểm, ví dụ curl lọc (số món trước/sau lọc), việc chưa làm. In ≤ 10 dòng.

## Status
Đóng N5 ngày 09/11/2026 sau lượt 2: đọc dinh dưỡng từ GET danh sách SKU, lưu bằng PATCH hiện có và xác minh dữ liệu thật qua BFF. Toàn bộ phạm vi chức năng đã xong; Vitest còn ba lỗi rebrand có sẵn như lượt 1.

### Tham khảo/Reuse
- `catalogEntrySchema`, `catalogToProduct`, `getCatalog`: mở rộng DTO nutrition và query, giữ dữ liệu/giá hiện có.
- `CatalogFilters`, `CatalogView`, `useCatalog`: giữ sidebar/sheet/layout thẻ; SWR phân trang, URL chia sẻ, debounce 250 ms.
- `ProductDetailView`: dùng Card/Badge/Table; bảng con cuộn ngang, không đổi bố cục trang.
- `RawLabelsForm`, `MaterialPicker`, `usePackages`: dùng màn chọn RAW_MATERIAL hiện có và quyền sales:product:update.
- `forwardService`, `serviceUrl`, `fetcher`, `FetchError`: tái sử dụng BFF xác thực, envelope và mã lỗi.
- RHF/zod/SWR, Field/Input/NativeSelect/toast đã có; thêm ToggleGroup từ Radix theo cách repo, không thêm dependency.
- Đã đọc ui-ux.md, plan duyệt và hợp đồng/spec; chạy ui-ux-pro-max về bảng mobile, nhãn ô nhập và phản hồi lưu.

### Đã làm / file sửa
- Catalog: chip kcal/đạm, tối đa hai nhãn; null/missing hiện thiếu dữ liệu; lọc kcal/đạm/nhãn qua BFF, giữ URL/branch_id, xoá lọc và empty state có hướng dẫn. File: `features/products/{catalog-view,catalog-filters,use-catalog}.tsx|ts`, `lib/api/{sales,catalog-query}.ts`, `app/api/public/catalog/route.ts`, `app/(store)/products/page.tsx`.
- Chi tiết: đủ bảy chất, đơn vị, nhãn, nguyên liệu thiếu, bảng ngăn/gói và câu ước tính; giữ branch khi đi/về. File: `features/products/{nutrition-view,product-detail-view,product-detail-loader}.tsx`, `app/(store)/products/[id]/page.tsx`.
- Nguyên liệu: bảy số/nguồn, quy đổi L/EA, ô trống thành null, chặn số âm/nguồn thiếu, GET khi mở/PATCH khi lưu, toast theo mã lỗi, ẩn nút theo quyền, không mở form ghi khi GET lỗi. File: `features/production/{material-nutrition-form,raw-labels-form}.tsx`, `features/production/{use-material-nutrition,use-packages}.ts`, `lib/{nutrition.ts,api/material-nutrition.ts}`, `app/api/sales/skus/[id]/nutrition/route.ts`.
- Primitive/test: `components/ui/toggle-group.tsx`, `frame.lock.json` chỉ thêm hash primitive mới; test `lib/nutrition.test.ts`, `lib/api/{catalog-query,material-nutrition}.test.ts`, `features/products/{nutrition-view,catalog}.test.tsx`, `app/api/public/catalog/route.test.ts`. `.env.local` thêm bốn SERVICE_URL còn thiếu trỏ Kong, không commit/push.

### Kiểm tra
- `TMPDIR=/home/dawn/work/ticket/.cache pnpm install --frozen-lockfile`: PASS, giữ lockfile/dependencies.
- `pnpm run typecheck`: PASS; `pnpm run lint`: PASS; `pnpm exec next build --webpack`: PASS. Log build: `/home/dawn/work/ticket/.cache/portal-n5-build.log`.
- Vitest: 1736 PASS / 3 FAIL, 115 file PASS / 1 FAIL. Chạy trực tiếp `TMPDIR=/home/dawn/work/ticket/.cache ESBUILD_BINARY_PATH=$PWD/node_modules/.pnpm/@esbuild+linux-x64@0.21.5/node_modules/@esbuild/linux-x64/bin/esbuild pnpm exec vitest run`, không chạy script copy /tmp. Ba lỗi `app/rebrand.test.ts:808` cấm ảnh trong detail đã có ảnh từ HEAD; chạy lại với nguyên file detail từ HEAD vẫn đúng ba lỗi đó. Log: `/home/dawn/work/ticket/.cache/portal-n5-vitest.log`, `/home/dawn/work/ticket/.cache/portal-n5-baseline-rebrand.log`.
- Trình duyệt thật: desktop 1440px lọc 16 món, xoá lọc về 34, mở chi tiết có ngăn/gói; mobile 375px không tràn ngang. Ảnh lưu `/home/dawn/work/ticket/.cache/portal-n5-{catalog-desktop,detail-desktop,detail-mobile}.png`. Không thêm test e2e.
- Curl thật: `curl -sS 'http://127.0.0.1:3002/api/public/catalog?branch_id=01a157cd-fef2-72ff-9428-63b4df7d25d0&page_size=100&protein_min=30'`: 34 → 16 món; đạm nhỏ nhất 30,1 g, tất cả >=30 g. kcal_max=420 →24; HIGH_PROTEIN →24. DEV hiện có 34 món/25 snapshot/9 null, khác mốc task 30/25/5; chi nhánh mặc định trả 0 nên demo cần branch_id như trên.
- Giữ `nohup next dev --webpack` cổng 3002, log `/home/dawn/work/ticket/.cache/portal-n5-dev.log`; mở `/products?branch_id=01a157cd-fef2-72ff-9428-63b4df7d25d0&protein_min=30` để quay video.

### Phụ thuộc lượt 1 đã giải quyết
- Không cần GET riêng: GET `/sales/skus?kind=RAW_MATERIAL` trả `nutrition_facts`. Lượt 2 dùng BFF danh sách SKU hiện có để tải dữ liệu; chỉ giữ PATCH tại BFF `/sales/skus/{id}/nutrition`.
- Chưa làm vệ tinh theo scope; không sửa service/Kong hoặc ba test rebrand lỗi sẵn. Kiểm FOOD_DEV đăng nhập qua BFF, chưa quay toàn hành trình trên trình duyệt.

### Lượt 2 — đọc dinh dưỡng nguyên liệu
- Tham khảo/reuse: BFF `app/api/sales/skus`, `fetcher`, `decodePlatform`, `materialNutritionSchema`, `nutritionDefaults` và SWR `mutate(saved, false)`; không thêm dependency/API backend.
- Form tải danh sách với `q=tên`, `include_unknown=true`, phân trang tới đúng ID; phân biệt nutrition=null với nguyên liệu không tồn tại, trường bị thiếu và lỗi HTTP. PATCH trả gì thì reset form/cập nhật cache SWR bằng dữ liệu đó; đọc đúng mã `errors.error_code`.
- File sửa lượt 2: `lib/api/material-nutrition.ts`, `lib/api/material-nutrition.test.ts`, `features/production/use-material-nutrition.ts`, `features/production/material-nutrition-form.tsx`, `app/api/sales/skus/[id]/nutrition/route.ts`, file status này.
- `TMPDIR=/home/dawn/work/ticket/.cache pnpm run typecheck`: PASS; `pnpm run lint`: PASS; `pnpm exec next build --webpack`: PASS. Log `/home/dawn/work/ticket/.cache/portal-n5-round2-{typecheck,lint,build}.log`.
- Vitest trực tiếp với `TMPDIR=/home/dawn/work/ticket/.cache` và `ESBUILD_BINARY_PATH=$PWD/node_modules/.pnpm/@esbuild+linux-x64@0.21.5/node_modules/@esbuild/linux-x64/bin/esbuild`: 1739 PASS / 3 FAIL, vẫn ba lỗi `app/rebrand.test.ts:808` từ lượt 1. Test API dinh dưỡng + schema chạy riêng 21/21 PASS, có kiểm số liệu/nguồn khác null, phân trang/ID và lỗi. Log `/home/dawn/work/ticket/.cache/portal-n5-round2-vitest.log`.
- DEV đăng nhập admin@dcenter.test qua BFF: GET `/api/sales/skus?kind=RAW_MATERIAL&q=C%C3%A0+chua&include_unknown=true&limit=100` → 200; chọn Cà Chua Baby Đỏ Thái ECO (300gr/Khay), PATCH lại nguyên `nutrition_facts` → 200; GET lại → 200; dữ liệu trước/response/sau bằng nhau. Bằng chứng `/home/dawn/work/ticket/.cache/portal-n5-round2-dev.json`, không chứa token.
- Curl catalog lượt 1 giữ kết quả 34 → 16 món với `protein_min=30` và branch đã ghi ở trên. Dev server 3002 đã dừng theo yêu cầu lượt 2; file phiên đăng nhập tạm đã xoá. Không commit/push; phần còn ngoài scope là vệ tinh và ba lỗi rebrand có sẵn.

### Lượt 3 — sửa UI khách và quay lại N6, 09/11/2026
- Reuse `recordCartResponse`/localStorage để giữ tên và ảnh; giỏ bỏ SKU/EA/UUID, thêm ảnh mặc định và câu cho khách; thẻ/chi tiết dùng giá /suất. File: `features/products/{cart-view,catalog-view,product-detail-view}.tsx`, `lib/api/sales.ts`.
- Sửa gốc GET giỏ thiếu branch_id và chưa decode envelope; lưu chi nhánh sau POST thành công, GET qua BFF chỉ forward branch_id. File: `app/api/sales/carts/[cart_id]/route.ts`; test tại `lib/api/sales.test.ts`, `app/api/sales/sales-bff.test.ts`, `features/products/{products,catalog}.test.tsx`.
- `e2e/dinh-duong/dinh-duong.spec.ts`: bỏ API/giỏ giả, bắt buộc bấm UI và assert tên món/không UUID; thêm ảnh `04a-loc-dam-30.png`, `04b-loc-it-beo.png` trước xoá lọc; báo cáo lấy kết quả thật và fail khi có bước gãy.
- Kiểm cuối: `pnpm run typecheck` PASS; `pnpm run lint` PASS; `pnpm exec next build --webpack` PASS; Vitest trực tiếp với TMPDIR cache và ESBUILD_BINARY_PATH trong node_modules: 1744 PASS / 3 FAIL rebrand có sẵn, 115/116 file PASS. Log `/home/dawn/work/ticket/.cache/portal-n5-round3-{typecheck,lint,build,vitest}.log`.
- Curl `/api/public/catalog?branch_id=01a157cd-fef2-72ff-9428-63b4df7d25d0&page_size=100&protein_min=30` → 16 món; video thật xác minh 34 → 16 → 13 khi thêm LOW_FAT → 34 khi xoá. Artifact `/home/dawn/work/ticket/.cache/video-nghiep-vu/10-dinh-duong/lan-2`: ảnh, `summary.json`, `bao-cao.md`, `video-dinh-duong.webm`, trace; 6/7 bước đạt.
- Chưa đổi luật tồn kho: spec đọc `/home/dawn/work/ticket/.cache/worktrees/sales-nutri-n1/docs/specs/catalog-store.md:44` ghi available_quantity=null không cho mua; DEV trả null nên bước 6 FAIL toBeEnabled, chưa xác minh giỏ qua trình duyệt. Đã hỏi người dùng cho phép đổi luật, đang chờ trả lời; không bypass API hoặc mock để báo đạt.
- Giữ server đang chạy cổng 3002, log `/home/dawn/work/ticket/.cache/portal-n5-dev.log`; không sửa backend/Kong, không thêm dependency, không commit/push. Tiếp tục: khi được xác nhận, sửa điều kiện catalog/detail + ghi chú tồn kho, kiểm lại và quay lại lan-2.
