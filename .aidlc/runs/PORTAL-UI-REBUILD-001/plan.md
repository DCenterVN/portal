# Plan: Dựng lại UI portal Bếp Tươi theo preview đã chốt 10/10 — luật trước, màn sau, nối API + e2e cuối

- **Task ID**: `PORTAL-UI-REBUILD-001`
- **Mode**: `hard`
- **Story**: US-UI-002
- **Sprint**: 03
- **Issue**: Dawn 10/10: "Triển khai các rule cho a, rồi để Anti code lại các UI rồi ghép API test e2e".
- **Nhánh**: `portal-ui-rebuild` (tách từ `main` @ 3c3d697). Một nhánh duy nhất; slice của Antigravity làm trong worktree Orca rồi merge về nhánh này.

## Scope
- Outcome: 18 màn của preview chạy thật trên portal, đúng token/lớp/bo góc/motion, có máy chặn lệch luật, nối API thật, e2e xanh và khớp log Kong.
- Nguồn thiết kế duy nhất:
  - Canvas: https://claude.ai/artifact/XuyqU2bzEpihN9Cb4sfqx4
  - Bản sao: `~/dawn-dotfiles/brain/inbox/portal-ui-preview/` (`Main.dc.html`, `BRIEF.md`, 20 `*.dc.html`, `canvas.json`).
  - Quyết định: `~/dawn-dotfiles/brain/inbox/2026-10-10-grill-portal-ui-rebuild.md` (vòng 21:15 thắng mọi vòng trước).
- Decision: EXTEND (shell + `components/ui` đã có) + REPLACE token. Không tạo shell thứ hai.
- Thứ tự 3 pha (Dawn 10/10, sửa lần 2):
  - **Pha A — Khung (Sonnet, Claude điều phối + verify)**: K1–K8 = token/font/theme, luật bằng máy, so ảnh, `components/ui` (kể cả `EntityPicker`), shell store, shell CRM, khoá khung. Xong K8 → handoff cho Antigravity.
  - **Pha B — Màn (Antigravity)**: U1–U11 dựng màn trên khung + F1–F6 đổi ô gõ ID thành picker. **Cấm sửa file khung** (gate `frame-lock` đỏ).
  - **Pha C — Nối API + e2e**: chỉ nối API có verdict `ĐỦ` trong [api-inventory.md](api-inventory.md). API `THIẾU`/`CHƯA CÓ` để Dawn làm dần (màn giữ mock + nhãn chờ). e2e chỉ cho luồng đã nối.
- Impact (đo 10/10):
  - Token hiện sinh từ `platform-docs/ui/tokens.json` → `platform-docs/scripts/uigen.py` → `app/tokens.generated.css` (đang là bộ kem `--color-bg: #FBF6EE`, `tokens.generated.css:3`). Preview dùng bộ khác: `--l0 #F4F4F5`, `--l1 #FFFFFF`, `--p #D2402A`, `--p-text #B3361F`, `--ok #2F7A3B`, `--err #9B2C55`, glass L2/L3, dark đủ bộ (`Main.dc.html` helmet).
  - Font: `app/layout.tsx:2` nạp `Nunito, Quicksand`; chốt mới là **Be Vietnam Pro 700** cho tiêu đề.
  - Gate có sẵn: `app/layout-gate.test.ts` (landmark, cấm `backdrop-blur` ngoài app, mock chỉ ở frame/test, cấm `SAMPLE_`, cấm `<button>` thô, cấm đè class Button) — mở rộng, không viết gate mới song song.
  - ESLint: `eslint.config.mjs` chưa có `no-restricted-imports`/`no-restricted-syntax`.
  - Đang có: `components/ui/{button,input,field,dialog,toast,tabs,table,state,badge,card,label,page}.tsx`; `components/layout/{store-shell,store-header,console-shell,console-sidebar,console-header,customer-auth-shell,employee-auth-shell,site-footer}.tsx`; `mocks/{store,console}.ts`.
  - Chưa có: checkbox 3 trạng thái, switch, segmented, menu/popover, sheet; Playwright trong portal (không có `playwright.config.*`).
  - BE (kiểm 10/10, chi tiết [api-inventory.md](api-inventory.md)): `sales/` không có wishlist. `/sales/catalog` chỉ có trong spec (`order-lifecycle.md:66-67`), **không** có trong router (`sales/internal/transport/http/router.go:19-28`). Mọi handler sales bắt `BranchID` (`sales.go:70`), trong khi khách không có membership (ADR-024) → store gần như chưa nối được. Đơn chỉ có create/list/get/cancel; confirm/pack/ship/deliver chỉ nằm trong spec.
  - Inventory: Bảng A ĐỦ 28 / THIẾU 11 / CHƯA CÓ 7; Bảng B SỬA NGAY 7 / CHỜ BE 6.

