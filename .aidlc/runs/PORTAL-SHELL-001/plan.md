# Plan: Một layout cho mỗi loại người dùng theo kit Đồng xanh: StoreShell (khách), ConsoleShell (nhân viên + nền tảng), AuthShell; một bộ nút; glass đúng chỗ

- **Task ID**: `PORTAL-SHELL-001`
- **Mode**: `hard`
- **Story**: US-UI-002
- **Sprint**: 02
- **Issue**: Dawn 2026-09-29: "chưa có layout thống nhất… employee là CRM, user là landing page hiện đại… button không thống nhất… dùng glass j j mà".

## Scope
- Outcome:
  - Mỗi URL rơi vào đúng **một** shell theo loại người dùng:
    - Khách: landing hiện đại (header trắng + footer màu chrome).
    - Nhân viên và nền tảng: CRM (sidebar màu chrome + topbar + thanh trạng thái).
    - Đăng nhập: card giữa màn.
  - Một bộ nút duy nhất, không màn nào tự đè style.
  - Không glass ngoài scrim của dialog.
  - Mỗi quy tắc trên có test đỏ khi bị vi phạm.
- Nguồn thiết kế đã chốt: kit "Đồng xanh" https://claude.ai/artifact/FyxNUSiHT9mjbweEy97EWi, bản lưu `kit.html` trong run này. §1 = khách, §2 = nhân viên, §5 = popup đăng nhập. Tài liệu `platform-docs/ui/2026-09-25-layout-shell-va-bo-component.md` đang DRAFT. Chỗ nào nó lệch kit thì **theo kit** (liệt kê ở Design).
- Decision: EXTEND + REMOVE. Tách `navbar.tsx` thành StoreShell. Dựng lại shell cũ thành ConsoleShell và gộp `platform-shell.tsx` vào đó. Sau đó xoá `navbar.tsx`, `layout/{app-shell,header,sidebar,platform-shell}.tsx`.
- Impact (đo 2026-09-29, có red-team `ecc:architect`):
  - Gốc lỗi: `app/layout.tsx` gắn `<Navbar />` cho **mọi** trang. `components/navbar.tsx:125` chỉ ẩn navbar ở auth, `/platform` và `/company`. Vì vậy `/console`, `/production/*`, `/inventory/*` và `/sales/*` mang header landing của khách.
    - Navbar hardcode user "Nguyễn Văn Quản" (`navbar.tsx:279`) và chi nhánh mẫu (`:37-71`).
  - Có 3 kiểu khung:
    - `Navbar`.
    - `PlatformShell` (`features/platform/workspace.tsx:10,67`).
    - `AppShell` (không ai dùng; `components/layout/index.ts:1-3` vẫn export nó).
    - EMPLOYEE-001 S1 còn định tạo thêm `employee-shell.tsx`.
  - Sidebar cũ có link chết `/goods-receipt`, `/qc-decision`, `/suppliers` (`layout/sidebar.tsx:58-72`).
  - 33 `page.tsx` nằm phẳng, chưa có route group.
  - Glass `backdrop-blur` có ở 10 chỗ. Kit chỉ blur 3px ở scrim (`kit.html:189`); header khách của kit nền `surface` đặc (`kit.html:221`).
  - Nút:
    - Kit `.btn` cao tối thiểu 44px, chữ 15px/600. `button.tsx` mặc định `h-9` (36px).
    - Có 22 chỗ `<Button className>` đè `bg-/rounded/h-/px-` trong 16 file, một số dùng màu thô như `bg-amber-600`.
    - Có 3 `<button>` thô.
  - Các chỗ phụ thuộc đã kiểm:
    - `size="touch"` dùng ở 26 chỗ trong 15 file.
    - `variant="secondary"` ở `features/platform/my-company-view.tsx:48`.
    - `ui/page.tsx:12` render `<main>`; 25 view dùng nó.
    - `app/page.tsx:28,74` tự có `<main>` và `<footer>`.
    - `lib/fetcher.ts:57-66` đá sang `/login` khi gặp 401.
    - Type sinh sẵn ở `.next/types` trỏ theo đường dẫn file (`tsconfig.json:35-36`).
    - archcheck đọc baseline theo đường dẫn file (`archcheck.py:174-180`).

