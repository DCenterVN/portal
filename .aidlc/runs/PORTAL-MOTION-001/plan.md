# PORTAL-MOTION-001: giữ portal gốc, thêm hiệu ứng và sửa lỗi nhìn

## Scope

- HEAD = origin/main = `473d8e313e3d56cc630713624469a2750f81f7b6`. Claude đã fast-forward. Lượt này không chạy Git ghi.
- Brief thiết kế: `/home/dawn/work/ticket/plans/261022-ui-motion/codex-ui-plan-sua3.md`. Lượt audit thực thi theo `/home/dawn/work/ticket/plans/261022-ui-motion/codex-ui-capture-before.md`. Luật: `codex-rules.md` R6–R10, R16–R19 và `/home/dawn/wt/pd-ux-rules/standards/ui-ux.md` §10–16.
- Giữ bố cục, component, font, màu, nội dung và khoảng cách hiện có. Chỉ thêm chuyển động vào phần tử sẵn có và sửa CSS/class của lỗi nhìn. Mọi sửa lệch, tràn, viền hoặc bóng phải có ảnh trước/sau.
- Không thêm component, drawer, shipping bar, lưới món, font, thư viện hoặc preview. Dừng hẳn preview-sua2. MASTER và artifacts preview cũ không phải hướng thiết kế của lượt này.
- Không đổi API/BFF, quyền, session, giá, giới hạn số lượng, dữ liệu QA hoặc request. Không thêm ô ID hoặc hiện UUID; giữ EntityPicker chọn bằng tên.
- Lượt này chỉ ghi trong run và thư mục bàn giao của brief. Chưa sửa app, chạy engine, commit, cài package, thao tác Docker/DB.

## Requirements

- FR-1. Gắn năm phần hành vi Lucian theo bảng dưới. Giữ nhịp gốc ở store/login theo ngoại lệ brief. Console theo UX-13. Không dựng phần tử còn thiếu của gallery.
- FR-2. Audit portal thật ở 1440×900 và 375×844, sáng/tối, mười màn. Không dùng preview hoặc màn lỗi thay cho màn tải dữ liệu thành công.
- FR-3. V-01 là yêu cầu bắt buộc. Audit đã xác nhận V-02/V-04/V-06/V-07, bác sửa global V-08; V-03/V-05 chưa có ảnh do chặn. V-09/V-10/V-11 là lỗi mới, V-09 vượt phạm vi CSS/class và tách việc riêng. Bảng giao: `/home/dawn/work/ticket/plans/261022-ui-motion/loi-nhin-v1.md`.
- FR-4. State/aria và request cập nhật ngay. Không chờ animationend để nhận input/đóng. Không đếm trung gian giá tiền hoặc tạo mutation trùng.
- FR-5. Sonnet viết test đỏ từng slice trước; Codex sửa sau khi có test và log đỏ. Phiên lập plan không nhân danh Sonnet và không tự ghi receipt.

**Acceptance criteria**

