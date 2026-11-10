# UI-ASTRYX-001 lô 1: catalog món cho khách

## CONTEXT
- Dawn 09/11/2026 yêu cầu học Astryx MIT để làm mới giao diện khách.
- Worktree `portal-ui-astryx`, nhánh `feat/UI-ASTRYX-001`, nền `feat/NUTRITION-N5`.
- Tham khảo chỉ đọc `/home/dawn/work/ticket/.cache/refs/astryx`; quyết định và file nguồn tại [astryx-hoc.md](../design/astryx-hoc.md).
- Giữ sidebar lọc, toolbar sắp xếp và lưới ba cột desktop/hai cột mobile hiện có.

## REQUIRED
- Tài liệu học Astryx ≤80 dòng, có bảng ánh xạ token sang portal.
- Làm mới chữ, khoảng cách, thẻ, chip, control và placeholder ảnh 4:3.
- Giữ dữ liệu, URL, debounce, lọc, sắp xếp, phân trang và nút thêm giỏ.
- Chụp trước/sau 1280×800 trên dữ liệu thật qua Kong `127.0.0.1:8000`.
- Kiểm TypeScript, lint và Vitest phần catalog.

## CONSTRAINT
- Dùng shadcn/Tailwind sẵn có, không dependency mới, không lấy code Astryx.
- Catalog dùng green-700 và neutral, card 8px/control 6px, card không bóng.
- Không đổi admin, FOOD_DEV, hook/API hoặc tên/giá trị token chung hiện có.
- Không commit, không sửa `.mcp.json`, không dùng `/tmp`; TMPDIR và pnpm store nằm dưới ticket/.cache.

## ACTION
- Đọc chuẩn portal/frontend/ui-ux, graph catalog và contract/token/design docs Astryx.
- Viết tài liệu học 50 dòng, chụp `truoc.png` trước khi sửa source giao diện.
- Thêm alias chung `media` và `duration-feedback`; style/màu chỉ scope `.catalog`, gồm filter sheet qua portal.
- Thẻ bỏ gap mặc định giữa ảnh và nội dung; padding desktop 20px, gap lưới 24px, tên/giá 16px semibold, số tabular.
- Placeholder HTML/CSS nền neutral, không icon, giữ aria-label tên món; ảnh thật vẫn dùng image_urls và object-cover.
- Ảnh mặc định cũ bị proxy chuyển khách sang login; catalog không gọi URL ảnh đó nữa, không sửa auth.
- Tái sử dụng NutritionChip, Card, Button, Input, NativeSelect, ToggleGroup và toàn bộ hook cũ.

## OUTPUT
### Status
Hoàn tất lô 1 ngày 09/11/2026, không commit.

