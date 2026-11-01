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

## S2b

Đã bổ sung 10 tệp kiểm thử còn lại thành 7 mục theo thư mục thực tế trong `e2e/`, bỏ `setup` và giữ nguyên `inventory-ux`. Con số “10 bộ” trong kế hoạch tương ứng 10 tệp, không phải 10 thư mục. Có 66 ca, gồm tên sinh theo kích thước, giao diện và tên màn; mỗi ca một bảng.

| Bộ | số ca | số bước | số Lệch |
|---|---:|---:|---:|
| catalog-split | 23 | 42 | 31 |
| fooddev-pack | 1 | 11 | 7 |
| fooddev-set | 1 | 10 | 3 |
| fooddev-v2 | 11 | 54 | 11 |
| rbac | 5 | 17 | 3 |
| supplier-contract | 4 | 23 | 9 |
| visual | 21 | 22 | 22 |
| Tổng | 66 | 179 | 86 |

Số bước đếm các hàng đánh số trong bảng đã gộp thao tác lặp, không đếm hàng “Chưa kiểm”; không phải số thao tác trình duyệt thô hoặc số bước đã chạy thành công. Số Lệch đếm hàng có nội dung khác dấu “—”, gồm hàng “Chưa kiểm” và hàng chưa có yêu cầu tương ứng trong hành trình; không phải số lỗi độc lập. Ca bị bỏ qua theo điều kiện vẫn được mô tả và tính một ca.

Kiểm tra tĩnh đạt: 66/66 tên ca khớp nguồn, đủ năm cột mỗi bảng, số bước liên tục, tối đa ba hàng “Chưa kiểm” mỗi ca; mọi Lệch có dẫn chứng file và dòng. Đối chiếu các tên sinh trực tiếp từ vòng lặp và danh sách trong nguồn, không dùng trình chạy kiểm thử. Kiểm tra đường dẫn và số dòng dẫn chứng tồn tại. Phần có sẵn của KICH-BAN.md gồm inventory-ux giữ nguyên toàn bộ 17.992 byte, xác nhận bằng dấu kiểm toàn vẹn trước và sau.

Các lệch đáng chú ý: ca bảng giá bắt chứng từ dù đặc tả hiện cho tùy chọn; ca tạo phiếu bắt giá chỉ đọc và chặn ngoài kỳ; ca gói cũ tự nhập các trường hiện tự sinh và tìm thẻ Set theo tên cũ. Các ca so ảnh chỉ mô tả so ảnh và điều kiện bỏ qua, chưa chứng minh tiền, kho hoặc quyền đúng.

Chỉ sửa `e2e/KICH-BAN.md` và phần bàn giao S2b này. Không sửa test, không chạy Playwright, không ghi /tmp, không git add/commit; giữ các thay đổi khác có sẵn. Bước tiếp theo: điều phối viên duyệt kịch bản S2b trước lượt chạy ghi hình được giao riêng.


## S4

Đã thêm `e2e/journeys/kho.spec.ts`: một hành trình KHO, 8 bước test.step tiếng Việt. Dùng phiên WAREHOUSE qua browser.newContext, ghi video có tên bước và chú thích thao tác. Tạo NCC, hợp đồng, phiếu và mã lô mới theo thời gian; chọn hai nguyên liệu KG có sẵn từ danh mục qua UI. Không dùng fixture NCC/hợp đồng cũ. PNG 1×1/70 byte tạo bằng Buffer, zlib và CRC32 trong test, không thêm thư viện. Mọi thao tác ghi qua UI; API GET chỉ đối chiếu phiếu, tồn trước nhận và lô.

| Bước | Kết quả cuối |
|---|---|
| 1. Kho tạo NCC mới | PASS, đúng tên, ACTIVE |
| 2. Lập và áp dụng bảng giá hai dòng | PASS, 25.000 và 40.000 VND/KG, phiên bản ACTIVE, có chứng từ |
| 3. Tạo phiếu 10 kg và 5 kg | PASS, tự điền giá hợp đồng, đúng refs, tổng dự kiến 450.000 VND, DRAFT |
| 4. Thiếu ảnh thì chặn nhận | PASS, nút khóa, không gửi receive, lượng nhận vẫn 0 |
| 5. Tải ảnh hàng/chứng từ/lệch rồi nhận 8 kg và 6 kg | PASS, thiếu từng loại ảnh vẫn khóa, đúng 2 lần nhận, hai lô RECEIVED |
| 6. Giải trình lệch 15 kg → 14 kg | PASS, có ảnh và giải thích |
| 7. Lượng và thành tiền thực nhận | FAIL ở tổng UI; hai lô và tiền từng dòng đúng 200.000/240.000 VND, tổng lại 450.000 thay vì 440.000 |
| 8. Tồn tăng đúng lượng thực nhận | CHƯA CHẠY vì bước 7 đỏ |