## Prerequisite (không thuộc slice, làm trước S0)
1. **PORTAL-PLATFORM-001 phải commit trước.** Code 19/19 của nó đang chưa commit trên `main`. Làm tuần tự review, `gate pr`, rồi commit. Run đó cần `--task PORTAL-PLATFORM-001` vì ACTIVE giờ là task này.
2. **Nhánh portal.** Local `feature/ui-uxuipromax-screens` (1c0a1ed) đi trước `main` (864266a) 2 commit của Dawn: 1fa6df4 (baseline) và 1c0a1ed (receipt Anti). Fast-forward được. Dawn chạy:
   `! git -C portal merge --ff-only feature/ui-uxuipromax-screens && git -C portal push origin main feature/ui-uxuipromax-screens`
3. **platform-docs.**
   - Merge `origin/docs-brand-dong-xanh` (commit c86f94c, tokens Đồng xanh). Nó vẫn chưa có trên `origin/main`.
   - Thêm token `chrome` vào `ui/tokens.json`: sáng = `ink` `#14291A`, tối = `#0A120C`. Kit dùng `var(--ink)` ở sáng và `#0A120C` ở tối (`kit.html:230-232,254-256`).
   - Chuyển tài liệu layout lên ACCEPTED, ghi các điểm lệch ở Design.
   - Làm trong một commit riêng ở repo platform-docs, như PORTAL-BRAND-001 đã làm.
4. **ARCH-ALIGN-001 S6** (`navbar.tsx`, `.aidlc/planning/board.md:19`) bị task này thay. Dawn đóng slice đó.

## Requirements
- FR-1 (một shell mỗi nhóm):
  - Mỗi `page.tsx` nằm dưới `(store)`, `(console)`, `(auth)`, `platform/` hoặc `company/`. Shell chỉ được chọn ở `layout.tsx` của nhóm.
  - `app/layout.tsx` chỉ giữ html/body/font/provider, không header, JSON-LD hay `robots index`.
  - AC-1: `npm test -- app/layout-gate` xanh khi:
    - (a) mọi `page.tsx` thuộc một trong 5 gốc trên;
    - (b) chỉ `app/**/layout.tsx`, `app/not-found.tsx` và `features/{store,console}/*-frame.tsx`, `features/platform/workspace.tsx` được import `@/components/layout`;
    - (c) không còn file nào import `@/components/navbar`.
- FR-2 (khách = landing, kit §1): StoreShell.
  - Header nền `surface` đặc, viền dưới `line`, cao 64px (56px mobile). Header gồm:
    - logo;
    - nav dạng pill, mục đang chọn có `aria-current` và vạch `accent` 2px dưới;
    - ô tìm kiếm;
    - tài khoản;
    - link giỏ.
  - Mobile: nav và ô tìm kiếm vào menu.
  - Footer nền `chrome`:
    - 4 cột (1.4fr + 3); tiêu đề cột 12px, viết hoa, màu `sun`;
    - dòng pháp lý có viền trên;
    - mobile còn 2 cột.
  - Nội dung rộng tối đa 1280px.
  - AC-2: `/`, `/products`, `/cart`, `/orders`, `/me`, `/traceability/[code]` render `data-surface="store"`, có đúng 1 `<main id="main">`, 1 `<header>`, 1 `<footer>` và không sidebar. Khách chưa đăng nhập vào `/` **không** bị chuyển sang `/login`.
- FR-3 (nhân viên = CRM, kit §2): ConsoleShell.
  - Sidebar nền `chrome` đặc, rộng 240px, thu gọn còn 68px. Trạng thái thu gọn lưu `localStorage` (có try/catch); dưới 1024px mặc định thu gọn.
  - Sidebar gồm:
    - logo;
    - thẻ chi nhánh (icon `sun`, tên chi nhánh **thật** lấy từ context);
    - menu nhóm theo module (tiêu đề nhóm 11px, viết hoa); mục đang chọn nền trắng 12% alpha, chữ trắng;
    - khối "tôi" (tên **thật** từ `/api/auth/me`).
  - Topbar nền `surface`, viền dưới `line`, có nút thu gọn với `aria-expanded`.
  - Thanh trạng thái cuối trang có chấm "live".
  - Menu chỉ gồm route có thật. Nội dung rộng tối đa 1440px.
  - AC-3: `/console`, `/branches`, `/memberships`, `/roles`, `/inventory/shelves`, `/production/*`, `/sales/pricing` render `data-surface="console"` với sidebar và topbar. Mọi href trong menu có `page.tsx` thật. Không còn dữ liệu mẫu (`SAMPLE_*`, "Nguyễn Văn Quản").
