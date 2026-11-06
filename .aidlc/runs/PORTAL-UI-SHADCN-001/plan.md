# Plan: UI shadcn gốc + xanh Lá dịu + cấu trúc theo Vinmec

- **Task ID**: `PORTAL-UI-SHADCN-001`
- **Mode**: `hard`
- **Story**: US-UI-SHADCN-001
- **Sprint**: 05
- **Nhánh**: `feat/portal-ui-shadcn` (1 nhánh duy nhất, từ main 767b6a7) · worktree `ticket/.cache/worktrees/portal-ui-shadcn`

## Scope
- Outcome: mỗi vai (kho, QC, FOOD_DEV, quản trị, khách) đi hết hành trình của mình trên giao diện mới mà không gặp màu đỏ cũ, nút/khung lệch kiểu, hay màn "nhựa". Dawn xem video trước/sau từng vai và gật.
- Decision: **REMOVE** kit tự viết trong `components/ui` (19 component) → **REUSE** shadcn gốc; **EXTEND** cấu trúc thư mục theo mẫu Vinmec.
- Nguồn kiểm kê: [kiem-ke-261105-1423-portal-ui-rebuild-report.md](../../../../../../plans/reports/kiem-ke-261105-1423-portal-ui-rebuild-report.md) · mẫu: `ticket/.cache/refs/vinmec/apps/web` (commit 0bbdd4f) + `docs/code-standards.md` của Vinmec.
- Màu chốt 05/11: **Lá dịu** primary `#2E9B5F`, hover `#237A4A`, soft `#E3F4EA`, ink `#1D5E3A`; nền zinc; đỏ `red-600` chỉ cho lỗi. Trang chọn: https://claude.ai/artifact/VLGyesyT9ng4G3uak2mP5U

## Requirements
- FR-1 Màu: toàn portal dùng 1 bộ biến shadcn (`--primary`, `--background`, `--muted`, `--border`, `--ring`, `--destructive`…) sinh từ `platform-docs/ui/tokens.json`; hệ `--p/--l0/--line` cũ bị gộp rồi xoá.
  - AC-1: `grep -rn "D2402A\|--p-\|tomato" app components features` = 0 dòng.
  - AC-2: chữ trắng trên nút chính đạt ≥ 4.5:1 ở cỡ 14px đậm (dùng ink `#1D5E3A` cho chữ trên nền soft; nút chính chữ trắng cỡ ≥ 14px semibold — đã đo trên trang chọn màu).
- FR-2 Component gốc: `components/ui/*` là file shadcn sinh bằng CLI (`npx shadcn add`), không sửa tay. Chỗ cần custom → file riêng ở `components/patterns/` bọc bản gốc.
  - AC-3: `git diff` của `components/ui/` so với bản CLI sinh ra = 0 (kiểm bằng script so hash, ghi vào frame lock).
  - AC-4: Button, Input, Label, Checkbox, Switch, Card, Badge, Table, Tabs, Popover, Dialog, Sheet, Select, DropdownMenu, Tooltip, Separator, Skeleton, Sonner thay hết bản cũ; 0 import tới bản cũ.
- FR-3 Layout: 1 khung console (sidebar shadcn có thu gọn + header có breadcrumb + vùng nội dung có `PageHeading`), 1 khung cửa hàng, 1 khung đăng nhập dùng chung cho khách và nhân viên.
  - AC-5: Dawn chọn bố cục trên trang mẫu trước khi code (S4a), bản code khớp bản đã chọn.
  - AC-6: ở 375px không cuộn ngang; sidebar thành Sheet.
- FR-4 Cấu trúc theo Vinmec: `app/` chỉ route + guard + parse; `components/{ui,layout,patterns}` dùng chung; `features/<domain>/` nghiệp vụ; `lib/` gọi API + contract; hook `use-*.ts` giữ state/điều hướng, `.tsx` chỉ render; không barrel `index.ts`; tên file kebab-case.
  - AC-7: `node scripts/check-structure.mjs --strict` xanh (luật bên dưới).
