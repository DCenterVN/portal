# Plan: E2E có video, trace và kịch bản tiếng Việt để Dawn xem lại

- **Task ID**: `PORTAL-E2E-VIDEO-001`
- **Mode**: `fast`
- **Story**: US-E2E-VIDEO-001
- **Sprint**: 01
- **Issue**: 
- **Người lập**: Claude Opus 31/10 (Dawn: "e2e cho codex làm rồi phải quay lại cho a"; "kịch bản phải khớp với các usecase, làm từ từ để a xem, review lại hành trình chức năng"). Code + chạy: codex gpt-6.1-sol medium, chạy sau PORTAL-INBOUND-001 S1–S5 (cùng repo, tuần tự). Claude điều phối và chấm.
- **Nhịp làm**: mỗi slice xong thì **dừng**, Claude chấm rồi đưa Dawn xem; Dawn gật mới làm slice sau.

## Scope
- Outcome: Dawn mở 1 báo cáo HTML, thấy **mỗi ca e2e** có video trình duyệt, trace từng bước và kịch bản tiếng Việt. Trước 31/10: `playwright.config.ts:12` `reporter: "list"`, không video, không trace, nên Dawn chỉ có chữ PASS do agent báo.
- Decision: EXTEND cấu hình hiện có bằng cờ `E2E_RECORD=1`. Không ghi video khi cờ tắt, để test hằng ngày vẫn nhanh.
- Phát hiện 31/10 khi bắt đầu S1: 7 spec + config fooddev-v2 tắt cứng video/trace; mỗi bộ đăng nhập một kiểu (storageState trong `.cache/tmp`, biến môi trường, ID fixture dán tay); runner sinh `SUPPLIER_CONTRACT_CONTEXT` không có trong repo. Nên S1 tách S1a/S1b/S1c.
- Ngoài phạm vi: sửa ca e2e đang đỏ (chỉ ghi lại, mỗi ca đỏ thành task sau), chạy project mobile (hoãn từ 27/10), visual baseline.

## Requirements
- FR-0: rà hành trình chức năng trước khi viết kịch bản.
- AC-0: `.aidlc/runs/PORTAL-E2E-VIDEO-001/hanh-trinh.md` có 1 bảng cho mỗi hành trình portal đang có màn hình (đăng ký → kích hoạt → đăng nhập; NCC + hợp đồng + bảng giá; phiếu nhập → nhận hàng; nguyên liệu/nhóm; món → gói → mở bán; phân quyền). Cột: Bước | Màn hình (route) | Use case (spec `path:line`, mục Usecase) | Ca e2e đang có (`spec:test`) hoặc "THIẾU" | Lệch (màn làm khác use case, ghi 1 dòng). Nguồn use case: các file spec trong thư mục specs của portal và của service backend tương ứng (auth, org, sales, inventory, production). Không đoán: use case không tìm thấy thì ghi "chưa có spec".
- FR-1: ghi lại từng ca.
- AC-1: `E2E_RECORD=1` → mọi ca có `video.webm` + `trace.zip` + ảnh cuối, kể cả ca PASS; báo cáo HTML ở `e2e-report/` (git-ignored), mở bằng `npx playwright show-report e2e-report`.
- AC-2: `E2E_BASE_URL` đổi được đích (mặc định giữ `http://localhost:3000`); đặt `E2E_BASE_URL=http://localhost:3002` thì không bật `webServer`, chạy trên portal DEV đang chạy.
- FR-2: kịch bản đọc được.
- AC-3: `e2e/KICH-BAN.md`, mỗi bộ (11 bộ trong `e2e/`) có 1 mục, mỗi ca 1 bảng: Bước | Làm gì (lời thường) | Mong thấy gì | Use case (spec `path:line` từ `hanh-trinh.md`). Mỗi bước phải khớp một bước của use case; bước test làm mà use case không có, hoặc use case có mà test bỏ qua, ghi vào cột "Lệch" và **không sửa test** ở task này. Tên ca khớp đúng tên `test(...)` trong spec. Không có UUID, không có selector.
- FR-3: gửi lại cho Dawn.
- AC-4: codex chạy toàn bộ e2e desktop trên DEV :3002 với `E2E_RECORD=1`, rồi ghi `.aidlc/runs/PORTAL-E2E-VIDEO-001/ket-qua.md`: bảng Bộ | Ca | PASS/FAIL | lý do đỏ (1 dòng) | đường dẫn video. Không sửa test để xanh.

## Technical definition
- Playwright 1.x có sẵn: `use.video: "on"`, `use.trace: "on"`, `use.screenshot: "on"`, reporter `[["list"], ["html", { outputFolder: "e2e-report", open: "never" }]]`. Không thêm thư viện.
- Giữ `workers: 1`, Brave headless (`playwright.config.ts:4`), `fullyParallel: false`.
- Tài khoản test: giữ như các spec đang dùng (1 tài khoản khách cố định, memory 23/10).