Lỗi chức năng đã ghi tại ket-qua.md, mục `## Lỗi chức năng`: màn `/inventory/suppliers/[id]?tab=receipts` hiển thị sai “Tổng thực nhận”. Nghi ngờ `features/inventory/supplier-receipts-view.tsx:30` dùng total_amount_vnd dự kiến thay vì tổng actual_amount_vnd của các dòng; đã tra backend và ghi file:line. Giữ assert UI phải hiện 440.000 VND, không skip, không sửa app/backend.

Chưa chứng minh tăng tồn khả dụng hoặc giá vốn đủ điều kiện QC. RECEIVED chưa phải APPROVED; không gọi API ghi để vượt bước QC. Tiền nhập đúng ở từng dòng chưa chứng minh material_cost_facts/bình quân đúng. Bước 8 có kiểm delta tồn nhưng chưa thực thi, còn cần hành trình QC qua UI để đáp ứng đầy đủ contract. Không báo S4 PASS.

Đã chạy 4/4 lượt tối đa bằng `npm run e2e:record -- e2e/journeys/kho.spec.ts`. Lượt 1 sửa lỗi bật trace trùng runner. Lượt 2 sửa kỳ vọng finalize 201 thành 200 theo handler. Lượt 3 phát hiện tổng phiếu 450.000; lượt 4 xác nhận trực tiếp lỗi UI, tránh áp đặt nghĩa trường API chưa được đặc tả. Kết quả cuối: 4 setup PASS, hành trình nghiệp vụ 0/1 PASS; 6/8 bước PASS trọn vẹn, 1 FAIL, 1 chưa chạy. Không chạy lượt thứ năm.

Bằng chứng lượt cuối:

- HTML: `e2e-report/index.html`.
- Video trong HTML: `e2e-report/data/e96dbb1b4df7ee8506c6d48a0d117dc9fc5cab23.webm`.
- Video gốc: `node_modules/.cache/playwright-results/journeys-kho-KHO-bảng-giá--1e995-lượng-tồn-và-tiền-thực-nhận-desktop/attachments/video-1b523ae666ba8e3a28f216b8f01bf450007d48c7.webm`.
- Trace: `node_modules/.cache/playwright-results/journeys-kho-KHO-bảng-giá--1e995-lượng-tồn-và-tiền-thực-nhận-desktop/trace.zip`.
- Ảnh đã xem xác nhận tổng 450.000 và dòng 200.000/240.000: `node_modules/.cache/playwright-results/journeys-kho-KHO-bảng-giá--1e995-lượng-tồn-và-tiền-thực-nhận-desktop/kho-cuoi.png`.

Kiểm tra: tsc --noEmit PASS; ESLint S4 PASS; ESLint toàn source với `--ignore-pattern 'e2e-report/**'` PASS; git diff --check PASS. `npm run lint` nguyên bản FAIL 3.965 lỗi do quét JavaScript sinh trong e2e-report. `npm test`: 1.622 PASS / 4 FAIL, gồm frame lock lệch package.json/playwright.config.ts từ slice trước và ba ca đọc ../inventory/api không tồn tại ở layout worktree. Không sửa lỗi ngoài scope.

Dọn ảnh: đã chạy git checkout theo brief nhưng filesystem chặn tạo index.lock. Dùng git ls-files/git show HEAD đối chiếu 212 artifact mà không ghi index: 212/212 khớp HEAD, không cần thay bytes. Không git add/commit. Giữ nguyên thay đổi có sẵn ở .aidlc/trace.jsonl, .aidlc/runs/PORTAL-E2E-VIDEO-001.json và node_modules.