- FR-5 Hành trình: mỗi slice màn hình kết thúc bằng video "đi thử như vai đó" (chromium headless, workers=1, kịch bản tiếng Việt), Dawn xem rồi mới tick.
- Ngoài phạm vi: nâng next 16.3→16.4 / react 19.0→19.2 / zod 3→4 (task riêng); đổi SWR; backend; mobile app; màn mới.

## Technical definition
- Luật `scripts/check-structure.mjs` (lấy từ Vinmec, chỉnh cho portal):
  1. `fetch(` chỉ trong `lib/`.
  2. File loader server (`lib/**/*-data.ts`) có `import "server-only"`.
  3. Cấm `index.ts` barrel trong `components/` và `features/`.
  4. Cấm `<table`, `<dialog`, `<select` thô ngoài `components/ui`.
  5. Cấm `useRouter` trong `.tsx` của `features/` (đưa vào hook).
  6. Cấm import `components/ui` cũ đã xoá (danh sách tên).
- Giữ guard sẵn có: archcheck FE-01..14, `app/ui-rules-gate.test.ts` + `ui-rules-baseline.txt` (chỉ được co lại), frame lock (`node scripts/frame-lock.mjs --write` sau mỗi slice khung).
- ESLint `no-restricted-imports` (eslint.config.mjs:40-44) hiện cấm `@radix-ui/*` và `sonner` → **mở riêng cho `components/ui/**`** (chỉ shadcn được import Radix/sonner); `app/` và `features/` vẫn cấm, phải đi qua `components/ui`.
- Không chuyển sang `src/` ở plan này: đổi alias `@/*` chạm toàn bộ import + vitest/playwright config, lợi ích thấp. [ASSUMED Dawn đồng ý — xem Open decisions D2]
- Code không comment (theo Vinmec code-standards "Cách viết"), trừ `ponytail:` đánh dấu chỗ cố ý đơn giản.

## UX
- Bố cục console tham khảo shadcn block `sidebar-07` (thu gọn thành icon) + `dashboard-01` (bảng + bộ lọc), cửa hàng tham khảo shadcn `store` patterns. Trang mẫu (S4a) dựng trên dữ liệu thật: phiếu nhập PN-2611-014, danh sách món, đơn khách.
- Mật độ: bảng `h-10` mỗi dòng, chữ 14px, bo `rounded-md` (6px), không bóng đổ ngoài Dialog/Popover, icon lucide 16px đồng cỡ.
- Skill bắt buộc trong mọi brief UI: `ui-ux-pro-max`, `frontend-design`, `senior-frontend`, `react-best-practices` (đã cài cho Claude + codex 05/11).

## Design
- `components.json`: style `new-york`, rsc true, baseColor `zinc`, cssVariables true, iconLibrary `lucide`, alias `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`.
- Chuỗi màu: `tokens.json` (thêm nhóm `shadcn` map vai trò → biến) → `uigen.py tokens --write` → `app/tokens.generated.css` khai `:root` + `.dark` biến shadcn → `globals.css` chỉ còn `@import` + `@theme inline` map biến → class Tailwind.
- Custom (bản riêng, bọc bản gốc) dự kiến: `patterns/action-button.tsx` (pending + lỗi), `patterns/entity-picker.tsx` (Popover + Command), `patterns/page-heading.tsx`, `patterns/empty-state.tsx`, `patterns/status-badge.tsx` (trạng thái phiếu/lô → màu), `patterns/confirm-dialog.tsx`, `patterns/password-input.tsx` (đã có).
- Xoá: `switch.tsx` (0 importer), 4 modal 0 importer trong `components/modals/`, Checkbox trùng, TextInput trùng Input, `console-motion.module.css`.
- Dọn thư mục: gộp `e2e-supplier-ux/` vào `e2e/`; `contracts/` gộp vào `lib/contracts/`; `plans/` trong portal chuyển về `.aidlc/` hoặc xoá nếu đã có ở ticket/plans; `mocks/` giữ (luật mock tách thư mục); `migrations/` [ASSUMED không thuộc portal — soát trong S5, chỉ chuyển khi xác minh không ai dùng]; tách `roles-view.tsx` 528 dòng ≤ 400.

