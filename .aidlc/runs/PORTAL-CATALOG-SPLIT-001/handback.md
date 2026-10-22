## Done

- S2: `red-S2.log` 9 xanh/15 đỏ → `green-S2.log` 24/24 xanh. Staff/public decode envelope bằng Zod; giữ ảnh, branch, cursor và giá thiếu; cart dùng sku_ref + branch_id, BFF chỉ forward branch_id.
- S3: `red-S3.log` không nạp được module (17 case trong source); `green-S3.log` 16/17 xanh. Catalog khách, filter desktop/mobile và sheet đã triển khai. Assertion query "g" vẫn đỏ; giữ nguyên test.
- S4: `red-S4.log` 37/44 xanh → `green-S4.log` 42/44 xanh; hai lỗi còn lại thuộc detail S6. Sau S6, cả 44 case tương ứng xanh trong `final-vitest.log` (products 20, sales API 15, BFF 9). Bảng/form staff chuyển vào console; form gửi name/slug; nút tạo cần canCreate; không còn thao tác giỏ/kích hoạt.
- S5: `red-S5.log` 10/19 xanh → `green-S5.log` 19/19 xanh. Menu/URL products cần sales:product:read; route được nhận diện employee.
- S6: `red-S6.log` 98/115 xanh → `green-S6.log` 97/115 xanh. Products 20/20 xanh; rebrand 77/95 xanh. Detail khách bỏ kích hoạt/SKU/barcode/ngày tạo, dùng ảnh và dữ liệu thật; cart không fallback product ID.
- Tổng cuối: `final-vitest.log` 156/175 xanh, 19 đỏ, exit 1; không sửa test. `pnpm run typecheck` exit 0; `pnpm run lint` exit 1; `python3 -B ~/agent_skills/sdlc/engine/archcheck.py` exit 1. Chi tiết phần Left over.
- E2E chưa chạy: chờ cổng 3000 từ khoảng 22:46 đến 23:26 ngày 22/10/2026, kiểm tra khoảng mỗi 60 giây. Lần cuối 23:26:09 vẫn là PORTAL-MOTION, PID 3661255. Không mở server catalog, không dừng server motion. Chưa có số pass/skip/fail E2E.
- Đã chép script được chỉ định sang `start-dev.cjs`, chỉ đổi root sang /home/dawn/wt/portal-catalog; giữ nguyên loadEnvConfig của portal gốc. Chưa chạy script.
- `git diff --check` exit 0. Quét JWT trong logs không có kết quả.

## Files changed

14 file source do Codex sửa/tạo:
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

Chứng cứ trong run: logs/red-S2..S6.log, logs/green-S2..S6.log, logs/final-vitest.log, logs/typecheck.log, logs/lint.log, logs/arch.log, logs/arch-head-comparison.json, logs/e2e-port-blocked.log và start-dev.cjs.
Test, node_modules symlink, .aidlc/ACTIVE, trace.jsonl và metadata run có sẵn được giữ nguyên. Không commit, không sửa backend/package/env/arch-baseline.

## Decisions

- Áp dụng ui-ux-pro-max và bố cục prototype đã duyệt; tái dùng Card/Input/Button/Dialog variant=sheet và state components, không thêm primitive/package/design system.
- Chỉ lọc/sort trên món đã tải, hiển thị số món đã tải và Xem thêm theo cursor; không tạo dữ liệu tim/khuyến mãi/đánh giá.
- Thiếu SKU/branch/giá/tồn kho thật thì không cho thêm giỏ; tồn UNKNOWN cũng bị khoá. Chỉ ghi cart cache/toast thành công sau response API thành công được decode.
- ProductsLoader chờ quyền trước khi gọi staff list. canCreate mặc định false; không so role. Chỉ thêm rule /sales/products vào nav hiện hữu, giữ hành vi route khác.
- Filter thuần dùng shape name/price generic, không phụ thuộc API; ô tìm mobile là textbox có label. Giữ nguyên phép lọc tên dù một assertion sai kỳ vọng.
- Không đặt nút kích hoạt ở cả hai màn theo OD-4. S7 motion chưa làm trong lượt S2→S6.
- Khi hết giới hạn chờ E2E, bàn giao blocker theo codex-build-1-e2e.md; không thử server worktree khác.

## Left over