- FR-4 (nền tảng): `/platform/*` và `/company/*` dùng ConsoleShell.
  - Thẻ chi nhánh hiển thị nhãn mặt phẳng: "Nền tảng" hoặc tên công ty.
  - Menu từ `navFor()` (`workspace.tsx:32`). Kiểu `ShellNavItem {href,label,match}` giữ nguyên và export từ `console-shell.tsx`.
  - AC-4: `platform-shell.tsx` bị xoá; `npm test -- features/platform` xanh; `workspace.tsx` không còn `<main>` riêng.
- FR-5 (auth, kit §5): `/login`, `/register`, `/activate`, `/forgot-password`, `/reset-password`, `/switch-branch`, `/switch-org` dùng khung chung trong `app/(auth)/layout.tsx`:
  - SkipLink, logo, card ở giữa màn, `MiniFooter` 1 dòng, `main#main`.
  - Tiêu đề và mô tả của từng trang đi qua `components/patterns/auth-heading.tsx`.
  - AC-5: các trang này có `data-surface="store"`, không sidebar, không header store, không glass.
- FR-6 (một bộ nút): `Button` theo kit, **giữ nguyên tên mọi variant/size** để không vỡ chỗ đang dùng.
  - Base: `min-h-11` (44px), `px-5`, `rounded-[var(--radius-md)]`, chữ 15px/600.
  - Size:
    - `sm`: `min-h-9` (36px), 14px.
    - `touch`, `lg`: bằng base.
    - `icon`: ô vuông 44px.
  - Variant:
    - `default`: primary gradient.
    - `accent`: giữ như hiện tại.
    - `outline` và `secondary`: cùng style quiet (nền `surface`, viền `line`, hover viền `input`).
    - `ghost`: hover nền `tint`.
    - `destructive` và `link`: giữ như hiện tại.
  - Màu trạng thái (amber/purple…) không đặt lên nút. Nút dùng `default`/`outline`/`destructive`; màu trạng thái để cho `Badge`.
  - AC-6: `app/layout-gate` báo 0 `<Button>` có `className` chứa `bg-`, `rounded`, `h-<số>` hay `px-` (quét nhiều dòng), và 0 `<button>` thô trong `app/`, `features/`.
- FR-7 (glass): `backdrop-blur` chỉ còn trên scrim trong `components/ui/dialog.tsx`, theo kit.
  - AC-7: gate đếm file có `backdrop-blur` = {`components/ui/dialog.tsx`}.
- FR-8 (mock tách khỏi code chính, Dawn 29/9): mọi dữ liệu giả nằm trong một thư mục `mocks/` ở gốc portal, không nằm trong `app/`, `features/`, `components/` hay `lib/`. Dữ liệu giả là thứ chưa có API thật: thông báo topbar, trạng thái "live", số giỏ trước khi có `use-cart`, fixture cho test.
  - Mỗi file mock ghi rõ API nào sẽ thay nó.
  - Chỉ được import `@/mocks/*` ở `features/{store,console}/*-frame.tsx` và file `*.test.ts(x)`.
  - Khi có API thật thì xoá file mock; `typecheck` đỏ chính là danh sách chỗ cần nối API.
  - AC-8: `app/layout-gate` báo:
    - 0 import `@/mocks` ngoài danh sách được phép;
    - 0 hằng `SAMPLE_`/`MOCK_` trong `app/`, `features/`, `components/`, `lib/`;
    - 0 tên người/chi nhánh hardcode ("Nguyễn Văn Quản", "CN-HCM-").
  - `SAMPLE_BRANCHES` ở `app/branches/page.tsx`, `navbar.tsx` và `layout/header.tsx` bị xoá chứ không chuyển sang `mocks/`, vì chi nhánh đã có API context thật.
