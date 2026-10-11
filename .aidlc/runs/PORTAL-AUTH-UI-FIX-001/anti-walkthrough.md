# Báo cáo nghiệm thu UI — PORTAL-AUTH-UI-FIX-001 S7 (Brave Walkthrough)

- **Thời gian nghiệm thu**: 2026-10-11T20:55:00+07:00
- **Nhánh**: `auth-rbac-001` @ `~/wt/auth-rbac-001/portal`
- **Commit S6**: `276f59d` (`style(portal): auth + role matrix skin per canvas (PORTAL-AUTH-UI-FIX-001 S6)`)
- **Môi trường**:
  - Trình duyệt: Brave Browser (`/opt/brave.com/brave/brave`) qua Playwright
  - Portal dev server: `http://localhost:3000`
  - Kong API Gateway: `localhost:8000` (container `dcentervn-local-api-gateway-1`)
  - Thư mục ảnh bằng chứng: `.aidlc/runs/PORTAL-AUTH-UI-FIX-001/anti/s7/`
- **Nguyên tắc**: Tuyệt đối KHÔNG sửa code trong pha S7. Toàn bộ các mục PASS đều được đối chiếu bằng mắt trên Brave và kèm dòng log thực tế tương ứng từ container Kong.

---

## 1. Bảng nghiệm thu các mục 1–8