Sai sót thao tác: script npm test có sẵn gọi copy/chmod `/tmp/esbuild`; đã lỡ chạy script khi kiểm tra chung, trái ràng buộc không /tmp. Không tạo ảnh, fixture hay tài liệu S4 trong /tmp; không tiếp tục dùng script đó. Các file chủ động sửa chỉ là spec S4 và hai báo cáo brief yêu cầu.

## S5

Đã thêm `e2e/journeys/mon-ban.spec.ts`: một ca MÓN → BÁN, 9 `test.step` tiếng Việt, video có tên bước/chú thích thao tác. Tái dùng picker hiện có, storageState FOOD_DEV/kho/khách tách qua browser.newContext. Chỉ sửa spec S5 và hai báo cáo brief yêu cầu; không sửa app/backend, không /tmp, không git add/commit.

| Bước | Kết quả cuối |
|---|---|
| 1. FOOD_DEV tạo nguyên liệu mới, chọn hai cấp nhóm | PASS, tên mới/KG/mã nhóm, ngăn Rau, 100 g/suất × 2 người |
| 2. Kho tạo NCC và bảng giá | PASS, đúng nguyên liệu mới, 100.000 VND/KG, ACTIVE và đang hiệu lực |
| 3. Tạo gói gia vị/công thức | PASS, 10 G, yield 100%, BOM_ACTIVE; món có gói bắt buộc |
| 4. Nguyên liệu chưa nhóm không hoàn tất | PASS, cảnh báo nhóm và thiếu ngăn, nút khóa, 0 POST complete, nháp OPEN còn nguyên sau tải lại; đổi về nguyên liệu hợp lệ thì nút mở |
| 5. Kho mở cùng nháp không sửa được | PASS, các trường/nút ghi khóa, GET trước/sau không đổi |
| 6. Giá vốn đủ 22.000 VND/kit, 11.000/suất | FAIL, lượng đúng 0,2/0,02 KG nhưng hai dòng NO_PRICE, complete=false, tổng 0/chưa đủ |
| 7. Hoàn tất để sinh gói nguyên liệu và bộ món | CHƯA CHẠY |
| 8. Mở bán 55.000 VND | CHƯA CHẠY |
| 9. Khách đăng nhập thấy món đúng giá | CHƯA CHẠY |

Lỗi chức năng được ghi ở `ket-qua.md`, mục `## Lỗi chức năng`, tiểu mục S5. Bảng giá mới `HD-MON-1793467078704` version 2 ACTIVE, đúng SKU/UOM/100000 và ngày. Cost-preview HTTP 200 vẫn trả hai NO_PRICE, giá và cost null. Đã xem ảnh UI xác nhận. Nghi ngờ `/home/dawn/work/ticket/production/internal/adapter/sales/material_catalog.go:260` chỉ lấy `seedQuote`; dòng 268 loại SKU mới thiếu reference_price_vnd/quy cách seed. Đây là thiếu nối giá NCC vào hành trình S5; không báo inventory ghi giá sai, không coi giá 0/chưa đủ là cost hợp lệ. Không chứng minh giá vốn kế toán sau QC.

Đã chạy đủ 4/4 lượt tối đa. Lượt 1 sửa phạm vi picker công thức/nhãn; lượt 2 sửa locator nhãn select đơn vị; lượt 3 sửa kỳ vọng thông báo thiếu nhóm kéo theo thiếu ngăn theo validateDish; lượt 4 dừng ở lỗi chức năng. Kết quả cuối 4 setup PASS, 1 hành trình FAIL tại `mon-ban.spec.ts:215`; 5/9 bước PASS, 1 FAIL, 3 chưa chạy. Không chạy lần thứ năm, không skip/nới assert giá vốn.

Bằng chứng lượt cuối:

- HTML: `e2e-report/index.html`.
- Video FOOD_DEV: `e2e-report/data/a300455f00a24e152ac6cc0f8f9ed4d2cd8fc9a7.webm`.
- Video kho: `e2e-report/data/71607e1dfd91de7928fad31d6da0cb161e6290c7.webm`.
- Video gốc FOOD_DEV: `node_modules/.cache/playwright-results/journeys-mon-ban-MÓN-→-BÁN-28c02-i-mở-bán-đúng-giá-cho-khách-desktop/attachments/video-fooddev-854aa9c89be8352df982c744694349e367260db7.webm`.
- Trace: `node_modules/.cache/playwright-results/journeys-mon-ban-MÓN-→-BÁN-28c02-i-mở-bán-đúng-giá-cho-khách-desktop/trace.zip`, có JSON bảng giá ACTIVE và cost-preview cùng SKU.
- Ảnh đã xem: `node_modules/.cache/playwright-results/journeys-mon-ban-MÓN-→-BÁN-28c02-i-mở-bán-đúng-giá-cho-khách-desktop/mon-ban-fooddev-cuoi.png`.

