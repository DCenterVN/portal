## Done

Đã triển khai theo thứ tự S7 → S1 → S2 → S5 → S8 → S9 → S11. Kết quả cuối **58/60 test pass**. Sáu slice đủ xanh; S2 còn hai assertion cần Claude quyết, không tạo DONE.

| Slice | Red trước sửa | Kết quả sau sửa | Log |
|---|---|---|---|
| S7 | Unit 1 fail + 4 pass; browser 12 fail + 1 pass | Unit 5/5 + browser 13/13, exit 0 | `logs/red-S7.log`, `logs/green-S7.log` |
| S1 | 4 fail + 4 pass | 8/8, exit 0 | `logs/red-S1.log`, `logs/green-S1.log` |
| S2 | 4 fail + 2 pass | 4/6; 2 fail, exit 1 | `logs/red-S2.log`, `logs/green-S2.log` |
| S5 | 2 fail + 2 pass | 4/4, exit 0 | `logs/red-S5.log`, `logs/green-S5.log` |
| S8 | 6 fail + 2 pass | 8/8, exit 0 | `logs/red-S8.log`, `logs/green-S8.log` |
| S9 | 12 fail | 12/12, exit 0 | `logs/red-S9.log`, `logs/green-S9.log` |
| S11 | 2 fail + 2 pass | 4/4, exit 0 | `logs/red-S11.log`, `logs/green-S11.log` |

`green-S2.log` giữ tên theo brief nhưng chứa kết quả thật 4 pass, 2 fail; không nhận S2 đã xanh. Các lần thử trung gian còn ở `logs/attempt-*` và `logs/*recheck*`.

Đã chụp và mở đủ **40 crop after**, ghép với ảnh before cùng dữ liệu/state/viewport/theme tại [bảng before/after](artifacts/build-1-after/index.md). Login là form trống, catalog là phiên CUSTOMER thật với 0 SKU. Không chỉnh ảnh hoặc ẩn DOM để che Next dev indicator xuất hiện trong một số crop.

## Files changed

- components/patterns/password-input.tsx
- features/store/landing.tsx
- features/store/home.tsx
- features/store/hero-motion.module.css
- features/products/products-view.tsx
- features/products/filter-motion.module.css
- features/customer-auth/login-form.tsx
- features/customer-auth/login-motion.module.css
- components/ui/dialog.tsx
- components/ui/page.tsx
- components/layout/site-footer.tsx

## Decisions

- Dùng ui-ux-pro-max để rà reduced-motion và focus; giữ thiết kế đã duyệt, không sinh design system hoặc component mới. Diff source nằm trong các file của slice.
- S7 giữ hit area 40px, nền/shadow trong suốt ở các trạng thái, icon đậm hơn khi hover và outline qua pseudo-element 20px. Không sửa Button global.
- S1 dùng CSS module, giữ số Lucian #216. Chỉ bật animation khi `scripting: enabled` và `prefers-reduced-motion: no-preference`; no-JS/reduced vẫn hiện ngay. Không chia thêm span trong h1.
- S2 chỉ thêm class/CSS module theo #019, không sửa setter/state, chọn đơn hoặc request. Không dùng flushSync để ép khớp phép đo đồng bộ của test.
- S5 đưa rung 500ms và fade opacity 200ms vào CSS module theo #062; giữ nhãn busy hiện có và cơ chế chống gửi trùng. Test phát hiện catch gọi focus lúc input còn disabled; chuyển riêng lời gọi focus sang requestAnimationFrame để DOM đã gỡ disabled. Không chờ animation hoặc trì hoãn request. Các request đăng nhập sai thật trả 401, không gặp 429 và không đổi limiter.
- S8 chỉ wrap hai cụm hiện có và căn giữa icon tìm. S9 chỉ bỏ tint/background hover và thay indicator focus quanh icon, giữ kích thước và lifecycle.
- S11 chọn màu từ token có sẵn bằng biến cục bộ `--footer-ink`, theo dark variant của app. Bỏ phụ thuộc `light-dark()` chọn theo color-scheme của trình duyệt; không thêm màu cứng, sửa token generated hoặc đổi nền/font/layout.
- `pnpm run typecheck` exit **0**, log `logs/typecheck.log`. ESLint trên đúng tám file TSX đã sửa exit **0**, log `logs/lint.log`; dùng `pnpm exec eslint <files>` vì script `pnpm run lint` cố định đối số `.`. Ba CSS module được kiểm qua render browser.
- Archcheck trước/sau đều exit **1**, cùng **17 vi phạm ngoài baseline có sẵn**. Tập vi phạm không đổi, **0 vi phạm phát sinh**; xem `logs/arch-before.log`, `logs/arch-after.log`, `logs/arch-comparison.json`. Không nới baseline. `git diff --check` exit 0.
- Next webpack dev có lỗi `Manifest file is empty` ở một số lần thử; giữ các log lỗi, khởi động lại đúng server đã mở. Lần cuối S7 chạy trọn suite 13/13 browser, không sửa config/retry/test để xanh.
- Hash toàn bộ test/config Sonnet và `password-input.test.tsx` không đổi so với đầu lượt. Những sửa đổi test do Sonnet có sẵn được giữ nguyên. Không sửa `.env`, cài package, commit, chạy `sdlc.py` hoặc ghi receipt.
- Đã tắt server qua đúng session exec 22214, không pkill server khác. Curl `http://localhost:3000` sau tắt exit 7, HTTP 000. Đã trả hai import `next-env.d.ts` do Next tự sinh về nền. JWT scan trên log/ảnh after/dev log exit 1, **0 file khớp**; quét mật khẩu QA trong bộ nhớ cũng **0 file khớp**.

