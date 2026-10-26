# Môi trường API/runtime dự kiến

Trạng thái: [ASSUMED], chưa preflight/seed/chạy stack vì R32 yêu cầu chỉ plan và worker SUPPLIER đang hoạt động. Không coi testkit này là environment receipt.

- QA_ROLE_ENV trỏ role-accounts.env sẵn có, chỉ đọc vào RAM. Không source/echo secrets ra shell, không commit file env.
- PORTAL_IT_BASE là origin portal thật; AUTH_SERVICE_URL do server cấu hình. MAILPIT_BASE là listener Mailpit của stack test, không URL lấy từ người dùng cuối.
- Cần hai identity ACTIVE cố định, customer không membership và employee có quyền tới console/company/platform cần UAT; có thể cần nhiều employee fixture để phủ từng plane nếu quyền không chung. [ASSUMED] Tên khóa env/fixture chưa chốt; S14 phải kiểm schema fixture và fail nếu thiếu, không tự tạo ngẫu nhiên hoặc dùng tài khoản operator cá nhân.
- Mỗi identity có email A/B test riêng và mật khẩu baseline lấy từ QA env; candidate password giữ trong RAM và đảm bảo đúng policy. Không dùng cùng identity/email với SUPPLIER.
- Auth, org, notification relay/consumer, storage và Mailpit phải đang sẵn; dùng healthcheck read-only của stack owner. Không compose up/down hoặc restart service do task này khi chưa thống nhất runtime.
- S14 bổ sung preflight/lease/reset bằng account-fixtures.ts, chỉ account của task. Snapshot profile/email và bytes/MIME ảnh gốc vào RAM, không chỉ URL/key; URL tải ảnh phải thuộc storage origin được cấu hình, không chuyển cookie/bearer sang storage. Nếu ban đầu không ảnh, cleanup DELETE; nếu tải ảnh gốc thất bại, dừng trước mutation để giữ khả năng khôi phục; kiểm login với credential fixture, state sạch không pending challenge lẫn run trước. Khôi phục qua BFF chính chủ và link Mailpit, không SQL/reset DB.
- Không có lệnh seed đã kiểm chứng trong lượt plan. Worker phải hoàn thành preflight và chứng minh restore trước khi coi môi trường đạt; nếu không thể, ghi “Claude chạy” theo R7, không skip/PASS giả. Thay đổi testkit sau approve cần Dawn approve lại.

Lệnh thực thi sau cook:

```sh
ACCOUNT_E2E=1 TMPDIR=/home/dawn/work/ticket/.cache/tmp pnpm exec vitest run tests/integration --testNamePattern=account-profile --maxWorkers=2 --minWorkers=1 --no-file-parallelism
ACCOUNT_E2E=1 TMPDIR=/home/dawn/work/ticket/.cache/tmp pnpm exec vitest run tests/integration --testNamePattern=account-security --maxWorkers=2 --minWorkers=1 --no-file-parallelism
```

Đây là 2 command nối tiếp, không chạy trong lượt plan. Test name phải bắt đầu đúng prefix: profile/avatar dùng account-profile, password/email dùng account-security. Runtime suite account được chọn phải có assertions đã execute và 0 skipped; các suite ngoài task bị testNamePattern lọc phải thống kê riêng. Harness mới đọc Set-Cookie vào cookie jar RAM, gửi Origin/Content-Type/CSRF theo BFF, không dùng cookie jar file. Mọi mutation account qua portal BFF; chỉ byte ảnh tới storage và đọc thư tới Mailpit. Kiểm epoch mailbox trước request, lọc recipient/time/message id, poll bounded timeout. Không delete toàn inbox hoặc in raw thư chứa token.

OD-1 hiện chưa có email link thật. Runtime email phải FAIL tiền điều kiện cho yêu cầu link, không tự tạo URL từ token để giả hoàn thành. Query/fragment và query-log redaction phải chốt với owner trước nghiệm thu.

Cleanup tuần tự trong finally. Lấy lại phiên bằng email/password đúng trạng thái hiện biết trong RAM, đổi password về baseline, đổi email về baseline và confirm Mailpit, phục hồi tên/avatar. Mọi revoke phải có session B để thử refresh cũ. Cleanup fail ghi test FAIL và tên bước lỗi đã redacted; không ghi payload/bí mật. Trước bước nặng kiểm MemAvailable >=3000 MB theo R28.
