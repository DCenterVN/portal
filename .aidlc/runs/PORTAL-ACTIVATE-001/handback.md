## Done

- Đã gỡ nội dung 7 xung đột, giữ thay đổi mới của main và thêm activation từ `dawnmoriaty/portal-activate-001`.
- Customer activation gửi đúng `{token,password}` sau submit chủ động; không POST khi mở link. Giữ validation ≥12 Unicode code points, ≤256 byte UTF-8, không trim/normalize; confirm chỉ ở client.
- Hai catalog JSON hợp lệ, không trùng key; kiểm tra đệ quy xác nhận không mất key nào của HEAD/main.
- Không push, đổi nhánh, merge, xoá/skip/nới test.
- Kiểm tra `git diff --check HEAD` xanh; không còn conflict marker trong nội dung file.

## Files changed

- `.aidlc/runs/PORTAL-ACTIVATE-001/anti/anti-test.md`
- `.aidlc/runs/PORTAL-ACTIVATE-001/anti/anti.sh`
- `.aidlc/runs/PORTAL-ACTIVATE-001/anti/anti_check.py`
- `.aidlc/runs/PORTAL-ACTIVATE-001/anti/anti_runner_selftest.py`
- `.aidlc/specs/customer-activation.md`
- `app/(auth)/activate/page.tsx`
- `app/api/auth/bff.test.ts`
- `components/patterns/password-input.test.tsx`
- `components/patterns/password-input.tsx`
- `contracts/README.md`
- `contracts/auth.public.yaml`
- `features/customer-auth/activate-view.tsx`
- `features/customer-auth/journey.test.tsx`
- `lib/api/activation-contract.test.ts`
- `lib/api/auth-journey-bff.test.ts`
- `lib/api/auth-journey-bff.ts`
- `lib/api/customer-auth.ts`
- `lib/fetcher.test.ts`
- `lib/fetcher.ts`
- `messages/en.json`
- `messages/vi.json`
- `next.config.mjs`
- `proxy.test.ts`
- `.aidlc/runs/PORTAL-ACTIVATE-001/handback.md` là báo cáo được yêu cầu thêm.

## Decisions

- `components/patterns/password-input.tsx`: giữ kích thước 40px, `ghost-icon`, focus outline và padding của main; thêm props `showLabel`/`hideLabel` từ activation, giữ nhãn mặc định tiếng Việt.
- `components/patterns/password-input.test.tsx`: giữ đầy đủ assert main về 40px, nền trong suốt, hit area/focus; thêm kiểm tra toggle, nhãn vi/en, giá trị/autocomplete và disabled từ nhánh cũ. Assert kích thước nhánh cũ đổi 44px thành 40px theo UI main.
- `contracts/README.md`: giữ đoạn nguồn token mới của main; nối thêm provenance snapshot auth và contract activation.
- `features/customer-auth/journey.test.tsx`: giữ mock `requestAnimationFrame` của main; thêm mock input focus và form reset để kiểm tra activation. Giữ test popup/route/i18n của main và bổ sung activation suite.
- `messages/en.json`: giữ toàn bộ key main, gồm placeholder mới; thêm 6 key activation/toggle, cập nhật activationPending và activateSubtitle theo flow chọn mật khẩu.
- `messages/vi.json`: quyết định tương tự bản en, giữ toàn bộ key main.
- `proxy.test.ts`: giữ suite S27 anonymous API boundary của main; nối thêm suite public activation và lookalike protection từ nhánh cũ.

## Left over

- Chưa stage được 7 file: mỗi lệnh `git add <file>` bị `Read-only file system` khi tạo `/home/dawn/work/ticket/portal/.git/worktrees/portal-activate-port/index.lock`. Git metadata nằm ngoài writable roots của sandbox. Git index vẫn báo UU dù nội dung đã gỡ marker.
- Chưa commit. Commit message đã yêu cầu: `feat(portal): kích hoạt khách gửi token+mật khẩu (PORTAL-ACTIVATE-001, port từ nhánh 6/10)`, không Co-Authored-By.
- 1 test frame-lock đỏ vì hash của hai file PasswordInput thay đổi đúng phạm vi port. `frame.lock.json` nằm ngoài 23 file được phép sửa; đang chờ mở rộng scope để cập nhật hash, không đổi test.
- 3 test supplier contract đỏ vì thiếu đường dẫn `../inventory/api/openapi.public.yaml` và `../inventory/api/permissions.json` theo layout worktree. Nguồn thật có tại `/home/dawn/work/ticket/inventory/api/`; đường dẫn sibling cần được môi trường chuẩn bị ngoài worktree. Không mock hay sửa test để né dependency.
- `node_modules` dùng chung ngoài writable roots khiến lần `npm test` đầu không ghi được Vitest results cache. Chạy lại đầy đủ cùng bộ test với `--no-cache` loại bỏ lỗi cache, còn đúng 4 test đỏ nêu trên.
- Script `npm test` có bước chuẩn bị `/tmp/esbuild` sẵn từ main; lần đầu chạy nguyên script với ESBUILD_BINARY_PATH được chỉ định. Lần xác minh cuối gọi Vitest trực tiếp qua npm exec, không dùng `/tmp`, không sửa package.json.

Kết quả: test **1606/1610** (80/82 test files); lint **PASS**; typecheck **PASS**; SHA commit **chưa có, Git metadata read-only**.

Lệnh xác minh cuối:

```sh
ESBUILD_BINARY_PATH=$HOME/.local/share/esbuild/esbuild-0.21.5 npm exec -- node node_modules/vitest/vitest.mjs run --no-cache --exclude 'e2e/**' --exclude 'e2e-*/**'
npm run lint
npm run typecheck
```
