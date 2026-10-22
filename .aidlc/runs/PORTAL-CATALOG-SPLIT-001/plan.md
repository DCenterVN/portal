# Plan: Tách catalog khách và quản trị sản phẩm

- **Task ID**: PORTAL-CATALOG-SPLIT-001
- **Mode**: hard
- **Story**: US-UI-002
- **Sprint**: 01
- **Issue**: /home/dawn/work/ticket/plans/261022-catalog-split/codex-de-xuat.md
- Repo: /home/dawn/wt/portal-catalog; baseline đọc được `473d8e313e3d56cc630713624469a2750f81f7b6`, branch `portal-catalog-split-001`.
- Quy ước chứng cứ: path portal tương đối với repo trên; `sales/...` tương đối /home/dawn/work/ticket; `preview/...` tương đối /home/dawn/dawn-dotfiles/brain/inbox/portal-ui-preview.

## Scope
- [ASSUMED] Đề xuất REUSE/EXTEND: chuyển điểm mount ProductsView vào console, giữ path feature hiện có để giảm đổi import và xung đột motion; tạo catalog khách trong cùng capability products. Không sửa shell, primitive, token, backend, DB hoặc role catalogue.
- Gốc: `app/(store)/products/page.tsx:8` → ProductsLoader; `features/products/products-loader.tsx:14` gọi getCatalog rồi `:17` render ProductsView. Public API đã đúng, component được chọn sai.
- Bảng quản trị lộ ở store: `features/products/products-view.tsx:43` lọc ACTIVE/DRAFT, `:229` cột SKU, `:327` mount form tạo; U2 catalog vẫn chưa làm tại `.aidlc/planning/board.md:135`. Console hiện chỉ có pricing trong nhóm sales ở `features/console/console-nav.ts:27`.
- Detail cũng trộn hai vai: `app/(store)/products/[id]/page.tsx:9` → ProductDetailLoader; `features/products/product-detail-loader.tsx:13` dùng getCatalogProduct công khai; `features/products/product-detail-view.tsx:38` lại có activate, `:55` có add-to-cart, `:157` thông tin quản trị. Không giữ activate/SKU/barcode/DRAFT trong detail khách.
- Nguồn staff khác shape: `lib/api/sales.ts:40` đang đọc payload.items và normalize SKU; BE trả envelope data.items[{product,variants}] tại `sales/internal/transport/http/catalog.go:202`, `sales/internal/service/catalog.go:216`. Không đổi loader sang helper cũ mà bỏ qua lỗi decode.
- Tạo mới cũng lệch contract: form tại `features/products/product-create-dialog.tsx:48` gọi createProduct với SKU/giá; BE strict DTO là name/slug tại `sales/internal/service/catalog.go:19`, response product+variants tại `sales/internal/transport/http/catalog.go:187`. Tái dùng createDraftProduct tại `lib/api/sales.ts:259`.