## Prerequisite (ngoài slice)
1. Token preview vào `platform-docs/ui/tokens.json` + chạy `uigen.py tokens --write` — một commit riêng ở platform-docs (như PORTAL-BRAND-001). R1 dùng file sinh ra.
2. Wishlist BE chưa có (`sales/` grep = 0): Dawn làm dần; FE dùng `mocks/store.ts`, không chặn Pha B.
3. Ảnh chuẩn so sánh (baseline) chụp từ canvas — xem Open decisions OD-1.

## Requirements
- FR-1 Token + font + theme (R1):
  - CSS var đúng tên/giá trị preview cho sáng + tối; Tailwind 4 `@theme` map sang tên token. Tiêu đề Be Vietnam Pro 700, thân Nunito qua `next/font`.
  - Nút Sáng/Tối (dùng `theme-provider.tsx` có sẵn), lưu lựa chọn, tôn trọng `prefers-color-scheme` khi chưa chọn, không nháy màu khi tải.
  - AC-1: test đọc `globals.css` + `tokens.generated.css` thấy đủ 23 token sáng và 20 token tối của `Main.dc.html`; `layout.tsx` nạp đúng 2 font; toggle đổi `data-theme` và giữ sau reload.
- FR-2 Luật bằng máy (R2):
  - ESLint `no-restricted-imports`: `app/**`, `features/**` không import thư viện UI ngoài `@/components/ui`, `@/components/layout`, `@/components/patterns`, `lucide-react`.
  - ESLint `no-restricted-syntax` + gate test: cấm hex/rgb thô trong `className`/`style` (ngoại lệ `#fff` chữ trên nút chính), cấm `rounded-*` ngoài thang 0/2/4/8/12/999 (`rounded-none|[2px]|sm|lg|xl|full` theo map R1), cấm `rounded-full` trên `<Button>` (cấm nút pill), cấm `backdrop-blur` ngoài file L2/L3 được liệt kê (store-header, console-header, menu/popover, drawer mobile), cấm `duration-*` ngoài 100/150/200/300/400, cấm emoji trong JSX.
  - AC-2: mỗi luật có 1 fixture vi phạm trong `app/ui-rules-gate.test.ts` làm test **đỏ**; repo sạch thì `npm run lint` + `npm test` xanh. Mutation: xoá một luật → fixture tương ứng phải lọt (test đỏ).
- FR-3 So ảnh (R3):
  - `@playwright/test` (devDependency), chạy Brave qua `executablePath`, 2 project `desktop 1440` và `mobile 390`; `toHaveScreenshot` so với baseline trong `e2e/visual/baseline/`.
  - Dữ liệu cho so ảnh lấy từ `mocks/` (cố định), font chờ `document.fonts.ready`, tắt animation.
  - AC-3: `npx playwright test e2e/visual` đỏ khi đổi 1 token màu, xanh khi đúng; ngưỡng mặc định `maxDiffPixelRatio 0.02` (OD-2).
- FR-4 `components/ui` (U1): button (32/40/48, primary đặc, danger viền `--err` + icon), input/field (validate khi blur, `aria-invalid`, `aria-describedby`, mật khẩu 12–256 + hiện/ẩn), checkbox 3 trạng thái (`aria-checked="mixed"`, bấm `−` chọn hết), switch (bật = `--ok`), segmented, menu/popover (glass L3, không scrim), modal/sheet (nền đặc, `position: fixed`, scrim, bo 12, focus không vào nút xoá), toast (đặc, `role="status"`, store mobile dưới giữa, CRM dưới phải, Hoàn tác 10s).
  - AC-4: test hành vi từng control (bàn phím Space/Enter/Esc, focus trap modal, ARIA) xanh; vùng bấm ≥24 desktop, ≥44 mobile.
