# Anti test: PORTAL-AUTH-UI-001 (các màn auth của portal, khách hàng + nhân viên)

Người chạy: Antigravity. Người chấm: `anti_check.py` (máy chấm, không phải bạn).
Bạn **chỉ chạy, thao tác trình duyệt và ghi lại**. Bạn không sửa code, không giải thích vì sao fail, không đoán.

## Luật (vi phạm 1 luật = cả lần chạy bị huỷ)
1. Không sửa, tạo hay xoá file nào ngoài thư mục `anti/`. Máy chấm so `git status` trước và sau.
2. Không `git commit/push/checkout/stash`. Không `docker compose down/restart`. Không `pkill`, không kill process nào, không khởi động lại portal.
3. Chỉ chạy đúng các lệnh ghi dưới đây, đúng thứ tự. Không thêm cờ, không chạy lại để "cho xanh".
4. Bước nào fail: ghi FAIL kèm output thật, rồi làm tiếp bước sau. Không tự sửa.
5. Con số trong report phải chép từ output lệnh. Không có output thì ghi `KHÔNG CÓ`.
6. Không tự nghĩ ra token, email hay mật khẩu. Chỉ dùng giá trị trong `anti/run.env`, `anti/staff.txt` và từ lệnh `anti.sh url`.
7. Không gọi API bằng tay (curl, fetch trong console). Mọi thao tác UI đều qua trình duyệt.
8. **Trình duyệt phải có giao diện (headed), thao tác từng bước như người dùng.** **CẤM script**: không file `.js/.cjs/.mjs/.ts/.py/.sh` nào trong `anti/`, không `sleep()` để kéo giờ, không chuỗi lỗi viết sẵn làm giá trị dự phòng. Máy chấm đo thời gian giữa các ảnh:
   - tổng ≥ 90 giây, và hai ảnh liền nhau cách ≥ 2 giây;
   - nhịp thao tác: máy chấm in số đo ra nhưng chưa dùng để chấm, vì chưa có mẫu người thật để đặt ngưỡng.

   Lần chạy bằng script trước có các khoảng 6.6–8.3 giây.
   Mỗi lượt chạy tay sạch được máy chấm ghi vào `pace-samples.txt` (mẫu 1/5 → 5/5). Đủ 5 mẫu thì Claude đặt ngưỡng nhịp.
   Trình duyệt: **Brave** qua Playwright MCP (mở phiên agent mới để nhận cấu hình Brave). Không có Chrome trên máy.
   Hộp của trình duyệt (không phải của portal, portal không xin quyền nào): "Lưu mật khẩu?" → bấm **Không bao giờ/Never**; "Allow/Cho phép" (thông báo, vị trí...) → **Block/Chặn**.
   Ghi 1 dòng vào `actions.log` rồi làm tiếp. Không tính là lỗi portal, không chụp ảnh khi hộp còn che màn.
9. Chỉ chụp khi màn đã **tải xong**: không còn chữ "Đang tải", "Đang xác thực" hay "Compiling". Nếu màn cứ quay mãi thì chờ 30 giây, chụp đúng như vậy, ghi FAIL và làm tiếp. Không chụp lúc đang tải rồi ghi PASS.

## Môi trường (đã bật sẵn)
- Thư mục làm việc: `/mnt/win_d/feature/ticket/portal/.aidlc/runs/PORTAL-AUTH-UI-001`
- Portal: http://127.0.0.1:3000 (next dev). Auth, org, postgres và mailpit chạy trong docker `dcentervn-local-*`.
- Nếu bước 0 không in ra `portal 200`: DỪNG và báo lại.

