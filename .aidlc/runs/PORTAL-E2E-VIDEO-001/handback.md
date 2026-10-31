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
