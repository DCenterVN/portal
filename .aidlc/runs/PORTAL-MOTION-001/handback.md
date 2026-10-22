## Done

Đã triển khai theo thứ tự S7 → S1 → S2 → S5 → S8 → S9 → S11. Kết quả cuối **58/60 test pass**. Sáu slice đủ xanh; S2 còn hai assertion cần Claude quyết, không tạo DONE.

| Slice | Red trước sửa | Kết quả sau sửa | Log |
|---|---|---|---|
| S7 | Unit 1 fail + 4 pass; browser 12 fail + 1 pass | Unit 5/5 + browser 13/13, exit 0 | `logs/red-S7.log`, `logs/green-S7.log` |
| S1 | 4 fail + 4 pass | 8/8, exit 0 | `logs/red-S1.log`, `logs/green-S1.log` |
| S2 | 4 fail + 2 pass | 4/6; 2 fail, exit 1 | `logs/red-S2.log`, `logs/green-S2.log` |
| S5 | 2 fail + 2 pass | 4/4, exit 0 | `logs/red-S5.log`, `logs/green-S5.log` |
| S8 | 6 fail + 2 pass | 8/8, exit 0 | `logs/red-S8.log`, `logs/green-S8.log` |
| S9 | 12 fail | 12/12, exit 0 | `logs/red-S9.log`, `logs/green-S9.log` |
| S11 | 2 fail + 2 pass | 4/4, exit 0 | `logs/red-S11.log`, `logs/green-S11.log` |

`green-S2.log` giữ tên theo brief nhưng chứa kết quả thật 4 pass, 2 fail; không nhận S2 đã xanh. Các lần thử trung gian còn ở `logs/attempt-*` và `logs/*recheck*`.

Đã chụp và mở đủ **40 crop after**, ghép với ảnh before cùng dữ liệu/state/viewport/theme tại [bảng before/after](artifacts/build-1-after/index.md). Login là form trống, catalog là phiên CUSTOMER thật với 0 SKU. Không chỉnh ảnh hoặc ẩn DOM để che Next dev indicator xuất hiện trong một số crop.

## Files changed

- components/patterns/password-input.tsx
- features/store/landing.tsx
- features/store/home.tsx
- features/store/hero-motion.module.css
- features/products/products-view.tsx
- features/products/filter-motion.module.css
- features/customer-auth/login-form.tsx
- features/customer-auth/login-motion.module.css
- components/ui/dialog.tsx
- components/ui/page.tsx
- components/layout/site-footer.tsx

## Decisions

- Dùng ui-ux-pro-max để rà reduced-motion và focus; giữ thiết kế đã duyệt, không sinh design system hoặc component mới. Diff source nằm trong các file của slice.
- S7 giữ hit area 40px, nền/shadow trong suốt ở các trạng thái, icon đậm hơn khi hover và outline qua pseudo-element 20px. Không sửa Button global.
- S1 dùng CSS module, giữ số Lucian #216. Chỉ bật animation khi `scripting: enabled` và `prefers-reduced-motion: no-preference`; no-JS/reduced vẫn hiện ngay. Không chia thêm span trong h1.
- S2 chỉ thêm class/CSS module theo #019, không sửa setter/state, chọn đơn hoặc request. Không dùng flushSync để ép khớp phép đo đồng bộ của test.
- S5 đưa rung 500ms và fade opacity 200ms vào CSS module theo #062; giữ nhãn busy hiện có và cơ chế chống gửi trùng. Test phát hiện catch gọi focus lúc input còn disabled; chuyển riêng lời gọi focus sang requestAnimationFrame để DOM đã gỡ disabled. Không chờ animation hoặc trì hoãn request. Các request đăng nhập sai thật trả 401, không gặp 429 và không đổi limiter.
- S8 chỉ wrap hai cụm hiện có và căn giữa icon tìm. S9 chỉ bỏ tint/background hover và thay indicator focus quanh icon, giữ kích thước và lifecycle.
- S11 chọn màu từ token có sẵn bằng biến cục bộ `--footer-ink`, theo dark variant của app. Bỏ phụ thuộc `light-dark()` chọn theo color-scheme của trình duyệt; không thêm màu cứng, sửa token generated hoặc đổi nền/font/layout.
- `pnpm run typecheck` exit **0**, log `logs/typecheck.log`. ESLint trên đúng tám file TSX đã sửa exit **0**, log `logs/lint.log`; dùng `pnpm exec eslint <files>` vì script `pnpm run lint` cố định đối số `.`. Ba CSS module được kiểm qua render browser.
- Archcheck trước/sau đều exit **1**, cùng **17 vi phạm ngoài baseline có sẵn**. Tập vi phạm không đổi, **0 vi phạm phát sinh**; xem `logs/arch-before.log`, `logs/arch-after.log`, `logs/arch-comparison.json`. Không nới baseline. `git diff --check` exit 0.
- Next webpack dev có lỗi `Manifest file is empty` ở một số lần thử; giữ các log lỗi, khởi động lại đúng server đã mở. Lần cuối S7 chạy trọn suite 13/13 browser, không sửa config/retry/test để xanh.
- Hash toàn bộ test/config Sonnet và `password-input.test.tsx` không đổi so với đầu lượt. Những sửa đổi test do Sonnet có sẵn được giữ nguyên. Không sửa `.env`, cài package, commit, chạy `sdlc.py` hoặc ghi receipt.
- Đã tắt server qua đúng session exec 22214, không pkill server khác. Curl `http://localhost:3000` sau tắt exit 7, HTTP 000. Đã trả hai import `next-env.d.ts` do Next tự sinh về nền. JWT scan trên log/ảnh after/dev log exit 1, **0 file khớp**; quét mật khẩu QA trong bộ nhớ cũng **0 file khớp**.

## Left over

- Hai case S2 tại `tests/motion-filter.spec.mjs:138` và `:179` đọc `aria-pressed` ngay trong cùng callback `el.click()`, trước khi React commit. Cùng assertion đỏ ở baseline trước sửa CSS. Probe thật ghi `duringClickCall=false`, `nextBrowserRead=true` trong `logs/diagnostic-S2-state.log`.
- Phép kiểm bổ sung bằng click người dùng thật xác nhận aria-pressed=true; bình thường thấy các nhịp 350/300/250/450ms, reduced-motion không có animation. Bằng chứng ở `artifacts/build-1-after/manifest.json`, trường `diagnostics`. Đây là thông tin bổ sung, không thay hai test Sonnet còn đỏ.
- Theo brief, giữ nguyên test và chờ Claude quyết phép đo sau click/commit. Không nhận toàn đợt đã PASS và không tạo `/home/dawn/work/ticket/plans/261022-ui-motion/DONE-ui-build-1.txt`. Handoff: `/home/dawn/work/ticket/plans/261022-ui-motion/handoff-ui-build-1.md`.
- S0/S6 chờ token; S3/S4 chờ dữ liệu món, không làm trong lượt này. Không sửa V-03 đã bác, V-05 chờ dữ liệu, V-08 đã bác hoặc V-09 cần việc riêng.
