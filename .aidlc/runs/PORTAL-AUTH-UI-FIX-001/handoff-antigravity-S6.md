# Handoff Antigravity — PORTAL-AUTH-UI-FIX-001 S6 (skin + hiệu ứng)

## CONTEXT
- Repo: `~/wt/auth-rbac-001/portal`, nhánh `auth-rbac-001`, HEAD `6c40f32`. Plan: `.aidlc/runs/PORTAL-AUTH-UI-FIX-001/plan.md` (đọc FR-4, FR-5, mục UX, slice S6).
- Logic đã xong và kiểm live (S1–S5, receipt `artifacts/verification.json` PASS 6 check): đăng xuất mọi khung, BFF redirect + lỗi phân biệt, form login/đăng ký/login nhân viên, bảng ma trận role × CRUDIE.
- Dawn chê UI "AI đại trà". Nguồn design: canvas `claude.ai/artifact/XuyqU2bzEpihN9Cb4sfqx4` (đã chốt), brand đỏ cà chua, 1 màu chính, neutral pha màu, glass chỉ ở hero/L2-L3, tham chiếu tutitor.com.
- Đang chạy sẵn: portal `http://localhost:3000` (next dev --webpack từ worktree này), Kong `localhost:8000`. Tài khoản QA (pass `REDACTED`): customer.s9@e2e.test, employee.s9@e2e.test, newowner.44186658@e2e.test (OWNER), padmin.44186658@e2e.test (superadmin). Đăng nhập dồn dập → 429.

## REQUIRED
Skin theo canvas + hiệu ứng theo token cho 4 file của S6:
1. `features/customer-auth/login-form.tsx`, `features/customer-auth/register-form.tsx`, `features/employee-auth/staff-login.tsx`: bố cục, typography, trạng thái lỗi/đếm ngược 429/chưa kích hoạt đúng canvas; rung nhẹ khi lỗi.
2. `features/platform/role-matrix-view.tsx`, sửa 3 chỗ lệch plan:
   - chọn role bằng `Segmented` (hiện đang là Select), theo AC-10;
   - mobile 390: **không cuộn ngang**, mỗi tài nguyên 1 hàng 6 chip CRUDIE bấm được (hiện đang là Table cuộn ngang), theo mục UX;
   - cột "Khác" chỉ đọc cho key ngoài CRUDIE (hiện bị ẩn; khi lưu vẫn giữ nguyên), theo AC-10;
   - hiệu ứng: hover hàng, chuyển trạng thái checkbox, thanh "Lưu thay đổi" dính đáy trượt lên khi có thay đổi.

## CONSTRAINT
- KHÔNG đổi logic: gọi API, payload PUT, điều kiện bật nút lưu, cách đọc `?redirect`, chuỗi lỗi theo status. Muốn đổi thì dừng và hỏi.
- KHÔNG sửa file trong `frame.lock.json` (components/ui/*, components/layout/*, app/globals.css…). Chỉ dùng token và component có sẵn. Không thêm thư viện.
- Không viết test mới. `npm` (không pnpm). Chạy `npm test` toàn bộ (không `npm test -- path`, sẽ PASS giả). Nếu vitest lỗi esbuild: `ESBUILD_BINARY_PATH=~/.local/share/esbuild/esbuild-0.21.5`.
- Không push, không merge, không approve. Không tắt Kong/portal/container.

## ACTION
1. Mở canvas + 4 màn đang chạy, ghi chỗ lệch.
2. Sửa 4 file, xem lại ở 1440 và 390.
3. `npm run lint && npm run typecheck && npm test` xanh (`app/frame-lock.test.ts`, `app/ui-rules-gate.test.ts` phải xanh).
4. Commit `style(portal): auth + role matrix skin per canvas (PORTAL-AUTH-UI-FIX-001 S6)`.

## OUTPUT
- SHA commit, danh sách file, kết quả lint/typecheck/test (số pass/fail).
- 4 cặp ảnh trước/sau (1440 + 390) lưu ở `.aidlc/runs/PORTAL-AUTH-UI-FIX-001/anti/s6/`.
- Chỗ nào chưa khớp canvas và lý do.