- Claude quyết test `features/products/catalog.test.tsx:124`: query "g" kỳ vọng "Cá hồi áp chảo" dù tên không chứa "g". Kết quả đúng theo lọc tên hiện chỉ có "Gà nướng mật ong". Không sửa test/không nới bộ lọc để khớp assertion.
- 18 case `app/rebrand.test.ts` còn kỳ vọng form SKU/giá/UOM/mô tả, các slot state cũ, create hiển thị khi không truyền canCreate, giỏ staff và detail quản trị/kích hoạt. Cần Claude cập nhật hợp đồng regression tương ứng brief mới. Chi tiết từng assertion trong green-S6.log/final-vitest.log; không coi nhóm này đã xanh.
- Lint lỗi tại `next.config.mjs:3`: process is not defined (no-undef). File trùng HEAD, ngoài Files planned nên giữ nguyên.
- Archcheck hiện 62 violations, 44 baselined, 18 new theo baseline cũ, 12 stale; exit 1. Đối chiếu cùng checker trên git archive HEAD 473d8e313e3d56cc630713624469a2750f81f7b6: trước 66, sau 62; **0 cặp rule/file mới**. FE-14 form đổi chi tiết từ thiếu loading,empty,error thành chỉ thiếu empty; không phải tăng vi phạm. Không sửa baseline hay nợ ngoài scope.
- E2E bị chặn bởi cổng 3000 sau 40 phút. Khi cổng trống, chạy start-dev.cjs, kiểm server của đúng worktree qua localhost:3000, chạy `pnpm exec playwright test e2e/catalog-split/catalog-split.spec.ts`, ghi số pass/skip/fail thật và dừng đúng PID đã mở. Catalog 0 món được skip theo test; không tự skip lỗi hạ tầng/quyền.
- Chưa xác nhận live cart mutation, các viewport/motion S7 hay browser E2E. Không tạo DONE-build-1.txt khi còn các blocker trên.

## S7 merge PORTAL-MOTION-001

### Done

- Đã `git fetch origin` và `git merge --no-ff --no-commit origin/portal-motion-001`. HEAD vẫn `f0d25ffab0f4ae6e4d04dc20a1e5f075c3a2a598`, MERGE_HEAD `b5fdb44c1235f1b4c5e6164f0b32118c4559cb1d`. Đã giải và stage conflict, không commit/push.
- Đỏ → xanh: catalog unit từ 20/23, 3 đỏ do thiếu module/import, thành 23/23; products regression 20/20. Lệnh `TMPDIR=/home/dawn/work/ticket/.cache/tmp ESBUILD_BINARY_PATH=/home/dawn/.local/share/esbuild/esbuild-0.21.5 pnpm exec vitest run features/products/catalog.test.tsx features/products/products.test.tsx`, exit 0, 43/43. Log `logs/green-S7-unit.log`.
- E2E thật, desktop + mobile, `pnpm exec playwright test --config /home/dawn/work/ticket/.cache/catalog-s7.playwright.config.ts e2e/catalog-split/catalog-split.spec.ts`, exit 1: 35 pass / 6 skip / 5 fail. Desktop 15/3/5, mobile 20/3/0. Log `logs/green-S7-e2e.log`, tên theo brief nhưng kết quả chưa xanh toàn bộ.
- Chạy lại desktop với `--grep 'staff có sales|staff không có|mở sheet và gõ|ba nút trạng thái|ở 375px'`, exit 1: 6/7 pass, còn tràn 4px tại 375px. Các lỗi điều hướng/boundingBox của lần đầy đủ không tái hiện. Log `logs/S7-e2e-retry.log`.
- Toàn nhánh: `pnpm exec vitest run --exclude 'e2e/**'`, exit 1, 1138/1146 pass, 8 fail; `logs/S7-vitest-all.log`. HEAD trước merge: 1135/1138 pass, 3 fail; `logs/S7-vitest-head.log`.
- `pnpm run typecheck` exit 0; `pnpm run lint` exit 1 chỉ D-267 `next.config.mjs:3` no-undef. Logs `S7-typecheck.log`, `S7-lint.log`.
- `python3 -B ~/agent_skills/sdlc/engine/archcheck.py` exit 1: 61 violations, 43 baselined, 18 new theo baseline cũ, 13 stale. Đối chiếu chính checker trên archive HEAD: 62 → 61, 0 rule/file mới, 0 chi tiết mới; hết FE-09 ở `components/ui/page.tsx`. Logs `S7-arch.log`, `S7-arch-comparison.json`.
- `make smoke` exit 0, `local smoke: OK`; không cần `make dev-up`, không dừng stack. Kiểm tra sẵn `.env`, AUTH_MAIN_BRANCH_ID và private.pem trước khi chạy; không in/sửa giá trị.
- Motion E2E: `PORTAL_E2E_BASE=http://localhost:3417 pnpm exec playwright test --config /home/dawn/work/ticket/.cache/catalog-s7.motion.config.mjs motion-filter.spec.mjs visual-layout.spec.mjs`, exit 1, 12/30 pass, 18 fail, 0 skip, 9.9 phút. Cả 18 lỗi nằm ở phần catalog cũ; dialog/header console/footer 12/12 pass. Log `logs/S7-motion-e2e.log`.
- Đã dừng đúng tiến trình server 3417 bằng session đã mở, exit 130; giữ nguyên server 3000 và stack backend. `git diff --check` và `git diff --cached --check` exit 0. Quét 49 file log/kết quả không có JWT hay mật khẩu QA; `logs/S7-secret-scan.json`.