## Requirements
- AC-1: /products dùng getCatalog công khai, render card theo nguyên mẫu; anonymous và khách đã đăng nhập không thấy tạo/kích hoạt, bảng SKU/barcode hoặc DRAFT (`app/api/public/catalog/route.ts:11`; `preview/StoreCatalog.dc.html:316`).
- AC-2: /products/[id] vẫn dùng public detail, chỉ tên/mô tả/ảnh/giá/quy cách thật và thao tác khách; không gọi activate hoặc staff products API (`features/products/product-detail-loader.tsx:13`; `lib/api/sales.ts:81`).
- AC-3: /sales/products nằm trong console; staff API hiển thị cả DRAFT với product/variants đúng envelope, lọc tên/trạng thái; tạo nháp dùng name/slug + Idempotency-Key, không gửi status/sellable/giá tuỳ ý (`sales/internal/transport/http/catalog.go:178`, `:197`; `lib/api/sales.ts:259`).
- AC-4: menu và truy cập trực tiếp cần sales:product:read; thiếu/chưa biết quyền không mount màn, không gọi staff list. Nút tạo cần sales:product:create; kích hoạt cần sales:product_listing:update và điều kiện OD-4; không so tên role (`sales/internal/transport/http/catalog.go:49`; `sales/internal/transport/http/sales.go:25`, `:29`, `:61`; `features/console/console-frame.tsx:102`).
- AC-5: thêm giỏ chỉ dùng sku_ref thật + branch_ref của product, không fallback product.id thành SKU; forward branch_id qua BFF và decode envelope trước recordCartResponse. Chỉ báo thành công khi API thành công; hết hàng/UNKNOWN/lỗi/thiếu phiên không tăng giỏ giả (`lib/api/sales.ts:159`, `:212`; `sales/internal/transport/http/catalog.go:85`, `:119`).
- AC-6: hai màn có loading/empty/error/success; 375/390/768/1024/1440, sáng/tối, không tràn trang; mobile filter dùng sheet có Esc/focus/label, control chạm 44px (`components/ui/state.tsx:56`; `components/ui/dialog.tsx:147`; `preview/StoreCatalog.dc.html:683`).
- AC-7: giữ class #019 ở filter console sau merge PORTAL-MOTION; gắn lại cùng module cho filter catalog mới, giữ reduced-motion và các sửa wrap/icon đã thấy trong diff được brief cho phép. Không tạo primitive/style effect thứ hai.
- AC-8: không UUID trong nội dung/nhãn người dùng, không mock wishlist/số lượt mua/thời gian nấu/ảnh; phần thiếu dữ liệu theo OD-1/2. Chỉ tên món hoặc mã nghiệp vụ ở staff (`lib/api/sales.ts:63`; `preview/StoreCatalog.dc.html:324`, `:327`).

## Technical definition
- R16/R20/R22 theo `/home/dawn/work/ticket/plans/261020-fooddev-set/codex-rules.md`: ID chỉ là khoá ẩn, code không comment diễn giải/TODO; AC ở ngay Requirements.
- Layer: route server chỉ mount feature; fetch ở lib/api; không import chéo feature để dùng quyền (`/home/dawn/work/ticket/platform-docs/standards/frontend.md:14`). Tái dùng getProductionContext tại `lib/api/production.ts:316` cho permissions của nút, truyền xuống view qua props; dữ liệu quyền do `app/api/auth/context/route.ts:62`, `:85` cung cấp.
- Không chạy engine, test/build, sửa app hoặc artifacts trong lượt đề xuất. Test do Sonnet viết sau khi Claude duyệt; lệnh bên dưới là kế hoạch, chưa PASS.
- Graph được hỏi trước nhưng không có kết quả cho các symbol portal; chứng cứ lấy source worktree. Chỉ xem PORTAL-MOTION bằng đúng git diff file ProductsView, không đọc file khác của worktree đó.

## UX
- Desktop: tiêu đề + số món đã tải, trái bộ lọc, phải sort/chip + card ảnh/tên/quy cách/giá/CTA; mobile 2 cột + nút mở filter sheet. Mẫu có 3 cột khi có sidebar, 4 khi filter ở trên (`preview/StoreCatalog.dc.html:180`, `:186`, `:241`, `:316`, `:684`). Mobile import chính StoreCatalog ở `preview/StoreCatalogMobile.dc.html:15`, không dựng layout khác.
- Console: giữ shell hiện hữu, toolbar tìm/lọc/1 nút tạo + bảng và empty state theo `preview/ConsoleTable.dc.html:130`, `:141`, `:160`, `:169`; không mang xuất/in/huỷ đơn hoặc dữ liệu CRM mẫu sang products.
- Ảnh thật từ product.image_urls (`sales/internal/store/models.go:34`); thiếu ảnh hiện khung “Chưa có ảnh”, không ảnh món giả. Không thay header/footer/auth/mini-cart của shell (`/home/dawn/work/ticket/platform-docs/standards/frontend.md:13`).
- [ASSUMED] Bộ lọc v1 chỉ tên/khoảng giá/sort giá trên tập đã tải; nhãn ghi rõ “N món đã tải”, next_cursor cho “Xem thêm”, không giả tổng/trang số hoặc lọc toàn DB. Chờ OD-2 cho phần nguyên mẫu chưa có field/API.
- [ASSUMED] DRAFT staff mở thông tin/variants ngay trong bảng, không dẫn tới public detail 404; product ACTIVE mới có link xem catalog. Giữ ProductsView ở path cũ nhưng chỉ route console sử dụng.

