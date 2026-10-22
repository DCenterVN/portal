# Handoff PORTAL-MOTION-001 lượt 3

Đã tiếp tục sau fast-forward do Claude chạy. Git chỉ đọc xác nhận HEAD = origin/main = `473d8e313e3d56cc630713624469a2750f81f7b6`. Không chạy Git ghi. Bỏ hẳn preview-sua2.

Đã viết lại `/home/dawn/wt/portal-motion/.aidlc/runs/PORTAL-MOTION-001/plan.md`. Giữ portal gốc, không Newsreader/nền giấy/MASTER/preview. Có FR/AC, Files planned/Tests planned đúng R18, 11 slice mỗi slice ≤5 file, slice motion tách lỗi nhìn, Q-n có mặc định. Sonnet viết test đỏ trước, Codex code sau; chưa có test Sonnet ở lượt này.

Năm phần hiệu ứng có đích gắn hiện hữu: #216 hero Landing/Home, #019 nút lọc trạng thái catalog, #018 span quantity chi tiết, #240 panel Popover mini-cart, #062 alert/busy login. Plan có file:line, thời lượng và phần gallery bỏ. Không thêm component/drawer/shipping bar. Mini-cart chưa nhận cartItems từ StoreFrame, không sửa dữ liệu để dựng số đếm. Chỉ nhận có năm phần gắn được, không nhận đã port app.

`loi-nhin-v1.md` có tám dòng V-01 đến V-08. V-01 bắt buộc theo brief và đã đối chiếu code; bảy dòng còn lại là nghi vấn mã, chưa xác nhận bằng ảnh. Xếp hạng mới là dự kiến. Không có crop hoặc ảnh màn thật được tạo, không coi tám dòng là tám lỗi nhìn đã kiểm.

## Chụp màn: Claude chạy

Lệnh thật:

```bash
TMPDIR=/home/dawn/work/ticket/.cache/tmp pnpm dev
```

Exit 1: `Cannot find module '/home/dawn/wt/portal-motion/node_modules/next/dist/bin/next'`, code MODULE_NOT_FOUND. Worktree chưa có node_modules. Chưa bind cổng hoặc gọi Kong, không gọi đây là lỗi socket. Không cài package, tạo symlink dependency hay sửa .env.local.

Các file chạy tiếp đều trong run:

- `start-audit-dev.cjs`: đọc cấu hình portal gốc bằng @next/env vào bộ nhớ rồi chạy pnpm dev trong worktree. Không in/sao chép .env. Chỉ chạy khi dependency đã sẵn có.
- `capture-audit.mjs`: portal thật, 40 tổ hợp chính; thêm Home signed-in/catalog/mini-cart và crop. QA đọc qua QA_ROLE_ENV, không token/cookie/password artifact. Không mock, seed hoặc gửi form nghiệp vụ.
- `capture-guide.md`: lệnh, biến tên món QA, browser/dependency, cách xem manifest và chụp before/after.

Không có audit/*.png hoặc manifest browser ở lượt này. Không dùng preview cũ làm ảnh. Nếu selector, quyền, dữ liệu hoặc chọn ngữ cảnh chặn thì script ghi blocked; Claude sửa script trong run theo màn thật, không đổi app để chụp.

## Phụ thuộc và việc tiếp theo

1. Claude chuẩn bị dependency trong phạm vi được phép riêng, chạy server worktree đúng Kong, rồi script chụp before. Không cài package theo brief hiện tại.
2. Mở 40 ảnh và crop thật. Xác nhận/bác V-02 đến V-08; thêm lỗi thấy thật khác nếu có, xếp bảng theo mức xấu. Điền link ảnh thật rồi mới chốt slice sửa nhìn.
3. Token console --motion-* chưa có trong generated CSS. S0 chờ nguồn platform-docs được duyệt và generator; không sửa tay generated, không fallback số. S6 chờ S0.
4. Sau khi plan/bảng được chốt và có quyền triển khai: Sonnet test đỏ, Codex code theo slice. Chụp after, đo reduced-motion/CLS bằng test thật; ảnh tĩnh không chứng minh timing.

Không sửa app, design-system, gate/baseline, package/lock, DB/Docker hoặc receipt. Hai đường dẫn untracked `.aidlc/runs/PORTAL-MOTION-001/` và `design-system/` đã có trước; design-system giữ nguyên. Plan đã hoàn tất phần có thể làm trong môi trường này; audit ảnh còn **Claude chạy**.

## Kiểm tra đã chạy

- `node --check .aidlc/runs/PORTAL-MOTION-001/capture-audit.mjs`: exit 0.
- `node --check .aidlc/runs/PORTAL-MOTION-001/start-audit-dev.cjs`: exit 0.
- `node .aidlc/runs/PORTAL-MOTION-001/capture-audit.mjs --check`: exit 0, ma trận 40 tổ hợp chính và 8 ID crop. Chưa chạy browser.
- Kiểm tĩnh R18 bằng Python: exit 0, 11 slice, mỗi slice ≤5 file, mọi file slice/test có trong Files planned. Không gọi engine.
- `pnpm dev`: exit 1 như trên. Unit/lint/build/browser/reduced-motion/CLS chưa chạy; không ghi PASS.

Trong lúc làm, Git status xuất hiện thay đổi đồng thời ở `.aidlc/runs/UX-NO-UUID-001.json`, `.aidlc/runs/UX-NO-UUID-001/artifacts/plan-approval.json`, `.aidlc/runs/UX-NO-UUID-001/state.json`, `.aidlc/trace.jsonl`. Các file này không thuộc thao tác ghi của lượt motion; đã giữ nguyên, không restore hoặc sửa receipt.

Đã rà độc lập theo sdlc-plan và sửa hai điểm trong script: mask chỉ ô có giá trị bí mật để không che nút mắt trống; kiểm GET danh sách chỉ tiêu bằng phiên QA và đối chiếu tên dòng trước khi tính ảnh thành công, tránh SSR bắt lỗi thành danh sách rỗng. Đã kiểm lại cú pháp sau sửa, exit 0. Chưa chạy browser nên không ghi review này là PASS audit.