## Left over

- Hai case S2 tại `tests/motion-filter.spec.mjs:138` và `:179` đọc `aria-pressed` ngay trong cùng callback `el.click()`, trước khi React commit. Cùng assertion đỏ ở baseline trước sửa CSS. Probe thật ghi `duringClickCall=false`, `nextBrowserRead=true` trong `logs/diagnostic-S2-state.log`.
- Phép kiểm bổ sung bằng click người dùng thật xác nhận aria-pressed=true; bình thường thấy các nhịp 350/300/250/450ms, reduced-motion không có animation. Bằng chứng ở `artifacts/build-1-after/manifest.json`, trường `diagnostics`. Đây là thông tin bổ sung, không thay hai test Sonnet còn đỏ.
- Theo brief, giữ nguyên test và chờ Claude quyết phép đo sau click/commit. Không nhận toàn đợt đã PASS và không tạo `/home/dawn/work/ticket/plans/261022-ui-motion/DONE-ui-build-1.txt`. Handoff: `/home/dawn/work/ticket/plans/261022-ui-motion/handoff-ui-build-1.md`.
- S0/S6 chờ token; S3/S4 chờ dữ liệu món, không làm trong lượt này. Không sửa V-03 đã bác, V-05 chờ dữ liệu, V-08 đã bác hoặc V-09 cần việc riêng.

## S0/S6 — Codex, 23/10/2026

### Done

Đã sửa source theo brief `plans/261022-catalog-split/codex-motion-s0-s6.md`, nhưng **chưa đạt acceptance**, không tick slice và không tạo DONE. Các log tên `green-*` dưới đây chứa kết quả thất bại thật.

| Kiểm tra | Trước sửa | Sau sửa / lượt cuối | Exit | Log trong run |
|---|---|---|---|---|
| S0 | 0/10 pass, 10 fail | 0/10 pass, 10 fail; parser không nhận root | 1 | `logs/red-S0.log`, `logs/green-S0.log` |
| S6 | 3 pass, 5 fail, 3 skip | 1/11 pass, 10 fail; case reduced-motion pass | 1 | `logs/red-S6.log`, `logs/green-S6.log` |
| Regression | Không chạy baseline mới | 15/55 pass, 40 fail, 0 skip | 1 | `logs/regression-S0-S6.log` |
| Unit Button / controls / overlay | — | 55/55 pass | 0 | `logs/unit-S6.log` |
| Typecheck, sau trả lại next-env ban đầu | — | Pass | 0 | `logs/typecheck-S0-S6.log` |
| ESLint ba file TSX đã sửa | — | Pass | 0 | `logs/lint-S0-S6.log` |
| Archcheck | 17 ngoài baseline có sẵn | Cùng 17; **0 phát sinh**, log trước/sau giống hệt | 1 | `logs/arch-before-S0-S6.log`, `logs/arch-after-S0-S6.log`, `logs/arch-comparison-S0-S6.json` |

Regression: hero 7/8, filter 0/6, login 0/4, visual-controls 8/13, visual-layout 0/24. Trong 40 lỗi: 22 timeout `locator.fill`, 13 timeout `locator.waitFor`, 4 timeout chờ POST login; 1 assertion hero desktop `eyebrow offsetTop` lệch 12px, ngưỡng 1px. Không nhận đây là 40 regression do diff source.

### Files changed

Repo `portal`, worktree `/home/dawn/wt/portal-motion`:

- `app/tokens.generated.css` — sinh bằng `uigen.py tokens --root <TMPDIR staging root> --write`, trỏ `portal` về worktree này và `platform-docs` về nguồn canonical. Không ghi CSS bằng tay, không ghi sang checkout portal chính.
- `components/ui/button.tsx`, `components/ui/popover.tsx`, `components/ui/dialog.tsx` — chỉ thêm class/import CSS module.
- `components/ui/console-motion.module.css` — press/hover/popover/dialog/sheet và reduced-motion.
- Handback này và log/diagnostic `S0/S6` trong `logs/`.

Repo `/home/dawn/work/ticket/platform-docs`:

- `ui/tokens.json` — thêm đúng 5 duration và 3 easing trong nhóm `motion`.
- `scripts/uigen.py` không đổi: renderer có sẵn đã sinh đủ nhóm motion.

Bàn giao ngoài repo portal: `/home/dawn/work/ticket/plans/261022-catalog-split/handoff-motion-s0-s6.md`.