- Ngoài phạm vi:
  - Nội dung nghiệp vụ từng màn: CUSTOMER-001, EMPLOYEE-001, ORG-001.
  - Ẩn mục menu theo quyền org: EMPLOYEE-001 S1, làm trên ConsoleShell này.
  - Số lượng giỏ trên badge: CUSTOMER-001 S3 `use-cart`. Tới lúc đó, link giỏ không có số.
  - StationShell.

## Technical definition
- Tầng: `ui → layout → features → app` (frontend.md FE-01..05).
  - `components/layout/*` chỉ nhận props.
  - `features/store/store-frame.tsx` và `features/console/console-frame.tsx` là client component, lấy dữ liệu qua `lib/api`/`fetch`, **không import feature khác** (FE-04).
- Session trong store-frame dùng `fetch("/api/auth/me")` thô, **không** qua `apiFetch`, vì `apiFetch` gặp 401 sẽ đá sang `/login` (`lib/fetcher.ts:57-66`). Nếu 401 thì hiện header khách vãng lai. Không đọc cookie ở server layout, để `/` giữ static cho SEO.
- console-frame lấy `/api/auth/me` + `/api/auth/context` để có tên người dùng và tên chi nhánh thật. Không dùng `SAMPLE_*` (FE-05, `archcheck.py:141`).
- SEO:
  - JSON-LD Organization/WebSite và `robots: index` chuyển từ `app/layout.tsx:75-85,140-147` sang `app/(store)/layout.tsx`.
  - Root, (console) và (auth) để `robots: noindex`.
  - `app/not-found.tsx` render StoreShell.
- Mỗi trang chỉ một `<main>`, do shell cấp. `components/ui/page.tsx:12`, `app/page.tsx:28`, `trace-view.tsx:30` và `workspace.tsx:55,82,126` đổi `<main>` thành `<div>`. Footer riêng ở `app/page.tsx:74` bị bỏ.
- Token: dùng `app/tokens.generated.css` + token `chrome` mới (Prerequisite 3). Nền chrome dùng `bg-[var(--color-chrome)]`, chữ và alpha trên chrome dùng `text-white/85`, `bg-white/8`, `bg-white/12`.
  - Kích thước dùng thang Tailwind (`w-60`, `w-[68px]` thì đổi thành `w-17`, `h-16`, `min-h-11`). Không dùng px tuỳ ý hay `z-` số, để không sinh dòng FE-10 mới. z-index lấy từ token.
- Test chạy môi trường `node` với `renderToStaticMarkup` (`vitest.config.ts:13`). Không thêm jsdom. Logic tương tác tách thành hàm thuần có test: `initialCollapsed(width, stored)` và `isActive(pathname, match)`. Aria và `data-collapsed` kiểm bằng static render.
- Dời file bằng `git mv`. Sau mỗi lần dời, xoá type cũ (`rm -rf .next/types .next/dev/types`) trước khi `typecheck`.
- archcheck baseline chỉ được giảm:
  - Khi dời, sửa nợ luôn trong file bị dời (vd. `'use client'` FE-06 ở `me`/`switch-branch`) để đường dẫn mới không sinh dòng NEW.
  - Sau mỗi slice dời/xoá, Dawn chạy `! python3 ~/agent_skills/sdlc/engine/archcheck.py --write-baseline` (lệnh này chỉ thu nhỏ baseline, không cho tăng).

## UX
Mockup chuẩn là `kit.html`: §1 → StoreShell, §2 → ConsoleShell, §5 → khung auth, §4 → control. Lề 16/24/32px. Trang console đi theo thứ tự `PageHeader` → nội dung. `prefers-reduced-motion` thì tắt animation thu gọn sidebar.

## Design
| Shell | File | Dùng cho | Lệch tài liệu DRAFT, theo kit |
|---|---|---|---|
| `StoreShell` | `components/layout/{store-shell,store-header,site-footer}.tsx` | `app/(store)/`, `app/not-found.tsx` | header đặc, **không glass**; footer `chrome` (DRAFT ghi `tint`) |
| `ConsoleShell` | `components/layout/{console-shell,console-sidebar,console-header}.tsx` | `app/(console)/`, `platform/`, `company/` | sidebar `chrome` đặc (DRAFT ghi `surface`); có thanh trạng thái cuối |
| khung auth | `app/(auth)/layout.tsx` + `components/layout/auth-shell.tsx` (viết lại) | `app/(auth)/` | card giữa màn + MiniFooter, thay cho layout chia đôi hiện tại |

