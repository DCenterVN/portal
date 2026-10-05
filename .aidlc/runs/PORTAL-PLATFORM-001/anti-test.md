# Anti test: PORTAL-PLATFORM-001 (UI mặt phẳng nền tảng + công ty)

Bạn là người test bằng trình duyệt. Bạn **không** sửa code. Kết quả chỉ được tính khi Claude chạy
`python3 .aidlc/runs/PORTAL-PLATFORM-001/anti_check.py` và nhận `PASS`. Báo cáo của bạn không thay được máy chấm.

## Luật cấm (vi phạm là FAIL, máy chấm có bắt)
0. Không sửa `anti-test.md` và `anti_check.py`. Báo cáo dán vào chat, không ghi vào file này. Claude so sha256 hai file trước khi chấm.
1. Không sửa, không tạo file ngoài `.aidlc/runs/PORTAL-PLATFORM-001/evidence/`. `git status` phải giữ nguyên so với `evidence/git-baseline.txt`.
2. Không viết script tự động (`.js/.ts/.py/.sh/.mjs`) trong `evidence/`. Bấm tay bằng browser agent.
3. Không chỉnh ảnh, không resize, không chụp lại một ảnh cho hai tên. Mỗi ảnh phải khác nhau (máy chấm so sha256).
4. Không sửa DB và không gọi API trực tiếp để tạo dữ liệu. Công ty `ANTI-<RUN>` phải được tạo bằng form Onboard trên UI.
5. Không chạy lại cho tới khi xanh rồi xoá dấu vết. Lỗi thật thì ghi vào báo cáo, kèm ảnh.

## Môi trường (Claude đã bật sẵn)
- Portal: http://localhost:3000. **Phải dùng `localhost`**, không dùng 127.0.0.1, vì cookie và link mail theo `localhost`.
- Stack dev-infra (Kong :8000, org, auth, mailpit :8025) đang chạy.
- Mật khẩu chung: `REDACTED`

| tài khoản | vai trò |
|---|---|
| ui-admin@test.local | PLATFORM_ADMIN |
| ui-support@test.local | PLATFORM_SUPPORT |
| ui-owner@test.local | OWNER của công ty bạn onboard |
| ui-customer@test.local | khách, không có quyền gì |

- Bị 429 khi login (giới hạn 15 lần / 15 phút mỗi IP): chạy `bash .aidlc/runs/PORTAL-PLATFORM-001/evidence/reset-login-limit.sh`.
- Thiếu tài khoản: chạy `bash .aidlc/runs/PORTAL-PLATFORM-001/evidence/seed-fixtures.sh` (chạy lại nhiều lần vẫn an toàn).

## Bước 0: đánh dấu lượt chạy
Chọn RUN = 6 ký tự in hoa/số, ví dụ `K7P2QX`. Ghi `evidence/run.json`:
`{"run_id": "K7P2QX", "started_at": "<giờ UTC ISO lúc bắt đầu, ví dụ 2026-09-28T10:00:00Z>"}`

## Bước 1: ảnh trạng thái theo route (mỗi ảnh chụp ở 2 bề rộng 1440 và 390)
Tên file: `<route>-<state>-<1440|390>.png`, ví dụ `companies-empty-390.png`. Chụp full page.
Ảnh loading: bật DevTools → Network → "Slow 3G", tải lại trang và chụp khi còn thấy vòng xoay.
Ảnh error: `docker stop dcentervn-local-org-1`, tải lại trang, chụp, rồi `docker start dcentervn-local-org-1`
(chờ ~20 giây; nếu vẫn 502 thì chạy `docker restart dcentervn-local-api-gateway-1`).
Màn hình phải báo "không khả dụng / bị chặn" và **không** hiện dữ liệu. Nếu vẫn hiện dữ liệu, đó là lỗi fail-open: ghi vào báo cáo.

| route | cách vào | trạng thái |
|---|---|---|
| companies | admin → /platform/companies | loading · empty (`?page=999`) · error · success |
| company | admin → bấm một công ty | loading · notfound (`/platform/companies/00000000-0000-7000-8000-000000000000`) · readonly (đăng nhập **support**, không có nút Bật/Tắt) · success (admin) |
| matrix | tab "Ma trận quyền" | loading · notfound (id như trên + `/role-matrix`) · readonly (support, không có nút Sửa) · success (admin) |
| support | /platform/support-access | loading · empty (support, trước khi xin quyền lần nào) · error · success (admin sau Bước 2) |
| staff | /platform/staff | loading · denied (support mở trang này) · error · success (admin) |
| audit | /platform/audit | loading · empty (lọc Action = `khong-co`) · error · success |
| my-company | owner → /company | loading · picker (/company không có `org_id`: màn chọn công ty) · error · success (công ty ANTI-RUN) |
| company-support | owner → tab "Yêu cầu hỗ trợ" | loading · empty (trước Bước 2) · error · success (sau Bước 2) |