- FR-5 Shell store (U2): header glass L2 sticky có tìm kiếm, toggle theme, giỏ mini (popover 3 món mới nhất + "+N món khác", nút Xem giỏ/Thanh toán → `/cart`), avatar + menu (gồm "Yêu thích (N)") khi đã đăng nhập, nút Đăng nhập mở popup khi chưa. Max-width 1440, lề 40/16.
  - AC-5: `store-shell.test.tsx` mở rộng: giỏ 5 món → hiện 3 + "+2 món khác"; chưa đăng nhập → không có avatar.
- FR-6 Màn store (U3–U6): Landing + Home, Catalog (bộ lọc trái/trên, mobile mở sheet, tim yêu thích trên card), Product, Checkout + popup khách 515×388 (tab Đăng nhập/Đăng ký; đăng ký xong đóng popup, giữ giỏ + địa chỉ, tiếp tục thanh toán; không guest checkout — ADR-024).
  - AC-6: mỗi màn có test render + 1 test hành vi chính (lọc, thêm giỏ expressive, đặt hàng); so ảnh desktop + mobile xanh.
- FR-7 CRM (U7–U11, chỉ desktop): shell (sidebar đặc, không avatar ở chân, top bar glass có toggle theme + avatar menu), Dashboard, Table (checkbox đầu 3 trạng thái, thanh "Đã chọn N" đặc thay toolbar), Record, Form (switch chỉ khi có hiệu lực ngay, form có Lưu dùng checkbox). PII đã che từ server.
  - AC-7: test hành vi bảng chọn hết/bỏ chọn; so ảnh desktop xanh.
- FR-8 Login nhân viên (U12): trang riêng 847×360 trong `app/(employee-auth)`, panel sóng. AC-8: route render đúng khung, không có header store.
- FR-9 States (U13): rỗng 3 loại, đang tải theo ngưỡng <1s/1–10s/>10s, lỗi/không quyền; có mobile. AC-9: test 3 loại rỗng + so ảnh.
- FR-10 Nối API (C1–C2): chỉ nối API verdict `ĐỦ` trong [api-inventory.md](api-inventory.md); xoá mock tương ứng (`typecheck` đỏ = danh sách chỗ nối). API khác giữ mock và ghi tên vào mục "Để Dawn" của `api-inventory.md`; không tự mở task BE (Dawn làm dần, wishlist cũng vậy).
  - AC-10: mỗi import `@/mocks` còn lại trong `app/` `features/` ứng đúng 1 dòng `THIẾU`/`CHƯA CÓ` của inventory; không còn mock cho API `ĐỦ`.
- FR-12 Không bắt người dùng gõ ID: người dùng không biết UUIDv7. Mọi trường `*_id`/`*_ref`/"UUID" người dùng chọn phải qua `EntityPicker` (combobox tìm theo tên/mã/SKU, hiện tên + mã phụ, gửi id ẩn), nguồn là API list của thực thể. Id hệ thống tự sinh (idempotency key, id mới) không bao giờ hiện ra.
  - AC-12a: gate `ui-rules-gate` đỏ khi có `Input`/`TextInput`/`Field` mà `label`/`placeholder` chứa `UUID|ID|ref` hoặc `name` kết thúc `_id|_ref` (trừ `type="hidden"`). Fixture vi phạm làm test đỏ.
  - AC-12b: 7 dòng `SỬA NGAY` ở Bảng B (B2,B4–B9) hết vi phạm, request gửi đi vẫn đúng id như cũ (test bắt payload); dòng `CHỜ BE` giữ ô cũ trong baseline `ui-rules-baseline.txt` (chỉ được giảm), kèm tên API list thiếu.
