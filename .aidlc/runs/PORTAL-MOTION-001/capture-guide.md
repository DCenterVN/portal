# Codex chạy audit portal thật

Codex đã thực chạy ngày 22/10/2026. Hai lượt cho kết quả 24/40 rồi 28/40; 12 ảnh chính còn chặn do catalog không có món ACTIVE và API chỉ tiêu HTTP 401. Manifest tổng hợp nằm ở `audit/before-manifest.json`, nguồn lượt hai trong `audit/retry-02/`, crop bổ sung trong `audit/supplement/`. Đã tắt server. Xem handoff và bảng lỗi, không coi các hướng dẫn bên dưới là tuyên bố đủ ảnh.

## Chuẩn bị

Codex kiểm dependency worktree có sẵn trong môi trường vận hành. Nếu vẫn thiếu, báo Dawn hoặc giao bước chuẩn bị dependency riêng; hai script này không cài package. Không dùng server portal gốc thay cho source worktree. Kiểm HEAD bằng Git chỉ đọc và xác nhận `473d8e3`.

`start-audit-dev.cjs` dùng `@next/env` sẵn có để đọc `.env.local` của `/home/dawn/work/ticket/portal` vào bộ nhớ. Không sao chép hoặc in cấu hình. Next chạy trong `/home/dawn/wt/portal-motion`, giữ upstream Kong như portal gốc. Nếu worktree có `.env.local` khác, đối chiếu upstream trong bộ nhớ và dừng khi lệch; không tự sửa file. Dev server có output runtime của Next; không in giá trị cấu hình hoặc bí mật. Lượt audit đã mở được server từ worktree.

Terminal 1:

```bash
cd /home/dawn/wt/portal-motion
TMPDIR=/home/dawn/work/ticket/.cache/tmp node .aidlc/runs/PORTAL-MOTION-001/start-audit-dev.cjs
```

Terminal 2, dùng tên món QA ACTIVE có sẵn, không UUID. QA_ROLE_ENV là file role-accounts.env hiện có. Script không đọc token kích hoạt và không lưu mật khẩu/session. Không `set -x`.

```bash
cd /home/dawn/wt/portal-motion
export TMPDIR=/home/dawn/work/ticket/.cache/tmp
export QA_ROLE_ENV="$HOME/.local/state/dcentervn/qa/role-accounts.env"
# Chỉ đặt MOTION_PRODUCT_NAME sau khi thấy tên ACTIVE thật trên UI.
# Nếu bỏ trống, script tìm tên đầu tiên đang hiện ở bộ lọc ACTIVE.
export MOTION_AUDIT_DIR=/home/dawn/work/ticket/plans/261022-ui-motion/audit/retry-03
export MOTION_STAFF_ROLE=FOOD_DEV
export PORTAL_E2E_BASE=http://127.0.0.1:3000
export CAPTURE_PHASE=before
node .aidlc/runs/PORTAL-MOTION-001/capture-audit.mjs
```

Không tự tạo món. Lượt vừa chạy catalog items=0 nên detail bị chặn đúng; không cấu hình tên ví dụ để tạo bằng chứng giả. FOOD_DEV cần quyền xem và tạo chỉ tiêu. Có thể dùng ADMIN hiện có qua MOTION_STAFF_ROLE nếu đúng quyền QA. Nếu login yêu cầu chọn tổ chức/chi nhánh thay vì tới console, script ghi blocked. Codex xử lý ngữ cảnh bằng tên trong UI, không giả session hoặc bỏ guard.

Script mặc định dùng Playwright đã cài ở portal gốc và Brave `/opt/brave.com/brave/brave`. Có thể đặt MOTION_MODULE_ROOT/PW_BROWSER_PATH tới dependency/browser đã có. Không cài package. Các context đều ở bộ nhớ, không storageState/trace/HAR/video. Không chụp màn đăng nhập đã điền QA.

## Ảnh và bảng lỗi

- Mười màn × hai viewport × hai theme = 40 ảnh chính. Có thêm Home đã đăng nhập, catalog, mini-cart và crop V-01 tới V-08. Main screenshot là fullPage, viewport vẫn đúng 375×844 hoặc 1440×900.
- Tên ảnh phẳng: `audit/before-login-375-light.png`, `audit/before-V-01-hover-375-light.png`. Manifest: `audit/before-manifest.json`. Sau sửa dùng CAPTURE_PHASE=after; giữ nguyên before. Script từ chối ghi đè manifest đã có; nếu lần cũ thiếu, chọn thư mục audit mới qua MOTION_AUDIT_DIR và cập nhật liên kết bảng.
- Script không mock API, không seed, không gửi đăng ký/reset/kích hoạt, không lưu form nghiệp vụ và không tự thêm món vào giỏ. Giỏ mới có thể rỗng. Nếu cần giỏ có món, Codex chuẩn bị bằng thao tác QA được phép và chụp bổ sung, ghi rõ state. Không nhận đã kiểm giỏ có dữ liệu từ ảnh giỏ trống.
- Nếu route/API lỗi, thiếu quyền/dữ liệu/selector, ghi blocked, exit 1. Không dùng ảnh lỗi thay màn thành công. Khi thay selector, sửa trong run; không sửa app để script chạy.
- Ảnh dùng animations disabled để so hình học cuối cùng. Chúng không chứng minh timing/reduced-motion/CLS. Sonnet viết test browser riêng theo plan.
- Mở ảnh thật trước khi nhận V-02 đến V-08 là lỗi. Xếp lại mức xấu, gắn crop thực tế, ghi xác nhận hoặc bác. Không để link giả hoặc dùng ảnh preview cũ.
- Rà thêm icon trong input/search, nút đóng, menu ⋮, badge/chip, viền đôi, bóng/tint, chữ và khoảng cách ở cả mười màn. Mã chỉ ra nghi vấn; ảnh quyết định. Nếu phát hiện lỗi mới, bổ sung bảng và cập nhật plan trước triển khai.

Rà R6/R8 trước bàn giao, không in nội dung file chứa bí mật:

```bash
rg -l 'eyJ[A-Za-z0-9_-]{20,}\.' /home/dawn/work/ticket/plans/261022-ui-motion/audit
```

Exit 1 với 0 file là không tìm thấy mẫu JWT trong dữ liệu đọc được, không chứng minh ảnh không chứa bí mật. Codex vẫn mở ảnh kiểm bằng mắt. Không đưa credentials vào caption/tên file.

## Kiểm script không cần browser

```bash
node --check .aidlc/runs/PORTAL-MOTION-001/start-audit-dev.cjs
node --check .aidlc/runs/PORTAL-MOTION-001/capture-audit.mjs
node .aidlc/runs/PORTAL-MOTION-001/capture-audit.mjs --check
```

Ba lệnh này chỉ kiểm cú pháp/ma trận, không phải PASS ảnh hoặc app.
