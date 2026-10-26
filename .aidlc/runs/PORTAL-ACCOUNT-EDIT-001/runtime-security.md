# Runtime mật khẩu và email

Lượt cuối 2026-10-26: e2e exit 1, 0/4 PASS, 4 FAIL preflight `QA_ROLE_ENV is required`, 16 test khác bị pattern lọc. Chạy với `ACCOUNT_E2E=1` và `env -u QA_ROLE_ENV` để không dùng fixture chung. Không seed vì công cụ chỉ hỗ trợ danh tính cố định, chưa tạo credential hoặc thực hiện mutation. Chặn `seed-khong-ho-tro-tai-khoan-rieng`. OD-1, revoke/restore và AC-4 vẫn chưa chứng minh runtime; đoạn dưới là kết quả lượt trước.

Đã gọi command S16 qua engine verify, check e2e: 0/4 PASS, 4 FAIL preflight vì thiếu fixture riêng. 16 test khác bị pattern lọc; 0 account-security được chọn skip. Chưa gửi HTTP, đổi mật khẩu/email hoặc chứng minh revoke/restore thật.

Test đã viết session A/B, credential mới/cũ, pending email, Mailpit recipient/time/message ID/link thật, foreign owner/replay và cleanup finally. Chưa nhận coverage runtime token hết hạn/sai mục đích. Không ghép link từ token. OD-1, edge/query redaction, AC-4 chưa nghiệm thu. Không browser theo R32. Xem receipt và artifacts/logs/e2e.log.