- FR-13 Khoá khung: file khung (danh sách trong `frame.lock.json`, sha256 từng file: token, `globals.css`, `layout.tsx`, `components/ui/*`, `components/layout/*`, `components/patterns/*`, `eslint.config.mjs`, `app/*-gate.test.ts`, `playwright.config.ts`, `e2e/visual/*`, `package.json`, `package-lock.json`) không được đổi trong slice U*/F*/C*.
  - AC-13: `app/frame-lock.test.ts` đỏ khi 1 byte file khung đổi mà lock không đổi; `frame.lock.json` thêm vào `protected_paths` của `.aidlc/stage-policy.json` (Dawn chạy, vì file đó protected) → agent không tự cập nhật lock được. Cần đổi khung = Antigravity ghi yêu cầu vào handback, Claude/Sonnet làm slice khung riêng.
- FR-11 e2e (C4): kịch bản tester-army/e2e (`~/refs/e2e`, locator cứng, không gọi model) cho: khách đăng nhập popup → catalog → thêm giỏ → checkout → đặt hàng; nhân viên đăng nhập → bảng đơn → mở record → đổi trạng thái. Tài khoản khách cố định qua `dev-infra/scripts/manage_qa_account.go`, xoá giỏ qua API mỗi run.
  - AC-11: e2e xanh 3 lần liên tiếp; mỗi request của kịch bản có dòng tương ứng trong log Kong (method + path + status), grep từng ô — receipt Anti không đủ.
- Ngoài phạm vi: guest checkout, View Transitions, CRM mobile, tách dev/main, điền placeholder `[X]%`, `[KHU VỰC]`, `[ĐỊA CHỈ PHÁP LÝ]`, `[HOTLINE]`, ảnh (giữ nguyên dạng `[…]`).

## Technical definition
- ADR-024 (customer = activated user → không guest checkout). Chuẩn màn: `../platform-docs/standards/ui-ux.md` + `frontend.md` (đọc trước mọi slice U*); preview thắng chỗ lệch. Next 16.3 / React 19 / Tailwind 4; `npm` không `pnpm` (NTFS); vitest dùng esbuild ổn định `~/.local/share/esbuild/esbuild-0.21.5`.
- NFR: WCAG AA (focus 2px, `prefers-reduced-motion` bắt buộc); motion 150/200/300/400 (hover 100); không layout shift khi nạp font (`display: swap` + `adjustFontFallback`).
- Mock chỉ ở `mocks/`, chỉ frame + test được import (gate có sẵn ở `layout-gate.test.ts:84`).
- Rủi ro "PASS giả": `npm test -- <path>` từng báo PASS giả → slice dùng `npm test` toàn bộ + điều kiện "slice test count > 0".

## UX
- Màn ↔ file preview: Landing/LandingMobile, StoreHome(+Mobile), StoreCatalog(+Mobile), StoreProduct(+Mobile), StoreCheckout(+Mobile), StoreAuth(+Mobile), ConsoleDashboard, ConsoleTable, ConsoleRecord, ConsoleForm, ConsoleLogin, States(+Mobile), Main (token/control/motion).
- Luật chi tiết: `BRIEF.md` mục REQUIRED (lớp L0–L3, bo góc, chữ, kích thước, tương tác, responsive, motion). Ngoại lệ: tiêu đề Be Vietnam Pro 700 (BRIEF ghi Quicksand — vòng 21:15 thắng).
- Mâu thuẫn đã xử lý: grill "ADJUST" ghi "không bật modal đăng nhập trong checkout"; vòng 21:15 chốt popup trong hành trình checkout → **theo 21:15**.
- Route: `/` Landing (khách chưa đăng nhập) / Home (đã đăng nhập) — OD-3; `/products`, `/products/[id]`, `/cart` (checkout); CRM giữ route `(console)` hiện có.

## Design
- Không đổi API/DB trong portal. BFF hiện có trong `app/api/` + `lib/` dùng lại; không thêm fetcher mới.
- Token: Tailwind `@theme` trong `globals.css` trỏ CSS var sinh từ `tokens.json`; component chỉ dùng class token (`bg-l1`, `text-fg-2`, `border-line`, `rounded-[var(--r-8)]`…).
- Wishlist: FE gọi qua hook `features/store/use-wishlist.ts`, nguồn tạm `mocks/store.ts`; chưa có API (Dawn làm dần), contract chốt khi có spec BE.