Giới hạn: “tạo nguyên liệu + nhóm” hiện là tạo nguyên liệu rồi gán taxonomy hai cấp có sẵn. Dữ liệu nhánh chính đều mới; nhánh âm dùng một nguyên liệu chưa phân nhóm có sẵn, không sửa nó. Kho chỉ kiểm bất khả sửa qua UI và dữ liệu giữ nguyên; không gửi API ghi để thử 403. Khách chưa mở trang vì dừng ở bước 6, video khách trống không là bằng chứng. Bước 8 mô tả UI mở bán đích, các nút Mở bán/Xác nhận mở bán chưa có trong code hiện tại và chưa được thực thi; còn phải nối định giá, duyệt độc lập, kích hoạt theo `hanh-trinh.md` 5.9–5.12. Không báo S5 hay đoạn mở bán/giá khách PASS.

Kiểm tra cuối: TypeScript `tsc --noEmit` PASS, ESLint riêng S5 PASS, `git diff --check` PASS. Không chạy npm test có script ghi /tmp hoặc sửa lỗi ngoài slice. Đã thử đúng `git checkout -- .aidlc/runs/PORTAL-INVENTORY-UX-001/artifacts`; filesystem chặn index.lock ngoài writable root. Đối chiếu không dùng index bằng git ls-files -z/git show HEAD: 212/212 artifact đã khớp HEAD, không cần thay bytes. Giữ nguyên các thay đổi có sẵn ở trace/run bookkeeping/node_modules. Runner đã thay HTML/results S4 bằng S5; đường dẫn S4 trong báo cáo cũ là lịch sử, không phải artifact hiện còn trong báo cáo mới.

Tiếp tục: sửa luồng cấp giá cho nguyên liệu mới bằng task riêng, rồi kiểm lại từ bước 6; chưa được đánh dấu S5 hoàn thành nghiệp vụ. Bàn giao hiện tại giữ ca đỏ và vị trí hỏng để điều phối viên tách việc.

## S6

Hành trình KHÁCH + QUẢN TRỊ: `e2e/journeys/khach-quan-tri.spec.ts`. Chạy 2/4 lượt; lượt 2 PASS (setup 4/4 + hành trình 1/1, 1,3 phút).

Lượt 1 đỏ ở bước 5 vì test viết sai, không phải lỗi chức năng: phiên ADMIN lưu sẵn chưa chọn công ty/chi nhánh nên `/memberships` bị chuyển sang `/staff/switch-org` (proxy.ts:35-39, đúng thiết kế). Đã thêm `enterCompany` (chọn công ty + chi nhánh theo `branch_id` đọc từ danh sách nhân viên, cùng cách `rbac.spec.ts` `openMemberships`). Không nới assert.

| Bước | Kết quả |
|---|---|
| 1. Khách đăng ký, thấy nhắc kiểm tra hộp thư, chưa có phiên | PASS (202) |
| 2. Mailpit nhận mail đúng người, có link `/activate?token=` | PASS |
| 3. Mở link chưa tự kích hoạt; đặt mật khẩu mới rồi kích hoạt, chưa tự đăng nhập | PASS |
| 4. Khách đăng nhập bằng mật khẩu vừa đặt; `/me` 200, danh sách nhân viên 403 | PASS |
| 5. ADMIN tạo nhân viên SALES: 201, role `["SALES"]`, ACTIVE, khớp danh sách | PASS |
| 6. SALES đăng nhập ngay, thấy "Bảng giá", đọc sản phẩm 200, nhân viên 403 | PASS |
| 7. ADMIN khoá SALES: cùng phiên đọc sản phẩm 403, menu Bảng giá mất, token giữ nguyên | PASS |
| 8. ADMIN mở khoá: cùng phiên đọc lại 200, menu Bảng giá có lại, không đăng nhập lại | PASS |
| 9. Khoá ADMIN cuối cùng: 409, thông báo lastAdmin, dữ liệu giữ nguyên | PASS |
| 10. Hạ ADMIN cuối xuống Bán hàng: 409, vai trò giữ nguyên | PASS |

