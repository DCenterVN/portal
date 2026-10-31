## S1a+S1b

Đã sửa 10 file theo brief:

- `playwright.config.ts`: đọc `E2E_RECORD`, `E2E_BASE_URL`; bật video, trace, screenshot và HTML reporter khi ghi hình; không bật webServer khi có E2E_BASE_URL. Giữ cơ chế VISUAL_BASELINE hiện có.
- `package.json`: thêm script `e2e:record` đúng Design.
- `.gitignore`: thêm `e2e-report/`.
- `e2e/fooddev-v2/playwright.fooddev-v2.config.ts`: video, trace, screenshot là `on` khi E2E_RECORD=1, ngược lại `off`.
- `e2e/supplier-contract/supplier-contract.spec.ts`
- `e2e/supplier-contract/permissions.spec.ts`
- `e2e/supplier-contract/receipt-gate.spec.ts`
- `e2e/inventory-ux/inventory-ux.spec.ts`
- `e2e/rbac/rbac.spec.ts`
- `e2e/fooddev-pack/fooddev-pack.spec.ts`

Sáu spec chỉ bỏ các khóa trace/video/screenshot khỏi test.use, xóa dòng nếu không còn khóa. Giữ nguyên storageState và mọi bước test. Không sửa fooddev-set, không thêm thư viện/helper/comment, không git add/commit.

Kiểm tra ngày 2026-10-31, các lệnh chạy qua `rtk proxy`:

| Lệnh | Kết quả |
| --- | --- |
| `npx playwright test --list --project=desktop` | PASS, exit 0; 69 ca trong 11 file |
| `E2E_RECORD=1 E2E_BASE_URL=http://localhost:3002 npx playwright test --list --project=desktop` | PASS, exit 0; 69 ca trong 11 file, không lỗi config |
| `npx playwright test --list -c e2e/fooddev-v2/playwright.fooddev-v2.config.ts` | PASS, exit 0; 11 ca trong 2 file |
| `npm run typecheck` | PASS, exit 0 |
| `node node_modules/eslint/bin/eslint.js playwright.config.ts e2e` | PASS, exit 0; không lỗi/cảnh báo |
| `grep -rnE "(video\|trace\|screenshot)\s*:\s*['\"]off" e2e playwright.config.ts` | PASS, exit 0; chỉ còn `e2e/fooddev-set/fooddev-set.spec.ts:67` |
| `git diff --check` | PASS, exit 0 |

Mẫu grep yêu cầu không khớp nhánh điều kiện của fooddev-v2. Đã kiểm tra riêng dòng 23: cả ba khóa dùng `record ? 'on' : 'off'`.

Đây là kiểm tra liệt kê/config và kiểm tra tĩnh; chưa chạy ca trình duyệt để sinh video/trace. `node_modules` đã ở trạng thái untracked trước khi sửa.

## S1c

Đã sửa/tạo 4 file triển khai:

- `e2e/setup/login.setup.ts`: đọc `~/work/ticket/.cache/e2e/accounts.env` bằng `node:fs`, tự tách KEY=VALUE; 4 ca WAREHOUSE, ADMIN, CUSTOMER, FOODDEV. Dùng selector theo nhãn từ thông điệp hiện có, nhân viên vào `/staff/login`, khách vào `/login`. Kiểm tra phản hồi đăng nhập 200 và chờ vào console/platform hoặc shop trước khi ghi `~/work/ticket/.cache/e2e/state/<vai>.json`. Vai thiếu email hoặc mật khẩu dùng `test.skip` kèm lý do; thiếu file báo `Thiếu ~/work/ticket/.cache/e2e/accounts.env` khi chạy setup. Không log mật khẩu.
- `playwright.config.ts`: thêm project `setup`; desktop phụ thuộc setup khi `E2E_RECORD=1`; desktop/mobile bỏ qua file setup. Đặt mặc định PORTAL_WAREHOUSE_STATE, PORTAL_ADMIN_STATE, PORTAL_CUSTOMER_STATE trỏ state mới; đọc accounts.env một lần nếu có để cấp FOODDEV_EMAIL/FOODDEV_PASSWORD. Giữ giá trị biến môi trường đã đặt.
- `e2e/fooddev-set/fooddev-set.spec.ts`: chỉ xóa dòng `test.use` tắt trace/screenshot/video.
- `e2e/README.md`: thêm mục "Xem lại e2e", tên biến tài khoản để trống, lệnh ghi hình inventory-ux, mở báo cáo và xem Video / Trace.