## Files planned
- app/globals.css
- app/layout.tsx
- app/tokens.generated.css
- app/layout-gate.test.ts
- app/ui-rules-gate.test.ts
- app/(store)/
- app/(console)/
- app/(employee-auth)/
- app/(auth)/
- eslint.config.mjs
- package.json
- package-lock.json
- playwright.config.ts
- e2e/
- components/ui/
- components/layout/
- components/patterns/
- features/store/
- features/console/
- features/customer-auth/
- features/employee-auth/
- features/sales/
- features/inventory/
- features/platform/
- features/production/
- mocks/
- frame.lock.json
- scripts/frame-lock.mjs
- app/frame-lock.test.ts
- app/ui-rules-baseline.txt
- app/theme.test.tsx
- app/rebrand.test.ts
- .aidlc/runs/PORTAL-UI-REBUILD-001/handoff-antigravity.md
- .aidlc/runs/PORTAL-UI-REBUILD-001/evidence/

## Tests planned
| TC | AC | layer | command |
|---|---|---|---|
| TC-1 | AC-1 | unit | `npm test` (theme/token test) |
| TC-2 | AC-2 | unit + lint | `npm test && npm run lint` (fixture vi phạm đỏ; mutation xoá luật) |
| TC-3 | AC-3 | visual | `npx playwright test e2e/visual` |
| TC-4 | AC-4 | unit | `npm test` (controls) |
| TC-5..9 | AC-5..9 | unit + visual | `npm test && npx playwright test e2e/visual --grep <màn>` |
| TC-10 | AC-10 | static | `npm run typecheck && rg "@/mocks" app features` |
| TC-11 | AC-11 | e2e | tester-army runner ×3 + grep log Kong từng request |
| TC-12 | AC-12a/b | unit (gate) | `npm test` (fixture ô gõ ID đỏ; baseline chỉ giảm) |
| TC-13 | AC-13 | unit (gate) | `npm test` (đổi 1 byte file khung → `frame-lock` đỏ) |