## Design
- Staff list: BFF `app/api/sales/products/route.ts:6` → GET /sales/products; `sales/internal/transport/http/catalog.go:49` dùng h.guard(ActionProductRead), h.guard gọi authz.RequireAction tại `sales/internal/transport/http/sales.go:62`; ActionProductRead=`sales:product:read` tại `:26`. SQL list không lọc ACTIVE ở `sales/internal/store/catalog.sql.go:69`; public list mới lọc ACTIVE tại `:91`.
- [ASSUMED] Sửa getProducts thành boundary typed staff rows {product,variants}, decodePlatform + schema Zod; giữ getDraftProducts và caller hiện hữu. ProductsLoader lấy staff rows/quyền; ProductsView nhận props, giữ tạo/lọc và chuyển activate từ detail khách vào console theo OD-4.
- Store giữ getCatalog/getCatalogProduct; mapper tại `lib/api/sales.ts:64` cần giữ thêm image_urls, branch_ref, available_quantity và sku_ref thật; phân biệt giá 0 thật với field thiếu. getCatalog thêm cursor/next_cursor theo BFF `app/api/public/catalog/route.ts:6`, không request từng card.
- Cart hiện addToCart không gửi branch (`lib/api/sales.ts:160`), BFF bỏ query (`app/api/sales/carts/[cart_id]/items/route.ts:6`), BE yêu cầu branch_id (`sales/internal/transport/http/catalog.go:85`). OD-3 đề xuất sửa chính hai file này, chỉ forward query branch_id; branch lấy từ public product, org vẫn quyết định quyền. Decode data thật trước cập nhật cache; không sửa backend/contract hay bypass thiếu tồn.
- Tạo nháp tái dùng createDraftProduct(name,slug) tại `lib/api/sales.ts:259`; form Dialog còn hai trường tên/mã đọc được, giữ Idempotency-Key và lỗi inline; bỏ payload SKU/giá cũ. Không tự bật ACTIVE.
- Menu thêm “Sản phẩm” href/match=/sales/products, action=sales:product:read vào `features/console/console-nav.ts:27`; thêm route vào CONSOLE_ROUTES `lib/fetcher.ts:2` để proxy dùng employee plane/staff-login (`proxy.ts:24`, `:32`). ConsoleFrame đã gate children và menu; không tạo gate theo role.
- Reuse: PageShell/PageHeader (`components/ui/page.tsx:4`, `:27`), Card/Table/Button/Input/Badge đang dùng tại `features/products/products-view.tsx:224`, `:225`, `:277`; DialogContent variant=sheet (`components/ui/dialog.tsx:147`), Skeleton/EmptyState/ErrorState (`components/ui/state.tsx:56`, `:60`, `:64`), useToast/getOrCreateCartId/recordCartResponse/formatVND (`lib/api/sales.ts:198`, `:212`, `:227`). Không thêm primitive hoặc package.
- [ASSUMED] File mới và tests trong Files planned/Slices là đường dẫn đề xuất chưa triển khai; dùng messages vi/en cho nhãn mới, không thay generated files. Giới hạn mỗi view ≤300 dòng theo frontend.md:41.

## Files planned
- `app/(store)/products/page.tsx`
- `features/products/catalog-view.tsx`
- `features/products/catalog-filters.tsx`
- `app/(console)/sales/products/page.tsx`
- `features/products/products-loader.tsx`
- `features/products/products-view.tsx`
- `features/products/product-create-dialog.tsx`
- `features/products/product-detail-view.tsx`
- `lib/api/sales.ts`
- `app/api/sales/carts/[cart_id]/items/route.ts`
- `features/console/console-nav.ts`
- `lib/fetcher.ts`
- `messages/vi.json`
- `messages/en.json`
- `lib/api/sales.test.ts`
- `features/products/catalog.test.tsx`
- `features/products/products.test.tsx`
- `features/console/console-nav.test.ts`
- `e2e/catalog-split/catalog-split.spec.ts`
- `app/rebrand.test.ts`
- `app/api/sales/sales-bff.test.ts`