## Bước 0: bắt đầu
```bash
cd /mnt/win_d/feature/ticket/portal/.aidlc/runs/PORTAL-AUTH-UI-001
bash anti.sh start
bash anti.sh staff
bash anti.sh unit
```
- `start` in ra `EMAIL=`: đây là tài khoản **khách** dùng trong toàn bộ bài. Mật khẩu `AntiPass123!`, sau khi reset thì `AntiPass456!`.
- `staff` in ra `staff ready: <STAFF> / AntiStaff123!`: đây là tài khoản **nhân viên** (có membership EMPLOYEE).
- `unit` phải in `unit exit=0`, dòng `Tests  N passed` và `archcheck: ... 0 new`.

## Bước 1: UI qua trình duyệt
Dùng browser agent của Antigravity. Nếu không bật được thì dùng Playwright MCP. Nếu cả hai đều không có: DỪNG và báo "không có trình duyệt".
- Ảnh chụp: cửa sổ 1440×900 (riêng U15 là 390×844). Lưu PNG vào `anti/ui/` đúng tên. Mỗi ảnh phải khác nhau.
- Mở DevTools Console suốt bài. Cuối bài, chép **nguyên văn toàn bộ** console vào `anti/ui/console.txt`. Nếu console trống thì ghi đúng một dòng `(trống)`.
- URL cần ghi thì ghi vào `anti/ui/urls.txt`, mỗi dòng `<khoá> <URL đầy đủ trên thanh địa chỉ>`.
- Mỗi ảnh `<tên>.png` phải kèm `<tên>.txt`: chép nguyên văn `document.body.innerText` của trang **tại đúng lúc chụp**. Máy chấm tìm trong đó câu mà màn phải hiện, và chữ "Đang tải".
- Ghi `anti/ui/actions.log`: mỗi thao tác một dòng `HH:MM:SS <việc đã làm>`. Dòng đầu ghi tên công cụ trình duyệt đang dùng. Nếu có dùng script thì lưu script đó vào `anti/`.
- Gặp lỗi 429: chạy `bash anti.sh rl-reset` một lần, làm lại đúng bước đó và ghi vào report.

| # | Làm | Kết quả đúng | Ảnh / ghi |
|---|---|---|---|
| U1 | Mở /register | Form có Tên hiển thị, Email, Số điện thoại, Mật khẩu. Có dòng "Nhân viên không tự đăng ký" | `01-register-empty.png` |
| U2 | Điền EMAIL, tên `Anti Khach`, mật khẩu `Short12345!` (11 ký tự), bấm Tạo tài khoản | Khung đỏ báo lỗi mật khẩu. Chép nguyên văn | `02-register-error.png` |
| U3 | Sửa mật khẩu thành `AntiPass123!`, bấm Tạo tài khoản | "Kiểm tra hộp thư của bạn" có EMAIL | `03-register-ok.png` |
| U4 | Mở `/activate?token=sai` | Khung đỏ báo liên kết không hợp lệ, có form gửi lại | `04-activate-bad-token.png` |
| U5 | Ở trang U4, nhập EMAIL, bấm Gửi lại liên kết kích hoạt | "Đã gửi lại liên kết" | `05-activate-resent.png` |
| U6 | Chạy `bash anti.sh url activate`, mở đúng URL nó in ra | "Tài khoản đã được kích hoạt" | `06-activate-ok.png` |
| U7 | Mở /login, EMAIL + `SaiMatKhau99!` | Khung đỏ báo lỗi, vẫn ở /login. Chép nguyên văn | `07-login-error.png` |
| U8 | Đăng nhập EMAIL + `AntiPass123!` | Về trang chủ, **không** vào /console | `08-login-customer-home.png`, ghi `customer <URL>` |
| U9 | Đăng xuất (nếu không có nút thì xoá cookie của 127.0.0.1 trong DevTools). Mở `/login?redirect=/console`, đăng nhập lại như U8 | Vẫn về trang chủ, không vào /console | `09-customer-console-blocked.png`, ghi `customer-redirect <URL>` |
| U10 | Đăng xuất như U9. Đăng nhập bằng STAFF + `AntiStaff123!`, chờ console tải xong | Vào /console, số liệu đã hiện, header hiện tên **Anti Staff** | `10-login-staff-console.png`, ghi `staff <URL>` |
| U11 | Đăng xuất. Mở /forgot-password, nhập EMAIL, gửi | "Kiểm tra hộp thư của bạn" (câu trung tính) | `11-forgot-ok.png` |
| U12 | Mở `/reset-password?token=sai`, nhập `AntiPass456!` hai lần, bấm Đặt lại | Khung đỏ báo mã không hợp lệ | `12-reset-bad-token.png` |
| U13 | Chạy `bash anti.sh url reset`, mở URL, nhập `AntiPass456!` hai lần | "Đã đặt lại mật khẩu" | `13-reset-ok.png` |
| U14 | /login với EMAIL + `AntiPass456!` | Đăng nhập được, về trang chủ | `14-login-new-password.png` |
| U15 | Đăng xuất. Đổi cửa sổ sang 390×844, mở /login | Không có thanh cuộn ngang, form đủ trên màn hẹp | `15-login-mobile.png` |