## Files planned
- components.json
- package.json
- pnpm-lock.yaml
- eslint.config.mjs
- frame.lock.json
- app/
- components/
- features/
- lib/
- hooks/
- e2e/
- e2e-supplier-ux/
- contracts/
- scripts/check-structure.mjs
- .aidlc/arch-baseline.txt
- ../platform-docs/ui/tokens.json
- ../platform-docs/scripts/uigen.py

## Tests planned
| TC | AC | layer | command |
|---|---|---|---|
| TC-1 | AC-1 | static | `grep -rnE "D2402A|--p-|tomato" app components features` → 0 |
| TC-2 | AC-1,2 | unit | `pnpm vitest run app/rebrand.test.ts app/theme.test.tsx app/layout-gate.test.ts` (viết lại kỳ vọng sang Lá dịu) |
| TC-3 | AC-3,4 | static | `node scripts/frame-lock.mjs --check` + `grep -rn "components/ui/(text-input|segmented)" ` → 0 |
| TC-4 | AC-7 | static | `node scripts/check-structure.mjs --strict` |
| TC-5 | all | unit+build | `pnpm vitest run` toàn bộ + `pnpm next build --webpack` + `python3 ~/agent_skills/sdlc/engine/archcheck.py` |
| TC-6 | AC-5,6, FR-5 | e2e | `pnpm playwright test e2e/journeys/<vai>.spec.ts` (video + trace + kịch bản VN), 1280px và 375px |