## UX
- Không đổi màn. Người xem: Dawn. `e2e/README.md` mục "Xem lại e2e": 3 lệnh (chạy, mở báo cáo, xem trace) và cách đọc báo cáo: bấm ca → tab Video / Trace.

## Design
- `playwright.config.ts`: `const record = process.env.E2E_RECORD === "1"; const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";` `use: { baseURL, launchOptions, ...(record && { video: "on", trace: "on", screenshot: "on" }) }`; reporter như trên khi `record`; `webServer` bỏ khi `E2E_BASE_URL` có giá trị.
- `package.json`: `"e2e:record": "E2E_RECORD=1 E2E_BASE_URL=${E2E_BASE_URL:-http://localhost:3002} playwright test --project=desktop"`.
- `.gitignore`: thêm `e2e-report/`.

## Files planned
- .aidlc/runs/PORTAL-E2E-VIDEO-001/hanh-trinh.md
- playwright.config.ts
- package.json
- .gitignore
- e2e/KICH-BAN.md
- e2e/README.md
- e2e/setup/login.setup.ts
- e2e/fooddev-v2/playwright.fooddev-v2.config.ts
- e2e/supplier-contract/supplier-contract.spec.ts
- e2e/supplier-contract/permissions.spec.ts
- e2e/supplier-contract/receipt-gate.spec.ts
- e2e/inventory-ux/inventory-ux.spec.ts
- e2e/rbac/rbac.spec.ts
- e2e/fooddev-pack/fooddev-pack.spec.ts
- e2e/fooddev-set/fooddev-set.spec.ts
- .aidlc/runs/PORTAL-E2E-VIDEO-001/ket-qua.md
- e2e/catalog-split/catalog-split.spec.ts
- e2e/fooddev-set/fooddev-set.spec.ts
- e2e/fooddev-v2/dishes.spec.ts
- e2e/fooddev-v2/fooddev-v2.spec.ts
- e2e/fooddev-v2/helpers.ts
- e2e/setup/data.setup.ts

## Tests planned
- TC-1 | AC-1, AC-2 | config | `npx playwright test --list --project=desktop` liệt kê đủ ca, không lỗi config.
- TC-2 | AC-1, AC-4 | e2e DEV | `npm run e2e:record` → `e2e-report/index.html` tồn tại; số thư mục video bằng số ca đã chạy.

## Slices
Mỗi slice dừng chờ Dawn xem.
- [ ] S0: rà hành trình chức năng ↔ use case ↔ ca e2e, chỉ đọc code/spec (files: .aidlc/runs/PORTAL-E2E-VIDEO-001/hanh-trinh.md; test: test -s .aidlc/runs/PORTAL-E2E-VIDEO-001/hanh-trinh.md)
- [ ] S1a: cờ ghi hình có hiệu lực ở MỌI bộ: bỏ `trace/video: "off"` cứng ở supplier-contract.spec + config riêng fooddev-v2 (đọc `E2E_RECORD`), đổi đích DEV qua `E2E_BASE_URL`, lệnh e2e:record (files: playwright.config.ts, package.json, .gitignore, e2e/fooddev-v2/playwright.fooddev-v2.config.ts, e2e/supplier-contract/supplier-contract.spec.ts; test: npx playwright test --list --project=desktop)
- [ ] S1b: bỏ `trace/video: "off"` ở 6 spec còn lại, chỉ sửa dòng `test.use`, không đổi bước test (files: e2e/supplier-contract/permissions.spec.ts, e2e/supplier-contract/receipt-gate.spec.ts, e2e/inventory-ux/inventory-ux.spec.ts, e2e/rbac/rbac.spec.ts, e2e/fooddev-pack/fooddev-pack.spec.ts; test: npx playwright test --list --project=desktop)
- [ ] S1c: 1 bước đăng nhập chung: `e2e/setup/login.setup.ts` đăng nhập DEV các vai (kho, quản trị, khách, FOOD_DEV) từ file ngoài repo `~/work/ticket/.cache/e2e/accounts.env` (không commit, không in mật khẩu), ghi storageState vào `.cache/e2e/state/`; các spec đọc biến state như hiện tại. Thiếu tài khoản thì dừng, báo Claude, không tự tạo. Kèm bỏ `trace/video: "off"` ở `fooddev-set.spec.ts:67` (sót ở S1b) (files: e2e/setup/login.setup.ts, playwright.config.ts, e2e/README.md, e2e/fooddev-set/fooddev-set.spec.ts; test: npx playwright test e2e/setup --project=setup)
- [ ] S2a: kịch bản 1 bộ mẫu `inventory-ux` (3 ca: phiếu nhập nháp nhiều dòng, ngày sai, danh sách + hồ sơ NCC; chỉ cần vai kho — bộ supplier-contract thiếu runner sinh ngữ cảnh) + hướng dẫn xem lại, chạy ghi hình riêng bộ này để Dawn duyệt mẫu (files: e2e/KICH-BAN.md, e2e/README.md; test: npm run e2e:record -- e2e/inventory-ux)
- [ ] S2b: kịch bản 10 bộ còn lại theo mẫu đã duyệt (files: e2e/KICH-BAN.md; test: npx playwright test --list --project=desktop)
- [ ] S3: chạy toàn bộ trên DEV có ghi hình, ghi bảng kết quả (files: .aidlc/runs/PORTAL-E2E-VIDEO-001/ket-qua.md; test: npm run e2e:record)

