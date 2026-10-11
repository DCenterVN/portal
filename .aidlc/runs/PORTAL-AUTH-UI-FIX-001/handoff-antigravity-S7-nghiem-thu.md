# Handoff Antigravity — PORTAL-AUTH-UI-FIX-001 S7 (nghiệm thu UI, không code)

Chạy SAU khi S6 đã commit.

## CONTEXT
- Repo: `~/wt/auth-rbac-001/portal`, nhánh `auth-rbac-001`. Plan: `.aidlc/runs/PORTAL-AUTH-UI-FIX-001/plan.md`, AC-1 đến AC-15.
- Portal `http://localhost:3000`, Kong `localhost:8000` (container `dcentervn-local-api-gateway-1`). Trình duyệt: Brave (Playwright MCP trỏ Brave, không có Chrome).
- Tài khoản QA (pass `REDACTED`): khách customer.s9@e2e.test; nhân viên employee.s9@e2e.test; OWNER newowner.44186658@e2e.test; superadmin padmin.44186658@e2e.test. Đăng nhập dồn dập → 429, giữ nhịp người.
- Bằng chứng live bằng curl đã có: `evidence/live.sh`, `evidence/e2e.sh`. Việc của bạn là xác nhận bằng mắt và bằng thao tác trên trình duyệt.

## REQUIRED
Bấm thật trên Brave, mỗi ô ghi PASS/FAIL kèm ảnh:
1. AC-1/2: đăng xuất ở menu avatar khách, `/console`, `/platform/companies`, `/company`. Sau đó vào `/cart` (khách) hoặc `/console` (nhân viên) phải bị chuyển sang trang đăng nhập đúng loại.
2. AC-4/5: form login khách mở ra không có câu lỗi; sai mật khẩu báo "sai thông tin"; user chưa kích hoạt (`unact.*@e2e.test` trong DB dev, hoặc đăng ký mới) báo chưa kích hoạt + link gửi lại.
3. AC-6: chưa đăng nhập vào `/cart` → login → quay về `/cart`.
4. AC-7: đăng ký → màn "Kiểm tra email" + nút gửi lại (mail ở mailpit).
5. AC-8: login nhân viên bằng tài khoản khách → báo không phải nhân viên + link `/login`.
6. AC-10/11: superadmin vào ma trận, chọn 1 role, tick 1 ô → thanh lưu hiện → Lưu → toast; tải lại trang thấy đã lưu; **bỏ tick về như cũ và Lưu lại** (không để lệch dữ liệu dev). Đổi role khi chưa lưu → có hộp xác nhận.
7. AC-12/13: OWNER vào `/company` thấy ma trận chỉ đọc (checkbox khoá, không nút lưu); `/roles` chuyển sang `/company`.
8. AC-15: chụp 5 màn (login khách, đăng ký, login nhân viên, ma trận platform, menu avatar) ở 1440 và 390, đặt cạnh canvas `claude.ai/artifact/XuyqU2bzEpihN9Cb4sfqx4`, ghi chỗ lệch.

## CONSTRAINT
- KHÔNG sửa code. Thấy lỗi thì ghi lại (bước tái hiện, ảnh, URL, status), không tự vá.
- KHÔNG viết script tự động thay thao tác người. Mỗi ô PASS phải có dòng log Kong tương ứng: `docker logs dcentervn-local-api-gateway-1 --since <giờ> | grep <path>`, dán method/path/status. Không có log khớp thì không được ghi PASS.
- Không push, không tắt stack.

## ACTION
1. Đọc AC trong plan.
2. Bấm 8 mục trên, chụp ảnh, đối chiếu log Kong.
3. Viết `.aidlc/runs/PORTAL-AUTH-UI-FIX-001/anti-walkthrough.md`, ảnh ở `anti/s7/`.

## OUTPUT
`anti-walkthrough.md`:
- bảng mục 1–8 × (PASS/FAIL, ảnh, dòng log Kong);
- danh sách lỗi (mức Chặn / Nên / Tuỳ);
- chỗ lệch canvas để Dawn comment.