| AC | Điều kiện chấp nhận | Test |
|---|---|---|
| AC-1 | Cùng route/dữ liệu/theme, cấu trúc, font, màu, kích thước và khoảng cách giữ như nền. Khác biệt CSS tĩnh chỉ thuộc V-n đã xác nhận. | TC-1, TC-4 |
| AC-2 | Năm phần hiệu ứng đúng bảng nguồn/phạm vi. Console theo token UX-13; không spring hoặc delay store lọt qua primitive chung. | TC-2, TC-3 |
| AC-3 | Reduced-motion bỏ trượt/rung/scale/quay lặp; chỉ fade ≤120ms hoặc tắt. Luồng chính, trạng thái cuối, Tab/Esc/trả focus đúng. Không JS vẫn thấy hero. | TC-2, TC-3 |
| AC-4 | CLS do chuyển động ≤0.01 mỗi luồng. Ghi cả LayoutShift có hadRecentInput để không bỏ qua dịch chuyển lúc bấm; đo bounding box riêng. Số cuối cập nhật ngay, bấm nhanh không mất thao tác hoặc gửi trùng. | TC-2, TC-3 |
| AC-5 | V-01 ở login/register/reset và staff: vùng bấm ≥40px; nền trong suốt ở thường/hover/active/focus/disabled; icon muted rồi đậm khi hover; focus vòng mảnh quanh icon. Giữ toggle, disabled và aria. | TC-4, TC-5 |
| AC-6 | Mỗi V-n nhận sửa có crop trước/sau cùng dữ liệu, trạng thái, viewport, theme, đủ bốn tổ hợp. Nghi vấn bị bác có lý do. Ảnh thiếu là chưa kiểm. | TC-4 |
| AC-7 | 40/40 ảnh màn chính thật và manifest; thêm crop V-n, V-01 thường/hover/focus. Không lưu mật khẩu/token/cookie vào ảnh, log, trace, HAR hay storageState. | TC-1 |
| AC-8 | Test/lint/typecheck/build và gate UI/layout/rebrand/frame-lock không đỏ do diff. Không nới gate/baseline. Có log đỏ Sonnet và log xanh Codex từng slice. | TC-5, TC-6 |

## Technical definition

Font gốc là Be Vietnam Pro và Nunito tại `app/layout.tsx:7–20`. Giữ nguyên. CSS module mới chỉ phục vụ hiệu ứng trên component đang có; không thêm component hoặc selector global.

Đã đọc lại năm file get cũ trong `artifacts/lucian-216.html`, `lucian-019.html`, `lucian-018.html`, `lucian-240.html`, `lucian-062.html`. Token nguồn `/home/dawn/work/ticket/.cache/lucian/en_tokens.css:26–27`: ease = `cubic-bezier(.2,.8,.2,1)`, spring = `cubic-bezier(.34,1.45,.64,1)`. Không dựng lại nguồn từ trí nhớ. Mỗi file port giữ dòng notice MIT của mẫu.

