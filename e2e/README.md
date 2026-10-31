## Xem lại e2e

Tạo file `~/work/ticket/.cache/e2e/accounts.env` ngoài repo, điền tài khoản DEV cho các biến sau. Không commit file này.

```dotenv
E2E_WAREHOUSE_EMAIL=
E2E_WAREHOUSE_PASSWORD=
E2E_ADMIN_EMAIL=
E2E_ADMIN_PASSWORD=
E2E_CUSTOMER_EMAIL=
E2E_CUSTOMER_PASSWORD=
E2E_FOODDEV_EMAIL=
E2E_FOODDEV_PASSWORD=
```

Chạy bộ mẫu trên portal DEV tại `http://localhost:3002`:

```bash
npm run e2e:record -- e2e/inventory-ux
npx playwright show-report e2e-report
```

Lệnh ghi hình chạy bước đăng nhập chung trước, lưu phiên vào `~/work/ticket/.cache/e2e/state/`. Vai thiếu email hoặc mật khẩu sẽ được bỏ qua và ghi lý do. Bộ `inventory-ux` cần tài khoản kho; các bộ khác có thể cần thêm vai tương ứng. Có thể đặt `E2E_BASE_URL` để đổi đích chạy.

Trong báo cáo, bấm ca → Video / Trace để xem video và từng bước. Muốn mở riêng một trace:

```bash
npx playwright show-trace <duong-dan-trace.zip>
```
