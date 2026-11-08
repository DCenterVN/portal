# FC-3B — Dấu khoá ADMIN + mô tả CUSTOMER ở màn Vai trò

Trạng thái: DONE (đã sửa; build và xác minh đầy đủ bị chặn, xem Kết quả) · Repo: portal · Nhánh `feat/FC-1` (worktree `ticket/.cache/worktrees/portal-fc1`) · Sau: FC-3 (`docs/tasks/FC-3.md`).

## CONTEXT
- Video e2e 08/11 (`ticket/.cache/video-nghiep-vu/08-chi-nhanh-phan-quyen/fc1/03-roles-order-desc.png`) cho thấy 2 lỗi ở `/roles`:
  1. ADMIN (`protected: true` trong catalog `GET /org/company/roles`) không có dấu khoá; FC-3 chỉ dùng `protected` cho cảnh báo/lọc.
  2. CUSTOMER hiện mô tả mặc định "Vai trò tuỳ chỉnh" (`features/roles/roles-view.tsx:94`) dù DB org có mô tả CUSTOMER (sort_order 60). Chưa rõ catalog có trả CUSTOMER không, hay danh sách vai trò bên trái lấy từ nguồn khác catalog.
- Org dev đã chạy migration `20261108000002` (roles.sort_order, description). Kong đã có route `/org/company` và `/org/company/roles`.

## REQUIRED
1. Vai trò `protected` hiện icon khoá (lucide `Lock`, cỡ như icon khác trong thẻ) cạnh tên ở danh sách vai trò `/roles`, kèm `aria-label`/title "Vai trò được bảo vệ".
2. Tìm nguyên nhân CUSTOMER thiếu mô tả: ghi vào Kết quả request nào, response có CUSTOMER không. Sửa ở portal nếu lỗi nằm ở portal. Nếu org không trả CUSTOMER (vd lọc theo `branch_types`) → không sửa org; ghi câu hỏi, và ở portal: vai trò không có trong catalog thì không hiện câu bịa "Vai trò tuỳ chỉnh" — để trống mô tả.
3. Sửa test cũ theo hành vi mới; thêm đúng 1 test cho icon khoá.
4. Siết `e2e/fc1/fc1.spec.ts` bước 03: kiểm thật icon khoá ở ADMIN và mô tả CUSTOMER không phải "Vai trò tuỳ chỉnh".

## CONSTRAINT
- Chỉ portal, worktree trên. Không commit, push, stash. Không comment trong code. File ≤400 dòng. Không thêm dependency. Dùng lại component/icon có sẵn.
- Không đổi màn khác.

## ACTION
1. Đọc `AGENTS.md`, `docs/tasks/FC-3.md`, `features/roles/`, `lib/role-catalog.ts`, `lib/api/company-bff.ts`.
2. Làm REQUIRED 1→4.
3. Chạy (node_modules đã có trong worktree): `npx vitest run --exclude "e2e/**"`, `npx tsc --noEmit`, `npm run lint`, `npx next build --webpack`.

## OUTPUT
- File này: trạng thái DONE + mục "Kết quả" (file đổi, lệnh + số pass/fail, nguyên nhân CUSTOMER). Câu hỏi chưa rõ ghi cuối file, không tự đoán.

## Kết quả

- `features/roles/roles-view.tsx`: hiện lucide `Lock` cạnh tên khi catalog có `protected: true`, `size-4`, `aria-label="Vai trò được bảo vệ"`. Mô tả chỉ lấy từ catalog; thiếu thì trống.
- `features/roles/roles-view.test.tsx`: thêm đúng 1 test render, kiểm icon khoá có nhãn và chỉ nằm ở vai trò protected, giữ mô tả catalog, để trống khi thiếu catalog và không có câu mặc định. Test đỏ trước sửa, xanh sau sửa.
- `e2e/fc1/fc1.spec.ts`: bước 03 bắt buộc ADMIN có `svg.lucide-lock` với nhãn bảo vệ hiển thị; CUSTOMER phải tồn tại và mô tả không phải "Vai trò tuỳ chỉnh". Bỏ điều kiện sidebar luôn đúng. Đổi tên biến cũ không dùng thành `_step4Error` để lint pass; giữ nguyên hành vi bước 04.
- `docs/tasks/FC-3B.md`: ghi kết quả và câu hỏi cho org. Không sửa backend, dependency hay màn khác. Không commit, push, stash.

### Nguyên nhân CUSTOMER