### Decisions

- Dùng ui-ux-pro-max, không dựng layout/design system mới. CSS button/popover chỉ có hiệu lực dưới `[data-surface="console"]`; dialog/backdrop portal được scope bằng `body:has([data-surface="console"])`. Store/auth không được chọn chỉ vì import chung primitive.
- Nút nhấn transform .97 trong 80ms, hover 120ms; vô hiệu scale .98 cũ trong scope console để không nhân hai phép scale. Popover trượt 6px trong 180ms; dialog scale .98 và sheet mobile trượt trong 220ms. Reduced-motion bỏ transform, chỉ fade 120ms, override rule global `animation: none !important` hiện có. Không thêm chờ animation vào state, aria, request, focus hoặc unmount.
- S0 đỏ vì regex của test lấy cả comment generated vào selector đầu tiên, rồi `startsWith(':root')` không khớp, khiến `light` rỗng. `logs/diagnostic-S0-parser.json` chứng minh 8 giá trị đúng; `logs/diagnostic-S0-browser.json` xác nhận cả 8 bằng computed style thật. Giữ nguyên test và header generated theo brief; không sửa generator để né parser.
- **Drift nguồn canonical có sẵn:** sinh đúng `platform-docs/ui/tokens.json` còn đồng bộ màu, font và shadow, ví dụ primary `#D2402A` → `#1B5E20`, Nunito → Be Vietnam Pro. Không sửa các giá trị này trong JSON. Đã báo và hỏi lựa chọn; chưa có trả lời, nên thực hiện yêu cầu sinh đúng nguồn của brief. Phần này cần Claude quyết trước khi nhận yêu cầu giữ giao diện gốc.
- Dev server nạp cấu hình dịch vụ có sẵn từ checkout portal chính vào tiến trình, không sửa/copy `.env*`. Bản chạy không cấu hình trả 503; các lượt configured vẫn gặp hydration/native submit và timeout. Log trung gian được giữ riêng trong `logs/*infra*`, `logs/*unconfigured*`, `logs/dev-S0-S6*.log`. Sau cùng S6 còn CLS **0.010255069610218942**, bằng giá trị đỏ trước sửa.
- Dev từng ghi query đăng nhập khi form submit HTML GET; một lần đọc log đã lộ mật khẩu trong đầu ra công cụ và đã thông báo người dùng. File log đã được che, các server sau lọc query nhạy cảm/JWT trước khi ghi. Quét cuối 66 log/context: 0 JWT, 0 mật khẩu QA còn sót (`logs/security-S0-S6.json`).
- Dừng đúng server do lượt này mở qua exec session 65836; localhost:3000 sau dừng HTTP 000, curl exit 7 (`logs/server-stopped-S0-S6.log`). `next-env.d.ts` trả đúng hash ban đầu, giữ thay đổi người dùng có sẵn. 10 file test/config giữ nguyên hash, `node_modules` giữ symlink (`logs/integrity-S0-S6.json`). Không cài package, sửa test, chạy `sdlc.py`, ghi receipt, commit, stage, push hoặc làm S3/S4. `git diff --check` cả hai repo exit 0.

### Left over

- Claude quyết parser S0 và nguồn token tương thích với yêu cầu giữ màu/font. Không tạo DONE khi S0 vẫn 0/10.
- Cần xử lý/ổn định hydration, login popup và đăng nhập trước khi đo lại browser; probe độc lập cũng có lượt timeout trước hydration. Setup `themeInit` còn ghi nhận `document.documentElement === null` (`logs/diagnostic-dev-test-context.json`). Không kết luận lỗi setup này giải thích mọi timeout.
- Chưa xác minh đầy đủ normal-motion/focus/dialog, sáng/tối và mobile của S6. Lượt red có 3 case dialog skip do ADMIN QA không thấy nút; lượt cuối auth timeout trước khi tới các case đó. Không sửa dữ liệu QA hoặc quyền.
- Còn assertion CLS console và hero desktop; chưa sửa shell/hero ngoài phạm vi. Chạy lại đầy đủ S0/S6, năm spec regression, typecheck và archcheck sau quyết định của Claude. Handoff ghi điểm tiếp tục và lệnh; **không có `DONE-motion-s0-s6.txt`**.

## fix2 — 23/10/2026 — tiếp tục theo quyết định Claude

Quyết định mới của người dùng thay thế blocker lock ở lần kiểm tra đầu: bốn file `site-footer.tsx`, `page.tsx`, `password-input.tsx`, `password-input.test.tsx` khớp HEAD, lock cũ từ các commit trước; cho phép refresh sau khi sửa password-input. File đúng là `components/patterns/password-input.tsx`; dùng variant `ghost`, size `icon` sẵn có, không thêm variant, không sửa test đang kiểm class cũ.