Menu nhân viên (`console-frame.tsx`):
- Tổng quan: `/console`
- Kho: `/inventory/shelves`
- Sản xuất: `/production/targets`, `/production/food-plans`, `/production/orders`, `/production/qc`
- Bán hàng: `/sales/pricing`
- Quản trị: `/branches`, `/memberships`, `/roles`

## Files planned
- vitest.config.ts
- app/tokens.generated.css
- app/globals.css
- components/ui/button.tsx
- components/ui/button.test.tsx
- components/ui/page.tsx
- components/ui/page.test.tsx
- components/ui/dialog.tsx
- components/ui/toast.tsx
- components/ui/overlay.test.tsx
- components/modals/session-timeout-modal.tsx
- components/patterns/auth-heading.tsx
- components/layout/index.ts
- components/layout/console-shell.tsx
- components/layout/console-sidebar.tsx
- components/layout/console-header.tsx
- components/layout/console-shell.test.tsx
- components/layout/store-shell.tsx
- components/layout/store-header.tsx
- components/layout/site-footer.tsx
- components/layout/store-shell.test.tsx
- components/layout/auth-shell.tsx
- components/layout/app-shell.tsx
- components/layout/header.tsx
- components/layout/sidebar.tsx
- components/layout/platform-shell.tsx
- components/navbar.tsx
- app/layout.tsx
- app/not-found.tsx
- app/layout-gate.test.ts
- app/(auth)/
- app/(store)/
- app/(console)/
- app/activate/
- app/login/
- app/register/
- app/forgot-password/
- app/reset-password/
- app/switch-branch/
- app/switch-org/
- app/page.tsx
- app/products/
- app/cart/
- app/orders/
- app/me/
- app/traceability/
- app/console/
- app/branches/
- app/memberships/
- app/roles/
- app/inventory/
- app/production/
- app/sales/
- features/auth/
- features/store/store-frame.tsx
- features/store/store-frame.test.ts
- features/console/console-frame.tsx
- features/console/console-frame.test.ts
- features/console/live-console.tsx
- features/platform/workspace.tsx
- features/branches/branches-view.tsx
- features/memberships/memberships-view.tsx
- features/roles/roles-view.tsx
- components/auth/login-form.tsx
- components/modals/allergen-warning-modal.tsx
- components/modals/cold-chain-violation-modal.tsx
- components/modals/confirm-qc-decision-modal.tsx
- components/modals/invite-member-modal.tsx
- components/modals/quantity-variance-modal.tsx
- components/modals/session-timeout-modal.tsx
- components/modals/supplier-suspension-modal.tsx
- features/traceability/trace-view.tsx
- features/products/cart-view.tsx
- features/products/product-detail-view.tsx
- features/products/products-view.tsx
- features/products/product-create-dialog.tsx
- features/production/orders-view.tsx
- features/production/qc-view.tsx
- features/inventory/shelves-view.tsx
- messages/vi.json
- messages/en.json
- mocks/
- .aidlc/runs/PORTAL-SHELL-001/

