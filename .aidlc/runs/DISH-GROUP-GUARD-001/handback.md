## Done

- S1 đã sửa AC-1/AC-2: nhóm thiếu, null, chuỗi rỗng hoặc mã không có trong cây trả lỗi `sku_ref` theo dòng với đúng thông báo đã duyệt; dòng lỗi không thêm ngăn vào `slots`.
- Cột Ngăn hiện `Chưa có nhóm` khi nhóm không hợp lệ.
- TDD: viết 2 test mới trước khi sửa. Lần đỏ: 149/151 test đạt, đúng 2 test mới thất bại vì thiếu lỗi `sku_ref`.
- Lần xanh: 225/225 test đạt, 8/8 file đạt, gồm 40/40 test validator và 151/151 test trong `lib/dishes`.
- Các lệnh kiểm tra cuối đều exit 0:
  - `ESBUILD_BINARY_PATH=$HOME/.local/share/esbuild/esbuild-0.21.5 npx vitest run lib/dishes features/production --no-cache`
  - `npm run typecheck`
  - `node node_modules/eslint/bin/eslint.js lib/dishes features/production`
  - `git diff --check`

## Files changed

- `lib/dishes/validate-dish.ts`: kiểm nhóm trước khi gọi `slots.add(slotOf(...))`.
- `lib/dishes/validate-dish.test.ts`: thêm 2 ca hồi quy, kiểm lỗi theo dòng và việc không tính ngăn cho dòng lỗi.
- `features/production/dishes/dish-ingredients-view.tsx`: kiểm nhóm trong cây trước khi hiển thị nhãn ngăn.
- `.aidlc/runs/DISH-GROUP-GUARD-001/handback.md`: bàn giao theo brief.

## Decisions

- Giữ nguyên chữ ký và hành vi `slotOf`; đặt luật tại validator dùng chung cho client/BFF.
- Không thêm helper, không xóa hoặc nới test cũ.
- Dùng `--no-cache` vì lần chạy đỏ gặp thêm lỗi ghi `node_modules/.vite/vitest/results.json` trên filesystem chỉ đọc. Không dùng `/tmp`.
- Giữ nguyên `node_modules` untracked đã có trước khi làm.
- SHA commit mới: chưa có, commit bị chặn bởi filesystem chỉ đọc.
- SHA HEAD gốc: `d0a67149f88632b1dcbc47354a2cf8f0016e360f`.

## Left over

- Chưa stage/commit được. `git add` và `git commit` đều trả lỗi `fatal: Unable to create '/home/dawn/work/ticket/portal/.git/worktrees/portal-dish-guard/index.lock': Read-only file system`.
- Khi Git metadata ghi được, commit 3 file sửa và handback với message `fix(portal): chặn hoàn tất món khi nguyên liệu không có nhóm hợp lệ (DISH-GROUP-GUARD-001)`, không thêm `Co-Authored-By`, rồi ghi nhận SHA thực tế.