Đã bỏ các class `bg-*` và `after:rounded-sm` khỏi Button hiện/ẩn mật khẩu; giữ variant/size sẵn có, vị trí, vùng bấm 40px, màu biểu tượng và chỉ báo focus đang có. Nền hover và bo góc theo variant ghost; không thêm CSS/style để lách gate. Vì ghost có `hover:bg-[var(--secondary)]`, yêu cầu V-01 nền trong suốt ở mọi trạng thái không còn khớp shared variant hiện hành.

Trước refresh, `node scripts/frame-lock.mjs` exit 1, danh sách:

1. đổi: `app/tokens.generated.css`
2. đổi: `components/layout/site-footer.tsx`
3. đổi: `components/patterns/password-input.test.tsx`
4. đổi: `components/patterns/password-input.tsx`
5. đổi: `components/ui/button.tsx`
6. thêm: `components/ui/console-motion.module.css`
7. đổi: `components/ui/dialog.tsx`
8. đổi: `components/ui/page.tsx`
9. đổi: `components/ui/popover.tsx`

Sau sửa password-input, đã chạy `node scripts/frame-lock.mjs --write`: 54 file. Kiểm tra lại exit 0, **danh sách drift sau: rỗng (0 file)**. Log `logs/frame-lock-before-fix2.log`, `logs/frame-lock-after-fix2.log`; đủ hash trước/sau 9 entry trong `logs/frame-lock-diff-fix2.json`. Không sửa source/test của ba file khác để cập nhật lock.

Full Vitest: **1083/1084 pass**, 1 fail V-01 ở `components/patterns/password-input.test.tsx:30`, assertion đòi class `bg-transparent`; assertion tiếp theo cũng đòi `hover:bg-transparent`. Giữ nguyên test theo quyết định mới. Hai lỗi ban đầu ở layout gate và frame lock đều PASS. Log `logs/vitest-all-fix2-before-fix2b.log`, exit 1. Không báo mục tiêu 0 fail đã đạt.

S0 10/10, `logs/S0-fix2.log`, exit 0. Typecheck exit 0, `logs/typecheck-fix2.log`. Archcheck trước/sau giống hệt: 65 vi phạm, 48 baseline, 17 ngoài baseline có sẵn, 8 stale; exit 1, **0 phát sinh**. Token diff non-motion 0, chỉ 8 khai báo motion; `logs/token-arch-fix2.json`.

### Kiểm chứng E2E fix2 và điểm còn chặn

Lượt đầy đủ cuối cùng chạy đúng ba spec được yêu cầu tại `http://localhost:3000`, log `logs/e2e-fix2-before-fix2b.log`: **4 pass / 24 fail / 0 skip, exit 1**.

| Spec | Pass | Fail | Skip |
|---|---:|---:|---:|
| `motion-console.spec.mjs` | 4 | 7 | 0 |
| `motion-login.spec.mjs` | 0 | 4 | 0 |
| `visual-controls.spec.mjs` | 0 | 13 | 0 |

Phân loại đủ 28 case và 24 lỗi: `logs/e2e-classification-fix2.json`.

- **8 lỗi V-01 là thay đổi giao diện thực tế sau khi dùng shared ghost:** bốn viewport/theme của staff login và bốn của reset password đều đỏ ở `hover: nền phải trong suốt`, expected alpha 0, received 1. Đây không chỉ là test unit kiểm class cũ. `ghost` hiện có `hover:bg-[var(--secondary)]`; không thể đồng thời giữ hợp đồng nền hover trong suốt bằng chính variant này nếu không thay đổi quyết định về variant/override. Không lách gate bằng style hoặc CSS ở wrapper, không sửa shared Button hay test ngoài phạm vi.
- **6 lỗi bị chặn trước thao tác do form chưa hydrate**, có log an toàn `ready: complete`, `reactProps: 0`; **10 lỗi timeout locator/chuyển trang**. Không quy 16 lỗi này cho motion hoặc lấy số pass Sonnet làm kết quả fix2. Probe mở trang rồi chờ trước khi nhập hydrate 4/4; probe login FOOD_DEV trả 200 và tới đích, ADMIN trả 200 nhưng timeout chuyển trang (`logs/hydration-probe-fix2.json`, `logs/login-ready-probe-fix2.json`). Chưa xác định đầy đủ nguyên nhân runtime chập chờn.
- CLS của lượt này không tới phép đo do bước đăng nhập bị chặn; không thay lỗi này bằng con số CLS lịch sử. Hai nợ CLS/hero đã được quyết định trước vẫn giữ nguyên, không sửa source hay ngưỡng.

Runtime dùng `nohup /home/dawn/work/ticket/.cache/tmp/serve.sh /home/dawn/wt/portal-motion`; process env `PORTAL_AUTH_MODE=dev` và sáu biến `AUTH_{INTERNAL,SERVICE}_URL`, `ORG_{INTERNAL,SERVICE}_URL`, `INTEGRATION_{INTERNAL,SERVICE}_URL` trỏ `http://127.0.0.1:8000`. Không tạo/đọc/copy `.env.local` trong lượt tiếp tục này. TMPDIR và ESBUILD_BINARY_PATH đúng brief.