## Tests planned
| TC | AC | Layer | Command |
|---|---|---|---|
| TC-0 | token | unit | `npm test` + đúng 1 token chrome sáng `#14291A` và 2 token chrome tối `#0A120C` trong `app/tokens.generated.css` |
| TC-1 | AC-6 | unit | `npm test -- components/ui/button` (`buttonVariants()` base chứa `min-h-11`; `sm` = `min-h-9`; `touch`/`lg` không thấp hơn base) + `npm run typecheck` |
| TC-2 | AC-3 | unit | `npm test -- components/layout/console-shell` (`initialCollapsed`, `isActive`; static render có `data-collapsed`, `aria-expanded`, `aria-current`, 1 `<main id="main">`) |
| TC-3 | AC-2 | unit | `npm test -- components/layout/store-shell` (static render: 1 header, 1 footer, 4 cột, 1 `<main id="main">`, không `backdrop-blur`) |
| TC-4 | AC-2 | unit | `npm test -- features/store/store-frame` (401 từ `/api/auth/me` → props khách vãng lai, không gọi `apiFetch`/redirect) |
| TC-5 | AC-3 | unit | `npm test -- features/console/console-frame` (mọi href menu có `page.tsx` thật trong `app/`) |
| TC-6 | AC-1,6,7,8 | unit (quét fs) | `npm test -- app/layout-gate` |
| TC-7 | AC-4 | unit | `npm test -- features/platform` |
| TC-8 | tất cả | regression | `rm -rf .next/types .next/dev/types && npm run typecheck && npm run lint && npm test && python3 ~/agent_skills/sdlc/engine/archcheck.py` |
| TC-9 | AC-2..5 | e2e/UI | `python3 .aidlc/runs/PORTAL-SHELL-001/anti_check.py` (chi tiết bên dưới) |

TC-9 gồm:
- Ảnh cho 3 vai (khách vãng lai, nhân viên, platform) × 375/1440px × sáng/tối.
- DOM probe: `data-surface`, số `<main>`, số phần tử có `backdrop-filter` ≠ none ngoài scrim dialog = 0, URL `/` lúc chưa đăng nhập vẫn là `/`.

Mutation (điều kiện nghiệm thu):
- Xoá `data-collapsed` → TC-2 đỏ.
- Thêm href `/suppliers` vào menu → TC-5 đỏ.
- Thêm `backdrop-blur` vào `toast.tsx` → TC-6 đỏ.
- Thêm `className="h-9"` vào một `<Button>` → TC-6 đỏ.
- Đổi store-frame sang `apiFetch` → TC-4 đỏ.
- Import `@/mocks/console` từ một view → TC-6 đỏ.
- Thêm `const SAMPLE_X` vào `features/` → TC-6 đỏ.

