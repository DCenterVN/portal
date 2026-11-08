# FC-3C — Ẩn vai trò ngoài catalog (CUSTOMER) ở màn Vai trò

Trạng thái: DONE · Repo: portal · Nhánh `feat/FC-3C` (worktree `ticket/.cache/worktrees/portal-fc3c`) · Sau: FC-3B (`docs/tasks/FC-3B.md`).

## CONTEXT
- FC-3B: `GET /org/company/roles` (catalog) trả 5 vai trò công ty, không có CUSTOMER; `role-matrix` có thêm CUSTOMER. Theo ADR-024 khách hàng không phải thành viên công ty → không phải vai trò công ty.
- Dawn chốt 08/11: `/roles` không hiện CUSTOMER.
- `features/roles/roles-view.tsx:41`: `roles` = mã trong catalog (theo thứ tự) + mã ngoài catalog từ ma trận.

## REQUIRED
1. Khi catalog đã tải: `/roles` chỉ hiện vai trò có trong catalog, theo thứ tự catalog. Khi catalog chưa có (undefined): giữ hành vi cũ.
2. Sửa test `features/roles/roles-view.test.tsx` theo hành vi mới (vai trò ngoài catalog không hiện). Không thêm test mới.
3. `e2e/fc1/fc1.spec.ts` bước 03: thứ tự 5 vai trò ADMIN FOOD_DEV WAREHOUSE PROCESSING_STAFF SALES, đúng 5 label, không có "Khách hàng"; giữ kiểm dấu khoá ADMIN. Đổi tiêu đề bước cho khớp.

## CONSTRAINT
- Chỉ portal, worktree trên. Không commit, push, stash. Không comment trong code. File ≤400 dòng. Không thêm dependency. Không đổi màn khác.

## ACTION
1. Đọc `AGENTS.md`, `features/roles/roles-view.tsx`, test, `e2e/fc1/fc1.spec.ts` bước 03.
2. Làm REQUIRED 1→3.
3. Chạy (node_modules có sẵn; `TMPDIR=/home/dawn/work/ticket/.cache`): `npx --no-install vitest run features/roles --exclude "e2e/**"`, `npx --no-install tsc --noEmit`, `npm run lint`. Không cần chạy full suite/build/e2e (Opus chạy ngoài sandbox).

## OUTPUT
- File này: trạng thái DONE + "Kết quả" (file đổi, lệnh + số pass/fail). Câu hỏi chưa rõ ghi cuối file.

## Kết quả
- `features/roles/roles-view.tsx`: khi catalog đã tải, chỉ lấy các mã trong catalog có trong ma trận, theo thứ tự catalog; khi catalog undefined, giữ danh sách ma trận sắp xếp như cũ. Vai trò đang chọn phải thuộc danh sách hiển thị, tránh giữ CUSTOMER khi catalog tải xong.
- `features/roles/roles-view.test.tsx`: sửa test hiện có, không thêm test; kiểm đúng 2 label theo thứ tự catalog, không có Khách hàng, giữ kiểm dấu khoá ADMIN và mô tả trống.
- `e2e/fc1/fc1.spec.ts`: bước 03 yêu cầu đúng 5 label ADMIN FOOD_DEV WAREHOUSE PROCESSING_STAFF SALES, không có Khách hàng; giữ kiểm dấu khoá ADMIN và đổi tiêu đề bước.
- `docs/tasks/FC-3C.md`: cập nhật DONE và kết quả kiểm tra.
- Các lệnh kiểm tra dùng `TMPDIR=/home/dawn/work/ticket/.cache` và `npm_config_cache=/home/dawn/work/ticket/.cache/npm`.
- `npx --no-install vitest run features/roles --exclude "e2e/**"`: trước sửa code, 0 pass / 1 fail vì nhận 3 label thay vì 2; sau sửa, 1 pass / 0 fail, 1 test file pass.
- `npx --no-install tsc --noEmit`: PASS, exit 0, 0 lỗi.
- `npm run lint`: PASS, exit 0, 0 lỗi / 0 cảnh báo.
- `git diff --check`: PASS. Các file thay đổi đều dưới 400 dòng. Không thêm dependency hoặc comment trong code; không commit, push, stash.
- Chưa chạy full suite, build hoặc e2e theo brief. Tiếp theo: Opus chạy e2e ngoài sandbox.
- Câu hỏi chưa rõ: không có.