Đã dời cache Next sang `/home/dawn/work/ticket/.cache/next-portal-motion-fix2-unhydrated-c6034a77`, sau đó chạy lượt đầy đủ cuối bằng cache mới. Metadata `logs/runtime-reset-fix2.json`. Các lượt trước bị ngắt được giữ riêng trong `e2e-fix2-unhydrated.log`, `e2e-fix2-nohup-unhydrated.log`, `e2e-fix2-submit-ready-interrupted.log`; không gộp thành lượt pass. Một case chẩn đoán riêng pass 1/1 ở `logs/e2e-hydration-probe-fix2.log`, không thay cho suite.

Lệnh E2E cuối: `TMPDIR=/home/dawn/work/ticket/.cache/tmp ESBUILD_BINARY_PATH=/home/dawn/.local/share/esbuild/esbuild-0.21.5 NODE_OPTIONS=--require=/home/dawn/work/ticket/.cache/tmp/motion-fix2-ready.cjs pnpm exec playwright test --config .aidlc/runs/PORTAL-MOTION-001/tests/playwright.config.mjs motion-login.spec.mjs motion-console.spec.mjs visual-controls.spec.mjs`. Preload tạm ngoài repo đợi form có React `onSubmit` trước `fill`, `click`, `dblclick`; không đổi test/config, assertion, retry hoặc ngưỡng. Khi quá 20s thì chặn thao tác, không submit HTML GET.

Đã tắt đúng server thuộc exec session 77052 (launcher PID 6 trong PID namespace của phiên); curl localhost:3000 sau tắt HTTP 000, exit 7, `logs/server-stopped-fix2.log`. Không restart backend hoặc đụng server khác. Quét 143 log/context/cache log: đã che 1 chuỗi nhạy cảm, còn **0 JWT / 0 mật khẩu QA** (`logs/security-fix2.json`); không in giá trị.

Đối chiếu snapshot 955 file đầu lượt tiếp tục: chỉ `components/patterns/password-input.tsx`, `frame.lock.json`, handback thay đổi; test/config/Sonnet, next-env, UX-NO-UUID-001, ACTIVE, trace, design-system và symlink node_modules giữ nguyên. `logs/integrity-fix2.json`; `git diff --check` cho diff fix2 exit 0; index sạch. Không stage/commit/push/install/sdlc.py hoặc ghi artifacts/receipt.

**Chưa tạo DONE:** mục tiêu Vitest 0 fail và giao diện V-01 chưa đạt; E2E còn lỗi runtime. Handoff hiện hành đã ghi rõ cần quyết định lại hợp đồng shared ghost/V-01 và xử lý runtime trong phạm vi riêng. Không tự mở rộng sửa shared variant, auth hoặc test. Dòng kết quả thực tế cho phần đã chạy: `S0 10/10 S6 4/11 regress-requested 0/17 vitest-all 1083/1084 token-diff-non-motion 0 typecheck 0 arch-new 0`; không ghi thành DONE hoặc nhận đã chạy lại đủ 55 case hồi quy.

### Lịch sử điều kiện dừng ban đầu (đã được quyết định mới thay thế)

Brief hiện hành: `/home/dawn/work/ticket/plans/261022-catalog-split/codex-motion-s0-s6-fix2.md`. Đã đọc chẩn đoán Sonnet và chạy kiểm tra chỉ đọc `node scripts/frame-lock.mjs`: exit 1, đúng 9 file lệch:

1. `app/tokens.generated.css` — đổi, token motion.
2. `components/layout/site-footer.tsx` — đổi, ngoài phạm vi motion được phép refresh.
3. `components/patterns/password-input.test.tsx` — đổi, test ngoài phạm vi được phép refresh.
4. `components/patterns/password-input.tsx` — đổi, file ô mật khẩu thực tế được brief nhắm tới.
5. `components/ui/button.tsx` — đổi, primitive motion.
6. `components/ui/console-motion.module.css` — thêm, motion.
7. `components/ui/dialog.tsx` — đổi, primitive motion.
8. `components/ui/page.tsx` — đổi, ngoài phạm vi motion được phép refresh.
9. `components/ui/popover.tsx` — đổi, primitive motion.

Áp dụng đúng câu “Có file lạ thì DỪNG, ghi handoff”: không chạy `--write`, không sửa password-input hoặc bất kỳ source/test/config nào trong fix2. `git diff --exit-code HEAD -- components/layout/site-footer.tsx components/ui/page.tsx components/patterns/password-input.tsx components/patterns/password-input.test.tsx frame.lock.json` exit 0: bốn file không thuộc diff motion và lock đều khớp HEAD, drift đã có sẵn so với lock.

Đường dẫn `components/ui/password-input.tsx` trong brief không tồn tại; file thực tế là `components/patterns/password-input.tsx`. Button hiện có `ghost`, không có `ghost-icon`; chưa đổi variant vì đã gặp điều kiện dừng.