## Slices
- [x] S0: token chrome vào portal + loại artefact AIDLC khỏi Vitest (files: app/tokens.generated.css, app/globals.css, vitest.config.ts; test: npm test && test "$(grep -c -- '--color-chrome: #14291A;' app/tokens.generated.css)" -eq 1 && test "$(grep -c -- '--color-chrome: #0A120C;' app/tokens.generated.css)" -eq 2)
- [x] S1: Button theo kit, giữ tên variant/size (files: components/ui/button.tsx, components/ui/button.test.tsx; test: npm test -- components/ui/button && npm run typecheck)
- [x] S2: ConsoleShell CRM chỉ nhận props, export ShellNavItem, index.ts bỏ export shell cũ (files: components/layout/console-shell.tsx, components/layout/console-sidebar.tsx, components/layout/console-header.tsx, components/layout/console-shell.test.tsx, components/layout/index.ts; test: npm test -- components/layout/console-shell && npm run typecheck)
- [x] S3: StoreShell landing, header đặc, footer chrome (files: components/layout/store-shell.tsx, components/layout/store-header.tsx, components/layout/site-footer.tsx, components/layout/store-shell.test.tsx, components/layout/index.ts; test: npm test -- components/layout/store-shell)
- [x] S4a: Khung (auth): layout nhóm card + MiniFooter, AuthHeading (files: app/(auth)/, components/layout/auth-shell.tsx, components/patterns/auth-heading.tsx; test: npm run typecheck)
- [x] S4b: Dời login/register/activate vào (auth) (files: app/(auth)/, app/login/, app/register/, app/activate/, features/auth/; test: rm -rf .next/types .next/dev/types && npm run typecheck && npm test -- features/auth)
- [x] S4c: Dời forgot/reset/switch-branch/switch-org vào (auth) (files: app/(auth)/, app/forgot-password/, app/reset-password/, app/switch-branch/, app/switch-org/; test: rm -rf .next/types .next/dev/types && npm run typecheck && npm test -- features/auth)
- [x] S5a: store-frame (fetch thô, 401 → khách vãng lai) + mocks/store.ts + layout (store) (files: app/(store)/, features/store/store-frame.tsx, features/store/store-frame.test.ts, mocks/; test: npm test -- features/store)
- [x] S5b: Root layout chỉ còn provider, SEO về (store), dời trang chủ, not-found (files: app/layout.tsx, app/page.tsx, app/not-found.tsx, app/(store)/; test: rm -rf .next/types .next/dev/types && npm run typecheck)
- [x] S5c: Dời products/cart vào (store) (files: app/(store)/, app/products/, app/cart/; test: rm -rf .next/types .next/dev/types && npm run typecheck)
- [x] S5d: Dời orders/me/traceability vào (store) (files: app/(store)/, app/orders/, app/me/, app/traceability/; test: rm -rf .next/types .next/dev/types && npm run typecheck && npm test)
- [x] S6: Một `<main>` mỗi trang (files: components/ui/page.tsx, components/ui/page.test.tsx, app/(store)/page.tsx, features/traceability/trace-view.tsx; test: npm test && ! grep -n '<main' components/ui/page.tsx features/traceability/trace-view.tsx app/\(store\)/page.tsx)
- [x] S7a: console-frame dữ liệu thật + mocks/console.ts + layout (console) (files: app/(console)/, features/console/console-frame.tsx, features/console/console-frame.test.ts, mocks/; test: npm test -- features/console)
- [x] S7b: Dời console/branches, gỡ SAMPLE khỏi branches (files: app/(console)/, app/console/, app/branches/, features/branches/branches-view.tsx; test: rm -rf .next/types .next/dev/types && npm run typecheck && npm test -- features/branches)
- [x] S7c: Dời memberships/roles/inventory (files: app/(console)/, app/memberships/, app/roles/, app/inventory/; test: rm -rf .next/types .next/dev/types && npm run typecheck)
- [x] S7d: Dời production/sales (files: app/(console)/, app/production/, app/sales/; test: rm -rf .next/types .next/dev/types && npm run typecheck)
- [x] S7e: Xoá navbar/header/sidebar/app-shell, chuyển regression test sang console nav (files: components/navbar.tsx, components/layout/app-shell.tsx, components/layout/header.tsx, components/layout/sidebar.tsx, components/ui/overlay.test.tsx; test: rm -rf .next/types .next/dev/types && npm run typecheck && npm test)
- [x] S8: Nền tảng/công ty dùng ConsoleShell, workspace bỏ `<main>`, xoá PlatformShell (files: features/platform/workspace.tsx, components/layout/platform-shell.tsx; test: npm test -- features/platform && npm run typecheck)
- [x] S9a: Dọn glass và fixture khỏi toast/membership; dialog giữ scrim glass (files: components/ui/dialog.tsx, components/ui/toast.tsx, features/memberships/memberships-view.tsx; test: ! grep -n 'backdrop-blur' components/ui/toast.tsx features/memberships/memberships-view.tsx)
- [x] S9b: Gate layout/glass/main/mocks và dọn dependency cuối (files: app/layout-gate.test.ts, features/traceability/trace-view.tsx, components/modals/session-timeout-modal.tsx, app/(console)/memberships/page.tsx; test: npm test -- app/layout-gate && npm run typecheck)
- [x] S10: Bỏ override nút ở auth (files: features/auth/; test: npm test -- features/auth)
- [x] S11: Bỏ override nút + `<button>` thô ở khách/kho (files: features/products/cart-view.tsx, features/products/product-detail-view.tsx, features/console/live-console.tsx, features/inventory/shelves-view.tsx, app/(store)/me/; test: npm test -- features/products features/inventory features/console)
- [x] S12a: Bỏ override nút màu thô ở sản phẩm/sản xuất (files: features/products/products-view.tsx, features/products/product-create-dialog.tsx, features/production/orders-view.tsx, features/production/qc-view.tsx; test: npm test -- features/products features/production)
- [x] S12b: switch-branch + bật gate nút toàn cây (files: app/(auth)/switch-branch/, app/layout-gate.test.ts, features/memberships/memberships-view.tsx; test: npm test -- app/layout-gate && npm test)
- [x] S14: Sửa review-2: profile `display_name` rỗng vẫn hợp lệ (nhãn dự phòng), gate Button quét AST bắt cả callback `=>` và biểu thức JSX, dọn 7 override Button còn sót (review-2-codex-sol.md #1, #2) (files: features/store/store-frame.tsx, features/console/console-frame.tsx, app/layout-gate.test.ts, features/memberships/memberships-view.tsx, features/roles/roles-view.tsx; test: npm test && npm run lint)
- [x] S15: Dọn override Button ở components/ phần 1 (review-3-codex-sol.md #1) chỉ bằng variant/size có sẵn (files: components/auth/login-form.tsx, components/modals/allergen-warning-modal.tsx, components/modals/cold-chain-violation-modal.tsx, components/modals/confirm-qc-decision-modal.tsx, components/modals/invite-member-modal.tsx; test: npm test && npm run lint)
- [x] S16: Dọn override Button ở components/ phần 2, mở rộng gate Button AST sang components/ (0 override toàn portal) (files: components/modals/quantity-variance-modal.tsx, components/modals/session-timeout-modal.tsx, components/modals/supplier-suspension-modal.tsx, app/layout-gate.test.ts; test: npm test && npm run lint)
- [x] S13: Bằng chứng UI 3 vai × 2 cỡ × 2 theme + máy chấm (files: .aidlc/runs/PORTAL-SHELL-001/; test: python3 .aidlc/runs/PORTAL-SHELL-001/anti_check.py)

Ghi chú: override nút ở `memberships-view` được sửa trong S9, ở `branches-view` trong S7b.

## Test kit
`testkit/env.md`:
- Chạy dev-infra compose, `npm run dev`, mở `http://localhost:3000`. Phải dùng `localhost`, vì cookie và link trong mail đều theo `localhost`.
- Tài khoản lấy bằng `bash .aidlc/runs/PORTAL-PLATFORM-001/evidence/seed-fixtures.sh` (chạy lại nhiều lần vẫn an toàn): khách (0 context), nhân viên (1 chi nhánh), platform staff.
- S13 viết `ui-cases.md` + `anti_check.py`. Máy chấm phải ra FAIL trên lần chạy rỗng trước khi giao.

## Risks / rollback
- **Plan khác lệch đường dẫn.** Plan CUSTOMER-001, EMPLOYEE-001 và ORG-001 (chưa duyệt) đang ghi đường dẫn phẳng. Sau S4, S5 và S7, đường dẫn thật nằm dưới `app/(store|console|auth)/…`. EMPLOYEE-001 S1 phải bỏ `employee-shell.tsx`. Sửa 3 plan này trước khi duyệt; không chạy song song với task này.
- **Bằng chứng cũ không còn khớp.** Bằng chứng Anti của PORTAL-AUTH-UI-001 chụp layout chia đôi, và sẽ lệch sau S4. Bằng chứng mới cho auth là S13.
- **Trùng path giữa hai nhóm.** Nếu hai nhóm có cùng path, Next báo lỗi build. `/orders` và `/me` chỉ đặt ở (store) (`home-for.ts:5`). Hệ quả: nhân viên bấm "tôi" sẽ sang `/me` trong StoreShell (quyết định (c)).
- **Rollback:**
  - Mỗi slice là một commit, và việc dời file bằng `git mv` có thể revert.
  - S5b và S7e chỉ được revert cùng nhau, theo thứ tự ngược, vì S7 xoá navbar mà S5 đã gỡ khỏi root.
  - Sau revert phải chạy `rm -rf .next/types .next/dev/types`.
  - URL không đổi, nên không có link hay dữ liệu nào cần khôi phục.

## Open decisions
Không còn giả định chưa kiểm. Các điểm dưới đã chốt theo kit; Dawn đổi được lúc duyệt:
- (a) `/switch-branch` và `/switch-org` vào (auth): card chọn giữa màn, vì lúc đó chưa có context để dựng sidebar.
- (b) `/products` tạm ở (store). Màn quản lý sản phẩm của nhân viên là CUSTOMER-001 S1.
- (c) `/me` chỉ ở (store).
- (d) Header khách **không glass**, đúng kit. Nếu Dawn muốn glass khi cuộn thì phải có task archcheck riêng để allow-list FE-11 cho `store-header.tsx`.
- Worker: codex `gpt-6-luna` high cho S0–S12, codex luna cho test/e2e S13. Claude review từng slice (gate + mutation).