## Slices
<!-- Pha A: Sonnet làm, Claude verify. Pha B: Dawn giao Antigravity bằng file handoff (không Orca), mỗi slice 1 worktree `~/wt/portal-ui-<slice>`, Claude chạy `verify --cwd <worktree> --task PORTAL-UI-REBUILD-001` rồi merge vào portal-ui-rebuild. Mọi slice B/C phải giữ `app/frame-lock.test.ts` xanh. -->
- [x] K1: token preview + font Be Vietnam Pro/Nunito + toggle Sáng/Tối; viết lại assertion font/hex/heading/palette của hợp đồng REBRAND-001 cũ trong rebrand.test.ts theo FR-1 (files: app/globals.css, app/rebrand.test.ts, app/layout.tsx, components/layout/theme-toggle.tsx, app/theme.test.tsx; test: npm test && npm run lint && python3 ~/agent_skills/sdlc/engine/archcheck.py; slice test count > 0)
- [x] K2: luật bằng máy — ESLint restricted imports/syntax + gate fixture đỏ + luật cấm ô gõ ID + baseline (files: eslint.config.mjs, app/ui-rules-gate.test.ts, app/ui-rules-baseline.txt, app/layout-gate.test.ts; test: npm test && npm run lint; mutation: bỏ 1 luật thì fixture lọt)
- [x] K3: so ảnh Playwright desktop 1440 + mobile 390 với baseline preview (files: package.json, package-lock.json, playwright.config.ts, e2e/visual/preview.spec.ts, e2e/visual/baseline/; test: npx playwright test e2e/visual đỏ khi đổi 1 token, xanh khi đúng)
- [x] K4a: ui cơ bản — button, input/field (blur validate, mật khẩu hiện/ẩn), checkbox 3 trạng thái, switch, segmented (files: components/ui/button.tsx, components/ui/field.tsx, components/ui/checkbox.tsx, components/ui/switch.tsx, components/ui/controls.test.tsx; test: npm test && npm run lint; slice test count > 0)
- [x] K4b: ui lớp nổi — menu/popover glass L3, modal/sheet đặc fixed, toast (files: components/ui/popover.tsx, components/ui/dialog.tsx, components/ui/toast.tsx, components/ui/overlay.test.tsx; test: npm test && npm run lint)
- [x] K4c: `EntityPicker` — combobox tìm theo tên/mã, gửi id ẩn, trạng thái tải/rỗng/lỗi, bàn phím (files: components/ui/entity-picker.tsx, components/ui/entity-picker.test.tsx, components/ui/segmented.tsx; test: npm test && npm run lint)
- [x] K5: shell store + header (avatar menu "Yêu thích (N)", giỏ mini 3 món + "+N món khác", toggle theme, nút đăng nhập) (files: components/layout/store-shell.tsx, components/layout/store-header.tsx, components/layout/mini-cart.tsx, components/layout/store-shell.test.tsx, mocks/store.ts; test: npm test && npx playwright test e2e/visual --grep StoreHome)
- [x] K6: shell CRM — sidebar đặc không avatar, top bar glass có toggle + avatar menu (files: components/layout/console-shell.tsx, components/layout/console-sidebar.tsx, components/layout/console-header.tsx, components/layout/console-shell.test.tsx; test: npm test && npx playwright test e2e/visual --grep ConsoleDashboard)
- [x] K7: khoá khung — `frame.lock.json` + gate (files: frame.lock.json, app/frame-lock.test.ts, scripts/frame-lock.mjs; test: npm test; đổi 1 byte `components/ui/button.tsx` thì đỏ)
- [ ] K8: handoff Antigravity — brief 5 phần, đáp án sẵn, danh sách màn + inventory (files: .aidlc/runs/PORTAL-UI-REBUILD-001/handoff-antigravity.md; test: test -s .aidlc/runs/PORTAL-UI-REBUILD-001/handoff-antigravity.md)
- [ ] U1: Landing + Home (files: app/(store)/page.tsx, features/store/landing.tsx, features/store/home.tsx, features/store/landing.test.tsx; test: npm test && npx playwright test e2e/visual --grep "Landing|StoreHome")
- [ ] U2: Catalog — lọc trái/trên, sheet mobile, tim yêu thích (mock) (files: app/(store)/products/page.tsx, features/store/catalog.tsx, features/store/catalog-filters.tsx, features/store/use-wishlist.ts, features/store/catalog.test.tsx; test: npm test && npx playwright test e2e/visual --grep StoreCatalog)
- [ ] U3: Product (files: app/(store)/products/[id]/page.tsx, features/store/product-detail.tsx, features/store/product-detail.test.tsx; test: npm test && npx playwright test e2e/visual --grep StoreProduct)
- [ ] U4: Checkout + popup khách 515×388 (files: app/(store)/cart/page.tsx, features/store/checkout.tsx, features/customer-auth/auth-popup.tsx, features/store/checkout.test.tsx; test: npm test && npx playwright test e2e/visual --grep "StoreCheckout|StoreAuth")
- [ ] U5: Dashboard CRM (files: features/console/dashboard.tsx, features/console/dashboard.test.tsx, app/(console)/console/page.tsx; test: npm test && npx playwright test e2e/visual --grep ConsoleDashboard)
- [ ] U6: Table — chọn 3 trạng thái, thanh "Đã chọn N" (files: features/console/record-table.tsx, features/console/record-table.test.tsx, app/(console)/sales/orders/page.tsx; test: npm test && npx playwright test e2e/visual --grep ConsoleTable)
- [ ] U7: Record (files: features/console/record-view.tsx, features/console/record-view.test.tsx, app/(console)/sales/orders/[id]/page.tsx; test: npm test && npx playwright test e2e/visual --grep ConsoleRecord)
- [ ] U8: Form (files: features/console/record-form.tsx, features/console/record-form.test.tsx, app/(console)/sales/products/new/page.tsx; test: npm test && npx playwright test e2e/visual --grep ConsoleForm)
- [ ] U9: Login nhân viên 847×360 (files: app/(employee-auth)/staff/login/page.tsx, features/employee-auth/staff-login.tsx, features/employee-auth/staff-login.test.tsx; test: npm test && npx playwright test e2e/visual --grep ConsoleLogin)
- [ ] U10: States — rỗng 3 loại, tải theo ngưỡng, lỗi/không quyền (files: features/store/states-preview.tsx, features/store/states-preview.test.tsx, app/(store)/states-preview/page.tsx; test: npm test && npx playwright test e2e/visual --grep States)
- [ ] U11: gate cuối màn — lint 0 lỗi + so ảnh đủ 18 màn + frame-lock xanh (files: e2e/visual/preview.spec.ts; test: npm run lint && npm test && npx playwright test e2e/visual)
- [ ] F1: picker thay ô ID ở audit nền tảng (B2) + chỉ tiêu sản xuất (B4 sản phẩm, B5 hiện tên chi nhánh) (files: features/platform/audit-view.tsx, features/platform/audit-view.test.tsx, features/production/targets-view.tsx, features/production/targets-view.test.tsx, app/ui-rules-baseline.txt; test: npm test && npm run lint — baseline 13 → 10)
- [ ] F2: picker ở food plan — chọn chỉ tiêu khi thiếu target_id (B8), sản phẩm từ dòng chỉ tiêu (B6), SKU nguyên liệu (B7) (files: features/production/food-plans-view.tsx, features/production/food-plans-view.test.tsx, app/(console)/production/food-plans/page.tsx, app/ui-rules-baseline.txt; test: npm test && npm run lint — baseline 10 → 7)
- [ ] F3: picker sản phẩm ở giá sàn (B9); B10–B13 giữ baseline chờ BE (files: features/sales/pricing-floor-view.tsx, features/sales/pricing-floor-view.test.tsx, app/ui-rules-baseline.txt; test: npm test && npm run lint — baseline 7 → 6 = B1,B3,B10,B11,B12,B13)
- [ ] C1: nối API store có verdict ĐỦ, xoá mock tương ứng (files: features/store/, mocks/store.ts; test: npm run typecheck && npm test)
- [ ] C2: nối API CRM có verdict ĐỦ (files: features/console/, features/sales/, mocks/console.ts; test: npm run typecheck && npm test)
- [ ] C3: e2e tester-army cho luồng đã nối, đối chiếu log Kong (files: e2e/flows/customer-order.spec.ts, e2e/flows/staff-order.spec.ts, e2e/kong-check.sh; test: chạy 3 lần xanh + kong-check.sh 0 dòng thiếu)