Kiểm tra ngày 2026-10-31, các lệnh chạy qua `rtk proxy`:

| Lệnh | Kết quả |
| --- | --- |
| `npx playwright test --list --project=desktop` | PASS, exit 0; 69 ca trong 11 file, không có setup |
| `npx playwright test --list --project=setup` | PASS, exit 0; 4 ca trong 1 file |
| `npm run typecheck` | PASS, exit 0 |
| `node node_modules/eslint/bin/eslint.js playwright.config.ts e2e` | PASS, exit 0; không lỗi/cảnh báo |
| `E2E_RECORD=1 E2E_BASE_URL=http://localhost:3002 npx playwright test --list --project=desktop e2e/inventory-ux` | PASS, exit 0; 7 ca trong 2 file, gồm 4 setup và 3 inventory-ux |
| `git diff --check` | PASS, exit 0 |

Kết quả đăng nhập thật trên DEV:

| Vai | Kết quả |
| --- | --- |
| WAREHOUSE | chưa chạy, thiếu accounts.env |
| ADMIN | chưa chạy, thiếu accounts.env |
| CUSTOMER | chưa chạy, thiếu accounts.env |
| FOODDEV | chưa chạy, thiếu accounts.env |

Không chạy `E2E_BASE_URL=http://localhost:3002 npx playwright test --project=setup` vì file tài khoản chưa tồn tại. Chưa tạo storageState hoặc video/trace từ trình duyệt. Không tạo/ghi accounts.env, không in nội dung file, không dùng /tmp, không git add/commit. Giữ nguyên các thay đổi có sẵn trong artifacts/plan-approval.json, state.json, .aidlc/trace.jsonl và các file untracked ngoài phạm vi.

## S2a

Đã tạo `e2e/KICH-BAN.md`: ba dòng cách xem, mục `inventory-ux`, ba bảng đúng tên ca. Đối chiếu thứ tự thao tác với `e2e/inventory-ux/inventory-ux.spec.ts` và mở các đặc tả được dẫn trong hành trình để kiểm số dòng.

| Ca | Số bước | Số dòng Lệch |
|---|---:|---:|
| TC-07: hai dòng, ngày Việt, tổng hợp đồng và tạo nháp đọc lại | 17 | 6 |
| TC-08: không tìm thấy và ngày sai không tạo phiếu | 6 | 4 |
| TC-07/12: list ACTIVE, hồ sơ chip và bảng không tràn sáng tối | 20 | 14 |
| Tổng | 43 | 24 |

Số bước tính các dòng đánh số, gồm bước mở trang chung, thao tác gõ/chọn có điều kiện và từng lượt xem sáng/tối ở bốn độ rộng. Dòng “Chưa kiểm” không tính là bước đã chạy. Số dòng Lệch đếm từng hàng có nội dung khác dấu “—”, gồm cả hàng chưa kiểm; tám lượt đổi sáng/tối có cùng giới hạn được đếm thành tám hàng.

Kiểm tra tài liệu: tên ba ca khớp nguyên văn; ba bảng có đủ năm cột; dòng dẫn đặc tả được mở và đối chiếu. Không chạy lại trình duyệt trong S2a này; kết quả chạy có video trên môi trường phát triển là dữ kiện brief đã cung cấp, không phải kết quả kiểm mới. Không sửa kiểm thử, không ghi /tmp, không git add/commit.