Lỗi chức năng tìm được: không có ở S6.

Video (gốc, mỗi vai một file): `node_modules/.cache/playwright-results/journeys-khach-quan-tri-KH-5dcef-lại-quyền-bảo-vệ-ADMIN-cuối-desktop/attachments/video-{khach,admin,sales}-*.webm` (3,9 / 5,1 / 1,7 MB). Bản trong báo cáo HTML: `e2e-report/index.html`, `e2e-report/data/*.webm`. Ảnh cuối mỗi vai: `.../khach-cuoi.png`, `admin-cuoi.png`, `sales-cuoi.png` cùng thư mục.

Giới hạn: bước 9-10 dựa vào DEV có đúng một ADMIN hoạt động (test khẳng định điều này, đỏ nếu DEV có thêm ADMIN). Không in/ghi mật khẩu; tài khoản khách/SALES sinh mới theo hậu tố thời gian, không dọn (không có API xoá). Đã chạy `git checkout -- .aidlc/runs/PORTAL-INVENTORY-UX-001/artifacts`. ESLint file spec PASS.

## Việc A (COST-PRICE-LINK-001 S1)

Sửa `features/inventory/supplier-receipts-view.tsx:30`: không DRAFT thì "Tổng thực nhận" = cộng `line.actual_amount_vnd` (null tính 0); DRAFT giữ `total_amount_vnd`. Thêm 1 ca test trong `supplier-receipts-view.test.tsx` (2 dòng 200.000 + 240.000 với total_amount_vnd 450.000, kỳ vọng "Tổng thực nhận: 440.000 VND", không có "450.000"). Vitest file: 6/6 PASS; `tsc --noEmit` sạch; eslint 3 file sạch. Lỗi S4 ở mục `## Lỗi chức năng` đã được sửa phía portal.

## Chạy lại sau fix (1/11/2026, portal :3003)

Lệnh lượt cuối: `E2E_BASE_URL=http://localhost:3003 npm run e2e:record -- e2e/journeys` (cả 3 file một lệnh): khach-quan-tri PASS, kho PASS, mon-ban FAIL ở bước 8. Số lượt: kho 4 lượt riêng (3 lượt đỏ do test của mình: strict-mode ô ghi chú; trường lô đúng là `expires_at` chứ không phải `expiry_date`; hạn sử dụng lô lưu 00:00 giờ Việt Nam = 17:00Z ngày trước) rồi PASS, thêm 2 lượt chung cả 3 file (lần 1 chụp ảnh form, lần 2 thêm ảnh cuộn ô) đều PASS; mon-ban 1 lượt riêng + 2 lượt chung, đều đỏ đúng bước 8; khach-quan-tri 1 lượt riêng + 2 lượt chung, đều PASS. Không sửa app/backend, không nới assert.

### KHO (`e2e/journeys/kho.spec.ts`)

| Bước | Kết quả | Điền đủ ô? |
|---|---|---|
| 1. Tạo NCC | PASS | Đủ 12 ô: ảnh, tên, mã, mã số thuế, số nhà/đường, tỉnh, phường, người liên hệ, điện thoại, email, 1 nhóm nguyên liệu, ghi chú. Đọc lại bằng GET NCC + trang chi tiết: đúng từng ô, ảnh image/png đã lưu |
| 2. Bảng giá 2 dòng | PASS | Đủ: mã, hiệu lực từ/đến, mỗi dòng nguyên liệu + giá + dòng giá từ/đến ngày + thuế + giao hàng (hai dòng chọn khác nhau) + chứng từ. Đọc lại bản ACTIVE: đúng ngày, thuế, giao hàng, có document_ref |
| 3. Phiếu nhập | PASS | Nhà cung cấp, ngày dự kiến nhập (gõ dd/mm/yyyy), 2 nguyên liệu, SL. Đơn giá KHÔNG gõ tay: tự điền từ hợp đồng, test khẳng định 25.000/40.000, tổng 450.000 |
| 4. Thiếu ảnh chặn nhận | PASS | Điền lô, lượng, hạn sử dụng, nhiệt độ; nút khoá |
| 5. Nhận 8 kg + 6 kg | PASS | Đủ 4 ô + 3 ảnh mỗi dòng. Kiểm payload receive và đọc lại lô (mã lô, HSD giờ VN, nhiệt độ 4, lượng 8/6) |
| 6. Giải trình lệch 14/15 | PASS | Điền giải thích; payload khớp |
| 7. Tổng thực nhận 440.000 | PASS | Thấy đúng "Tổng thực nhận: 440.000 VND" sau fix af60b57 |
| 8. Tồn sau QC | PASS nhưng KHÔNG chứng minh tăng tồn | Chưa có màn QC nhập kho: chỉ kiểm lô RECEIVED không cộng tồn (chênh 0). Tồn/giá vốn sau QC: CHƯA KIỂM |