| Mẫu | Phần tử portal hiện có | Giữ nhịp và giới hạn |
|---|---|---|
| [#216 Staggered hero entrance](https://lucianlabs.dev/uxui-prompt/#216) | `features/store/landing.tsx:42–54`: eyebrow, h1, mô tả, CTA, visual. `features/store/home.tsx:24–32`: hero/nội dung. | Fade 550ms ease, nhóm 700ms ease; h1 nguyên khối 750ms ease; delay eyebrow180/h1 300/mô tả620/CTA760/visual900ms. Visual opacity600/transform1100/blur900ms. Không chia chữ thành span, thêm screen SaaS/ảnh/replay. Keyframes chỉ enhancement; SSR/no-JS không bị ẩn. |
| [#019 Interest chips multi-select](https://lucianlabs.dev/uxui-prompt/#019) | `features/products/products-view.tsx:190–218`: ba nút lọc có aria-pressed và Check. | Background350/color300ms ease, Check opacity250ms ease/transform450ms spring. Giữ chọn đơn ALL/ACTIVE/DRAFT. Không thêm quota/multi-select/icon; không animate padding/width. Route này thuộc store, không mang spring sang console. |
| [#018 Rolling quantity stepper](https://lucianlabs.dev/uxui-prompt/#018) | `features/products/product-detail-view.tsx:116–135`: nút ± và span số. | Phản hồi dọc span số550ms spring, nút transform400ms spring/nền250ms ease. Số thật cập nhật ngay. Không dựng cột odometer, đổi cỡ stepper, lấy MAX=12 hoặc tổng mẫu. Chỉ mượn nhịp số trên span hiện có. |
| [#240 Cart drawer with free-shipping bar](https://lucianlabs.dev/uxui-prompt/#240) | `components/layout/mini-cart.tsx:28–32`: panel Popover đang có qua className. | Chỉ mượn nhịp vào450ms cubic-bezier(.3,1,.3,1), dịch ngắn hợp panel. Đóng/unmount ngay. Không đổi thành drawer/thêm scrim/bar/nút xoá. `StoreShell:32` mặc định items=[]; `StoreFrame:59` chưa cấp cartItems. Không sửa dữ liệu để tạo số đếm hoặc nhận đã có số/tổng giỏ chạy thật. |
| [#062 Sign-in card feedback](https://lucianlabs.dev/uxui-prompt/#062) | `features/customer-auth/login-form.tsx:90–98`: alert lỗi; `:136–138`: submit có nhãn busy. | Rung alert500ms cubic-bezier(.36,.07,.19,.97); busy fade200ms. Không morph width/radius, thêm spinner/pane, delay request hoặc response giả. V-01 làm riêng, không thay icon mắt bằng SVG gallery. |

Có năm mẫu gắn được một phần hành vi, không phải năm widget port đầy đủ. Các phần không có đích gắn đã bỏ trong bảng.

Console chỉ phản hồi trên Button, Popover và Dialog có sẵn. Press80ms ease-out scale.97; hover120ms ease-out; panel vào180ms cubic-bezier(.2,.8,.2,1); dialog/sheet vào220ms cùng curve. Đóng ngay nếu primitive đang unmount ngay; không đổi lifecycle để thêm exit.

`app/tokens.generated.css` chưa có `--motion-*`. `app/globals.css:36` còn sheet300ms. S0 chờ nguồn token platform-docs được duyệt rồi sinh CSS bằng generator hiện có. Không sửa generated tay hoặc tự sửa nguồn ngoài repo. S0 chưa xong thì S6 chờ, không dùng số fallback. S6 override sheet300ms bằng token220ms chỉ trong console. Store/login giữ số Lucian trong CSS scope theo ngoại lệ brief.

## UX

Mười màn: `/` vãng lai, chi tiết món chọn qua tên ở `/products`, `/cart`, `/login`, `/register`, `/activate` không token, `/forgot-password`, `/console`, danh sách `/production/targets`, form “Tạo chỉ tiêu” trên cùng route. `/login` và `/register` redirect về popup hiện có, không dựng trang mới. Thêm Home đã đăng nhập, catalog `/products` và panel mini-cart để kiểm các hiệu ứng.

Đặt `dcenter_theme`, `.dark`, `data-theme` đồng nhất trước khi mở trang. Không thay nội dung/DOM để làm ảnh. Activation chỉ chụp trường hợp thiếu token. Không gửi activation/reset/register hoặc lưu form nghiệp vụ trong script audit.

## Design

Không đổi API/DTO/DB/event/spec tính năng. Không dẫn spec mới chưa viết. R19 không phát sinh file spec ở task CSS/chuyển động này. Bảng lỗi ở thư mục bàn giao có vị trí mã và đề xuất class. Nếu sửa cần đổi cấu trúc/component thì tách việc riêng.

## Files planned

- `app/tokens.generated.css`
- `features/store/landing.tsx`
- `features/store/home.tsx`
- `features/store/hero-motion.module.css`
- `features/products/products-view.tsx`
- `features/products/filter-motion.module.css`
- `features/products/product-detail-view.tsx`
- `features/products/quantity-motion.module.css`
- `components/layout/mini-cart.tsx`
- `components/layout/mini-cart-motion.module.css`
- `features/customer-auth/login-form.tsx`
- `features/customer-auth/login-motion.module.css`
- `components/ui/button.tsx`
- `components/ui/popover.tsx`
- `components/ui/dialog.tsx`
- `components/ui/console-motion.module.css`
- `components/patterns/password-input.tsx`
- `components/patterns/password-input.test.tsx`
- `components/ui/page.tsx`
- `components/layout/site-footer.tsx`
- `.aidlc/runs/PORTAL-MOTION-001/tests/motion-token.test.ts`
- `.aidlc/runs/PORTAL-MOTION-001/tests/motion-hero.spec.mjs`
- `.aidlc/runs/PORTAL-MOTION-001/tests/motion-filter.spec.mjs`
- `.aidlc/runs/PORTAL-MOTION-001/tests/motion-quantity.spec.mjs`
- `.aidlc/runs/PORTAL-MOTION-001/tests/motion-cart.spec.mjs`
- `.aidlc/runs/PORTAL-MOTION-001/tests/motion-login.spec.mjs`
- `.aidlc/runs/PORTAL-MOTION-001/tests/motion-console.spec.mjs`
- `.aidlc/runs/PORTAL-MOTION-001/tests/visual-controls.spec.mjs`
- `.aidlc/runs/PORTAL-MOTION-001/tests/visual-layout.spec.mjs`
- `.aidlc/runs/PORTAL-MOTION-001/tests/playwright.config.mjs`

Test mới bên dưới là Sonnet sẽ viết. Script audit trong run đã chuẩn bị riêng, không phải code app hoặc test đã PASS.

## Tests planned

- `.aidlc/runs/PORTAL-MOTION-001/tests/motion-token.test.ts`
- `.aidlc/runs/PORTAL-MOTION-001/tests/motion-hero.spec.mjs`
- `.aidlc/runs/PORTAL-MOTION-001/tests/motion-filter.spec.mjs`
- `.aidlc/runs/PORTAL-MOTION-001/tests/motion-quantity.spec.mjs`
- `.aidlc/runs/PORTAL-MOTION-001/tests/motion-cart.spec.mjs`
- `.aidlc/runs/PORTAL-MOTION-001/tests/motion-login.spec.mjs`
- `.aidlc/runs/PORTAL-MOTION-001/tests/motion-console.spec.mjs`
- `.aidlc/runs/PORTAL-MOTION-001/tests/visual-controls.spec.mjs`
- `.aidlc/runs/PORTAL-MOTION-001/tests/visual-layout.spec.mjs`
- `.aidlc/runs/PORTAL-MOTION-001/tests/playwright.config.mjs`
- `components/patterns/password-input.test.tsx`

Mọi lệnh dưới là dự kiến sau khi có dependency và test Sonnet, với `TMPDIR=/home/dawn/work/ticket/.cache/tmp`. Gọi Vitest trực tiếp vì script test trong package.json hiện ghi `/tmp/esbuild` trái R9.

| TC | AC | Phép thử/lệnh |
|---|---|---|
| TC-1 | 1,7 | Codex chạy `node .aidlc/runs/PORTAL-MOTION-001/capture-audit.mjs` theo capture-guide.md. Manifest đủ40/40 ảnh chính; ảnh phụ/crop đếm riêng. Không mock. |
| TC-2 | 2,3,4 | Sonnet viết test browser computed timing, geometry, LayoutShift, reduced, no-JS, bấm nhanh, state cuối ngay lập tức. `pnpm exec playwright test --config .aidlc/runs/PORTAL-MOTION-001/tests/playwright.config.mjs --grep motion-store`. Phải discover >0 case. |
| TC-3 | 2,3,4 | Config riêng chỉ tìm test trong run, không dùng npm/webServer của config gốc. Console kiểm token, press<100ms, hover, Tab/Esc/trả focus, đóng/mở khi animate. `pnpm exec playwright test --config .aidlc/runs/PORTAL-MOTION-001/tests/playwright.config.mjs --grep motion-console`. |
| TC-4 | 1,5,6 | `pnpm exec playwright test --config .aidlc/runs/PORTAL-MOTION-001/tests/playwright.config.mjs --grep visual`. Render thật, kiểm V-n ở thường/hover/focus/active/disabled và bốn viewport/theme. So ảnh cùng state, không chỉ tìm class. |
| TC-5 | 5,8 | `pnpm exec vitest run --exclude 'e2e/**' components/patterns/password-input.test.tsx`. Token test là Node assert độc lập, không Vitest vì config hiện loại run: `node --experimental-strip-types .aidlc/runs/PORTAL-MOTION-001/tests/motion-token.test.ts`. |
| TC-6 | 8 | `pnpm exec vitest run --exclude 'e2e/**'`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run build`, `python3 -B ~/agent_skills/sdlc/engine/archcheck.py`. Chạy ở bước triển khai được phép; không chạy engine trong lượt plan. Bảo toàn gate UI/frame, không nới baseline. |

Sonnet phải chạy test đỏ thật; không coi thiếu file/module là test đỏ chứng minh hành vi. Chưa có PASS UI/reduced-motion/CLS ở lượt này.

## Slices

Mỗi slice ≤5 file. S1 tạo browser config chung. S0 là phụ thuộc token riêng; S6 chờ S0. S8/S9 đã thu hẹp theo ảnh thật. Bỏ S10 vì bác đề xuất sửa global V-08; S11 mới sửa class footer theo V-11. V-03/V-05 chờ dữ liệu/API rồi mới mở slice. V-09 cần đổi điều kiện render nên tách việc riêng, không thêm vào Files planned. Slice motion tách slice lỗi nhìn.

- [ ] S0: nhận token sinh từ nguồn duyệt, Node assert đúng UX-13 (files: app/tokens.generated.css, .aidlc/runs/PORTAL-MOTION-001/tests/motion-token.test.ts; test: node --experimental-strip-types .aidlc/runs/PORTAL-MOTION-001/tests/motion-token.test.ts)
- [x] S1: #216 hero đang có và config browser riêng (files: features/store/landing.tsx, features/store/home.tsx, features/store/hero-motion.module.css, .aidlc/runs/PORTAL-MOTION-001/tests/motion-hero.spec.mjs, .aidlc/runs/PORTAL-MOTION-001/tests/playwright.config.mjs; test: pnpm exec playwright test --config .aidlc/runs/PORTAL-MOTION-001/tests/playwright.config.mjs motion-hero.spec.mjs)
- [x] S2: #019 nút lọc store, giữ chọn đơn (files: features/products/products-view.tsx, features/products/filter-motion.module.css, .aidlc/runs/PORTAL-MOTION-001/tests/motion-filter.spec.mjs; test: pnpm exec playwright test --config .aidlc/runs/PORTAL-MOTION-001/tests/playwright.config.mjs motion-filter.spec.mjs)
- [ ] S3: #018 phản hồi span số, giữ giới hạn nghiệp vụ (files: features/products/product-detail-view.tsx, features/products/quantity-motion.module.css, .aidlc/runs/PORTAL-MOTION-001/tests/motion-quantity.spec.mjs; test: pnpm exec playwright test --config .aidlc/runs/PORTAL-MOTION-001/tests/playwright.config.mjs motion-quantity.spec.mjs)
- [ ] S4: #240 nhịp vào Popover giỏ hiện có (files: components/layout/mini-cart.tsx, components/layout/mini-cart-motion.module.css, .aidlc/runs/PORTAL-MOTION-001/tests/motion-cart.spec.mjs; test: pnpm exec playwright test --config .aidlc/runs/PORTAL-MOTION-001/tests/playwright.config.mjs motion-cart.spec.mjs)
- [x] S5: #062 alert lỗi và nhãn busy login (files: features/customer-auth/login-form.tsx, features/customer-auth/login-motion.module.css, .aidlc/runs/PORTAL-MOTION-001/tests/motion-login.spec.mjs; test: pnpm exec playwright test --config .aidlc/runs/PORTAL-MOTION-001/tests/playwright.config.mjs motion-login.spec.mjs)
- [ ] S6: console UX-13 sau S0, scope không lọt store/auth (files: components/ui/button.tsx, components/ui/popover.tsx, components/ui/dialog.tsx, components/ui/console-motion.module.css, .aidlc/runs/PORTAL-MOTION-001/tests/motion-console.spec.mjs; test: pnpm exec playwright test --config .aidlc/runs/PORTAL-MOTION-001/tests/playwright.config.mjs motion-console.spec.mjs)
- [x] S7: V-01 toggle mật khẩu không nền, kiểm nơi dùng chung (files: components/patterns/password-input.tsx, components/patterns/password-input.test.tsx, .aidlc/runs/PORTAL-MOTION-001/tests/visual-controls.spec.mjs; test: pnpm exec playwright test --config .aidlc/runs/PORTAL-MOTION-001/tests/playwright.config.mjs visual-controls.spec.mjs)
- [x] S8: V-02/V-04/V-10 đã XÁC NHẬN: wrap cụm lọc và actions riêng catalog, căn giữa icon tìm. Không sửa stepper V-05 chưa có ảnh (files: features/products/products-view.tsx, .aidlc/runs/PORTAL-MOTION-001/tests/visual-layout.spec.mjs; test: pnpm exec playwright test --config .aidlc/runs/PORTAL-MOTION-001/tests/playwright.config.mjs visual-layout.spec.mjs --grep store)
- [x] S9: V-06/V-07 đã XÁC NHẬN: bỏ khối nền hover nút đóng và tint xanh ô icon PageHeader, giữ vị trí/kích thước. Không sửa nút xoá dòng V-03 chưa có ảnh (files: components/ui/dialog.tsx, components/ui/page.tsx, .aidlc/runs/PORTAL-MOTION-001/tests/visual-layout.spec.mjs; test: pnpm exec playwright test --config .aidlc/runs/PORTAL-MOTION-001/tests/playwright.config.mjs visual-layout.spec.mjs --grep 'console|dialog')
- [x] S11: V-11 mới, XÁC NHẬN: sửa class chọn màu chữ/hover/divider footer trên chrome để giữ màu sáng vốn dùng ở footer sáng, không đổi nền/palette/font/layout; kiểm mọi route store sáng/tối (files: components/layout/site-footer.tsx, .aidlc/runs/PORTAL-MOTION-001/tests/visual-layout.spec.mjs; test: pnpm exec playwright test --config .aidlc/runs/PORTAL-MOTION-001/tests/playwright.config.mjs visual-layout.spec.mjs --grep footer)

## Risks/rollback

- Audit before có 28/40 ảnh chính. V-03/V-05 chưa kết luận; không sửa hoặc bác chỉ từ mã. Các V-n nhận sửa vẫn cần after cùng dữ liệu/state. V-08 bị bác trên catalog/forgot/register/activate; form chỉ tiêu chưa kiểm.
- Dialog dùng portal; ancestor DOM console không đủ để scope. S6 lấy scope route hiện có trong primitive client, không thêm component hay đổi public API. Nếu không cô lập được thì để S6 chờ thiết kế, không áp timing global. ConsoleShell đã có data-surface="console" tại components/layout/console-shell.tsx:77; nó không bao portal DOM của Dialog.
- Không đổi geometry để giống gallery. Nếu một phần cần cấu trúc mới thì bỏ phần đó như bảng.
- Khi triển khai, rollback bằng patch đúng import/class của slice lỗi. Không reset nhánh hoặc đụng thay đổi có sẵn. Hiện chưa có app diff cần rollback.

## Q-n có mặc định

- Q-1. Giữ mấy mẫu? Mặc định năm phần hành vi trong bảng, không port đủ widget. #240 giữ Popover và dữ liệu hiện có.
- Q-2. Store/login vượt300ms? Mặc định giữ nhịp nguồn theo brief mới; console dùng UX-13. Reduced-motion vẫn ưu tiên.
- Q-3. Nghi vấn chưa có ảnh? Giữ V-03/V-05 chờ; không nhận sửa và không bác giả. Codex bổ sung ảnh sau khi catalog có món ACTIVE thật và API chỉ tiêu hết 401.
- Q-4. Thiếu token console? Mặc định chờ nguồn token platform-docs duyệt rồi generate S0, không fallback số/sửa nguồn ngoài phạm vi.
- Q-5. Cần thêm phần tử để gắn gallery? Mặc định bỏ phần đó, chỉ gắn trực tiếp như bảng.
- Q-6. QA thiếu dữ liệu/quyền? Mặc định báo màn bị chặn, không seed/đổi quyền/thêm sản phẩm/mock để đủ ảnh.
- Q-7. Lỗi cần đổi cấu trúc? Mặc định tách việc riêng; lượt này CSS/class.

## Kết quả audit before do Codex chạy

- Nền `473d8e313e3d56cc630713624469a2750f81f7b6`; dependency symlink đã có. Codex mở server bằng `start-audit-dev.cjs`, loopback `/` HTTP 200, không dùng server portal gốc. Log `/home/dawn/work/ticket/.cache/tmp/motion-dev.log`.
- Hai `node --check` và `capture-audit.mjs --check` exit 0. Lượt chụp đầu exit 1, 24/40; script thao tác quá sớm trước khi trang sẵn sàng. Sửa bước chờ trong run, chụp lại vào `audit/retry-02`, giữ ảnh cũ. Lượt hai exit 1, 28/40 ảnh chính, 12 ảnh phụ, 36 crop. Script bổ sung exit 0, thêm 16 crop. Tổng bộ cuối 92 PNG, 52 crop.
- `/products` có 0 SKU/ACTIVE; `/api/public/catalog?page_size=100` HTTP 200, items=0. Không có tên món thật để chọn, thiếu 4 ảnh detail và V-05. Không tạo món, không lấy UUID để đi vòng UI.
- FOOD_DEV đăng nhập HTTP 200 và vào console QA Fresh, thấy 17 quyền. `GET /api/production/targets` trả 401 qua phiên QA; ADMIN hiện có cũng 401. Thiếu 8 ảnh danh sách/form và V-03/V-08-targets. Không chụp màn lỗi làm màn thành công.
- Đã mở từng ảnh thật. Xác nhận V-01/V-02/V-04/V-06/V-07; bác sửa global V-08 trên các consumer đã xem; V-03/V-05 chưa kết luận. Mới V-09 lặp thông báo activate, V-10 actions catalog tràn mobile, V-11 chữ footer tối chìm vào nền. V-09 cần đổi điều kiện render, tách việc riêng.
- S8 giữ V-02/V-04 và thêm V-10; S9 giữ V-06/V-07; bỏ S10 và `components/ui/input.tsx` khỏi Files planned; bỏ `features/production/targets-view.tsx` khỏi Files planned khi V-03 chưa có ảnh. S11 mới cho V-11. Còn 11 slice dự kiến, chưa triển khai slice nào ở lượt audit.
- Manifest tổng hợp `/home/dawn/work/ticket/plans/261022-ui-motion/audit/before-manifest.json` bảo toàn nguồn manifest từng lượt và file ảnh. Bảng ảnh `/home/dawn/work/ticket/plans/261022-ui-motion/loi-nhin-v1.md`. Handoff chặn `/home/dawn/work/ticket/plans/261022-ui-motion/handoff-ui-capture-before.md`. Không tạo DONE.
- Server đã tắt bằng Ctrl-C qua đúng phiên exec 85341 đã mở, exit 130. Sau đó curl loopback exit 7, HTTP 000. Không còn server audit nghe cổng 3000.
- Chỉ chụp/đối chiếu hình tĩnh; chưa PASS app, timing, reduced-motion hoặc CLS. Không sửa app, cài package, đổi .env, chạy engine/commit hay ghi storageState/trace/HAR. Quét JWT ghi kết quả trong handoff.