Không khởi chạy server hoặc chạy lại Vitest/E2E/typecheck/archcheck sau điều kiện dừng. Số Sonnet báo 1082 pass / 2 fail Vitest và 64 pass / 2 fail / 0 skip E2E là kết quả trước fix2, không phải lượt kiểm chứng mới. Hai nợ CLS/hero giữ nguyên. Giữ nguyên các sửa test của Sonnet và thay đổi ngoài task. Không tạo DONE.

Handoff hiện hành: `/home/dawn/work/ticket/plans/261022-catalog-split/handoff-motion-s0-s6.md`. Cần brief tiếp theo quyết phạm vi ba file ngoài task trước khi có thể refresh lock và tiếp tục sửa/kiểm chứng.

## fix1 — 23/10/2026

### Done

Đã làm theo brief `codex-motion-s0-s6-fix1.md`. Đã giải quyết nguồn brand và parser S0 của lượt trước; **chưa đủ acceptance S6/hồi quy, không tạo DONE**.

- Port nguyên giá trị từ `git show HEAD:app/tokens.generated.css` vào `platform-docs/ui/tokens.json`: 27 biến ở root, 19 màu dark; giữ nguyên nhóm motion. Không tự chọn màu/font/shadow/radius.
- Sinh CSS qua `uigen.py tokens --root <TMPDIR staging root> --write`. Bỏ đúng 8 dòng motion thì CSS khớp HEAD từng byte: **token-diff-non-motion 0**, header giữ nguyên. Bằng chứng: `logs/token-diff-fix1.json`.
- S0 chạy sau cùng, dùng test Sonnet đã sửa, `TOKENS_CSS=app/tokens.generated.css`: **10/10 pass, exit 0**, `logs/S0-fix1.log`. Không thay `red-S0-fixed.log` hoặc test.

| Kiểm tra | Kết quả | Exit / log |
|---|---|---|
| S6, server chạy trực tiếp ở worktree | 0 pass / 11 fail; timeout trước assertion | 1, `logs/S6-fix1.log` |
| Hồi quy, server trực tiếp ở worktree | 16/55 pass, 39 fail; timeout trước assertion | 1, `logs/regression-fix1.log` |
| S6, server bản source tạm khớp byte | **7 pass / 1 fail / 3 skip** | 1, `logs/S6-clean-runtime-fix1.log` |
| Hồi quy, server bản source tạm khớp byte | **54/55 pass**, 1 fail, 0 skip | 1, `logs/regression-clean-runtime-fix1.log` |
| Typecheck ở worktree, sau trả next-env ban đầu | PASS | 0, `logs/typecheck-fix1.log` |
| Archcheck trước/sau | 17 ngoài baseline có sẵn; **0 phát sinh**, log giống hệt | 1, `logs/arch-before-fix1.log`, `logs/arch-after-fix1.log` |

Hồi quy ở bản source tạm: filter 6/6, hero 7/8, login 4/4, visual-controls 13/13, visual-layout 24/24. Ở lượt worktree, hero 8/8; không nhận lỗi eyebrow đã hết ổn định vì nó xuất hiện lại khi chạy trọn suite ở bản tạm.

### Files changed

Trong fix1 chỉ đổi source:

- Repo `/home/dawn/work/ticket/platform-docs`: `ui/tokens.json`.
- Repo `portal`: `app/tokens.generated.css`, sinh bằng generator.

Ba primitive và `console-motion.module.css` giữ nguyên implementation từ lượt trước. Không đổi generator, test/config, `.env*`, backend hoặc QA. Đã thêm mục handback này, cập nhật handoff và lưu log/diagnostic fix1.

### Decisions và phân loại từng case