### Files changed

- `features/products/products-view.tsx`: giải conflict bằng tay; so HEAD chỉ thêm 1 import + 3 className.
- Tự động từ merge, 11 source/test file còn lại: `components/layout/site-footer.tsx`, `components/patterns/password-input.test.tsx`, `components/patterns/password-input.tsx`, `components/ui/dialog.tsx`, `components/ui/page.tsx`, `features/customer-auth/login-form.tsx`, `features/customer-auth/login-motion.module.css`, `features/products/filter-motion.module.css`, `features/store/hero-motion.module.css`, `features/store/home.tsx`, `features/store/landing.tsx`.
- Tự động từ merge, 74 file metadata/chứng cứ: `.aidlc/runs/PORTAL-MOTION-001.json` và `.aidlc/runs/PORTAL-MOTION-001/**`. Các file `artifacts/` có sẵn trên nhánh motion, không sinh/chỉnh artifacts trong lượt S7. Danh sách đủ 86 file merge tại `logs/S7-merge-files.txt`.
- Hai file test Sonnet có sẵn và giữ nguyên, vẫn unstaged: `features/products/catalog.test.tsx` +39 dòng, `e2e/catalog-split/catalog-split.spec.ts` +91 dòng. Không sửa assertion để nhận PASS.
- Chứng cứ S7 trong `logs/`, cập nhật handback này và handoff tại `/home/dawn/work/ticket/plans/261022-catalog-split/handoff-catalog-s7.md`.

### Merge conflicts

- Duy nhất `features/products/products-view.tsx`, tại actions của PageHeader. Giữ `canCreate && <Button>` từ catalog, bỏ Link giỏ hàng và ShoppingCart của motion. Giữ API/model/filter tên và dialog permission của catalog. Import module + ba `motion.filter` từ motion được merge; ba aria-pressed, Check, hai hàng flex-wrap và Search top-1/2 -translate-y-1/2 đều còn. Không chọn ours/theirs cả file.

### Decisions

- Theo mục Claude chốt trong handoff Sonnet: hoãn #019 ở catalog khách. `catalog-filters.tsx`, `catalog-view.tsx` và route store không đổi so HEAD. Không thêm nút sort/chip/primitive/keyframes/module thứ hai.
- Giữ nguyên CSS motion 350/300ms và Check 250/450ms, reduced-motion tắt transition/animation. Probe browser bổ sung qua API QA thật xác nhận icon lệch tâm 0px, cả ba nút nằm trong viewport, đúng một pressed, normal 0.35s/0.3s và reduced 0s/none; `logs/S7-console-probe.log`.
- Server riêng `http://localhost:3417`, `pnpm exec next dev --webpack -p 3417`. Lượt đầu không nạp cấu hình portal gốc bị login 503, giữ log `S7-e2e-no-env.log`. Sau đó loadEnvConfig portal gốc vào bộ nhớ qua launcher tạm `/home/dawn/work/ticket/.cache/catalog-s7-start.cjs`, giữ nguyên lệnh Next, không tạo/sửa/copy `.env*`. Hai config Playwright tạm ở `.cache/`, giữ config gốc, trace/video/screenshot off, output cũng ở `.cache/`. Spec motion nhận thêm PORTAL_E2E_BASE=http://localhost:3417 vì tự tạo browser context.
- Các baseline unit được kiểm trong archive riêng ở `.cache/`, không đổi checkout hay dependency. Không sửa test/frame lock/baseline hoặc source ngoài phạm vi để che lỗi.

### Left over

