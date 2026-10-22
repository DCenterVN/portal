## Done

- S2: `red-S2.log` 9 xanh/15 đỏ → `green-S2.log` 24/24 xanh. Staff/public decode envelope bằng Zod; giữ ảnh, branch, cursor và giá thiếu; cart dùng sku_ref + branch_id, BFF chỉ forward branch_id.
- S3: `red-S3.log` không nạp được module (17 case trong source); `green-S3.log` 16/17 xanh. Catalog khách, filter desktop/mobile và sheet đã triển khai. Assertion query "g" vẫn đỏ; giữ nguyên test.
- S4: `red-S4.log` 37/44 xanh → `green-S4.log` 42/44 xanh; hai lỗi còn lại thuộc detail S6. Sau S6, cả 44 case tương ứng xanh trong `final-vitest.log` (products 20, sales API 15, BFF 9). Bảng/form staff chuyển vào console; form gửi name/slug; nút tạo cần canCreate; không còn thao tác giỏ/kích hoạt.
- S5: `red-S5.log` 10/19 xanh → `green-S5.log` 19/19 xanh. Menu/URL products cần sales:product:read; route được nhận diện employee.
- S6: `red-S6.log` 98/115 xanh → `green-S6.log` 97/115 xanh. Products 20/20 xanh; rebrand 77/95 xanh. Detail khách bỏ kích hoạt/SKU/barcode/ngày tạo, dùng ảnh và dữ liệu thật; cart không fallback product ID.
- Tổng cuối: `final-vitest.log` 156/175 xanh, 19 đỏ, exit 1; không sửa test. `pnpm run typecheck` exit 0; `pnpm run lint` exit 1; `python3 -B ~/agent_skills/sdlc/engine/archcheck.py` exit 1. Chi tiết phần Left over.
- E2E chưa chạy: chờ cổng 3000 từ khoảng 22:46 đến 23:26 ngày 22/10/2026, kiểm tra khoảng mỗi 60 giây. Lần cuối 23:26:09 vẫn là PORTAL-MOTION, PID 3661255. Không mở server catalog, không dừng server motion. Chưa có số pass/skip/fail E2E.
- Đã chép script được chỉ định sang `start-dev.cjs`, chỉ đổi root sang /home/dawn/wt/portal-catalog; giữ nguyên loadEnvConfig của portal gốc. Chưa chạy script.
- `git diff --check` exit 0. Quét JWT trong logs không có kết quả.

## Files changed

14 file source do Codex sửa/tạo:
- `app/(store)/products/page.tsx`
- `features/products/catalog-view.tsx`
- `features/products/catalog-filters.tsx`
- `app/(console)/sales/products/page.tsx`
- `features/products/products-loader.tsx`
- `features/products/products-view.tsx`
- `features/products/product-create-dialog.tsx`
- `features/products/product-detail-view.tsx`
- `lib/api/sales.ts`
- `app/api/sales/carts/[cart_id]/items/route.ts`
- `features/console/console-nav.ts`
- `lib/fetcher.ts`
- `messages/vi.json`
- `messages/en.json`

Chứng cứ trong run: logs/red-S2..S6.log, logs/green-S2..S6.log, logs/final-vitest.log, logs/typecheck.log, logs/lint.log, logs/arch.log, logs/arch-head-comparison.json, logs/e2e-port-blocked.log và start-dev.cjs.
Test, node_modules symlink, .aidlc/ACTIVE, trace.jsonl và metadata run có sẵn được giữ nguyên. Không commit, không sửa backend/package/env/arch-baseline.

## Decisions

- Áp dụng ui-ux-pro-max và bố cục prototype đã duyệt; tái dùng Card/Input/Button/Dialog variant=sheet và state components, không thêm primitive/package/design system.
- Chỉ lọc/sort trên món đã tải, hiển thị số món đã tải và Xem thêm theo cursor; không tạo dữ liệu tim/khuyến mãi/đánh giá.
- Thiếu SKU/branch/giá/tồn kho thật thì không cho thêm giỏ; tồn UNKNOWN cũng bị khoá. Chỉ ghi cart cache/toast thành công sau response API thành công được decode.
- ProductsLoader chờ quyền trước khi gọi staff list. canCreate mặc định false; không so role. Chỉ thêm rule /sales/products vào nav hiện hữu, giữ hành vi route khác.
- Filter thuần dùng shape name/price generic, không phụ thuộc API; ô tìm mobile là textbox có label. Giữ nguyên phép lọc tên dù một assertion sai kỳ vọng.
- Không đặt nút kích hoạt ở cả hai màn theo OD-4. S7 motion chưa làm trong lượt S2→S6.
- Khi hết giới hạn chờ E2E, bàn giao blocker theo codex-build-1-e2e.md; không thử server worktree khác.

## Left over

- Claude quyết test `features/products/catalog.test.tsx:124`: query "g" kỳ vọng "Cá hồi áp chảo" dù tên không chứa "g". Kết quả đúng theo lọc tên hiện chỉ có "Gà nướng mật ong". Không sửa test/không nới bộ lọc để khớp assertion.
- 18 case `app/rebrand.test.ts` còn kỳ vọng form SKU/giá/UOM/mô tả, các slot state cũ, create hiển thị khi không truyền canCreate, giỏ staff và detail quản trị/kích hoạt. Cần Claude cập nhật hợp đồng regression tương ứng brief mới. Chi tiết từng assertion trong green-S6.log/final-vitest.log; không coi nhóm này đã xanh.
- Lint lỗi tại `next.config.mjs:3`: process is not defined (no-undef). File trùng HEAD, ngoài Files planned nên giữ nguyên.
- Archcheck hiện 62 violations, 44 baselined, 18 new theo baseline cũ, 12 stale; exit 1. Đối chiếu cùng checker trên git archive HEAD 473d8e313e3d56cc630713624469a2750f81f7b6: trước 66, sau 62; **0 cặp rule/file mới**. FE-14 form đổi chi tiết từ thiếu loading,empty,error thành chỉ thiếu empty; không phải tăng vi phạm. Không sửa baseline hay nợ ngoài scope.
- E2E bị chặn bởi cổng 3000 sau 40 phút. Khi cổng trống, chạy start-dev.cjs, kiểm server của đúng worktree qua localhost:3000, chạy `pnpm exec playwright test e2e/catalog-split/catalog-split.spec.ts`, ghi số pass/skip/fail thật và dừng đúng PID đã mở. Catalog 0 món được skip theo test; không tự skip lỗi hạ tầng/quyền.
- Chưa xác nhận live cart mutation, các viewport/motion S7 hay browser E2E. Không tạo DONE-build-1.txt khi còn các blocker trên.