- Bảng đủ **66 case**, đối chiếu lượt worktree và bản source tạm, có vị trí log từng lỗi: [case-classification-fix1.md](logs/case-classification-fix1.md), dữ liệu [JSON](logs/case-classification-fix1.json). Không gộp timeout trước assertion thành regression do motion.
- 287 file ứng dụng/config cần chạy app trong bản tạm được so từng byte với worktree; 0 lệch, cùng node_modules. Playwright chạy từ worktree, dùng nguyên test/config hiện tại và localhost:3000. Bằng chứng source: `logs/clean-runtime-source-fix1.json`. Không lấy các case PASS ở bản tạm để nhận runtime worktree đã được sửa.
- Đối chứng cùng thư mục tạm, cùng cấu hình dịch vụ/browser: HEAD b5fdb44 chưa có motion đi tới assertion nút rồi đỏ vì thiếu transition transform; login popup PASS; hero desktop có `eyebrow offsetTop = 12px`. Đưa đúng bản sửa vào cùng thư mục, ba case đó PASS **3/3**. Log: `head-control-tests-fix1.log`, `patched-control-tests-fix1.log`; revision/phase ở `head-control-fix1.json`.
- **CLS console có sẵn trên HEAD:** bản sửa và HEAD đều đo **0.010255069610218942 > 0.01**, xác nhận riêng bằng `logs/head-cls-control-fix1.log`. Không quy lỗi này cho diff S6.
- **Hero desktop phụ thuộc timing/môi trường:** bản sửa có lượt PASS, lượt FAIL 12px; HEAD cũng FAIL cùng 12px. Không thay hero/font-loading, hạ ngưỡng hoặc sửa test ngoài scope.
- **Ba case dialog chưa kiểm chứng:** chính test gọi skip vì ADMIN QA không thấy nút “Thêm nhân viên” ở memberships. Không đổi vai trò/dữ liệu QA hoặc test để lấy xanh.
- Lỗi runtime worktree được phân loại môi trường/setup trước assertion: chờ POST login, điều hướng, trường login hoặc popup. Backend có các POST login trả 200. Probe `diagnostic-auth-fix1.json` còn thấy native HTML GET, URL có tham số password, không có POST và vẫn ở staff/login; giá trị không được in. Probe khác hydrate thành công, JS assets đều 200, không pageerror (`diagnostic-hydration-fix1.json`). Chưa xác định đầy đủ cơ chế khác biệt runtime; không sửa auth/themeInit/config theo R4.
- Không restart/dev-down stack dùng chung. Chỉ mở/tắt các Next dev do lượt này sở hữu. Server cuối đã tắt qua exec session 76321; localhost:3000 HTTP 000, curl exit 7 (`logs/server-stopped-fix1.log`).
- 10 file test/config giữ nguyên hash so với đầu fix1, gồm test S0 của Sonnet. `next-env.d.ts` trả đúng bytes ban đầu, giữ symlink node_modules. Token gate 0 và arch log trước/sau giống hệt: `logs/integrity-fix1.json`. Quét log/context: **0 JWT, 0 mật khẩu QA còn sót**, `logs/security-fix1.json`.
- Không cài package, stage, commit, push, chạy sdlc.py, ghi receipt hoặc sửa ngoài source được giao. Giữ các thay đổi UX-NO-UUID-001/ACTIVE/trace/design-system có sẵn.

### Left over

- S0 và cổng token đã đạt. S6 còn CLS trên HEAD và 3 dialog skip; hồi quy còn hero desktop timing cũng tái hiện trên HEAD. Không nhận task đã PASS toàn bộ.
- Cần Claude mở phạm vi điều tra runtime worktree/performance/font timing và quyết fixture/quyền ADMIN cho dialog; giữ nguyên assertion khi chưa có quyết định. Không chữa bằng thay đổi ngoài S0/S6.
- Handoff mới: `/home/dawn/work/ticket/plans/261022-catalog-split/handoff-motion-s0-s6.md`. **Không có DONE-motion-s0-s6.txt.**

## fix2b — 23/10/2026 — source và regression xanh, còn assertion token production

Đã thực hiện quyết định mới của Claude: thêm đúng một variant `ghost-icon` vào `components/ui/button.tsx`, nền trong suốt ở normal/hover/active/focus-visible/disabled, shadow none, chữ muted và hover ink. Các giá trị box-shadow none (kể cả focus) nằm trong variant. `components/patterns/password-input.tsx` dùng `variant="ghost-icon" size="icon"`, bỏ bg/rounded/shadow và màu icon override; giữ vị trí, vùng bấm 40px và chỉ báo focus. Không thêm variant khác, không sửa test.

### Lock trước/sau

Trước refresh chỉ có hai drift được cho phép:

1. đổi: `components/patterns/password-input.tsx`
2. đổi: `components/ui/button.tsx`

Đã in danh sách rồi chạy `node scripts/frame-lock.mjs --write`. Sau refresh: **0 drift, khớp 54 file**, exit 0. `logs/frame-lock-{before,after}-fix2b.log`; hash trước/sau hai entry ở `logs/frame-lock-diff-fix2b.json`. Chín drift lịch sử của fix2 đã được ghi ở mục fix2 phía trên; không phát sinh drift khác trong fix2b.

### Kết quả

| Kiểm tra | Kết quả | Exit / log |
|---|---|---|
| S0 | 10/10 pass | 0, `logs/S0-fix2b.log` |
| Full Vitest | **1084/1084 pass**, 49/49 file | 0, `logs/vitest-all-fix2b.log` |
| Production build webpack | PASS | 0, `logs/build-fix2b.log` |
| motion-console S6 | **9 pass / 2 fail / 0 skip** | 1, `logs/e2e-fix2b.log` |
| motion-hero | 8/8 pass | cùng lượt E2E |
| motion-filter | 6/6 pass | cùng lượt E2E |
| motion-login | 4/4 pass | cùng lượt E2E |
| visual-controls | **13/13 pass** | cùng lượt E2E |
| visual-layout | 24/24 pass | cùng lượt E2E |
| Tổng 5 spec regression | **55/55 pass** | cùng lượt E2E |
| Tổng 6 spec E2E | **64 pass / 2 fail / 0 skip**, không retry | 1, `logs/e2e-fix2b.log` |
| Typecheck sau trả next-env ban đầu | PASS | 0, `logs/typecheck-fix2b.log` |
| Archcheck trước/sau | giống hệt, **0 phát sinh** | 1, `logs/arch-{before,after}-fix2b.log` |
| Token diff non-motion | **0**, chỉ 8 khai báo motion | `logs/token-arch-fix2b.json` |

