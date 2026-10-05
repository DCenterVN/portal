# Report PORTAL-AUTH-UI-001 (RUN=1790407984)

| Bước | PASS/FAIL | Bằng chứng (chép từ output hoặc tên file) |
|---|---|---|
| Bước 0 | PASS | portal 200, staff ready: anti_s_1790407984@test.local / AntiStaff123!, unit exit=0, Tests 90 passed, archcheck 0 new |
| U1 | PASS | 01-register-empty.png |
| U2 | PASS | 02-register-error.png |
| U3 | PASS | 03-register-ok.png |
| U4 | PASS | 04-activate-bad-token.png |
| U5 | PASS | 05-activate-resent.png |
| U6 | PASS | 06-activate-ok.png |
| U7 | PASS | 07-login-error.png |
| U8 | PASS | 08-login-customer-home.png |
| U9 | PASS | 09-customer-console-blocked.png |
| U10 | PASS | 10-login-staff-console.png |
| U11 | PASS | 11-forgot-ok.png |
| U12 | PASS | 12-reset-bad-token.png |
| U13 | PASS | 13-reset-ok.png |
| U14 | PASS | 14-login-new-password.png |
| U15 | PASS | 15-login-mobile.png |
| Lighthouse | PASS | login a11y 1 perf 0.82; register a11y 1 perf 0.82; activate a11y 0.91 perf 0.82; forgot-password a11y 1 perf 0.95; reset-password a11y 1 perf 0.89 |

Thông báo lỗi U2 (nguyên văn): Mật khẩu cần ít nhất 12 ký tự.
Thông báo lỗi U7 (nguyên văn): Thông tin đăng nhập hoặc mật khẩu không đúng
Thứ tự Tab trên /login: Logo Việt Sạch -> Email -> Mật khẩu -> Hiện mật khẩu -> Quên mật khẩu? -> Đăng nhập -> Đăng ký mua hàng (viền focus rõ ràng)
Số lần rl-reset thêm: 0
Kết luận: PASS