## Slices
Mỗi slice: codex sol code (brief 5 phần + 4 skill UI), Claude review diff + chạy verify, Dawn xem video ở slice có màn hình. Slice > 5 file chỉ khi là thay thế cơ học (import đổi đường dẫn), ghi rõ.
- [ ] S0: Quay video "trước" 5 hành trình trên main để so (files: e2e/journeys/kho.spec.ts, e2e/journeys/qc.spec.ts, e2e/journeys/fooddev.spec.ts, e2e/journeys/quan-tri.spec.ts, e2e/journeys/khach.spec.ts; test: pnpm playwright test e2e/journeys)
- [ ] S1: Màu Lá dịu qua tokens.json → uigen → biến shadcn, gộp hệ `--p` (files: ../platform-docs/ui/tokens.json, ../platform-docs/scripts/uigen.py, app/tokens.generated.css, app/globals.css, app/rebrand.test.ts; test: TC-1, TC-2)
- [ ] S2: Dựng shadcn: components.json, Radix/sonner chỉ cho components/ui, `lib/utils.ts` cn, frame lock (files: components.json, package.json, pnpm-lock.yaml, eslint.config.mjs, frame.lock.json; test: pnpm lint && TC-3)
- [ ] S3a: Button + Input + Label + Checkbox + Switch shadcn gốc; `patterns/action-button.tsx`; đổi 73+27 importer (cơ học) (files: components/ui/button.tsx, components/ui/input.tsx, components/ui/label.tsx, components/ui/checkbox.tsx, components/patterns/action-button.tsx; test: pnpm vitest run components && TC-3)
- [ ] S3b: Card, Badge, Table, Tabs, Separator, Skeleton, Tooltip; `patterns/status-badge.tsx`, `patterns/empty-state.tsx` (files: components/ui/card.tsx, components/ui/badge.tsx, components/ui/table.tsx, components/ui/tabs.tsx, components/patterns/status-badge.tsx; test: pnpm vitest run components)
- [ ] S3c: Dialog, Sheet, Popover, Select, DropdownMenu, Command, Sonner; `patterns/confirm-dialog.tsx`, `patterns/entity-picker.tsx`; xoá dialog 403 dòng, toast cũ, 4 modal thừa (files: components/ui/dialog.tsx, components/ui/sonner.tsx, components/patterns/confirm-dialog.tsx, components/patterns/entity-picker.tsx, components/ui/popover.tsx; test: pnpm vitest run components)
- [ ] S4a: Trang mẫu 2–3 bố cục console + cửa hàng + đăng nhập trên dữ liệu thật để Dawn chọn (artifact, không code portal) (files: components/layout/; test: Dawn chọn trên trang mẫu)
- [ ] S4b: Khung console theo bố cục đã chọn: sidebar shadcn thu gọn, header breadcrumb, `patterns/page-heading.tsx`, `lib/navigation.ts` theo quyền (files: components/layout/console-shell.tsx, components/layout/console-sidebar.tsx, components/layout/console-header.tsx, components/patterns/page-heading.tsx, lib/navigation.ts; test: pnpm vitest run components/layout && TC-6 1280+375)
- [ ] S4c: Khung cửa hàng + 1 khung đăng nhập chung khách/nhân viên (gộp 2 bộ form trùng) (files: components/layout/store-shell.tsx, components/layout/store-header.tsx, components/layout/auth-frame.tsx, features/customer-auth/, features/employee-auth/; test: TC-6 khach)
- [ ] S5: Dọn cấu trúc theo Vinmec + `scripts/check-structure.mjs`; bỏ barrel, gộp e2e/contracts, tách roles-view (cơ học, nhiều file) (files: scripts/check-structure.mjs, components/layout/index.ts, components/modals/index.ts, contracts/, features/roles/roles-view.tsx; test: TC-4, TC-5)
- [ ] S6: Hành trình **kho**: NCC, phiếu nhập, nhận hàng có ảnh, tồn kho — đổi primitive + trả nợ UI các màn đó (files: features/inventory/; test: TC-6 kho + Dawn xem video)
- [ ] S7: Hành trình **QC**: QC đầu vào, QC thành phẩm, truy xuất (files: features/inventory/ (phần QC), features/production/, features/traceability/; test: TC-6 qc + Dawn xem video)
- [ ] S8: Hành trình **FOOD_DEV**: món, nguyên liệu, giá vốn, mở bán (files: features/production/dishes/, features/products/, features/sales/; test: TC-6 fooddev + Dawn xem video)
- [ ] S9: Hành trình **quản trị**: chi nhánh, nhân sự, vai trò, nền tảng/công ty (files: features/branches/, features/memberships/, features/roles/, features/platform/, features/staff-profile/; test: TC-6 quan-tri + Dawn xem video)
- [ ] S10: Hành trình **khách**: cửa hàng, giỏ, đăng nhập/kích hoạt (files: features/store/, features/customer-auth/; test: TC-6 khach + Dawn xem video)
- [ ] S11: Dọn cuối: xoá kit cũ còn sót, co `ui-rules-baseline.txt` + `.aidlc/arch-baseline.txt`, frame lock, verify toàn bộ, handback (files: app/ui-rules-baseline.txt, .aidlc/arch-baseline.txt, frame.lock.json, components/ui/; test: TC-1..TC-5)

## Risks / rollback
- Thay Button/Input đổi hàng trăm import một lúc → 1 commit cơ học riêng, dễ revert; vitest + build chạy ngay sau.
- Test rebrand/theme/layout-gate khoá màu đỏ cũ → sửa kỳ vọng trong S1, không xoá test.
- Radix thêm ~40 KB gzip cho các màn có Dialog/Popover [ASSUMED, đo `next build` trước/sau trong S2, ghi vào handback].
- Đổi tokens.json chạm repo platform-docs → commit riêng ở platform-docs cùng nhánh tên `feat/portal-ui-shadcn`, merge cùng lúc.
- Rollback: mỗi slice 1 commit; không merge main cho tới khi Dawn xem đủ video S6–S10.

## Open decisions
- D1: Mở lệnh cấm Radix/sonner **chỉ cho `components/ui/**`** — cần cho shadcn gốc. Đề xuất: đồng ý.
- D2: Không chuyển sang `src/` như Vinmec (đổi alias toàn repo, lợi ích thấp). Đề xuất: không chuyển. Nếu Dawn muốn giống hẳn Vinmec → thêm 1 slice cơ học sau S5.
- D3: Nâng next/react/zod để ngang Vinmec → task riêng sau plan này.