### MÓN → BÁN (`e2e/journeys/mon-ban.spec.ts`)

| Bước | Kết quả | Điền đủ ô? |
|---|---|---|
| 1. Nguyên liệu + nháp món | PASS | Form nguyên liệu đủ: tên, nhóm 1/2, đơn vị, dị ứng (SOYBEANS), nhãn kiêng (SPICY), chế độ ăn Chay, tháng 6-7-8; payload khớp. Nháp món: tên, danh mục, hashtag, khẩu phần, lượng 100 g, hao hụt 0% |
| 2. Kho cấp giá | PASS | NCC đủ 12 ô + bảng giá đủ ô (1 dòng) |
| 3. Gói gia vị + công thức | PASS | Họ món (chỉ có ô tên); gói: tên, quy cách, chế độ nhiệt, khối lượng; công thức: định lượng, đơn vị, yield, 1 bước chế biến (hướng dẫn + 30 giây). Đọc lại phản hồi |
| 4. Nguyên liệu chưa nhóm chặn | PASS | |
| 5. Kho chỉ xem | PASS | |
| 6. Giá vốn 22.000 | PASS | Hai dòng 20.000 + 2.000 = 22.000, 11.000/suất, hết NO_PRICE: fix giá vốn chạy đúng. Đọc lại nháp: tên, khẩu phần 2, danh mục, hashtag, nguyên liệu, gói gia vị |
| 7. Hoàn tất món | PASS | Gói RAU 100 g, biến thể 2 người DONE |
| 8. Mở bán 55.000 | FAIL (lỗi chức năng) | Không có nút "Mở bán" trên màn món: `e2e/journeys/mon-ban.spec.ts:342`. Xem ket-qua.md mục "Mới sau chạy lại 1/11" |
| 9. Khách thấy giá | CHƯA CHẠY | Dừng sau bước 8 |

### KHÁCH + QUẢN TRỊ (`e2e/journeys/khach-quan-tri.spec.ts`)

| Bước | Kết quả | Điền đủ ô? |
|---|---|---|
| 1–4 | PASS | Đăng ký đủ 4 ô (tên hiển thị, email, số điện thoại, mật khẩu; payload có phone). Kích hoạt đủ 2 ô. Đăng nhập; `/me` có tên và email |
| 5–8 | PASS | Form nhân viên: tên, email, mật khẩu, vai trò (chỉ Bán hàng, mặc định) |
| 9–10 | PASS | |

### Ô còn bỏ trống và lý do

- Phiếu nhập: UI không có ô ghi chú (API có `notes`); đơn giá không gõ tay (tự điền từ hợp đồng, đúng thiết kế).
- Dị ứng nguyên liệu: chỉ chọn 1/14; nhãn kiêng 1/7; NCC chỉ chọn 1 nhóm con.
- Món: chỉ 1 nguyên liệu, 1 gói gia vị; "Loại ô" giữ mặc định "Gia vị thêm"; "Cho bỏ gói" bị khoá theo luật (phải còn ≥1 gói không được bỏ). Họ món chỉ có ô tên.
- Nhân viên: chỉ vai trò Bán hàng; không kiểm form sửa nhiều vai.
- Form "Mở bán": UI chưa có nên chưa điền được.

### Đã soi ảnh (Read .png trong `e2e-report/data/`)