- Bằng chứng từ trace video 08/11 đã có, không phải request mới trong phiên này: `/home/dawn/work/ticket/.cache/video-nghiep-vu/08-chi-nhanh-phan-quyen/fc1/fc1-FC-1-FC-3-—-Chi-nhánh-Phân-quyền-desktop/trace.zip`.
- `GET http://localhost:3002/api/org/company/roles` trả HTTP 200, envelope `data.items` chỉ có ADMIN, FOOD_DEV, WAREHOUSE, PROCESSING_STAFF, SALES; không có CUSTOMER trong cả 5 response catalog của trace. ADMIN có `protected: true` và mô tả đầy đủ.
- `GET http://localhost:3002/api/org/company/role-matrix` trả HTTP 200, `data` có ADMIN, CUSTOMER, FOOD_DEV, PROCESSING_STAFF, SALES, WAREHOUSE trong cả 4 response ma trận.
- `RolesView` lấy tập vai trò từ ma trận, sắp theo catalog rồi nối mã ngoài catalog. `companyRoles()` giữ mọi phần tử catalog, BFF chuyển tiếp `/org/company/roles`, không lọc CUSTOMER ở portal. Vì catalog thiếu CUSTOMER, câu fallback trong view tạo ra mô tả bịa. Đã bỏ fallback; CUSTOMER vẫn hiện với mô tả trống.
- Bản trích 9 response chỉ gồm dữ liệu vai trò: `/home/dawn/work/ticket/.cache/fc-3b/catalog-evidence.json`. Chưa xác định vì sao org loại CUSTOMER; không suy diễn là do `branch_types`.

### Kiểm tra

Các lệnh dùng `TMPDIR=/home/dawn/work/ticket/.cache`; `npx --no-install` dùng binary đã cài. Log ở `/home/dawn/work/ticket/.cache/fc-3b/`.

| Lệnh | Kết quả |
|---|---|
| `npx --no-install vitest run features/roles/roles-view.test.tsx --exclude 'e2e/**'` | PASS: 1/1 test; trước sửa FAIL 1/1 do thiếu icon. |
| `npx --no-install vitest run features/roles/roles-view.test.tsx lib/role-catalog.test.ts features/platform/role-matrix.test.ts --exclude 'e2e/**'` | PASS: 3 file, 9/9 test liên quan vai trò. |
| `npx --no-install vitest run --exclude 'e2e/**'` | Ghi nhận 107 file, 1.666 test PASS, 0 FAIL được báo; suite `lib/api/activation-contract.test.ts` dùng Python qua `spawnSync` không kết thúc. Dừng bằng SIGINT, exit 130, không coi toàn bộ suite PASS. `vitest.log`. |
| Chạy lại cùng lệnh với `--maxWorkers=2 --minWorkers=1` | 106 file, 1.664 test PASS trước khi tiếp tục treo ở suite trên; dừng exit 130. `vitest-limited.log`. |
| `npx --no-install tsc --noEmit` | PASS, exit 0, 0 lỗi sau khi bổ sung `plane` vào provider của test mới. `tsc.log`. |
| `npm run lint` | PASS, exit 0, 0 lỗi sau khi đổi tên biến cũ trong e2e. `lint.log`. |
| `NEXT_TELEMETRY_DISABLED=1 npx --no-install next build --webpack` | FAIL, exit 1: `Could not parse output from TypeScript's --showConfig.` Gọi riêng helper Next xác nhận subprocess exit 0 nhưng stdout/stderr đều rỗng; gọi TypeScript trực tiếp xuất được JSON. Không đổi cấu hình build ngoài phạm vi. `build.log`. |
| `npx --no-install playwright test --config e2e/fc1/playwright.config.ts --list` | PASS, exit 0, nhận 1 test desktop. Chưa chạy lại hành vi e2e. `e2e-list.log`. |
| Khởi động Brave bằng Playwright | Bị chặn: `setsockopt: Operation not permitted (1)`; kết nối localhost cũng bị sandbox chặn. `browser.log`. |
| `git diff --check` | PASS. Các file code đổi đều dưới 400 dòng, không thêm comment. |

## Câu hỏi còn mở

- Org chủ đích loại CUSTOMER khỏi `GET /org/company/roles` hay đây là lỗi catalog? Nếu `/roles` cần mô tả CUSTOMER, org có thể trả metadata CUSTOMER trong catalog này không? Cần org xác nhận tiêu chí lọc; portal hiện giữ mô tả trống theo brief.