- File sửa: `app/globals.css`, `features/products/catalog-view.tsx`, `features/products/catalog-filters.tsx`, `features/products/catalog.test.tsx`.
- File tạo: `docs/design/astryx-hoc.md`, `docs/tasks/UI-ASTRYX-001.md`. Các file đều dưới 400 dòng.
- Test ảnh được cập nhật theo placeholder có accessible name, giữ kiểm ảnh thật và chặn URL fallback cần đăng nhập.
- `TMPDIR=/home/dawn/work/ticket/.cache pnpm install --frozen-lockfile --store-dir /home/dawn/work/ticket/.cache/pnpm-store`: PASS, không đổi lockfile.
- `TMPDIR=/home/dawn/work/ticket/.cache npx --no-install tsc --noEmit`: PASS.
- `TMPDIR=/home/dawn/work/ticket/.cache npm run lint`: PASS.
- Vitest trực tiếp, TMPDIR cache và ESBUILD_BINARY_PATH trong node_modules: **78/78 PASS, 5/5 file** gồm catalog, nutrition-view, catalog-query, public catalog BFF và ui-rules-gate. Không chạy script npm test có thao tác /tmp.
- Vitest có cảnh báo timezone từ provider test có sẵn; không có test fail. Log `vitest.log` trong thư mục ảnh dưới đây.
- Trình duyệt dùng API thật: 34 món → lọc protein_min=30 còn 16 → thêm LOW_FAT còn 13 → xoá về 34; reload giữ lọc và branch_id; sort giá tăng đúng; tìm tên không khớp có empty state/xoá lọc.
- Focus bàn phím có ring xanh; mobile 375px scrollWidth=375, mở/đóng sheet và lọc được; dark card có nền rgb(16,16,18), chữ rgb(250,250,250); reduced-motion transition=0s.
- Luồng thành công không có pageerror hoặc HTTP ≥500. GET auth/me trả 401 đúng trạng thái khách chưa đăng nhập.
- Bằng chứng `/home/dawn/work/ticket/.cache/video-nghiep-vu/ui-astryx/lo1/`: `truoc.png`, `sau.png` cùng 1280×800, cùng 34 món; thêm `mobile.png`, `toi.png`, `rong.png`, `dang-tai.png`, `loi-mo-phong.png`, `kiem-tra.json`, `vitest.log`.
- Ảnh loading giữ chậm request thật; ảnh lỗi mô phỏng API 503 chỉ để kiểm trạng thái giao diện. Ảnh trước/sau và mobile/dark dùng dữ liệu thật.
- Diff không đổi primitive, token generated, hook, API, detail, admin hoặc FOOD_DEV; `git diff --check` PASS. Đã hoàn nguyên thay đổi next-env do dev server tự sinh.
- Giới hạn kiểm: chưa chạy toàn bộ suite/build/Lighthouse, chưa ghi giỏ trong lượt kiểm này; điều kiện và handler thêm giỏ giữ nguyên.
- Tiếp tục review trực quan từ cặp ảnh trước/sau; dev server đang ở `http://127.0.0.1:3003/products?branch_id=01a157cd-fef2-72ff-9428-63b4df7d25d0`.


### Status lô 2
Hoàn tất màn mẫu ngày 09/11/2026, chờ Dawn duyệt bố cục; không commit, push hoặc merge.

- Theo brief lô 2, thay yêu cầu giữ sidebar/lưới ba cột của lô 1 bằng banner gọn, chip ngang và lưới bốn cột desktop. Banner ghi “Món dân dã, sạch, hợp túi tiền.”
- Chip nhanh: Giàu đạm, Ít béo, Ít natri, Nhiều xơ, ≤500 kcal, ≥30 g đạm và giá ≤80.000 đ. Nút Bộ lọc mở Sheet phải với tìm tên, khoảng giá, kcal, đạm, nhãn và xoá lọc. Tham số URL, debounce và hook/API giữ hành vi cũ.
- Thẻ ảnh 4:3, tên, dòng kcal · đạm, nhãn, giá và nút phụ “Thêm giỏ”. Món thiếu ảnh dùng minh hoạ HTML/CSS đĩa thức ăn và tên món trên nền dịu theo nhóm. Không đưa ảnh nguyên liệu vào code chính.
- Thêm `features/products/catalog-artwork.tsx`, `mocks/catalog-lo2-preview.mjs`; sửa tiếp các file catalog/CSS/test từ lô 1. Mọi file sửa/tạo dưới 400 dòng, không dependency mới. Admin, chi tiết, giỏ và hook/API không đổi.
- Tham khảo chỉ đọc Astryx `docs/design/spatial-hierarchy.md`: dùng khoảng cách để nhóm, không thêm panel bao từng vùng; giữ shadcn và green-700 của portal, không chép code.
- `TMPDIR=/home/dawn/work/ticket/.cache pnpm exec tsc --noEmit`: PASS.
- `TMPDIR=/home/dawn/work/ticket/.cache pnpm run lint`: PASS.
- Vitest catalog, nutrition-view, catalog-query, public catalog BFF và ui-rules-gate: **78/78 PASS, 5/5 file**. Test provider được khai báo timezone để bỏ cảnh báo môi trường.
- Playwright trên dev :3003, dữ liệu thật qua Kong :8000, branch_id theo brief: 34 món, xác nhận bốn thẻ cùng hàng; chip ≥30 g đạm còn 16, thêm Ít béo còn 13, reload giữ lọc và branch_id; Sheet cập nhật kcal_max/minPrice/maxPrice; sort và reload giữ URL. Mobile 375px không tràn ngang; Sheet mở/đóng được. Không pageerror hoặc HTTP ≥500 trong lượt kiểm.
- Ba ảnh 1280×800: `/home/dawn/work/ticket/.cache/video-nghiep-vu/ui-astryx/lo2/khong-anh.png`, `co-anh.png`, `bo-loc-mo.png`; đã xem trực quan cả ba. `kiem-tra.json` ghi kết quả trình duyệt.
- `co-anh.png` dùng ảnh nguyên liệu từ `images-chuan` gắn bằng route mock trong `mocks/catalog-lo2-preview.mjs`, chỉ để duyệt bố cục có ảnh, không phải ảnh món thành phẩm. Script không sửa dữ liệu backend hoặc chép ảnh vào repo.
- Log kiểm nằm ở `/home/dawn/work/ticket/.cache/astryx-lo2-{tsc,lint,vitest}.log`. Chưa chạy toàn bộ suite/build hoặc ghi giỏ trong lượt này. Dev tiếp tục ở :3003 để Dawn duyệt.