- KHO: NCC `c340e297ea49e555f4ec7d79c293cadde2ed7c30.png` (ảnh, tên, mã, thuế), `90207b89292dd306ae0ff5f2cf9c485def02e35c.png` (địa chỉ, liên hệ; ô "Số nhà, đường" bị cuộn khuất, được kiểm bằng payload và trang chi tiết), `5e81566c5c71e5c40983de2c0e954f8ad43882f3.png` (nhóm "Chả, giò" đã tick), bảng giá `99755fed1a1b8d983b4043888133e245bbf0cb6b.png` (chưa soi lại ảnh lượt cuối này; lượt trước đã soi: 2 dòng đủ ngày/thuế/giao hàng) và chứng từ `d1a17b2ce3f5c46142bfc20d2f273d30b14f318e.png`, phiếu nhập `fae9bac42686dfa40b50488727f98d15adbcfa92.png` (chưa soi lại lượt cuối; lượt trước soi: ngày 01/11/2026, 2 dòng, tổng 450.000), nhận hàng dòng 1 `5250a5e5141cee38292a7732c56d15f6da599732.png` (đã soi: lô, 8, 31/12/2027, 4 °C, 3 ảnh "Đã tải lên").
- MÓN → BÁN (đã soi, lượt cuối): nguyên liệu `a3304e374165bef12241d2f86259a6b432d1ad8b.png` (tên, nhóm 1/2, Kilôgam, đã khai báo + SOYBEANS, SPICY, Chay, tháng 6-7-8), công thức `3c80ba346170f9f546a85d952ff2eb710d49fc69.png` (10 G, yield 100, bước 30 giây), màn món + giá vốn 22.000 `31ea8273e0b8be0c5fb12fa3b638483fceaa3479.png`, NCC `97ba3f7f8025d028b38ebe67f96c353a9514732f.png`. Gói `39b3472c9e74c1307d1143fee7984176c32a31af.png` chưa soi lượt cuối (lượt trước soi: quy cách "Hũ nhỏ 10 g", Nhiệt độ thường, 10 g).
- KHÁCH: đăng ký `3ce61daa97cd9f3a8a24f2c24d77665c7387b49c.png` (đã soi: 4 ô có giá trị), kích hoạt `68cebd8e2bf01f0314cce1750678b709a95c0a4f.png` (đã soi), nhân viên `4403fca32092e8ab3f812d15254db88b57dcd6aa.png` (chưa soi lượt cuối; lượt trước soi: tên, email, mật khẩu, vai trò Bán hàng).
- Nhận xét từ ảnh: ở bảng nguyên liệu của màn món, cột "Lượng / suất" bị cắt ("10C" thay vì "100") và ô "Hao hụt %" trông trống dù giá trị là 0 (test khẳng định `toHaveValue("0")`). Đây là lỗi hiển thị cột hẹp, chưa ghi vào Lỗi chức năng.

### Video (bản trong e2e-report, lượt chung cuối; mở `e2e-report/index.html`)

- KHO: `e2e-report/data/d12783c60d5c62cb1200cf65dd95bf142580731a.webm`
- MÓN → BÁN: FOOD_DEV `e2e-report/data/b9aa4789a85eb34f0fe66babfc45ac64991a7790.webm`, kho `e2e-report/data/d88ee92875db7003c6a464e3195e4a90ea075a92.webm`, khách (trống, bước 9 chưa chạy) `e2e-report/data/88a5d164fdd9e541df18f82fef0d3379f330a068.webm`
- KHÁCH + QUẢN TRỊ: khách `e2e-report/data/7653560b0635d5a84ca847e396dc9542f57948ae.webm`, admin `e2e-report/data/70f98416b0f41781a05fe44cbc81cfefcf879257.webm`, sales `e2e-report/data/b57dd36e3c905769f543f89a6aa0042e3e229310.webm`

Ghi chú: ràng buộc chỉ cho sửa `*.spec.ts`, nên phần điền NCC/bảng giá được chép trong cả kho.spec.ts và mon-ban.spec.ts (không tạo tệp helper). Đã chạy `git checkout -- .aidlc/runs/PORTAL-INVENTORY-UX-001/artifacts`.


## S7

Ngày 01/11/2026. Dừng ở kiểm tra đầu vào, chưa sửa test vì DEV trong brief không truy cập được. Không khởi động lại server, không đổi nhánh, không push/merge, không ghi API và không in tài khoản.

