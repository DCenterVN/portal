# CI-GREEN — portal: test không đọc repo khác

Trạng thái: DONE · Repo: portal · Nhánh `fix/CI-GREEN` (worktree `ticket/.cache/worktrees/portal-ci-green`).

## CONTEXT
- CI chỉ checkout portal. `lib/api/supplier-contract-bff.test.ts` đọc `../inventory/api/openapi.public.yaml` và `../inventory/api/permissions.json` → ENOENT, 3 test đỏ.
- Portal giữ bản sao hợp đồng ở `lib/contracts/` (`inventory.public.yaml`, xem `lib/contracts/README.md`). `permissions.json` của service sinh từ `x-action-key` trong openapi.

## REQUIRED
1. Test chỉ đọc file trong portal: kiểm action key ↔ operation bằng `x-action-key`/`operationId` trong `lib/contracts/inventory.public.yaml`, giữ nguyên ý nghĩa assertion.
2. Phép so bản sao với `../inventory` (dòng ~20): bỏ khỏi unit test; nếu README contracts đã có lệnh đồng bộ/kiểm drift thì dẫn tới đó, không thì ghi câu hỏi. Không thêm script mới.
3. Grep toàn portal (`*.test.ts*`, trừ e2e) chỗ nào khác đọc `../<repo>/`; sửa cùng cách và liệt kê.

## CONSTRAINT
- Chỉ portal worktree. Không commit, push, stash. Không comment trong code. Không thêm dependency. Không /tmp.

## ACTION
1. Đọc test, `lib/contracts/README.md`.
2. Sửa. Kiểm (node_modules có sẵn, `TMPDIR=/home/dawn/work/ticket/.cache`): `npx --no-install vitest run lib/api/supplier-contract-bff.test.ts`, rồi chạy thử với thư mục `../inventory` không tồn tại (ví dụ đặt `cwd` copy? nếu khó, chỉ cần chứng minh bằng grep không còn `../`), `npx --no-install tsc --noEmit`, `npm run lint`.

## OUTPUT
- File này: DONE + "Kết quả" (file đổi, lệnh + kết quả). Câu hỏi ghi cuối.

## Kết quả

- `lib/api/supplier-contract-bff.test.ts`: chỉ đọc `lib/contracts/inventory.public.yaml`; kiểm `operationId` và `x-action-key` trong cùng khối HTTP operation cho taxonomy, đính kèm chứng từ và ba thao tác ảnh NCC. Giữ nguyên assertion `OPERATIONS` và các test BFF. Bỏ phép so bytes với repo inventory khỏi unit test.
- `docs/tasks/CI-GREEN.md`: cập nhật trạng thái, bằng chứng kiểm tra và câu hỏi còn lại.
- Đã rà toàn portal bằng `rg -n '\.\./' --glob '*.test.ts' --glob '*.test.tsx' --glob '!e2e/**'`. Không còn test đọc `../<repo>/`; các kết quả còn lại là import nội bộ, dữ liệu kiểm thử và URL. Không có file khác cần sửa theo mẫu đường dẫn này.
- `lib/contracts/README.md` đã nêu `uigen.py operations --write` để sinh operations trong workspace đủ service. Đây không phải lệnh đồng bộ/kiểm drift snapshot, nên chưa có lệnh phù hợp để dẫn tới. Không thêm script.
- Các lệnh dùng `TMPDIR=/home/dawn/work/ticket/.cache`. Dùng `pnpm exec`/`pnpm run` tương đương các lệnh npx/npm trong ACTION theo quy định package manager tại `AI_CONTEXT.md`; không cài dependency.
- `pnpm exec vitest run lib/api/supplier-contract-bff.test.ts`: PASS, 14/14 test.
- Chạy cùng lệnh trong bản sao `/home/dawn/work/ticket/.cache/portal-ci-green-qfzr1cf3/portal`, xác nhận thư mục `../inventory` không tồn tại: bản test trước sửa FAIL đúng 3 test với ENOENT, bản sau sửa PASS 14/14. Không thay đổi symlink inventory của workspace.
- Trong bản sao, đổi riêng action key của `listMaterialCategories` từ read sang update: FAIL đúng test taxonomy. Khôi phục snapshot sau phép thử. Log tại `/home/dawn/work/ticket/.cache/portal-ci-green-qfzr1cf3/before.log` và `wrong-action.log`.
- `pnpm exec tsc --noEmit`: PASS, exit 0.
- `pnpm run lint`: PASS, exit 0 sau khi sửa regex theo `no-regex-spaces`.
- `git diff --check`: PASS. Không commit, push, stash; không dùng `/tmp` cho cache/file tạm.

## Câu hỏi

- Lệnh chuẩn để đồng bộ và kiểm drift `lib/contracts/inventory.public.yaml` với nguồn inventory là gì? README hiện chỉ mô tả nguồn và lệnh sinh operations.
- Rà thêm thấy `lib/permission-labels.test.ts` đọc `${homedir()}/work/ticket/org/api/role-templates.yaml`, có `skipIf` khi thiếu file. Đây là đường dẫn tuyệt đối ngoài mẫu `../<repo>/` trong REQUIRED 3, giữ nguyên trong lượt này. Portal chưa có snapshot role templates tương ứng; nên đưa snapshot này vào portal hay tách kiểm tra đó khỏi unit test? Vì vậy chưa thể khẳng định toàn bộ unit suite chỉ đọc portal.