## Tests planned
- [ASSUMED] Sonnet viết test đỏ sau duyệt, Codex chỉ sửa khi có test; Vitest dùng fixture envelope đúng BE, browser e2e quyền dùng QA thật. Chưa chạy lệnh nào sau đây.
| TC-id | AC | layer | command |
|---|---|---|---|
| TC-1 | AC-1/2/6/8 | render | `pnpm exec vitest run features/products/catalog.test.tsx features/products/products.test.tsx` |
| TC-2 | AC-3/5 | client/BFF | `pnpm exec vitest run lib/api/sales.test.ts app/api/sales/sales-bff.test.ts` |
| TC-3 | AC-4 | unit | `pnpm exec vitest run features/console/console-nav.test.ts` |
| TC-4 | AC-1/2/3/4/5 | e2e | `pnpm exec playwright test e2e/catalog-split/catalog-split.spec.ts --project=desktop` |
| TC-5 | AC-6/7/8 | browser/visual | `pnpm exec playwright test e2e/catalog-split/catalog-split.spec.ts --project=mobile` |
| TC-6 | AC-2/3/7 | regression | `pnpm exec vitest run app/rebrand.test.ts features/products/products.test.tsx` |
| TC-7 | mọi AC | static/build | `pnpm run typecheck && pnpm run lint && pnpm run build` |

- TC-1 render DOM thật: store list/detail không tạo/kích hoạt/SKU/DRAFT, grid/sheet/empty/error khác nhau; không chỉ React.createElement như test cũ `features/products/products.test.tsx:28`.
- TC-2: nested staff data, DRAFT không bị bỏ, tạo name/slug đúng key; add cart dùng SKU+branch, envelope success; 401/403/409/503 không tăng cache/toast thành công.
- TC-3/4: staff có đúng read thấy menu + màn DRAFT; staff không read không thấy menu và URL trực tiếp bị denied, không gọi list; chờ quyền không mount; role-name-only không được qua (`features/console/console-nav.test.ts:11`).
- TC-4/5: anonymous + customer xem store không thấy control nhân viên; staff tạo nháp qua API đúng grant rồi đọc lại; cart success cần fixture QA bán được, thiếu thì ghi blocked, không mock/seed để nhận live PASS. Credential chỉ trong bộ nhớ.
- TC-5: thêm viewport 375/768/1024/1440 và sáng/tối trong spec, keyboard/focus/Esc, reduced-motion và horizontal overflow; chụp trạng thái thật, không ghi đè baseline cũ. Config mặc định desktop/mobile ở `playwright.config.ts:19`.
- Trước TC-4/5 mở server bằng `pnpm run dev -- --port 3000`, chờ /staff/login sẵn sàng rồi dùng reuseExistingServer (`playwright.config.ts:26`); không để config khởi động command npm mặc định tại `:24`.
- Dùng pnpm exec trực tiếp, không npm test vì `package.json:13` ghi /tmp; TMPDIR=/home/dawn/work/ticket/.cache/tmp. Chỉ kiểm sau có code; không chạy engine hoặc ghi artifacts trong lượt này.

## Slices
- [x] S1: Sonnet viết regression đỏ cho tách vai/API/quyền (files: lib/api/sales.test.ts, features/products/catalog.test.tsx, features/console/console-nav.test.ts, e2e/catalog-split/catalog-split.spec.ts, app/api/sales/sales-bff.test.ts; test: TC-1, TC-2, TC-3, TC-4)
- [x] S2: boundary staff/public và cart đúng envelope/branch theo OD-3 (files: lib/api/sales.ts, app/api/sales/carts/[cart_id]/items/route.ts, lib/api/sales.test.ts, app/api/sales/sales-bff.test.ts; test: TC-2)
- [x] S3: catalog card + filter desktop/mobile thay route store (files: app/(store)/products/page.tsx, features/products/catalog-view.tsx, features/products/catalog-filters.tsx, messages/vi.json, messages/en.json; test: TC-1, TC-5)
- [x] S4: ProductsView tạo/lọc/kích hoạt thuộc console, sửa form staff đúng DTO (files: app/(console)/sales/products/page.tsx, features/products/products-loader.tsx, features/products/products-view.tsx, features/products/product-create-dialog.tsx, features/products/products.test.tsx; test: TC-1, TC-2, TC-4)
- [x] S5: menu và route employee theo read action, fail-closed (files: features/console/console-nav.ts, lib/fetcher.ts, features/console/console-nav.test.ts; test: TC-3, TC-4)
- [x] S6: detail khách bỏ thao tác/metadata quản trị, sửa regression liên quan (files: features/products/product-detail-view.tsx, features/products/products.test.tsx, app/rebrand.test.ts; test: TC-1, TC-6)
- [ ] S7: gắn lại #019 và giữ sửa wrap/icon sau PORTAL-MOTION (files: features/products/catalog-filters.tsx, features/products/products-view.tsx, features/products/catalog.test.tsx, e2e/catalog-split/catalog-split.spec.ts; test: TC-5, TC-6)

