# UI-TRACE-001 — Truy xuất nguồn gốc cho khách

Hoàn tất sau lô 4 ngày 10/11/2026 trong cùng worktree, không commit.

- Route mới `/traceability`: ô mã lớn, submit đến route mã đã encode, hướng dẫn tem hộp món và ba bước minh hoạ. `?code=` tự chuyển sang kết quả, bỏ khoảng trắng đầu/cuối.
- Route kết quả giữ API công khai, chuyển thành timeline nguyên liệu → sản xuất → QC thành phẩm. Không hiện UUID, enum QC có nhãn Việt, ngày dd/mm/yyyy.
- API công khai chỉ có tên nguyên liệu, mã NCC, ngày sản xuất/hạn dùng, QC thành phẩm và nhật ký. Ngày nhập, QC nguyên liệu và tên bếp chưa được API cung cấp; giao diện ghi rõ thiếu thông tin.
- 404 hiện lời hướng dẫn và ô nhập lại. Lỗi tải có thử lại và tra mã khác. Hook gọi API, view chỉ render.
- Menu header/footer đã trỏ `/traceability`; giữ liên kết hiện có và bổ sung kiểm tra.
- Skill ui-ux-pro-max tra thiết kế food traceability và form error clarity. Áp luật lô 4: shadcn/Tailwind, green-700 + neutral, khối nền nhạt, không viền trang trí hoặc bóng. Giữ font/token đang có, không tạo design system khác.
- File: `app/(store)/traceability/page.tsx`, `features/traceability/{trace-lookup.tsx,trace-presenter.ts,trace-view.tsx,use-trace.ts,trace.test.tsx}`, `mocks/trace-preview.mjs`. Mỗi file dưới 400 dòng; không dependency mới, không comment.
- TypeScript `pnpm exec tsc --noEmit`, lint `pnpm run lint`; Vitest traceability/page/store-shell: 16/16 PASS.
- Browser: form submit trim mã, QR redirect, link menu, mobile 375px không tràn, focus, theme tối, lỗi 503/thử lại chuyển 404; không pageerror.
- Hai ảnh 1280×800 dùng API thật và đã tự xem: `/home/dawn/work/ticket/.cache/video-nghiep-vu/ui-astryx/trace/{nhap-ma,ket-qua}.png`.
- Chưa có `/home/dawn/work/ticket/.cache/briefs/trace-code-demo.txt`, ảnh kết quả dùng mã không tồn tại. Timeline thành công kiểm bằng fixture riêng trong `timeline-mo-phong.png`, không thay dữ liệu backend.
- Có thêm ảnh mobile/tối và `kiem-tra.json` cùng thư mục. Chưa chạy toàn suite/build.