## Risks / rollback
- Đổi token phá màn cũ chưa dựng lại → chấp nhận trên nhánh `portal-ui-rebuild`; `main` không đổi tới khi U13 + C4 xanh. Rollback = bỏ nhánh.
- Baseline so ảnh lệch vì preview dùng dữ liệu mock và runtime canvas → ngưỡng OD-2 + Dawn xem ảnh diff ở slice đầu (U2) trước khi khoá ngưỡng.
- Antigravity hỏi qua `orca ask` rồi nộp rỗng → brief 5 phần ghi sẵn đáp án mọi câu đã chốt (file này + BRIEF.md), check inbox khi chờ.
- Receipt Antigravity báo PASS giả → Claude tự chạy `verify --cwd <worktree>`, e2e đối chiếu log Kong.
- API thiếu → màn giữ mock có nhãn chờ, ghi vào mục "Để Dawn" của inventory; không tự mở task BE.
- Antigravity phá khung → `frame-lock` đỏ, Claude từ chối merge slice; lock nằm trong `protected_paths` nên agent không tự sửa.

## Open decisions
- OD-1 [ASSUMED] Baseline so ảnh: Claude chụp từng artboard từ canvas bằng Playwright MCP (Brave, đã đăng nhập claude.ai) vào `e2e/visual/baseline/` ở R3. Thay thế: Dawn tự xuất PNG từ canvas.
- OD-2 [ASSUMED] Ngưỡng `maxDiffPixelRatio` = 0.02 (2% pixel). Dawn chốt bar Tier 3.
- OD-3 [ASSUMED] `/`: chưa đăng nhập = Landing, đã đăng nhập = Home.
- OD-4 [ASSUMED] Màn CRM mẫu gắn vào đơn hàng (`/sales/orders`, `/sales/orders/[id]`) và tạo sản phẩm (`/sales/products/new`) vì đã có API sales.
- OD-5 [ASSUMED] Trang `states-preview` chỉ bật khi `NODE_ENV !== "production"`.
- OD-6 [ASSUMED] Khung (K1–K8) do subagent Sonnet làm trong nhánh `portal-ui-rebuild`, Claude verify từng slice; Dawn chạy 1 lệnh thêm `frame.lock.json` vào `protected_paths` sau K7.
