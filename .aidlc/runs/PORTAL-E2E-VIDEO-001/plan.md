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
- e2e/journeys/kho.spec.ts
- e2e/journeys/mon-ban.spec.ts
- e2e/journeys/khach-quan-tri.spec.ts

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

### Lượt 2 (31/10 tối, Dawn: "nghiệp vụ thì lỗi hết, pass toàn cơ bản"; "duyệt 1 lần")
Lượt 1: 32 PASS chỉ là đăng nhập, danh sách, giao diện; KHÔNG luồng nghiệp vụ nào chạy hết từ đầu đến cuối. Lượt 2 lấy nghiệp vụ làm thước đo: mỗi hành trình = 1 ca dài chạy trên DEV bằng UI như người dùng, dữ liệu mới tạo trong ca (tên có hậu tố thời gian), mỗi bước `test.step("Bước n: …")` tiếng Việt để video có thuyết minh, kiểm kết quả nghiệp vụ (tiền, số lượng tồn, trạng thái, quyền) chứ không chỉ "thấy trang". Use case lấy từ hanh-trinh.md. Ca đỏ vì chức năng hỏng = ghi lỗi (màn, bước, mong đợi, thực tế, file:line nghi ngờ) vào ket-qua.md, KHÔNG nới test; Claude tách task sửa. Chạy liền S4→S9.
- [ ] S4: hành trình KHO: kho tạo NCC → hợp đồng/bảng giá áp dụng → phiếu nhập 2 dòng giá theo hợp đồng → nhận hàng có ảnh hàng + ảnh chứng từ, lệch số lượng → tồn kho tăng đúng lượng thực nhận, giá vốn theo lượng thực nhận; thiếu ảnh thì không nhận được (files: e2e/journeys/kho.spec.ts; test: npm run e2e:record -- e2e/journeys/kho.spec.ts)
- [ ] S5: hành trình MÓN → BÁN: FOOD_DEV tạo nguyên liệu/nhóm, món có định lượng, giá vốn đủ → gói → mở bán có giá → khách (đã đăng nhập) thấy sản phẩm đúng giá; nguyên liệu chưa có nhóm thì không hoàn tất món; vai kho không sửa được món (files: e2e/journeys/mon-ban.spec.ts; test: npm run e2e:record -- e2e/journeys/mon-ban.spec.ts)
- [ ] S6: hành trình KHÁCH + QUẢN TRỊ: khách đăng ký → email kích hoạt trong Mailpit DEV → đặt mật khẩu → đăng nhập; ADMIN tạo nhân viên SALES, khoá → SALES mất quyền ngay, mở lại → có quyền; không khoá được ADMIN cuối cùng (files: e2e/journeys/khach-quan-tri.spec.ts; test: npm run e2e:record -- e2e/journeys/khach-quan-tri.spec.ts)
- [ ] S7: sửa 13 ca cũ đang đỏ: bước chuẩn bị dữ liệu chung thay runner NCC đã mất + món mẫu bộ Món; Gói/Set chọn thay vì gõ; rbac dùng thành viên SALES tạo trong ca. Không nới assert (files: e2e/setup/data.setup.ts, playwright.config.ts, e2e/fooddev-v2/helpers.ts, e2e/fooddev-pack/fooddev-pack.spec.ts, e2e/fooddev-set/fooddev-set.spec.ts, e2e/rbac/rbac.spec.ts; test: npm run e2e:record)
- [ ] S8: chạy toàn bộ có ghi hình, ket-qua.md: hành trình nghiệp vụ lên đầu (bước nào chạy, bước nào hỏng), rồi các bộ cũ; danh sách lỗi chức năng tìm được (files: .aidlc/runs/PORTAL-E2E-VIDEO-001/ket-qua.md, e2e/KICH-BAN.md; test: npm run e2e:record)
- [ ] S9: merge `fix/portal-activate-inbound-261031` + `test/portal-e2e-record` vào main portal và push sau khi npm test, lint, typecheck, next build PASS ở checkout chính (files: .aidlc/runs/PORTAL-E2E-VIDEO-001/ket-qua.md; test: git log origin/main -1)

## Risks / rollback
- Video làm chạy chậm hơn (~1,3 lần). Chỉ bật khi có cờ.
- Video nặng (vài MB mỗi ca) nằm trong `e2e-report/`, `node_modules/.cache/playwright-results`, không commit.
- Rollback: revert 1 commit.

## Open decisions
- Không có.