- 3 lỗi Vitest sẵn ở HEAD: layout-gate Button overrides ở catalog, ui-rules-gate rounded-md mới và baseline stale. 5 lỗi tăng sau merge cũng có trên nhánh motion gốc: frame-lock lệch 5 file và 4 case journey login thiếu requestAnimationFrame trong Node. Kiểm 4 file test liên quan trên archive MERGE_HEAD: 158/164 pass, 6 fail, gồm layout-gate của password-input; `logs/S7-motion-base-unit.log`. Không sửa test theo brief; Claude quyết hợp đồng/baseline và phạm vi sửa.
- Desktop 375 tràn ngang 4px từ AccountMenu ở `components/layout/console-header.tsx:29`, ngoài file S7 và không phải conflict. Probe đo menu rộng 216px, mép phải 378.828px; ẩn tạm menu trong DOM thì document overflow về 0, trả lại ngay sau đo. Bảng nằm trong vùng cuộn, nút filter không vượt biên, Search vẫn căn giữa. Không vá view để che lỗi shell.
- 6 skip theo spec có sẵn: thiếu món ACTIVE nên skip card/detail ở mỗi project và 1 case chỉ dành project kia. Chưa có live cart/detail acceptance; không tạo fixture backend hoặc skip bổ sung.
- Spec motion cũ vẫn yêu cầu bộ lọc staff, ô tìm tên SKU và nút tạo tại `/products` dưới phiên CUSTOMER. Hợp đồng này đã đổi bởi catalog split và quyết định hoãn #019; phải được Claude cập nhật, không đưa control staff trở lại catalog để làm xanh.
- Chưa tạo DONE-catalog-s7.txt vì hồi quy và E2E còn đỏ. Merge giữ staged cho Haiku sau khi Claude xử lý các mục trên.

## S7 fix1

- Phạm vi code: chỉ `features/products/catalog-filters.tsx`, `features/products/catalog-view.tsx`, `features/products/product-detail-view.tsx` và `app/ui-rules-baseline.txt`. Bỏ class min-h-11 thừa vì Button mặc định đã cao tối thiểu 44px; bỏ px-2 trên nút thêm giỏ để dùng padding của variant; nút tăng/giảm dùng size="icon" 44px có sẵn. Select dùng rounded-lg ánh xạ token --r-8. Không đổi state/API/bố cục hay thêm style/primitive.
- Baseline chỉ xoá đúng 3 dòng thừa được brief chỉ định ở product-create-dialog và product-detail-view; không thêm dòng hoặc sửa gate test.
- Đỏ → xanh một phần: `TMPDIR=/home/dawn/work/ticket/.cache/tmp ESBUILD_BINARY_PATH=/home/dawn/.local/share/esbuild/esbuild-0.21.5 pnpm exec vitest run app/layout-gate.test.ts app/ui-rules-gate.test.ts features/products/catalog.test.tsx features/products/products.test.tsx`, trước 147/150 pass, 3 fail (`logs/S7-fix1-red.log`), sau 149/150 pass, 1 fail, exit 1 (`logs/S7-fix1-unit.log`). Hai case ui-rules-gate đã xanh; catalog 23/23, products 20/20. Tổng 3 gate được yêu cầu hiện 2/3 xanh.
- Blocker còn lại của layout-gate.test.ts:102 là `components/patterns/password-input.tsx`, file motion có class ghi đè bg/rounded trên Button. Ba file catalog đã hết vi phạm; log chỉ còn đúng file password-input. File này nằm ngoài phạm vi fix1 nên giữ nguyên, không nới test hay thêm baseline để nhận PASS. Claude cần quyết phạm vi xử lý tiếp.
- `TMPDIR=/home/dawn/work/ticket/.cache/tmp pnpm run typecheck`, exit 0; `logs/S7-fix1-typecheck.log`.
- E2E đủ desktop/mobile: `TMPDIR=/home/dawn/work/ticket/.cache/tmp pnpm exec playwright test --config /home/dawn/work/ticket/.cache/catalog-s7.playwright.config.ts e2e/catalog-split/catalog-split.spec.ts`, exit 1, 36 pass / 6 skip / 4 fail; `logs/S7-fix1-e2e.log`. Ba lỗi tạm thời gồm fill/boundingBox timeout và dialog còn hiện khi đổi viewport. Chạy lại đúng 4 case bằng `--last-failed`, exit 1, 3 pass / 0 skip / 1 fail; `logs/S7-fix1-e2e-retry.log`. Chỉ còn nợ tràn 4px ở header console 375px như brief đã nêu; không sửa shell. Sáu skip theo điều kiện test có sẵn, không thêm skip.
- Server mở bằng đúng launcher `/home/dawn/work/ticket/.cache/catalog-s7-start.cjs`, localhost:3417, chạy trong PTY. Đã đối chiếu cây PID host 149999 launcher → 150018 pnpm → 150082 Next → 150158 next-server. Gửi SIGINT vào đúng session; `ps -p` sau đó không còn cả bốn PID. Không dừng tiến trình khác theo cổng. Quét 8 file log/kết quả không có JWT hoặc mật khẩu QA; `logs/S7-fix1-secret-scan.json`. `git diff --check` exit 0.
- Không sửa test, đặc biệt không đụng motion-quantity.spec.mjs Sonnet đang sửa. Không merge lại/abort, commit/push, sdlc.py, env/package/backend hay artifacts. Chưa tạo DONE-catalog-s7-fix1.txt vì layout gate còn bị chặn ngoài phạm vi.