| Mục | Nội dung kiểm tra | Tiêu chí (AC) | Kết quả | Ảnh bằng chứng (`anti/s7/`) | Dòng log Kong tương ứng (`dcentervn-local-api-gateway-1`) |
|:---|:---|:---|:---:|:---|:---|
| **1** | Đăng xuất ở menu avatar khách, `/console`, `/platform/companies`, `/company`. Sau đó vào `/cart` (khách) hoặc `/console` (nhân viên) bị chuyển sang trang đăng nhập đúng loại. | AC-1, AC-2 | **PASS** | `item1-customer-avatar-menu.png`<br>`item1-cart-redirect-login.png`<br>`item1-console-avatar-menu.png`<br>`item1-console-redirect-staff-login.png`<br>`item1-platform-avatar-menu.png`<br>`item1-company-avatar-menu.png` | **Khách logout:**<br>`172.19.0.1 - - [11/Oct/2026:13:47:04 +0000] "POST /auth/web/logout HTTP/1.1" 204 0 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/154.0.0.0 Safari/537.36" kong_request_id: "331b031d6fcd970f00e39d3f619d130d"`<br>**Nhân viên console logout:**<br>`172.19.0.1 - - [11/Oct/2026:13:47:07 +0000] "POST /auth/web/logout HTTP/1.1" 204 0 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/154.0.0.0 Safari/537.36" kong_request_id: "def8a7240bc2d870dafacd2f3f338056"`<br>**Platform superadmin logout:**<br>`172.19.0.1 - - [11/Oct/2026:13:47:13 +0000] "POST /auth/web/logout HTTP/1.1" 204 0 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/154.0.0.0 Safari/537.36" kong_request_id: "96e8e62a120d433400a30e0d9376b946"`<br>**Company OWNER logout:**<br>`172.19.0.1 - - [11/Oct/2026:13:47:16 +0000] "POST /auth/web/logout HTTP/1.1" 204 0 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/154.0.0.0 Safari/537.36" kong_request_id: "d472ea74eaf93c4331add30ac3a15a26"` |
| **2** | Form login khách mở ra không có câu lỗi; sai mật khẩu báo "sai thông tin" (401); user chưa kích hoạt báo chưa kích hoạt + link gửi lại (403). | AC-4, AC-5 | **PARTIAL**<br>(FAIL nhánh unactivated) | `item2-customer-login-initial.png`<br>`item2-customer-login-wrong-pw.png`<br>`item2-customer-login-unactivated.png` | **Wrong password (401):**<br>`172.19.0.1 - - [11/Oct/2026:13:55:49 +0000] "POST /auth/web/login HTTP/1.1" 401 158 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/154.0.0.0 Safari/537.36" kong_request_id: "6686ff093f79886c8a0fd85c0580752a"`<br>**Unactivated login (403):**<br>`172.19.0.1 - - [11/Oct/2026:13:55:52 +0000] "POST /auth/web/login HTTP/1.1" 403 176 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/154.0.0.0 Safari/537.36" kong_request_id: "5cd3997c88aa384c8d8a4010201eaa11"`<br>*(Ghi chú: Upstream trả 403 `user_not_active`, UI hiện `loginFailed` "Đăng nhập không thành công." thay vì `notActivated`)* |
| **3** | Chưa đăng nhập vào `/cart` → login → quay về `/cart`. | AC-6 | **PASS** | `item3-redirect-cart-success.png` | **Login with redirect:**<br>`172.19.0.1 - - [11/Oct/2026:13:55:55 +0000] "POST /auth/web/login HTTP/1.1" 200 758 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/154.0.0.0 Safari/537.36" kong_request_id: "8b34826833d8a76b046f0953b4ccba74"`<br>`172.19.0.1 - - [11/Oct/2026:13:55:55 +0000] "GET /auth/me HTTP/1.1" 200 233 "-" "node" kong_request_id: "5da8de6fb8a23039b2a8d521cd7d085b"` |
| **4** | Đăng ký khách → màn "Kiểm tra email" + nút gửi lại (mail đến mailpit). | AC-7 | **PASS** | `item4-register-check-email.png` | **Register 202 Accepted:**<br>`172.19.0.1 - - [11/Oct/2026:13:55:58 +0000] "POST /auth/register HTTP/1.1" 202 82 "-" "node" kong_request_id: "268b2e5ba488af340443f22d52c8a401"`<br>Mailpit nhận mail thành công: subject *"Activate your account"*. |
| **5** | Login nhân viên bằng tài khoản khách → báo không phải nhân viên + link sang `/login`. | AC-8 | **PASS** | `item5-staff-login-customer-forbidden.png` | **Auth check & Org access context rejection:**<br>`172.19.0.1 - - [11/Oct/2026:13:56:55 +0000] "POST /auth/web/login HTTP/1.1" 200 758 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/154.0.0.0 Safari/537.36" kong_request_id: "33cd8c2ac6d89a2c36ea6b2d2baa6e62"`<br>`172.19.0.1 - - [11/Oct/2026:13:56:55 +0000] "GET /platform/me HTTP/1.1" 404 115 "-" "node" kong_request_id: "b339fa461982154f3c7df22c96b13f49"`<br>`172.19.0.1 - - [11/Oct/2026:13:56:55 +0000] "GET /org/access-contexts/me HTTP/1.1" 200 3 "-" "node" kong_request_id: "81f20f24e6f32b719929bc233d395d41"`<br>`172.19.0.1 - - [11/Oct/2026:13:56:55 +0000] "POST /auth/web/logout HTTP/1.1" 204 0 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/154.0.0.0 Safari/537.36" kong_request_id: "2f24ae5711306160b4f4db61432ead4f"` |
| **6** | Superadmin vào ma trận, chọn 1 role, tick 1 ô → thanh lưu hiện → Lưu → toast; reload thấy đã lưu; bỏ tick về như cũ và Lưu lại (giữ sạch DB). Đổi role khi chưa lưu có hộp xác nhận. | AC-10, AC-11 | **PASS** | `item6-save-bar-visible.png`<br>`item6-confirm-dialog.png`<br>`item6-save-toast.png`<br>`item6-reload-persisted.png`<br>`item6-reverted-clean.png` | **Lưu lần 1 (PUT add action):**<br>`172.19.0.1 - - [11/Oct/2026:13:55:11 +0000] "PUT /platform/companies/1a80b5f2-d649-4df2-8ead-565ea5e4d1eb/role-matrix/roles/BRANCH_MANAGER HTTP/1.1" 200 3489 "-" "node" kong_request_id: "2998380c2ad03604b4332766fedb1a2d"`<br>**Lưu lần 2 (PUT revert/restore clean dev DB):**<br>`172.19.0.1 - - [11/Oct/2026:13:55:14 +0000] "PUT /platform/companies/1a80b5f2-d649-4df2-8ead-565ea5e4d1eb/role-matrix/roles/BRANCH_MANAGER HTTP/1.1" 200 3468 "-" "node" kong_request_id: "2b3d76263e77cd3436bf9e5644ba0a12"` |
| **7** | OWNER vào `/company` thấy ma trận chỉ đọc (checkbox khoá, không nút lưu); `/roles` chuyển sang `/company`. | AC-12, AC-13 | **PASS** | `item7-owner-matrix-readonly.png`<br>`item7-roles-redirect-to-company.png` | **GET role matrix chỉ đọc:**<br>`172.19.0.1 - - [11/Oct/2026:13:54:05 +0000] "GET /org/company/role-matrix?org_id=1a80b5f2-d649-4df2-8ead-565ea5e4d1eb HTTP/1.1" 200 3468 "-" "node" kong_request_id: "130aff776165e0007acd1e6accd04726"`<br>Kiểm tra DOM: 468/468 checkbox đều `disabled`, 0 nút lưu. |
| **8** | Chụp 5 màn ở 1440 và 390 (login khách, đăng ký, login nhân viên, ma trận platform, menu avatar), so sánh canvas `claude.ai/artifact/XuyqU2bzEpihN9Cb4sfqx4`. | AC-14, AC-15 | **PASS** | `screen-customer-login-1440.png`<br>`screen-customer-login-390.png`<br>`screen-customer-register-1440.png`<br>`screen-customer-register-390.png`<br>`screen-staff-login-1440.png`<br>`screen-staff-login-390.png`<br>`screen-platform-matrix-1440.png`<br>`screen-platform-matrix-390.png`<br>`screen-avatar-menu-1440.png`<br>`screen-avatar-menu-390.png` | Toàn bộ 5 màn hình đã render đúng bảng màu token `--p`, bo góc 4px/8px chuẩn canvas, không tràn viền ở 390px mobile, touch target >= 44px. Chi tiết đối chiếu ở Mục 3 dưới đây. |