### Status lô 3
Hoàn tất ngày 10/11/2026, không commit.

- Áp skill thiết kế `/home/dawn/.claude/plugins/cache/ui-ux-pro-max-skill/ui-ux-pro-max/2.13.0/.claude/skills/ui-ux-pro-max/SKILL.md`; tra UX navigation cho food e-commerce. Checklist áp dụng: SVG cùng họ, icon 20px/vùng bấm 44px, focus bàn phím, bố cục không tràn mobile, màu sáng/tối và reduced-motion.
- Mục 1: header nền trắng theo theme, bỏ border-bottom và border menu mobile; không thêm bóng. Dùng z-header sẵn có để overlay vẫn nằm trên header.
- Mục 2: tìm kiếm nền neutral nhạt, border 0, bo 6px và ring green-700 1px khi focus.
- Mục 3: nav đang chọn chữ semibold xanh, gạch ngắn 16px; bỏ khối nền.
- Mục 4: Sunny chữ bold, thêm mặt trời SVG Lucide màu green-700.
- Mục 5: icon giỏ/theme/đăng nhập cùng 20px, vùng bấm 44px, gap 8px; giữ badge tổng số lượng thật của MiniCart và nút đăng nhập ghost gọn. Không đổi primitive/theme toggle chung của admin.
- Mục 6: đổi bản dịch Catalog.loaded thành “{count} món”; tiêu đề 30/36px, mô tả 16px, tăng khoảng cách giữa banner, lọc và lưới.
- Mục 7: thẻ món không viền/bóng, nền neutral nhẹ; bỏ viền nhãn dinh dưỡng, chip nhanh, nút Bộ lọc và select sắp xếp; footer nền nhạt, bỏ cả hai đường phân cách. Giữ ring thể hiện focus/chip đang chọn và viền ô nhập trong Sheet phục vụ nhập liệu.
- File lô 3: `components/layout/store-header.tsx`, `components/layout/site-footer.tsx`, `components/layout/store-shell.test.tsx`, `app/globals.css`, `features/products/catalog-view.tsx`, `features/products/catalog.test.tsx`, `messages/vi.json`, `mocks/catalog-lo3-preview.mjs`, tài liệu task/design. Giữ nguyên thay đổi lô 1–2; không sửa shell admin/FOOD_DEV, API hoặc hook.
- TypeScript `pnpm exec tsc --noEmit`: PASS; `pnpm run lint`: PASS; Vitest trực tiếp 6 file gồm store-shell, catalog, nutrition-view, catalog-query, public catalog BFF và ui-rules-gate: **87/87 PASS**. TMPDIR dùng ticket/.cache; log `/home/dawn/work/ticket/.cache/astryx-lo3-{tsc,lint,vitest}.log`.
- Playwright `mocks/catalog-lo3-preview.mjs` chạy dev :3003, dữ liệu thật qua Kong :8000, không mock dữ liệu: 34 món/bốn cột; lọc ≥30 g đạm →16, thêm Ít béo →13; reload giữ branch/lọc/sort; Sheet đổi kcal_max, popup giỏ trống/đăng nhập, menu mobile hoạt động; 375px không tràn; kiểm focus ring xanh 1px và theme tối/reduced-motion. Không pageerror/HTTP ≥500. Không ghi giỏ trong lượt này; Vitest giữ kiểm badge tổng số lượng.
- Ba ảnh 1280×800 đã tự xem hai lượt, lượt hai bỏ nốt viền nhãn dinh dưỡng: `/home/dawn/work/ticket/.cache/video-nghiep-vu/ui-astryx/lo3/{dau-trang,san-pham,cuon-xuong}.png`. `kiem-tra.json` lưu kết quả browser, border computed 0px ở header/search/card/footer. Không còn đường kẻ trang trí giữa các vùng; giữ gạch nav và hình đĩa minh hoạ của lô 2.
- `git diff --check`: PASS; file source sửa/tạo dưới 400 dòng, không dependency mới. Chưa chạy toàn suite/build/Lighthouse. Dev tiếp tục ở :3003 để duyệt.


