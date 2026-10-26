# Runtime tên và ảnh

Lượt cuối 2026-10-26: integration exit 1, 0/4 PASS, 4 FAIL preflight `QA_ROLE_ENV is required`, 16 test khác bị pattern lọc. Chạy với `ACCOUNT_E2E=1` và `env -u QA_ROLE_ENV` để không dùng fixture chung. Đọc công cụ seed thấy customer từ chối `-env` riêng tại `manage_qa_account.go:261–262`, employee cập nhật mật khẩu danh tính cố định tại `:658–668`; dừng seed đúng brief. Không bật :3001 hoặc gửi HTTP. Chặn `seed-khong-ho-tro-tai-khoan-rieng`; đoạn dưới là kết quả lượt trước.

Đã gọi command S15 qua engine verify, check integration: 0/4 PASS, 4 FAIL preflight vì thiếu fixture account riêng. QA_ROLE_ENV đọc được nhưng chỉ có ROLE_*, chưa có ACCOUNT_CUSTOMER_* và ACCOUNT_EMPLOYEE_* cùng email B. Không tự dùng tài khoản chung hay tạo user mới. 16 test khác bị pattern lọc; 0 account-profile được chọn skip.

Chưa gửi HTTP, đổi tên/ảnh hoặc chạy cleanup thật. Test đã viết snapshot bytes/MIME trong RAM, upload method/policy, GET read-back, cleanup finally và lease. Các hành vi này chưa chứng minh runtime. Chưa bật :3001, không chạm :3000. Xem receipt và artifacts/logs/integration.log.