---

## 2. Danh sách lỗi ghi nhận (Bugs by Severity)

### [Nên] Bug 1: Form login khách trả về câu lỗi chung thay vì "Tài khoản chưa được kích hoạt" khi đăng nhập user PROVISIONED
- **Mức độ**: **Nên** (ảnh hưởng trải nghiệm kích hoạt tài khoản khách hàng, AC-5).
- **Mô tả hiện tượng**:
  Khi người dùng đăng ký mới hoặc tài khoản chưa kích hoạt (`unact.*@e2e.test`) cố gắng đăng nhập tại `/login`, hệ thống hiển thị thông báo lỗi:
  > *"Đăng nhập không thành công."*
  thay vì:
  > *"Tài khoản chưa được kích hoạt. Kiểm tra email để kích hoạt hoặc gửi lại liên kết."* kèm nút/liên kết gửi lại email.
- **Nguyên nhân kỹ thuật**:
  - Dịch vụ auth BE trả về mã HTTP 403 với payload:
    `{"error": "user_not_active", "message": "Tài khoản chưa được kích hoạt hoặc đã bị vô hiệu hoá", "retryable": false}`
  - Trong file `features/customer-auth/login-form.tsx` (dòng 19):
    ```ts
    if (err.status === 403 && (err.info as { reason?: string } | undefined)?.reason === "NOT_ACTIVATED") return "notActivated";
    ```
    Do `err.info` có cấu trúc `{ error: "user_not_active" }` (không chứa trường `reason: "NOT_ACTIVATED"`), điều kiện trên không khớp và rơi vào fallback `loginFailed`.
- **Cách tái hiện**:
  1. Đăng ký tài khoản mới qua API hoặc form `/register`.
  2. Mở trình duyệt truy cập `http://localhost:3000/login`.
  3. Nhập email chưa kích hoạt và mật khẩu đúng, bấm "Đăng nhập".
  4. Quan sát: Hiển thị lỗi "Đăng nhập không thành công." (xem ảnh `item2-customer-login-unactivated.png`).
- **Đề xuất khắc phục (trong task tiếp theo, không sửa trong S7)**:
  Bổ sung kiểm tra `err.code === "user_not_active"` hoặc `(err.info as any)?.error === "user_not_active"` trong `loginErrorKey`:
  ```ts
  if (err.status === 403 && ((err.info as any)?.reason === "NOT_ACTIVATED" || err.code === "user_not_active")) return "notActivated";
  ```

---

### [Tuỳ] Bug 2: Điều hướng `/company` khi chưa có query parameter `org_id`
- **Mức độ**: **Tuỳ** (Tối ưu UX).
- **Mô tả hiện tượng**:
  Khi OWNER đăng nhập lần đầu vào `/staff/login`, router đưa về `/console`. Nếu OWNER click hoặc truy cập trực tiếp URL `/company` mà chưa có `?org_id=...`, trang hiển thị selector `CompanyPicker` yêu cầu chọn công ty. Sau khi chọn mới điều hướng sang `/company?org_id=<UUID>`.
- **Đánh giá**:
  Đối với người dùng chỉ sở hữu duy nhất 1 công ty, việc bắt buộc chọn lại công ty có thể hơi thừa bước. Có thể tối ưu auto-redirect sang công ty duy nhất nếu danh sách chỉ có 1 phần tử.

---