## Bước 2: các luồng (ảnh `flow-<tên>-1440.png`, chỉ ở 1440; 17 ảnh)
1. `onboard-validation`: admin mở "Onboard công ty", bấm "Tạo công ty" khi form rỗng → hiện lỗi từng trường.
2. `onboard-success`: tên `Anti RUN`, mã `ANTI-<RUN>`, hợp đồng `HD-<RUN>`, email OWNER `ui-owner@test.local`, tên OWNER `UI Owner`, tick SALES → màn "Đã tạo công ty".
3. `module-confirm`: ở công ty ANTI-RUN, bấm "Bật" INVENTORY → hộp xác nhận có ô mã hợp đồng (chụp trước khi xác nhận), rồi xác nhận.
4. `core-locked`: dòng CORE ghi "Không tắt được", không có nút.
5. `matrix-edit`: bấm "Sửa" một role → hộp thoại có textarea và dòng "Thêm x · bỏ y".
6. `matrix-400`: thêm dòng `production:order:read` (module chưa mua) → Lưu → báo lỗi, bản nháp vẫn còn.
7. `breakglass-confirm`: /platform/support-access, chọn ANTI-RUN, lý do, tick Break-glass → hộp xác nhận ghi "4 giờ".
8. `breakglass-409`: xác nhận lần 1 (thành công), làm lại lần 2 cho cùng công ty → hiện đúng câu "Công ty đã dùng break-glass trong 24 giờ qua, hãy xin OWNER duyệt."
9. `staff-409-duplicate`: /platform/staff → "Cấp quyền" với User ID của ui-support (lấy ở bảng) → báo "đã là nhân sự nền tảng".
10. Xin quyền thường (không tick break-glass) cho ANTI-RUN → trong "Grant của tôi" có dòng "Chờ OWNER duyệt".
11. `owner-approve`: đăng nhập owner → /company/support-access, chọn ANTI-RUN → "Duyệt" grant đang chờ → hộp xác nhận "Duyệt 24 giờ" (chụp), rồi xác nhận.
12. `owner-409`: bấm "Thu hồi" grant vừa duyệt, rồi mở tab khác và thử duyệt lại grant đó (nếu nút không còn thì chụp bảng, ghi "không có nút"; không được giả).
13. `consent-saved`: /company → "Đồng ý hỗ trợ thường trực" → Bật → xác nhận → trạng thái "Đang bật".
14. `customer-denied`: đăng nhập customer → mở /platform/companies → màn bị từ chối, không có dữ liệu.
15. `dark-companies`: admin, bấm nút mặt trăng → /platform/companies ở giao diện tối.

16. `matrix-typing`: trong hộp "Sửa" ma trận, gõ liền một dòng mới dài ≥ 20 ký tự (không bấm chuột lại) → cả dòng hiện đủ trong textarea, textarea vẫn có viền focus. Nếu focus nhảy ra sau mỗi phím: lỗi, ghi báo cáo.
17. `module-scheduled`: bật một module chưa bật (ví dụ PRODUCTION) với "Bắt đầu" = ngày mai → dòng module ghi trạng thái hẹn lịch và nút đổi thành "Huỷ lịch" (chụp bảng). Sau đó bấm "Huỷ lịch" → xác nhận → dòng trở lại chưa bật (ghi đạt/không đạt).
18. `support-org-down`: /platform/support-access, chọn ANTI-RUN, nhập lý do, tick Break-glass, bấm gửi để **mở hộp xác nhận nhưng chưa xác nhận**. Rồi `docker stop dcentervn-local-org-1`, bấm sang tab trình duyệt khác rồi quay lại (trang tự kiểm lại quyền) → hộp xác nhận không còn bấm được, hoặc cả trang chuyển sang "không khả dụng". Chụp. Nếu vẫn bấm được "Mở 4 giờ" thì bấm thử, rồi `docker start` org và xem "Grant của tôi": **không** được có grant break-glass mới (có thì là lỗi fail-open, ghi báo cáo).
Bàn phím (ghi đạt/không đạt vào báo cáo, không cần ảnh): trong mọi hộp thoại, Tab/Shift+Tab chỉ đi vòng bên trong hộp; Esc đóng hộp và focus quay về đúng nút đã mở; ở /company/support-access, phím ← → chuyển giữa 2 tab.

**Không** thử "thu hồi PLATFORM_ADMIN cuối cùng": stack dùng chung, dễ khoá nền tảng. Ghi `DEBT` vào báo cáo.

## Bước 3: Lighthouse (mobile, 3 lần mỗi route)
Với 8 route ở Bước 1 (trạng thái success), dùng profile trình duyệt đã đăng nhập:
`lighthouse <URL> --only-categories=accessibility,performance --form-factor=mobile --output=json --output-path=evidence/<route>.lighthouse-run<N>.json --disable-storage-reset`
Máy chấm đòi a11y ≥ 0.90 ở cả 3 lần, và LCP trung vị ≤ 2500ms. Chạy trên `npm run dev` thường chậm: nếu LCP trượt thì ghi rõ, **không** tự sửa số.

## Báo cáo (dán nguyên mẫu, điền số)
```
RUN: <run_id>  started_at: <...>  finished_at: <...>
Ảnh trạng thái: <n>/64   Ảnh luồng: <n>/17   Lighthouse: <n>/24
Bàn phím (Tab vòng trong hộp · Esc trả focus · ← → đổi tab): đạt/không đạt từng mục
Lỗi UI thấy được (route · bước · ảnh · mô tả):
- ...
Fail-open (thấy dữ liệu khi org tắt): có/không · ảnh
Vùng bấm < 44px thấy được: ...
DEBT: last-admin 409 không test trên stack chung
anti_check.py (Claude chạy): <để trống>
```

