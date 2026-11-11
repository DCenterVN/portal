# FLOW-PORTAL-001

Status: DONE · 2026-11-11

## CONTEXT

- Worktree `portal-flow-fix`, nhánh `feat/FLOW-PORTAL-001`, base `main` tại `6f207fb`.
- Plan: `platform-docs/planning/sprints/261110-flow-fix/plan.md` §2 D11, D12; audit A16, A17.
- Nút nấu gửi `role_code` thay vì `stage`; nút đóng gói gửi sản lượng kế hoạch làm sản lượng thực tế.

## REQUIRED

- Nút Bắt đầu nấu gửi công đoạn nấu theo contract backend.
- Nút Đóng gói mở Dialog với sản lượng thực tế để trống, kế hoạch tham chiếu, RHF + zod kiểm số nguyên ≥ 1.
- Gửi số thực nhập; lỗi API giữ Dialog và dữ liệu để thử lại.
- Bỏ mã VT trên nút và nhãn & Cấp đông; kiểm thử hồi quy, gate kiến trúc và frame lock.

## CONSTRAINT

- Chỉ sửa worktree portal; production chỉ đọc. Không lệnh git ghi, không dependency mới.
- View render; hook gọi API. Tái sử dụng `startOrder`, `completeOrder`, `run`, Dialog, Input, Button, Field.
- Không UUID trên UI, không thêm comment trong code. `TMPDIR=/home/dawn/work/ticket/.cache`.

## ACTION

- Contract xác nhận tại `production/internal/transport/http/orders.go:158`: body start chỉ nhận `stage`; dòng 164 lấy vai trò từ context, dòng 176 chuyển stage vào service.
- `production/internal/service/service.go:923–930`: chấp nhận `preparation` hoặc `cooking`, ánh xạ `cooking` sang COOKING.
- Test đỏ: 9/10 test flow thất bại, có bằng chứng request thực tế `{ role_code: "cooking" }` thay cho `{ stage: "cooking" }`.
- API và hook gửi `stage: "cooking"`, bỏ role_code khỏi body start. Hook giữ state Dialog và form, tái sử dụng run trả kết quả thành công để chỉ đóng sau khi API thành công.
- View render Dialog, nhãn Sản lượng thực tế (hộp), kế hoạch tham chiếu, lỗi trường và nút xác nhận. Chặn đóng trong lúc gửi; lỗi API qua toast, giữ số nhập.
- Test dùng bộ điều khiển RHF thật và zod resolver, gọi handler của view rồi kiểm request API: rỗng/0/âm/số lẻ bị chặn; kế hoạch 2 nhập 3 gửi 3; lỗi API giữ form và thử lại thành công; quyền cập nhật vẫn được kiểm tra.
- Điều chỉnh test nhãn cũ trong `app/rebrand.test.ts` để kiểm nút theo nhãn mới.

## OUTPUT

- Sửa `lib/api/production.ts`, `features/production/use-production-orders.ts`, `features/production/orders-view.tsx`, `app/rebrand.test.ts`.
- Thêm `features/production/orders-flow.test.tsx` và task này.
- `pnpm vitest run`: PASS, 120 file, 1790 test; gồm `app/*.test.ts` và 10 test flow mới. Không treo, không bỏ qua test vì sandbox.
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `node scripts/frame-lock.mjs`: PASS, khớp 97 file; không cần `--write`.
- Vitest có cảnh báo sẵn về `PORTAL_CLIENT_IP_SOURCE` và next-intl `timeZone`; không có test lỗi.
- Chưa kiểm thử trình duyệt/DEV. Không commit, push hoặc thay đổi production.