## Risks / rollback
- Merge sau PORTAL-MOTION; diff được phép xem có import ./filter-motion.module.css, 3 motion.filter, wrap actions/filter và căn giữa icon. Không đọc CSS/worktree khác để suy timing. [ASSUMED] Sau merge tái dùng nguyên module cùng feature, kiểm lại reduced-motion; nếu module đổi thì cập nhật plan trước khi sửa ngoài Files planned.
- Không git mv ProductsView giúp giảm xung đột, nhưng vẫn conflict nội dung; giữ cả motion lẫn API/model mới, không chọn ours/theirs toàn file. #019 gắn catalog-filters mới, không giữ bộ lọc trạng thái staff ở store.
- Frontend không sửa bug activate tìm SKU bằng product ID (`sales/internal/service/service.go:125`, `:139`); không giả success hoặc đổi sang SKU ID để lách. Dữ liệu live đủ điều kiện và sửa API là điều kiện cho acceptance mutation theo OD-4.
- [ASSUMED] Rollback revert riêng change-set UI sau khi task được phép ship; không đổi backend/data. Không commit/push trong lượt đề xuất này.
- Baseline có thay đổi .aidlc/ACTIVE, trace.jsonl và run do bên giao tạo; giữ nguyên. Không đánh dấu U2/U3 DONE hoặc sinh receipt từ plan.

## Open decisions
- Claude 22/10 đề xuất: OD-1 bỏ tim/khuyến mãi/đánh giá; OD-2 chỉ lọc phần có dữ liệu; OD-3 duyệt sửa giỏ (2 file FE/BFF), live PASS chờ dữ liệu SALES-FLOW-001; OD-4 không đặt nút kích hoạt ở console tới khi SALES-FLOW-001 sửa lifecycle, chỉ gỡ khỏi detail khách. Nghiệm thu = `sdlc.py verify` (TC-7), không có slice nghiệm thu riêng.
- OD-1 [ASSUMED]: đề xuất không render tim yêu thích/khuyến mãi/đánh giá khi chưa có API thật; mẫu có heart tại `preview/StoreCatalog.dc.html:324`, mapper thật tại `lib/api/sales.ts:63` chưa có wishlist. Claude duyệt bỏ khỏi v1, không local mock.
- OD-2 [ASSUMED]: nhóm hàng/khẩu phần/thời gian nấu/bán chạy và tổng trang của mẫu `preview/StoreCatalog.dc.html:188`, `:195`, `:202`, `:243` thiếu metadata/filter server trong public BFF `app/api/public/catalog/route.ts:6`. Đề xuất chỉ phần có dữ liệu, filter trên tập đã tải với nhãn rõ; hoàn thiện toàn nguyên mẫu là task API riêng, không tự chế trường.
- OD-3 [ASSUMED]: cho phép hai sửa FE client/BFF đã khoanh ở S2 để quick-add hoạt động theo guard branch hiện hữu; cần bán được qua API thật trước khi nhận PASS. Nếu không duyệt phạm vi đó, CTA chỉ “Xem món”, không nút Thêm giả; bỏ AC-5 mutation và S2 cart khỏi plan trước cook.
- OD-4 [ASSUMED]: giữ/chuyển vị trí UI kích hoạt vào console nhưng chưa bật khi API product lifecycle chưa đúng. Claude chốt dependency task sales hoặc hoãn acceptance kích hoạt; không mở rộng Files planned sang BE. Bug và chặn dữ liệu đã có tại `/home/dawn/work/ticket/plans/261022-ui-motion/handoff-qa-data-catalog.md`, cơ chế source `sales/internal/service/service.go:125`.
