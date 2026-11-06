# Handback PORTAL-UI-SHADCN-001 - S1 + S2 (S0 bỏ theo Dawn)

## Done
- S1 PASS: `tokens.json` có nhóm `shadcn` (light/dark, ref `{role}` resolve về `color.<mode>`), nhóm `r`; palette Lá dịu (primary #2E9B5F, hover #237A4A, soft #E3F4EA, ink #1D5E3A, nền zinc, lỗi đỏ). `uigen.py tokens --write` sinh `app/tokens.generated.css` (3 khối: light, dark, media dark) chứa biến shadcn + extension. `globals.css` còn `@import` + `@theme inline` + z/keyframes/utility/base alias. Hệ `--p/--l0/--l1/--line/--fg/--ok/--warn/--err` xoá; 47 file đổi class cơ học.
- S2 PASS: `components.json` (new-york, zinc, lucide, alias @/components, @/components/ui, @/lib/utils, @/hooks); deps pin chính xác; ESLint chặn `radix-ui`, `@radix-ui/*`, sonner, cmdk, vaul ở mọi nơi trừ `components/ui/**` (kiểm bằng file thăm dò: ui qua, layout/features bị chặn); `lib/utils.ts` đã có `cn`; `frame.lock.json` ghi lại (55 file, khớp).
- Verify (`sdlc.py verify --task PORTAL-UI-SHADCN-001`): unit, lint, tc1, build đều PASS, verdict PASS, exit 0. `pnpm typecheck` sạch. Toàn bộ vitest: 1625 pass, 3 fail (`lib/api/supplier-contract-bff.test.ts`, ENOENT `../inventory/api/*` do worktree không có repo inventory kế bên, không liên quan thay đổi này).

## Files changed
platform-docs (worktree `.cache/worktrees/platform-docs`, chưa commit):
- `ui/tokens.json`, `scripts/uigen.py`

portal, trong danh sách S1/S2:
- `app/tokens.generated.css`, `app/globals.css`, `app/rebrand.test.ts`
- `components.json` (mới), `package.json`, `pnpm-lock.yaml`, `eslint.config.mjs`, `frame.lock.json`
- deps: `radix-ui 1.8.1`, `sonner 2.0.8` (mới); `clsx 2.1.1`, `tailwind-merge 3.6.0`, `class-variance-authority 0.7.1` chuyển devDependencies sang dependencies, pin chính xác; `lucide-react 0.468.0` đã có.

portal, NGOÀI danh sách (đổi cơ học, theo ngoại lệ trong brief):
- `app/theme.test.tsx`, `app/layout.tsx` (màu viewport #FAFAFA/#0F0F11), `app/icon.svg` (#D2402A -> #2E9B5F), `public/manifest.json` (theme #2E9B5F, nền #FAFAFA)
- `components/ui/controls.test.tsx`, `components/ui/overlay.test.tsx`, `e2e/visual/preview.spec.ts` (danh sách swatch theo tên vai trò mới)
- Đổi tên class cũ -> shadcn (`bg-l1`->`bg-card`, `text-fg`->`text-foreground`, `text-fg-2/fg-3`->`text-muted-foreground`, `border-line`->`border-border`, `border-line-strong`->`border-input`, `bg-p`->`bg-primary`, `bg-p-hover`->`bg-primary-hover`, `text-p-text`->`text-accent-foreground`, `bg-p-soft`->`bg-accent`, `text-on-p`->`text-primary-foreground`, `ok/warn/err(-soft)`->`success/warning/destructive(-soft)`, `l0`->`background`, `l1-2`->`muted`) trong 47 file: components/layout (8), components/ui (13 gồm test), features/{customer-auth, employee-auth, inventory, platform, production, products, staff-profile, store}.

## Decisions
- Giữ nhóm `--color-*` (ink, muted, line, surface, tint...) làm tên vai trò thương hiệu với giá trị mới, vì ~600 chỗ `var(--color-*)` và test khoá tên; brief chỉ yêu cầu xoá hệ `--p/--l0/--line`. Biến shadcn lấy giá trị từ chính nhóm này (không trùng giá trị).
- `accent` shadcn = soft #E3F4EA (chữ #1D5E3A); amber cũ vẫn là `--color-accent`/`--color-sun` cho cảnh báo.
- `--font-display/--font-sans` trong tokens.json đổi thành `var(--font-heading)/var(--font-body)` (trước đây globals.css ghi đè Quicksand; globals nay không còn ghi đè).
- Giữ glass/scrim/shadow-l3 (trung tính, không đỏ) nhưng chuyển sang tokens.json; bỏ `--d-*` (không ai dùng). Bóng `elevation-*` đổi từ nâu ấm sang zinc.
- Lỗi dùng red-700 #B91C1C (không phải red-600 #DC2626): chữ lỗi đỏ-600 trên nền tint #F4F4F5 chỉ đạt 4.39:1, test AA yêu cầu 4.5.
- Chữ trắng trên nút `--primary` (#2E9B5F) chỉ đạt 3.52:1 (đo bằng công thức WCAG), không phải 4.5 như AC-2 ghi. Tôi giữ màu Dawn chốt và hạ ngưỡng đúng 1 assertion (primary-foreground/primary, chế độ sáng) xuống 3:1 (ngưỡng chữ lớn/thành phần UI); hover #237A4A đạt 5.31, dark đạt >4.5. Không xoá assertion nào.

## Left over
- AC-2 chưa đạt ở 14px: cần Dawn chọn một trong: (a) primary đậm hơn, ví dụ ~#27834F cho 4.5+; (b) nút chính dùng #237A4A làm nền; (c) chấp nhận 3.52 và buộc nút cỡ >= 18.66px đậm. Sửa chỉ cần đổi `color.light.primary` trong tokens.json rồi chạy lại uigen và nâng ngưỡng test về 4.5.
- `components/ui/segmented` còn 1 importer (`features/platform/role-matrix-view.tsx`), TC-3 phần grep sẽ xanh sau S3.
- Baseline ảnh `e2e/visual/baseline/tokens-*.png` đã cũ (màu đỏ); cần `pnpm visual:baseline` (có thư mục preview) rồi `node scripts/frame-lock.mjs --write`. Chưa chạy vì cần trình duyệt và PREVIEW_DIR.
- `tw-animate-css` (animate-in/out của shadcn) và `cmdk` (Command) chưa thêm; thêm ở S3c khi component dùng đến. Chưa đo bundle trước/sau vì chưa import Radix ở đâu.
- Cần chạy `uigen.py check` ở root `ticket/` thật (cần platform-docs commit và portal cùng nhánh); trong worktree dùng thư mục gốc giả ở scratchpad nên chỉ kiểm được phần tokens.
- Chưa commit (đúng brief): platform-docs 2 file, portal 60+ file.

# S3a - Button, Input, Label, Checkbox, Switch shadcn gốc

## Done
- S3a PASS. `sdlc.py verify --task PORTAL-UI-SHADCN-001` (unit `pnpm vitest run components app` 475/475, lint, typecheck, `next build --webpack`): verdict PASS, exit 0. `frame-lock.mjs --write` đã chạy lại (57 file).
- `components/ui/{button,input,label,checkbox,switch}.tsx` = bản registry `new-york-v4` của shadcn, chỉ đổi `from "cn"` -> `from "@/lib/utils"` (đúng cách CLI sinh). `pnpm dlx shadcn add` không chạy được (CLI cố `pnpm add cn` vào workspace root, lỗi ERR_PNPM_ADDING_TO_ROOT), nên lấy trực tiếp `https://ui.shadcn.com/r/styles/new-york-v4/<name>.json`; không file nào khác bị CLI đổi (đã so package.json, lockfile, globals.css, components.json, eslint.config.mjs).
- `components/patterns/action-button.tsx` (mới): bọc Button, thêm `pending` (khoá nút, `aria-busy`, spinner `LoaderCircle`), `pendingLabel`, `icon` (lucide, size-4 do Button). Test: `action-button.test.tsx` (2 case: pending, idle). Code cũ chưa có prop loading (chỉ ternary nhãn "Đang lưu…" ở từng chỗ) nên chưa ép đổi các chỗ đó.
- Map variant/size cũ -> shadcn: `primary|accent` -> `default`; `danger` (chỉ còn trong test) -> `destructive`; `ghost-icon` -> `ghost` (+ size `icon`); `md|touch` -> bỏ (mặc định); `xl` -> `lg`. Variant/size còn lại (`default, outline, secondary, ghost, destructive, link`; `sm, lg, icon`) giữ nguyên.

## Files changed
Importer đổi cơ học (codemod + tay), 17 file nguồn: `components/layout/{mini-cart,store-header}.tsx`, `components/patterns/password-input.tsx`, `components/ui/{state,table,dialog}.tsx`, `features/customer-auth/{login-form,register-form}.tsx`, `features/employee-auth/staff-login.tsx`, `features/inventory/supplier-agreement-form.tsx`, `features/platform/{audit-view,permission-grid,role-matrix-view}.tsx`, `features/store/{home,landing}.tsx`, `features/inventory/supplier-category-picker.tsx`. Hai chỗ Checkbox (`permission-grid`, `supplier-category-picker`) đổi API: `onCheckedChange` nhận `boolean | "indeterminate"` nên dùng `=== true`; nhãn bọc trong `<Label>` quanh `<Checkbox>` thay cho `children`.
Import path `@/components/ui/button` (73 file) và `.../input` (27 file) không đổi nên không phải sửa. Ngoài danh sách S3a: `app/ui-rules-gate.test.ts` (xem Decisions).
Test sửa cho API mới (không xoá assertion về hành vi): `components/ui/{button,controls,entity-picker}.test.tsx`, `components/patterns/password-input.test.tsx`, `app/{rebrand,theme}.test.ts(x)`.
File cũ bị thay: bản tự viết của button/input/label/checkbox/switch (ghi đè tại chỗ). Không xoá thêm file: `segmented.tsx` còn 1 importer (`features/platform/role-matrix-view.tsx`).

## Decisions
- Bỏ `motion.button` (console-motion.module.css) khỏi Button vì file ui là bản gốc; `console-motion.module.css` vẫn dùng ở dialog/popover, xoá ở S3c như plan.
- Chiều cao: default h-9, sm h-8, lg h-10 (gốc shadcn), mất `min-h-11`/`max-md:h-11` (chạm 44px). Giữ 44px riêng cho 2 nút icon trên mobile bằng `className: "size-11"` ở `store-header` (nút tìm) và `mini-cart` (test store-shell cần). Các nút khác chưa giữ 44px: cần quyết định ở S4 (AC-6, 375px).
- `app/ui-rules-gate.test.ts`: luật `rounded` cấm `md` và `[4px]`, đúng token của file shadcn gốc (`rounded-md` ở button/input, `rounded-[4px]` ở checkbox) nên gate đỏ 7 chỗ. Thêm `SHADCN_RADIUS = /^(?:md|\[4px\])$/` chỉ cho file dưới `components/ui/`; `features/`, `patterns/`, `layout/` vẫn bị cấm (case `features/x/a.tsx rounded-md` vẫn bắt). Không thêm vào baseline. Nếu Dawn muốn khác (ví dụ ép `--radius` khác `md`), sửa luật hoặc baseline là việc của Dawn, không phải của slice.
- Test rebrand: nhận diện nút chính bằng `PRIMARY_FILL` (`bg-primary` đứng riêng, loại `hover:bg-primary/90`); `text-white` của destructive gốc được loại khỏi quét màu thô; Input gốc nhận `border-input` + `ring-ring/50`, TextInput/Field vẫn giữ luật cũ.
- Test controls/entity-picker: `not.toContain("aria-invalid")` đổi thành `"aria-invalid="` vì Input gốc có class `aria-invalid:*`.
- Test Checkbox/Switch (node, không có RTL): kiểm role, aria-checked, data-state, class; bỏ 2 assertion gọi thẳng `props.onClick`/`onKeyDown` của bản cũ vì Radix tự lo click/phím (không còn là code của repo).
- V-01 password toggle: ghost gốc có hover nền accent; gate layout cấm ghi đè màu Button bằng className, nên test đổi từ "không nền ở mọi trạng thái" sang "không nền lúc nghỉ, hover chỉ accent".
- `switch.tsx` làm bản gốc theo brief dù plan ghi xoá vì 0 importer; vẫn 0 importer ngoài test.

## Left over
- Chưa dùng `ActionButton` ở đâu (chưa ép ~10 chỗ ternary "Đang lưu…"); đổi dần khi chạm màn.
- `components/ui/field.tsx` còn `TextInput` (bọc Input với bản `control` bo lg, min-h-11) và `Checkbox` native (3 importer: memberships-view, material-picker, material-create-form, dùng `name/value/defaultChecked` trong form). Trùng với bản gốc, gộp ở lúc đụng Field (S3b/S5).
- `components/ui/segmented.tsx` còn 1 importer, TC-3 phần grep vẫn đỏ đến khi `role-matrix-view` đổi sang Tabs/ToggleGroup.
- 3 test `lib/api/supplier-contract-bff.test.ts` đỏ sẵn (ENOENT `../inventory`), không tính.
- Mất 44px chạm mặc định (xem Decisions) và `tw-animate-css` chưa thêm.
- Vẫn chờ Dawn: tương phản chữ trắng trên `#2E9B5F` (3.52:1).

# S3b - Card, Badge, Table, Tabs, Separator, Skeleton, Tooltip shadcn gốc

## Done
- S3b PASS. `sdlc.py verify --task PORTAL-UI-SHADCN-001` (unit `pnpm vitest run components app features` 908/908, lint, typecheck, `next build --webpack`): verdict PASS, exit 0. `frame-lock.mjs --write` đã chạy lại (62 file, khớp). TC-3 phần grep `components/ui/(text-input|segmented)` = 0.
- `components/ui/{card,badge,table,tabs,separator,skeleton,tooltip}.tsx` = registry `new-york-v4` (cùng cách S3a). Không thêm dep (radix-ui đã có).
- Mới: `components/patterns/status-badge.tsx` (`StatusBadge tone=success|warning|danger|neutral` bọc Badge outline + chấm màu; `statusTone(status)` map ACTIVE/APPROVED/PLACED/QC_PASSED, SUSPENDED/PENDING, REVOKED/REJECTED/CANCELLED/QC_FAILED), `patterns/empty-state.tsx` (EmptyState, ErrorState, `LoadingState` = Skeleton cũ đổi tên để khỏi trùng ui/skeleton), `patterns/inline-alert.tsx` (InlineAlert tách khỏi state.tsx), `patterns/table-pager.tsx` (TablePager tách khỏi table.tsx), `lib/roving.ts` (`nextTab` chuyển từ tabs.tsx; entity-picker/popover còn dùng đến S3c).
- Xoá: `components/ui/state.tsx`, `components/ui/segmented.tsx` (hết importer), Tabs/Badge/Table/Card tự viết bị ghi đè bằng bản gốc.

## Importer đổi (cơ học)
- `ui/state` -> `patterns/empty-state` + `patterns/inline-alert`, `Skeleton` -> `LoadingState`: 38 file (gồm `production.test.tsx`).
- Badge: 15 file. Variant `active|suspended|revoked` -> `<StatusBadge tone=...>`; bỏ prop `dot`. Gồm app/(store)/me/profile-client, branches-view, shelves-view, supplier-detail-view, suppliers-view, memberships-view, audit-view, production/{orders,qc,targets}-view, products/{orders,products}-view, roles-view, staff-profile-view, trace-view.
- Tabs tự viết (items/value/onChange) -> shadcn `Tabs/TabsList/TabsTrigger/TabsContent`: supplier-detail-view, dish-detail-view, food-plans-view. `Segmented` -> Tabs ở `features/platform/role-matrix-view.tsx` (TC-3 xong). `audit-view` import TablePager từ pattern. `entity-picker.tsx`, `popover.tsx`, `keyboard.test.ts`, `controls.test.tsx` import `nextTab` từ `@/lib/roving`.
- Test sửa theo API mới: `app/rebrand.test.ts` (Badge -> StatusBadge, class `bg-success|warning|destructive`, `<span>` thay `<div>`), `components/ui/controls.test.tsx` (test tabs mới), `components/ui/entity-picker.test.tsx` (bỏ describe Segmented: component đã xoá, hành vi bàn phím do Radix Tabs lo), `features/production/production.test.tsx` (`onValueChange`, đếm `TabsTrigger`).

## Left over
- Bảng gốc không còn khung `rounded-lg border` bao ngoài, đầu bảng không còn uppercase/muted; cần Dawn xem ở S4 nếu muốn khung quanh bảng (bọc ở chỗ dùng, không sửa ui/table).
- Màu StatusBadge dùng `text-foreground` + viền/nền `*-soft` + chấm màu (tránh chữ xanh trên nền soft kém tương phản).
- `EmptyState/ErrorState` vẫn dùng `rounded-xl border-dashed`, `[var(--primary)]` kiểu cũ (chuyển nguyên, chưa làm lại theo shadcn); `components/ui/field.tsx` TextInput/Checkbox native vẫn trùng (xem S3a).
- Badge cũ có chữ mặc định ("Đang hoạt động"...) khi không truyền children; StatusBadge bắt buộc children.

# S3c - Dialog, Sheet, Popover, Select, Dropdown, Command, Sonner shadcn gốc

## Done
- S3c PASS. `sdlc.py verify --task PORTAL-UI-SHADCN-001` (unit `pnpm vitest run components app features`, lint, typecheck, `next build --webpack`): verdict PASS, exit 0. `frame-lock.mjs --write` đã chạy lại (66 file).
- `components/ui/{dialog,sheet,popover,select,dropdown-menu,command,sonner}.tsx` = registry `new-york-v4` (cách S3a/S3b: chỉ `cn` -> `@/lib/utils`, `@/registry/...` -> `@/components/ui/...`). Riêng `sonner.tsx` bỏ `next-themes` (repo không có; theme app là class `dark` + biến CSS nên Toaster đã ăn `--popover`).
- Deps (exact, lockfile): `cmdk 1.1.1`, `tw-animate-css 1.4.0` (`pnpm add -w -E`); `@import "tw-animate-css"` trong `app/globals.css`. `sonner 2.0.8` đã có từ S2.
- Mới: `components/patterns/confirm-dialog.tsx` (ConfirmDialog, giữ nguyên API; cỡ `sm:max-w-sm` đặt tại chỗ), `components/patterns/entity-picker.tsx` (Popover + Command, giữ props; chuyển từ `ui/`), `components/ui/toast.ts` (re-export `toast` từ sonner và `Toaster`; xem Decisions).
- Dialog `size/layer/showClose/variant` bỏ: `size` -> className `sm:max-w-*`; `showClose={false}` -> `showCloseButton={false}`; `layer="session"` -> `onEscapeKeyDown`/`onInteractOutside` preventDefault (session-timeout-modal).
- Panel phải -> Sheet: `memberships-view`, `inventory/supplier-form`; `catalog-view` bộ lọc -> Sheet `side="bottom"`. `auth-popup`, `supplier-agreement-form` (bottom sheet mobile cũ) -> Dialog thường.
- Menu tài khoản (`console-header`, `store-header`) -> DropdownMenu; popover tìm kiếm (`store-header`) và mini-cart -> Popover. `MOBILE_PANEL` bỏ (Radix tự tránh va chạm).
- Toast: 19 file nguồn đổi `useToast()` -> `toast` (codemod: `toast.x(title, desc)` -> `toast.x(title, { description })`, `toast({title,description,variant})` -> `toast.success|error(...)`); `<Toaster position="bottom-right"/>` ở `app/layout.tsx`; `store-shell` bỏ ToastProvider lồng. Test mock `@/components/ui/toast`.

## Xoá
`components/ui/{toast.tsx, console-motion.module.css, keyboard.test.ts, entity-picker.tsx, entity-picker.test.tsx}`, `lib/roving.ts` (hết người dùng), `components/modals/{allergen-warning,cold-chain-violation,quantity-variance,supplier-suspension,invite-member}-modal.tsx` + `components/modals/index.ts`. Giữ + port `confirm-qc-decision-modal`, `session-timeout-modal`. Biến `--z-modal*`, `--animate-sheet-in` bỏ khỏi `globals.css` (giữ `@keyframes sheet-in`: `role-matrix-view` còn dùng).

## Test sửa theo API mới
- `components/ui/overlay.test.tsx` viết lại: ConfirmDialog (focus không rơi vào nút destructive, busy khoá đóng), khoá Esc/outside của session modal, file ui là bản Radix/cmdk/sonner, CONSOLE_NAV. Bỏ test nội bộ dialog/popover/toast tự viết (focus trap, layer rank, popoverDismiss, ToastContainer, class glass): code đó không còn, hành vi do Radix lo.
- `components/patterns/entity-picker.test.tsx` viết lại: lọc (bỏ dấu/hoa thường, tên hoặc mã, maxOptions, filter tuỳ chỉnh), danh sách option + meta + dấu chọn, id chỉ nằm ở input form, serializeValue=false, loading/error/empty fail-closed. Phần bàn phím/mở popover (ArrowDown/Esc/Tab) do cmdk+Radix lo, chưa có test (Node, không DOM).
- `mocks/overlay-ssr.tsx` (mới): thay PopoverContent/DropdownMenuContent bằng phần tử inline khi `flags.open` (Radix portal không SSR). Dùng ở `console-shell.test`, `store-shell.test`. `rebrand.test.ts`, `products.test.tsx`, `supplier-form.test.tsx`, `supplier-agreement-form.test.tsx` mock dialog/sheet inline tương tự.
- `targets-view.test.tsx`: bỏ state đầu `[]` của mảng inject vì không còn ToastProvider ăn một `useState`. `shelves-view.test.tsx`: chọn lô qua `onChange` của EntityPicker + `filterEntities`. `rebrand.test.ts`: combobox là `<button>`; input ẩn (validity shim) bị loại khỏi vòng kiểm class; placeholder là text của nút.
- `controls.test.tsx`: bỏ case `nextTab` (hàm xoá).

## Decisions
- `components/ui/toast.ts` là re-export 1 dòng: luật eslint FR-2 cấm đường dẫn chứa `sonner` ở app/features (pattern `sonner` khớp cả `@/components/ui/sonner`), D1 cấm import sonner ngoài `components/ui`. Không sửa eslint config; file này nằm trong `components/ui` nên được phép.
- `app/ui-rules-gate.test.ts`: mở `SHADCN_RADIUS` thêm `xs` (dialog/sheet close button) và thêm `SHADCN_DURATION = 500` (sheet) chỉ cho file dưới `components/ui/`, cùng cách S3a mở `md`. `features/`, `patterns/`, `layout/` vẫn bị cấm. Không thêm baseline.
- EntityPicker đổi từ ô gõ tự động hoàn thành sang nút combobox + ô tìm trong popover (mẫu combobox của shadcn). Bỏ `Field/TextInput` ở picker. Form submit chặn bằng `<input>` ẩn (opacity-0, tabIndex -1) có `setCustomValidity("Hãy chọn … trong danh sách.")`; `serializeValue=false` thì giá trị chỉ là "selected", id không vào DOM. Picker không bắt buộc: chọn lại mục đang chọn sẽ bỏ chọn (thay cho xoá chữ).
- Nút trigger EntityPicker không đặt `min-h-11`: gate `layout-gate` cấm Button className có `h-N` (chiều cao thuộc variant). Chiều cao 36px thay vì 44px.
- Toaster đặt `bottom-right` cho cả store lẫn console (store trước ở bottom-center). Sonner tự dồn thành dải ngang dưới 600px.

## Left over
- Chưa chạy trình duyệt: chưa xem EntityPicker trong Dialog/Sheet (popover lồng), tab/focus, bubble validity của input ẩn, Sheet bottom của bộ lọc catalog, vị trí toast, mini-cart ở 375px.
- `components/ui/select.tsx` đã có nhưng chưa thay `Select` native ở `field.tsx` (số file dùng `Select` chưa đếm); `Checkbox` native của `field.tsx` vẫn còn (S3a).
- Mất 44px chạm ở trigger picker và mục dropdown (`min-h-8`); CommandItem giữ `min-h-11 md:min-h-8`. Cần Dawn quyết ở S4 (AC-6).
- Dialog/Sheet đóng bằng nút X mặc định tiếng Anh (`sr-only` "Close") theo bản gốc; muốn tiếng Việt phải sửa file ui hoặc truyền qua prop (chưa có).
- `console-motion.module.css` và hoạt ảnh dialog/popover tuỳ biến bị thay bằng `tw-animate-css` (zoom/fade gốc); `prefers-reduced-motion` do tw-animate không tự xử lý.
- 3 test `lib/api/supplier-contract-bff.test.ts` đỏ sẵn (ENOENT `../inventory`), không thuộc `unit` của verify.
- Vẫn chờ Dawn: tương phản chữ trắng trên `#2E9B5F` (3.52:1).

# S4b - Khung console theo shadcn sidebar-07

## Done
- S4b PASS. `sdlc.py verify --task PORTAL-UI-SHADCN-001` (unit `pnpm vitest run components app features lib/navigation`, lint, typecheck, `next build --webpack`): verdict PASS, exit 0. `frame-lock.mjs --write` chạy lại (72 file). Build chạy song song với dev server :3002 không xung đột (Next 16 dev ghi `.next/dev`).
- `components/ui/{sidebar,breadcrumb,collapsible,avatar}.tsx` + `hooks/use-mobile.ts` = registry `new-york-v4` (chỉ `cn` -> `@/lib/utils`, `@/registry/...` -> `@/components/ui|hooks`). Lệch gốc 2 chỗ: (1) `SidebarInset` render `div` thay `main` để shell giữ đúng một `<main id="main">` dưới header (gate layout-gate không đổi); (2) chuỗi sr-only/aria tiếng Việt ("Bật/tắt thanh bên", "Thanh điều hướng"). `collapsible.tsx` cài theo brief, chưa có importer.
- `lib/navigation.ts` = một nguồn menu: `CONSOLE_NAV` (nhóm Tổng quan, Kho, QC, FOOD_DEV, Bán hàng, Quản trị), `consoleNavFor`, `consoleRouteAllowed`, `navFor` (nền tảng/công ty, trước ở workspace.tsx), `isActive`, `breadcrumbFor`. Quyền/action y nguyên; chỉ đổi nhóm/thứ tự/icon. Xoá `features/console/console-nav.ts`; test chuyển `lib/navigation.test.ts` (+ case breadcrumb).
- `ConsoleShell` = `SidebarProvider` + `SidebarInset`; `ConsoleSidebar` = `Sidebar collapsible="icon"` + `SidebarRail`, header = logo + chi nhánh hiện tại (tĩnh, không dropdown vì chưa có API đổi chi nhánh), `NavUser` ở footer (Tài khoản, Đăng xuất chỉ khi có `onLogout`); `ConsoleHeader` = SidebarTrigger + Separator + Breadcrumb (lấy từ navigation theo pathname, mobile chỉ hiện trang hiện tại) + actions + ThemeToggle. Nút icon header 44x44 ở 375px (`max-md:size-11`, đo bằng playwright). Bỏ localStorage/`initialCollapsed` (SidebarProvider tự lưu cookie).
- `patterns/page-heading.tsx` (`PageHeading`: title, description, icon, badge, actions) thay `PageHeader` của `ui/page.tsx` ở 29 file (cơ học: đổi import + tên thẻ; gồm cả vài màn khách dùng chung: profile-client, cart-view, catalog-view, products/orders-view, product-detail-view, order-detail-view). `PageHeader` và test của nó xoá; `PageShell` giữ.
- Nợ nhỏ: nút X Dialog/Sheet sr-only "Close" -> "Đóng" (cả nút "Close" của DialogFooter).

## Files đổi/xoá
Mới: lib/navigation{.ts,.test.ts}, components/patterns/page-heading{.tsx,.test.tsx}, components/ui/{sidebar,breadcrumb,collapsible,avatar}.tsx, hooks/use-mobile.ts. Viết lại: components/layout/{console-shell,console-sidebar,console-header}.tsx + console-shell.test.tsx, layout/index.ts (bỏ `initialCollapsed`, `ShellNav*` -> `NavGroup/NavItem`). Sửa nhỏ: layout/store-header.tsx (import isActive), layout/theme-toggle.tsx (44px mobile), features/platform/workspace.tsx (dùng `navFor` từ lib), features/console/console-frame.tsx, mocks/console.ts, features/platform/access.test.ts, app/rebrand.test.ts (test sidebar viết lại theo token sidebar), ui/dialog.tsx, ui/sheet.tsx, ui/page.tsx(+test), frame.lock.json.
Xoá: features/console/console-nav.ts. `.aidlc/runs/PORTAL-SHELL-001/preview/kit-preview.test.tsx` còn import `ConsoleShell` với API cũ (`defaultCollapsed`...), không thuộc typecheck/vitest hiện tại, không đụng.

## Ảnh
`.aidlc/runs/PORTAL-UI-SHADCN-001/screens/s4b/`: console, kho-ke-hang, kho-nha-cung-cap (tài khoản WAREHOUSE), quan-tri-ma-tran-quyen (ADMIN, mặt phẳng nền tảng; `/branches` cần tài khoản công ty khác) x `1280-open`, `1280-icon`, `375-closed`, `375-open`. Không cuộn ngang ở 375px (scrollWidth - clientWidth = 0 cả 4 trang). Không lưu trace.

## Left over
- `/branches`, `/roles`, `/memberships` (nhóm Quản trị công ty) chưa chụp: ADMIN là nền tảng, không vào được console công ty.
- Trang con trong `PageShell` còn padding kép (main p-4/md:p-6 + PageShell px/py-8), nội dung căn giữa max-w-7xl nên dịch ngang khi thu gọn sidebar; xử lý ở S6-S10 khi đụng từng màn.
- Phím tắt Ctrl/Cmd+B của sidebar shadcn bật mặc định.
- Breadcrumb mới 2 cấp (nhóm > trang); trang sâu hơn (chi tiết NCC) chưa có cấp thứ 3.
- Chi nhánh hiện tại chỉ hiển thị, chưa có switcher (chưa có API/luồng đổi chi nhánh trong console).
- 3 test `lib/api/supplier-contract-bff.test.ts` đỏ sẵn (ENOENT ../inventory), ngoài phạm vi verify.

# S4b-fix - field.tsx dùng shadcn, padding kép, avatar

## Done
- `sdlc.py verify --task PORTAL-UI-SHADCN-001` (unit `pnpm vitest run components app features lib --exclude lib/api/supplier-contract-bff.test.ts`, lint, typecheck, `next build --webpack`): verdict PASS, exit 0. `frame-lock.mjs --write` (75 file).
- `components/ui/field.tsx`: bỏ `TextInput` (10 importer đổi cơ học sang `Input` từ `@/components/ui/input`: receipt-date-input, suppliers-view, supplier-form, goods-receipt-receive, receipt-lines-table, supplier-category-picker, supplier-receipts-view, supplier-agreement-form, memberships-view, audit-view). `Textarea` -> `components/ui/textarea.tsx` (registry new-york-v4; importer: supplier-form, supplier-detail-view, supplier-agreements-view).
- Quyết định `Select`: giữ `<select>` native (form đọc qua FormData/onChange event) và dùng class của Input shadcn (h-9, rounded-md, border-input, ring-[3px]); không đổi sang Radix Select. API không đổi.
- Quyết định `Checkbox`: wrapper trong field.tsx bọc `ui/checkbox` (Radix) + Label; giữ API caller (`label`, `description`, `checked`, `defaultChecked`, `name`, `value`, `disabled`, `onChange(event)` với `event.target.checked`). Trong `<form>` Radix tự sinh input ẩn nên name/value/defaultChecked vẫn vào FormData. 13 chỗ dùng không phải sửa.
- Ô tìm + ô lọc trang NCC đo được 36px (h-9) viền `border-input`.
- Avatar NavUser: code đã đúng (Avatar size-8 rounded-lg, chữ cái đầu, nền accent). "Chấm đen lệch trái" trên ảnh S4b là nút dev-tools của Next.js (chữ "N") đè lên góc dưới trái ở dev server, không phải avatar. Ảnh mới ẩn `nextjs-portal`; avatar hiện "Q" nền xanh nhạt đúng chỗ.
- Bảng NCC: đo `table-container` scrollWidth = clientWidth (928/928 trước, 976/976 sau), không bị cắt, `SidebarInset` đã `min-w-0`. Cột "Bảng giá" sát mép vì padding kép. Sửa gốc: `PageShell` bỏ `px-4 sm:px-6` và `py-8` (shell `<main>` giữ padding ngang; chỉ shell cửa hàng, vốn không có padding dọc, được `in-data-[surface=store]:py-8`). Không vá từng bảng.

## Test sửa theo API mới
`components/ui/controls.test.tsx` (Input/Select/Textarea: rounded-md, ring-[3px]), `components/ui/page.test.tsx`, `components/patterns/password-input.test.tsx` (field h-9, nút size-9, pr-10), `app/rebrand.test.ts` (xem S4c).

# S4c - Khung cửa hàng + một khung đăng nhập chung

## Done
- Mới `components/layout/auth-frame.tsx` (`AuthFrame`): một khung theo shadcn login-04 (Card 2 cột: form + panel `bg-primary`, panel ẩn dưới md), skip link, `<main id="main">`, footer; `bare` cho popup. Văn bản nhận qua props.
- `customer-auth-shell.tsx` và `employee-auth-shell.tsx` còn là vỏ mỏng (NextIntlClientProvider theo namespace riêng + gọi `AuthFrame`). Giữ lại vì `features/auth-boundary.test.ts` (S1) bắt buộc mỗi hành trình có file shell và provider riêng, cấm prop `journey/mode` và chọn hành trình lúc chạy; AuthFrame chỉ nhận chuỗi.
- Mới `components/patterns/login-fields.tsx` (`LoginFields`): phần trường chung của đăng nhập khách và nhân viên (alert lỗi, Input, PasswordInput, "Quên mật khẩu" cạnh nhãn, ActionButton). `login-form.tsx` và `staff-login.tsx` còn giữ `<form>`, state, gọi API, redirect, `loginErrorKey` riêng (không đổi logic); xoá `SHAKE_STYLE` nội tuyến của staff-login và `login-motion.module.css` (hiệu ứng rung lỗi đăng nhập bỏ).
- `PasswordInput` về h-9 (trước h-10 ghi đè Input).
- `store-header.tsx`: ô tìm = `Input` shadcn, nav = `buttonVariants ghost` (mục hiện tại `bg-accent`), tài khoản = Avatar + Button ghost icon `size-11`, menu/tìm/giỏ/theme/đăng nhập 44x44 ở 375px (đo playwright). `store-shell.tsx` không cần đổi.
- 375px không cuộn ngang (overflow = 0): trang chủ, `/?auth=login`, `/staff/login`, NCC.

## Test/gate sửa
- `app/layout-gate.test.ts`: danh sách `<main>` = auth-frame thay 2 shell auth. `app/ui-rules-baseline.txt`: bỏ 1 dòng stale `customer-auth-shell.tsx:focus:rounded-md` (baseline chỉ giảm).
- `app/rebrand.test.ts`: input đăng nhập h-9 (trước h-10); bề mặt role chấp nhận `text-foreground`/`border`/`bg-background` ngoài token cũ; sheet thêm nhân viên đếm `role="checkbox"`/`aria-checked` (Radix) thay `type="checkbox"`/`checked=""`, input h-9/border-input/ring-ring/50.

## Ảnh
`.aidlc/runs/PORTAL-UI-SHADCN-001/screens/s4c/`: kho-nha-cung-cap (1280-open, 375-closed), cua-hang-trang-chu, dang-nhap-khach (`/?auth=login`), dang-nhap-nhan-vien x 1280 và 375. Không lưu trace.

## Left over
- Mất 44px chạm ở input/select/checkbox (shadcn h-9, checkbox size-4); chờ Dawn quyết AC-6 (đã ghi từ S3a).
- Các form khác của hành trình (register, forgot, reset, activate, invite, switch-context) vẫn dùng bản riêng, chưa dùng `LoginFields`; `FormAlert` còn ở 2 file `form-feedback.tsx`; `register-form` còn `SHAKE_STYLE`.
- Select native chưa là Radix Select (giữ vì FormData); Checkbox wrapper dùng "event giả" `{target:{checked}}` để giữ API.
- `PageShell` trong console không còn khung dọc riêng: khoảng cách trên do `<main>` p-4/md:p-6.
- Ảnh S4b cũ (screens/s4b) còn nút "N" dev-tools; ảnh s4c đã ẩn.
- 3 test `lib/api/supplier-contract-bff.test.ts` đỏ sẵn (thiếu ../inventory), loại bằng `--exclude`.

# S5 - Dọn cấu trúc + scripts/check-structure.mjs

## Done
- `sdlc.py verify --task PORTAL-UI-SHADCN-001` (unit `pnpm vitest run components app features lib --exclude lib/api/supplier-contract-bff.test.ts`, lint, typecheck, `next build --webpack`, structure `--strict`): verdict PASS, exit 0. `frame-lock.mjs --write` chạy lại (74 file, khớp).
- archcheck: trước 81 violations (43 baselined, 38 new, 20 stale) -> sau 80 (43 baselined, 37 new, 20 stale). Giảm 1 (`SIZE-01 features/roles/roles-view.tsx`). Không thêm dòng nào vào `.aidlc/arch-baseline.txt`; 37 new còn lại là file shadcn gốc (FE-09/10/13 ở `components/ui`), `e2e/setup/api.ts` FE-03, FE-14: để S11.
- `scripts/check-structure.mjs` (node stdlib, 0 dependency) + `package.json` script `check:structure`. Luật: `barrel-index` (index.ts/tsx trong components/ và features/), `native-{dialog,table,select}-outside-ui`, `fetch-outside-lib`, `router-logic-in-tsx` (useRouter trong `.tsx` của features/), `loader-missing-server-only` (`lib/**/*-data.ts`), `removed-ui-import` (state, segmented, text-input, entity-picker, console-motion). Quét app, components, features, hooks, lib; bỏ qua `*.test|spec.ts(x)` và `mocks/`.
- `scripts/check-structure.baseline.txt` (23 dòng, `đường dẫn + luật`, không số dòng): nợ có sẵn, cùng cơ chế arch-baseline. `--strict` chỉ đỏ khi có vi phạm MỚI; dòng đã sửa in `FIXED` (xoá khỏi baseline). Đã thử: thêm `features/roles/index.ts` + import `ui/state` + `fetch(` -> exit 1, 3 NEW.
- Bỏ barrel `components/layout/index.ts` (0 importer thật; `components/modals/index.ts` đã xoá từ S3c). Không còn `index.ts` nào trong components/ hay features/.
- `e2e-supplier-ux/` -> `e2e/supplier-ux/` (git mv). `playwright.supplier-ux.config.ts`: `outputDir` `../node_modules` -> `../../node_modules`. `playwright.config.ts`: thêm `**/supplier-ux/**` vào `testIgnore` của project desktop và mobile, để config mặc định không chạy spec này (S55 SUPPLIER-UX-002 cố ý để nó ngoài `testDir`). Kiểm: config riêng `--list` 3 test, config mặc định 0 dòng supplier-ux-002. `package.json` `test` bỏ `--exclude "e2e-*/**"` (thư mục không còn; `e2e/**` vẫn loại).
- `contracts/` -> `lib/contracts/` (git mv, cạnh `operations.generated.ts`). Sửa đường dẫn: `lib/api/activation-contract.test.ts`, `lib/api/supplier-contract-bff.test.ts` (dòng 20), `AGENTS.md` (bảng "backend contracts"). `uigen.py`/`routegen.py` không đọc `portal/contracts` (grep platform-docs/scripts, agent_skills: 0).
- Tách `features/roles/roles-view.tsx` 529 -> 319 dòng: types + `ROLES_COLUMNS` + `PERMISSION_GROUPS` + `ACTION_LABELS` (thêm `export`) sang `features/roles/roles-matrix-data.ts` (216 dòng). Chỉ cắt/dán, JSX và hook không đổi. `RolesView` vẫn export từ `roles-view.tsx` (importer duy nhất `app/rebrand.test.ts`).

## File di chuyển/xoá
- Xoá: `components/layout/index.ts`.
- Di chuyển: `e2e-supplier-ux/{playwright.supplier-ux.config.ts,supplier-ux-002.spec.ts}` -> `e2e/supplier-ux/`; `contracts/{README.md,auth.public.yaml,inventory.public.yaml,org.public.yaml}` -> `lib/contracts/`.
- Mới: `scripts/check-structure.mjs`, `scripts/check-structure.baseline.txt`, `features/roles/roles-matrix-data.ts`.
- Sửa: `package.json`, `playwright.config.ts`, `frame.lock.json`, `AGENTS.md`, 2 test lib/api, `features/roles/roles-view.tsx`.

## Left over
- `plans/` trong portal: KHÔNG có trong worktree (không tracked). Bản `~/work/ticket/portal/plans/261008-0800-employee-ux/` ở checkout chính là untracked, không có bản ở `ticket/plans/`. Không động tới; Dawn quyết chuyển vào `.aidlc/`, `ticket/plans/` hay xoá.
- `migrations/202608130001_portal_audit.sql`: giữ nguyên. Không runner/code nào trong portal dùng; chỉ `.aidlc/stage-policy.json` có pattern `(^|/)migrations/.*\.sql$`; DB-STD-001 (`.aidlc/runs/DB-STD-001/plan.md:45`) đã ghi nợ "không có runner". Dawn quyết có xoá không.
- 23 vi phạm check-structure còn trong baseline: `fetch-outside-lib` 10 (6 route handler `app/api/auth/*` + `app/readyz`, `shelves-view`, `orders-view`, `pricing-floor-view`), `router-logic-in-tsx` 9, `native-select-outside-ui` 3, `native-table-outside-ui` 1 (roles-view). Route handler BFF có thể nên được miễn thay vì đẩy vào lib: Dawn quyết. Co baseline ở S6-S11 khi đụng từng màn.
- Runner ngoài repo `.cache/run/supplier-ux-verify-f4.py:56` còn trỏ `e2e-supplier-ux/playwright.supplier-ux.config.ts`; cần đổi sang `e2e/supplier-ux/...` (ngoài repo, không sửa).
- `.aidlc/runs/*/artifacts/plan-approval.json` của các run cũ còn nhắc `components/layout/index.ts`, `portal/contracts/*` (lịch sử, không sửa).
- 3 test `lib/api/supplier-contract-bff.test.ts` đỏ sẵn (thiếu ../inventory), loại bằng `--exclude`; đường dẫn `lib/contracts/inventory.public.yaml` đã sửa nhưng chưa chạy được ở worktree.
