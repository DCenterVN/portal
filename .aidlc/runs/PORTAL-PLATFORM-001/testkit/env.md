# Live environment — chưa chạy trong phiên plan

Owner chạy live: Claude. Backend org source pin: 6c1c0132f2b246726231547e99d30c61ee31eceb.
- Backend PLATFORM-PLANE-001 phải sẵn sàng trong dev-infra; portal `npm run dev` :3000; server org base URL trỏ Kong http://127.0.0.1:8000 qua .env.local (không commit secrets).
- Fixture riêng: platform admin, platform support, OWNER công ty A/B, employee thiếu quyền, customer không membership; 2 công ty MAIN. Dùng API provision/onboard chính thức, không sửa DB dùng chung.
- Seed/reset runnable và credentials chưa có trong handoff: S15 phải xác thực cách seed có thể chạy lại trên stack cô lập rồi ghi evidence trước live PASS. Không tự nhận setup verified.
- Run: `ESBUILD_BINARY_PATH=/tmp/esbuild npm test -- tests/integration`.
- Bắt buộc ghi backend SHA, commands, fixture ids, read-back, cleanup vào evidence; không token/password. Ca last-admin/break-glass cooldown chỉ chạy trong fixture cô lập.