Archcheck tổng vẫn là 65 vi phạm, 48 baseline, 17 ngoài baseline có sẵn, 8 stale; không nhận tổng vi phạm bằng 0. Phân loại đầy đủ 66 case: `logs/e2e-classification-fix2b.json`.

Đường dẫn log theo brief fix2 (`logs/vitest-all-fix2.log`, `logs/e2e-fix2.log`) đã trỏ tới bản sao kết quả fix2b mới nhất. Log fix2 cũ được giữ tại `logs/vitest-all-fix2-before-fix2b.log`, `logs/e2e-fix2-before-fix2b.log`; các tham chiếu lịch sử trong handback đã chuyển sang bản lưu này.

### Hai assertion đỏ

1. `motion-console.spec.mjs:137` so chuỗi token theo ms. Production CSS minifier trả `--motion-hover=.12s`, `--motion-enter=.18s`, `--motion-exit=.12s`, `--motion-sheet=.22s`; `--motion-press=80ms` giữ nguyên. Test đòi `120ms`, `180ms`, `120ms`, `220ms`. Năm giá trị sau chuẩn hoá đều đúng 80/120/180/120/220ms (`logs/token-production-fix2b.json`), các case animation thực tế pass. Đây là khác biệt serialization production, không phải duration sai. Không sửa test hoặc config/minifier để ép assertion xanh.
2. CLS **0.010255069610218942 > 0.01**, đúng nợ đã tái hiện ở HEAD. Không sửa source hoặc threshold. Hero 8/8 trong lượt production này; không nhận đã sửa nợ timing cũ chỉ dựa trên một lượt pass.

Không còn lỗi runtime hydrate/login ở lượt đầy đủ production, không còn lỗi V-01, không skip dialog. Probe production hydrate 4/4 trước khi chạy suite (`logs/hydration-production-fix2b.json`); probe không thay đổi thao tác của test.

### Production và bảo toàn workspace

`pnpm exec next build` mặc định dùng Turbopack đã fail vì node_modules symlink ra ngoài project root (`logs/build-turbopack-fix2b.log`). Giữ nguyên symlink/config, chạy lại `pnpm exec next build --webpack` thành công. Build ID `aviG8-FoRP-_0gRO5s4E7`. Chạy đúng `pnpm exec next start -p 3000` tại worktree, không Next dev, không preload/patch thao tác. Server và Playwright đều bỏ NODE_OPTIONS khỏi process env. Không tạo .env.local; sáu URL AUTH/ORG/INTEGRATION INTERNAL/SERVICE truyền trên command line tới `http://127.0.0.1:8000`, `PORTAL_AUTH_MODE=dev`; TMPDIR và ESBUILD_BINARY_PATH đúng brief. Chi tiết `logs/runtime-production-fix2b.json`.

Lệnh suite: `env -u NODE_OPTIONS TMPDIR=/home/dawn/work/ticket/.cache/tmp ESBUILD_BINARY_PATH=/home/dawn/.local/share/esbuild/esbuild-0.21.5 PORTAL_E2E_BASE=http://localhost:3000 pnpm exec playwright test --config .aidlc/runs/PORTAL-MOTION-001/tests/playwright.config.mjs motion-login.spec.mjs motion-console.spec.mjs visual-controls.spec.mjs motion-hero.spec.mjs motion-filter.spec.mjs visual-layout.spec.mjs`.

Server thuộc exec session 53445 (launcher PID 6 trong PID namespace của phiên) đã tắt. Curl localhost:3000 HTTP 000, exit 7, `logs/server-stopped-fix2b.log`. Không đụng backend/server khác. Build tự cập nhật next-env, đã trả đúng bytes ban đầu trước typecheck. Test Sonnet, config, UX-NO-UUID-001, ACTIVE/trace, design-system và symlink node_modules giữ nguyên; chỉ ba source/lock được giao cùng handback thay đổi so snapshot 955 file. Không stage/commit/push/install/sdlc.py/artifacts/receipt.

Quét log/context/cache log: không phải che thêm chuỗi nhạy cảm trong fix2b, còn 0 JWT và 0 mật khẩu QA (`logs/security-fix2b.json`).

### Bàn giao

**Chưa tạo DONE** vì assertion serialization token production là lỗi chưa được quyết định chấp nhận; giữ nguyên yêu cầu không sửa test. Cần người sở hữu test quyết chuẩn hoá đơn vị time trước so sánh hoặc quyết định acceptance cho khác biệt biểu diễn này, rồi chạy lại phần cần thiết. Không cần thay duration/source/minifier hoặc làm lại phần variant đã xanh. Nợ CLS giữ nguyên.

Dòng kết quả thực tế: `S0 10/10 S6 9/11 regress 55/55 vitest-all 1084/1084 token-diff-non-motion 0 typecheck 0 arch-new 0`. Handoff mới nhất: `/home/dawn/work/ticket/plans/261022-catalog-split/handoff-motion-s0-s6.md`.