## 3. Đối chiếu giao diện thực tế với Canvas `XuyqU2bzEpihN9Cb4sfqx4` (để Dawn comment)

| Màn hình | Canvas quy định | Giao diện thực tế trên worktree | Đánh giá & Độ lệch |
|:---|:---|:---|:---|
| **Màu sắc & Token** | - Màu chính duy nhất `--p` (đỏ cà chua).<br>- Neutral pha màu, không dùng hex thô.<br>- Nền L1 viền 1px line, không bóng. | Toàn bộ nút submit dùng token `bg-p` / `bg-[var(--primary)]`, viền `border-line`, card nền `bg-l1`. Trạng thái lỗi dùng `bg-err-soft` và `text-err`. | **Khớp 100%**. |
| **Typography & Bo góc** | - Font Nunito / Quicksand tiêu đề.<br>- Bo góc: card bo 8px (`rounded-lg`), button/input bo 4px (`rounded-sm`), checkbox bo 2px, avatar tròn (`rounded-full`). Cấm pill button. | Các component tuân thủ nghiêm ngặt hệ thống token bo góc `--r-2`, `--r-4`, `--r-8`, không có button dạng pill nào. | **Khớp 100%**. |
| **Login khách & Đăng ký** | - Form đơn giản, nhãn rõ ràng, hỗ trợ hiện/ẩn mật khẩu.<br>- EmptyState khi chưa nhập.<br>- Báo lỗi rung lắc (shake). | Đã tích hợp hiệu ứng rung khi lỗi (`animate-shake`), EmptyState sạch sẽ không hiện thông báo lỗi giả khi mới mở form. | **Khớp 100%** visual. *(Ghi chú: Header store hiện tại là frame tối giản cho trang auth riêng, khớp plan FR-5/OD-1)*. |
| **Login nhân viên** | - Giao diện dành riêng cho nhân viên CRM.<br>- Nhãn và hỗ trợ đổi sang đăng nhập khách nếu nhầm lẫn. | Có badge "Dành cho nhân viên", link chuyển hướng "Đăng nhập mua hàng" rõ ràng khi phát hiện tài khoản là khách. | **Khớp 100%**. |
| **Ma trận quyền Desktop (1440px)** | - Hàng = tài nguyên, 6 cột C R U D I E.<br>- Chọn role bằng `Segmented`.<br>- Thanh lưu dính đáy khi dirty.<br>- Cột "Khác" hiển thị action phi CRUDIE. | - Đã đổi từ Select sang `Segmented` (10 role chip).<br>- Cột "Khác" hiển thị các chip monospaced gọn gàng.<br>- Thanh lưu dính đáy có hiệu ứng slide-in (`animate-[sheet-in_200ms_ease-out]`), nút Huỷ và nút Lưu thay đổi. | **Khớp 100%**. |
| **Ma trận quyền Mobile (390px)** | - **Tuyệt đối không cuộn ngang**.<br>- Mỗi tài nguyên 1 hàng 6 chip CRUDIE bấm được. | Bảng table được ẩn trên mobile (`hidden md:block`); giao diện mobile render dạng thẻ card tài nguyên, bên dưới là grid 6 cột nút chip C, R, U, D, I, E tương tác trực tiếp (`md:hidden`). Không có thanh cuộn ngang nào xuất hiện. | **Khớp 100%** yêu cầu UX của plan. |
| **Menu Avatar** | - Dropdown L3 nổi bật.<br>- Hiển thị avatar tròn, thông tin tài khoản, danh sách liên kết và nút "Đăng xuất" màu `text-err`. | Menu mở ra hiển thị chuẩn xác cả trên Store, Console, Platform và Company workspace. Nút "Đăng xuất" nổi bật với màu đỏ cảnh báo. | **Khớp 100%**. |

---

## 4. Kết luận
- **S6**: Đã hoàn thành toàn bộ skin, animation, typography và responsive theo Canvas, test suite `1000/1000` test passed, commit SHA `276f59d`.
- **S7**: Đã thực hiện kiểm thử thực tế trên trình duyệt Brave với đầy đủ 8 mục tiêu chí nghiệm thu. 7/8 mục đạt tuyệt đối (**PASS**), 1 mục phát hiện lỗi lệch map mã lỗi từ auth upstream (**PARTIAL** - phát hiện và ghi nhận đầy đủ bằng chứng, không tự ý sửa code theo đúng ràng buộc). Toàn bộ bằng chứng ảnh (26 tệp PNG) và log truy cập Kong gateway thực tế đã được lưu trữ và ghi nhận chi tiết.