Ngoài bảng (không chấm điểm, nhưng ghi vào report): dùng phím Tab đi hết form /login. Ghi lại thứ tự focus và có thấy viền focus không.

## Bước 2: Lighthouse
```bash
bash anti.sh a11y
```
Mất khoảng 1–2 phút. In ra 5 dòng `<route> a11y <điểm> perf <điểm>`. Chép nguyên văn vào report.

## Bước 3: report và máy chấm
Viết `anti/report.md` theo mẫu, không thêm phần khác:
```
# Report PORTAL-AUTH-UI-001 (RUN=<số trong run.env>)
| Bước | PASS/FAIL | Bằng chứng (chép từ output hoặc tên file) |
|---|---|---|
| 0, U1 ... U15, Lighthouse | | |
Thông báo lỗi U2 (nguyên văn):
Thông báo lỗi U7 (nguyên văn):
Thứ tự Tab trên /login:
Số lần rl-reset thêm:
Kết luận: <PASS nếu mọi bước PASS, ngược lại FAIL + danh sách bước>
```
Cuối cùng chạy:
```bash
bash anti.sh check
```
Dán **nguyên văn** toàn bộ output vào tin nhắn trả lời Dawn. `VERDICT` do máy chấm quyết. Nếu report ghi PASS mà máy chấm ra FAIL thì FAIL là đúng.
Claude sẽ tự chạy lại `anti.sh check` trên đúng thư mục `anti/` này.

## Máy chấm kiểm gì
- G1: `git status` của portal không đổi.
- G2: `npm test` có exit 0 và ≥ 86 test pass; archcheck `0 new`.
- G3 (DB thật):
  - khách EMAIL đang `ACTIVE`, đã đăng nhập và đổi mật khẩu sau lúc bắt đầu;
  - STAFF đã đăng nhập;
  - token đã dùng phải có trong outbox của auth.
- G4: URL sau đăng nhập là `/` với khách (kể cả khi có `redirect=/console`) và `/console` với nhân viên.
- G5:
  - 15 ảnh PNG thật (> 5KB), khác nhau, chụp sau lúc bắt đầu;
  - mỗi ảnh có `.txt` chứa đúng câu của trạng thái đó và không còn chữ đang tải;
  - thời gian chụp trải ≥ 90 giây, hai ảnh liền nhau cách ≥ 2 giây;
  - `actions.log` có ít nhất 15 dòng.
- G6: Lighthouse a11y ≥ 0.9 cho cả 5 trang, chạy sau lúc bắt đầu. LCP chỉ in ra, không chấm, vì chạy trên next dev.
- G7:
  - log của auth/org không có response 5xx nào sau lúc bắt đầu;
  - `console.txt` có mặt; ngoài các 400/401 của bước cố tình sai thì không có dòng error/failed/warning/hydration. Phải có 401 của U7, chứng tỏ console đã thật sự được ghi.
- G8: report có dòng `Kết luận`.