### Status lô 4b

- 10/11/2026: chỉ sửa nhãn thành phần, ô/nút nguồn gốc, tóm tắt dinh dưỡng và placeholder tra cứu. Không commit.
- API trả thành phần tổng hợp `Cải chíp xào gừng · RAU`, không có tên nguyên liệu riêng: hiện nhóm `Rau` thay vì suy đoán nguyên liệu; tái sử dụng bảng nhãn nhóm hiện có. Bỏ định lượng cuối tên, giữ cột grams làm nguồn duy nhất. Không sửa dữ liệu backend.
- Tóm tắt và nhãn dưới tên món 14px; chip nền xanh nhạt chỉ áp khối đầu trang chi tiết. Ô mã nền xám không viền, focus xanh mảnh; nút phụ rõ hơn, chỉ tạo link khi mã sau trim có nội dung. Placeholder tra cứu dùng ví dụ `TRC-20260901-DEMO` có trong test production, spec không quy định định dạng mã.
- `pnpm exec tsc --noEmit`, `pnpm run lint`: PASS. Vitest trực tiếp bốn file products/nutrition-view/catalog/trace: 62/62 PASS. Script `pnpm test` không chuyển tiếp bộ lọc nên đã vô tình chạy toàn suite; suite rộng còn lỗi ở layout gate, các gate UI và production, không mở rộng sửa ngoài brief.
- Playwright dữ liệu thật :3003: kiểm 14px, thành phần/định lượng, ô không viền và có focus, disabled khi trắng, link mã được trim/encode, placeholder/helper; không pageerror. Ghi đè và tự xem cả ba ảnh 1280×800 `lo4/chi-tiet.png`, `lo4/chi-tiet-cuon.png`, `trace/nhap-ma.png`.

### Status lô 4
Hoàn tất ngày 10/11/2026, không commit.