| Bộ | Ca | Trước | Sau | Lý do |
| --- | --- | --- | --- | --- |
| setup | Đăng nhập WAREHOUSE | FAIL | Chưa chạy lại | `net::ERR_CONNECTION_REFUSED` tại `http://127.0.0.1:3003/staff/login` |
| setup | Đăng nhập ADMIN | FAIL | Chưa chạy lại | Cùng lỗi kết nối |
| setup | Đăng nhập CUSTOMER | FAIL | Chưa chạy lại | `net::ERR_CONNECTION_REFUSED` tại `http://127.0.0.1:3003/login` |
| setup | Đăng nhập FOODDEV | FAIL | Chưa chạy lại | Cùng lỗi kết nối |
| Các bộ cũ | 69 ca desktop đã chọn, không gồm journeys | Chưa chạy | Chưa chạy | Dependency setup thất bại; chưa có bằng chứng phân loại từng ca |

### S7 lỗi chức năng

Chưa xác minh được lỗi chức năng mới: DEV từ chối kết nối trước khi có màn hình. Không quy lỗi môi trường thành lỗi chức năng, không đổi assert để làm xanh.

### Lượt chạy và dẫn chứng

- Đã dùng 1/4 lượt chạy toàn bộ. Một lần gọi trước đó bị CLI từ chối `--ignore-pattern` trước khi chạy test, không tính thành lượt chạy test.
- Lệnh thực chạy: `E2E_BASE_URL=http://127.0.0.1:3003 npm run e2e:record -- e2e/catalog-split e2e/fooddev-pack e2e/fooddev-set e2e/fooddev-v2 e2e/inventory-ux e2e/rbac e2e/supplier-contract e2e/visual`.
- Kết quả: 4 setup FAIL, 69 ca desktop không chạy. Chưa chạy lại riêng nhóm hoặc lượt toàn bộ sau sửa.
- Log: `/home/dawn/work/ticket/.cache/e2e/s7-before.log`.
- Báo cáo HTML: `e2e-report/index.html`. Error context: `node_modules/.cache/playwright-results/setup-login.setup.ts-Đăng-nhập-{WAREHOUSE,ADMIN,CUSTOMER,FOODDEV}-setup/error-context.md`.
- Không có video/trace của ca lỗi kết nối vì project setup đang tắt video/trace theo cấu hình hiện có; 69 ca desktop chưa khởi chạy nên không sinh video/trace.
- `npx tsc --noEmit`: PASS, exit 0; log `/home/dawn/work/ticket/.cache/e2e/s7-tsc.log`.
- `npx eslint playwright.config.ts e2e/fooddev-v2/helpers.ts e2e/fooddev-pack/fooddev-pack.spec.ts e2e/fooddev-set/fooddev-set.spec.ts e2e/rbac/rbac.spec.ts`: PASS, exit 0; log `/home/dawn/work/ticket/.cache/e2e/s7-eslint.log`. Đây là kiểm tra baseline, chưa có thay đổi TypeScript.

## Files changed

- `.aidlc/runs/PORTAL-E2E-VIDEO-001/handback.md`: ghi kết quả S7, blocker và phần chưa làm. Các thay đổi có sẵn ngoài phạm vi được giữ nguyên.

## Left over

- Cần coordinator khôi phục DEV `http://127.0.0.1:3003`; đã gửi escalation và câu hỏi qua Orca. Brief cấm worker tự khởi động lại server.
- Chưa thực hiện bốn nhóm REQUIRED: data.setup và project data, dữ liệu bộ Món qua helpers, bộ Gói/Set chọn danh sách, RBAC tạo SALES mới và tìm qua phân trang.
- Cần xem lại whitelist trước khi sửa lỗi test khác: `e2e/fooddev-v2/fooddev-v2.spec.ts:42-70` luôn tạo `me chua`, đòi 201, sau đó kiểm tên trùng trả 409. Khi chạy lại trên DEV còn dữ liệu cũ, tên cố định có thể gây 409 ngay lần tạo đầu. Sửa literal tên và assert liên quan cần file ngoài whitelist; chưa xác minh trên DEV do mất kết nối. Brief yêu cầu cần file khác thì dừng và ghi Left over.
- Sau khi xử lý blocker: chạy baseline đủ ca để phân loại lỗi test/lỗi chức năng, hoàn thành sửa trong phạm vi được duyệt, chạy riêng nhóm, rồi chạy toàn bộ ghi hình và giữ video/trace cho ca còn đỏ. Chưa có cơ sở khẳng định 69 ca xanh.

Tier 1: tsc PASS · eslint PASS · e2e cũ 0/69 PASS