### Lượt 2 (31/10 tối, Dawn: "duyệt 1 lần") — sửa 13 ca đỏ, thuyết minh tiếng Việt, merge
Kết quả lượt 1: 32 PASS / 13 FAIL / 23 bỏ qua / 5 không chạy. Cả 13 ca đỏ đều do test/dữ liệu, chưa thấy lỗi chức năng. Lượt 2 ĐƯỢC sửa test (khác AC-3/AC-4), nhưng chỉ sửa cách test chuẩn bị dữ liệu và tìm phần tử theo màn hiện tại; KHÔNG nới assert, không bỏ ca, không skip. Không làm theo nhịp dừng từng slice: chạy liền S4→S9, dừng chỉ khi gặp lỗi chức năng thật (ghi vào ket-qua.md, báo Claude).
- [ ] S4: thuyết minh tiếng Việt trên video: bọc thân mỗi ca bằng `test.step("Bước n: …")` lấy chữ từ e2e/KICH-BAN.md, không đổi lệnh bên trong (files: e2e/inventory-ux/inventory-ux.spec.ts, e2e/catalog-split/catalog-split.spec.ts, e2e/rbac/rbac.spec.ts, e2e/fooddev-pack/fooddev-pack.spec.ts, e2e/fooddev-set/fooddev-set.spec.ts; test: npx playwright test --list --project=desktop)
- [ ] S5: như S4 cho bộ NCC và Món (files: e2e/supplier-contract/supplier-contract.spec.ts, e2e/supplier-contract/permissions.spec.ts, e2e/supplier-contract/receipt-gate.spec.ts, e2e/fooddev-v2/dishes.spec.ts, e2e/fooddev-v2/fooddev-v2.spec.ts; test: npx playwright test --list --project=desktop)
- [ ] S6: bước chuẩn bị dữ liệu chung `e2e/setup/data.setup.ts` chạy sau đăng nhập, gọi API DEV qua phiên đã lưu: tạo/tìm NCC + hợp đồng + nguyên liệu và ghi `SUPPLIER_CONTRACT_CONTEXT` (thay runner đã mất), tạo/tìm món mẫu cho biến `FOODDEV_<KEY>_ID`, bảo đảm có thành viên SALES mẫu cho rbac; ghi ra `~/work/ticket/.cache/e2e/state/data.json`, config nạp vào biến môi trường. Chạy lại không tạo trùng (files: e2e/setup/data.setup.ts, playwright.config.ts, e2e/fooddev-v2/helpers.ts, e2e/fooddev-v2/playwright.fooddev-v2.config.ts; test: E2E_BASE_URL=http://localhost:3002 npx playwright test --project=setup)
- [ ] S7: sửa test Gói/Set và rbac theo màn hiện tại: ô đã đổi thành ô chọn thì chọn thay vì gõ; rbac tìm thành viên SALES mẫu từ S6 (files: e2e/fooddev-pack/fooddev-pack.spec.ts, e2e/fooddev-set/fooddev-set.spec.ts, e2e/rbac/rbac.spec.ts; test: npm run e2e:record -- e2e/fooddev-pack e2e/fooddev-set e2e/rbac)
- [ ] S8: chạy toàn bộ có ghi hình (kể cả bộ Món bằng config riêng), ghi ket-qua.md: Bộ | Ca | PASS/FAIL | lý do 1 dòng | video (files: .aidlc/runs/PORTAL-E2E-VIDEO-001/ket-qua.md; test: npm run e2e:record)
- [ ] S9: merge `fix/portal-activate-inbound-261031` + `test/portal-e2e-record` vào main portal và push, sau khi verify toàn bộ (npm test, lint, typecheck, next build) PASS ở checkout chính (files: .aidlc/runs/PORTAL-E2E-VIDEO-001/ket-qua.md; test: git log origin/main -1)

## Risks / rollback
- Video làm chạy chậm hơn (~1,3 lần). Chỉ bật khi có cờ.
- Video nặng (vài MB mỗi ca) nằm trong `e2e-report/`, `node_modules/.cache/playwright-results`, không commit.
- Rollback: revert 1 commit.

## Open decisions
- Không có.