- Ảnh trước `lo4/truoc-chi-tiet.png` ở 1280×800: ảnh mặc định hỏng do URL ảnh cũ; mô tả lặp; panel viền quá lớn và dư khoảng trắng; tên/giá yếu thứ bậc; dinh dưỡng nằm ngoài màn đầu. Đã liệt kê lỗi trước khi sửa.
- Áp skill `/home/dawn/.claude/plugins/cache/ui-ux-pro-max-skill/ui-ux-pro-max/2.13.0/.claude/skills/ui-ux-pro-max/SKILL.md`. Query food-detail UX không có kết quả; retry domain product cho e-commerce có kết quả phù hợp. Chỉ lấy phân cấp nội dung/màu chính; bỏ đề xuất glass/motion không hợp luật Dawn. Checklist trước sửa: ảnh giữ 4:3, giá/CTA rõ, control có nhãn và vùng bấm 44px, focus, thông tin thiếu trung thực, mobile không tràn, theme tối/reduced-motion.
- Chi tiết hai cột desktop: breadcrumb, gallery 4:3, dải ảnh chọn khi nhiều ảnh, tên lớn, kcal/đạm/nhãn, mô tả một lần, giá/suất xanh, quy cách, số lượng và nút thêm giỏ. Ảnh dùng image_urls theo thứ tự, lỗi ảnh/thiếu ảnh dùng CatalogArtwork sẵn có, không gọi URL mặc định bị chặn.
- API adapter hiện chỉ đưa SKU đầu tiên vào Product; ô quy cách hiện một suất đang bán, không tạo biến thể giả hoặc đổi lựa chọn SKU của giỏ. Dưới có bảng gọn bảy chỉ số, dữ liệu thiếu hiện “Chưa có” và thông báo “Chưa đủ dữ liệu dinh dưỡng”; thành phần lấy từ nutrition.components, không suy đoán dị ứng.
- Nguồn gốc nhập mã trên bao bì để tạo link /traceability/<code> đang có. /traceability ở nav hiện không có index route; không tạo link 404, không bịa mã lô từ UUID sản phẩm. Khối liên quan dùng hook đọc catalog cùng chi nhánh, bỏ món hiện tại, lấy tối đa bốn món và tái sử dụng thẻ catalog; có loading/error/empty.
- Thẻ tách sang catalog-product-card.tsx để tái sử dụng; minh hoạ bỏ tên nhìn thấy, giữ accessible name; tên line-clamp-2, bỏ min-height tên cũ, vùng dinh dưỡng giữ chiều cao khi thiếu dữ liệu, giá/nút thẳng hàng. Nhóm Cải dùng minh hoạ rau. Không đổi primitive, admin, API adapter, hook giỏ, URL hoặc dependency.
- File lô 4: product-detail-view.tsx, product-detail-info.tsx, product-gallery.tsx, product-origin.tsx, related-products.tsx, use-related-products.ts, catalog-product-card.tsx, catalog-view.tsx, catalog-artwork.tsx, products.test.tsx, mocks/catalog-lo4-preview.mjs và task này. File source đều dưới 400 dòng; giữ nguyên thay đổi lô 1–3 và next-env.d.ts đã có từ đầu lượt.
- `TMPDIR=/home/dawn/work/ticket/.cache pnpm exec tsc --noEmit`: PASS; `pnpm run lint`: PASS; Vitest trực tiếp (không chạy script ghi /tmp) sáu file products/catalog/nutrition-view/catalog-query/sales/ui-rules-gate: **119/119 PASS**. Log `/home/dawn/work/ticket/.cache/astryx-lo4-{tsc,lint,vitest,browser}.log`. `git diff --check`: PASS.
- Playwright `mocks/catalog-lo4-preview.mjs`: dữ liệu thật qua dev :3003/Kong :8000; bốn món liên quan; tăng/giảm số lượng; bốn thẻ đầu cùng cao 387,5px; lọc ≥30 g đạm còn 16 và reload giữ branch/filter; mobile 375px không tràn; theme tối/reduced-motion; không pageerror/HTTP ≥500. Gallery hai ảnh, dinh dưỡng null và link truy xuất theo mã kiểm bằng route mock riêng sau khi chụp ảnh thật. Không ghi giỏ/backend trong lượt kiểm.
- Bằng chứng `/home/dawn/work/ticket/.cache/video-nghiep-vu/ui-astryx/lo4/`: `truoc-chi-tiet.png`, `chi-tiet.png`, `chi-tiet-cuon.png`, `san-pham.png` đều 1280×800; thêm `mobile.png`, `toi.png`, `kiem-tra.json`. Đã tự xem lại cả ba ảnh desktop và mobile/tối, sửa radius theo token và nhóm minh hoạ Cải sau lượt đầu. Chưa chạy toàn suite/build/Lighthouse; chưa kiểm chọn nhiều SKU vì adapter hiện chỉ cung cấp SKU đầu tiên.
