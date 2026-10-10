# Handoff Antigravity — PORTAL-UI-REBUILD-001 · Task 1 = slice F1

Dawn đưa thẳng file này cho Antigravity (không qua Orca), **chỉ sau khi khung K1–K7 đã verify xanh và merge vào `portal-ui-rebuild`**. Các slice sau (F2, F3, rồi U1…U11) dùng y hệt file này, chỉ đổi phần "Task".

## CONTEXT
- Portal (Next 16.3, React 19, Tailwind 4) đang được dựng lại UI theo preview Dawn chốt 10/10. Plan: [plan.md](plan.md). API nào dùng được: [api-inventory.md](api-inventory.md).
- **Khung** (token, font, theme, `components/ui/*` kể cả `EntityPicker`, shell, luật lint, so ảnh) do Claude/Sonnet dựng và đã khoá bằng `frame.lock.json`. Bạn chỉ xây **trên** khung.
- Người dùng không biết UUIDv7. Hiện nhiều form bắt gõ UUID. Task 1 đổi 3 ô ở 2 form sang chọn theo tên.
- Người điều phối: Claude. Claude tự chạy verify trên worktree của bạn rồi mới merge; báo "xong" của bạn không phải biên lai.

## Môi trường (Claude dựng sẵn trước khi gửi, bạn chỉ chạy phần "Bạn chạy")
- **Nhánh + thư mục làm việc:** Claude tạo sẵn worktree `~/wt/portal-ui-f1` trên nhánh `portal-ui-rebuild-f1` (tách từ `portal-ui-rebuild`):
  `git -C /mnt/win_d/feature/ticket/portal worktree add ~/wt/portal-ui-f1 -b portal-ui-rebuild-f1 portal-ui-rebuild`
  Mở đúng thư mục `~/wt/portal-ui-f1`. Chỉ commit ở đó. Không push, merge, rebase hay đổi nhánh; không sửa checkout chính `/mnt/win_d/feature/ticket/portal`.
- **Claude dựng sẵn:**
  - `dev-infra`: `docker compose up -d postgres redis kafka minio kong`. Các service auth, org, sales, production chạy sau Kong `:8000`.
  - `.env.local` chép từ checkout chính `portal/.env.local` (trỏ `http://127.0.0.1:8000`, `PORTAL_AUTH_MODE=dev`).
  - Tài khoản QA nhân viên có quyền production + platform: tạo bằng `go run dev-infra/scripts/manage_qa_account.go -action seed`. Đường dẫn file credential ghi trong `dev-infra/.qa-account-pointer` [ASSUMED: tên file pointer, Claude điền đúng khi seed]. Không chép mật khẩu vào log, handback hay commit.
- **Bạn chạy:**
  ```bash
  cd ~/wt/portal-ui-f1
  npm ci --no-audit --no-fund            # không dùng pnpm
  export ESBUILD_BINARY_PATH=$HOME/.local/share/esbuild/esbuild-0.21.5
  npm test && npm run lint               # phải xanh TRƯỚC khi sửa (khung sạch)
  npm run dev                            # http://localhost:3000
  ```
  Nếu `npm test` đỏ trước khi bạn sửa gì: dừng, ghi lỗi vào handback, không tự sửa khung.

## REQUIRED — Task 1 (slice F1)
Đổi ô gõ ID thành chọn theo tên, request gửi đi **giữ đúng id như cũ**:

| # | Chỗ | Hiện tại | Đổi thành | Nguồn dữ liệu (dùng lại, không viết mới) |
|---|---|---|---|---|
| B2 | `features/platform/audit-view.tsx:51` | `TextInput name="root_branch_id" placeholder="UUID"` | `EntityPicker` chọn công ty, hiện **tên công ty + mã (`code`)**, gửi `root_branch_id` ẩn | `useCompanyOptions()` + `usableCompanies()` ở `features/platform/use-support.ts:17-24` (mẫu dùng: `support-request-form.tsx:66`) |
| B4 | `features/production/targets-view.tsx:94` | `Field label="Product UUID"` | `EntityPicker` chọn sản phẩm, hiện **`sku_code` · `name` · `temperature_regime`**, gửi `product_ref` | `getProducts()` ở `lib/api/sales.ts:38`. Lọc ở client, bỏ SKU `RAW_MATERIAL` |
| B5 | `features/production/targets-view.tsx:87` | ô khoá hiện UUID chi nhánh | chữ chỉ đọc hiện **tên chi nhánh**, UUID giữ trong state (không hiển thị) | `branch_name` của context đã đọc ở `targets-view.tsx:33` (`/api/auth/context`). Context không có `branch_name` thì hiện "Chi nhánh hiện tại" |

Hành vi bắt buộc:
- Picker có đủ trạng thái: đang tải, rỗng ("Chưa có công ty/sản phẩm" + 1 câu), lỗi (thông báo + "Thử lại"). Lỗi API thì không cho chọn (fail closed như `usableCompanies`).
- Gõ để lọc theo tên/mã. Bàn phím: ↑ ↓ Enter Esc. Có `label` thật, chưa chọn mà bấm gửi thì báo lỗi ngay tại ô (`aria-invalid`).
- Không còn chữ "UUID"/"ID" nào hiện cho người dùng ở 2 màn này.
- `app/ui-rules-baseline.txt`: xoá 3 dòng B2, B4, B5 (từ 13 xuống 10). Không được thêm dòng.

## CONSTRAINT
- **Chỉ sửa 5 file của slice:** `features/platform/audit-view.tsx`, `features/platform/audit-view.test.tsx`, `features/production/targets-view.tsx`, `features/production/targets-view.test.tsx`, `app/ui-rules-baseline.txt`.
- **Cấm sửa khung.** `app/frame-lock.test.ts` sẽ đỏ, và Claude từ chối merge. Khung gồm: `app/globals.css`, `app/tokens.generated.css`, `app/layout.tsx`, `components/ui/**`, `components/layout/**`, `components/patterns/**`, `eslint.config.mjs`, `app/*-gate.test.ts`, `app/frame-lock.test.ts`, `frame.lock.json`, `scripts/frame-lock.mjs`, `playwright.config.ts`, `e2e/visual/**`, `package.json`, `package-lock.json`. Ngoài ra mọi file không có trong danh sách file của slice (vd. `lib/**`, `mocks/**`) cũng không được đụng.
  - Thiếu gì ở khung (prop của `EntityPicker`, API client thiếu `query`…) thì **không tự vá**. Ghi vào mục "Yêu cầu khung" của handback; Claude làm slice khung riêng.
- Không viết helper/hook/component mới trùng cái đã có. Không màu hex thô, không class `rounded-*`/`duration-*` ngoài thang (lint sẽ chặn). Không import `@/mocks` trong `features/`.
- TDD: viết test đỏ trước (render picker, chọn 1 mục → payload có đúng id; API lỗi → không chọn được), ghi đỏ bằng `verify`, rồi mới code cho xanh.
- Không `--no-verify`, không sửa hook, không sửa `.aidlc/stage-policy.json` hay `.aidlc/runs/*/artifacts/*`, không pnpm, không push.
- Không dừng lại hỏi những câu đã có đáp án ở dưới. Câu thật sự chưa có đáp án: ghi vào handback, làm phần còn lại.

### Đáp án sẵn (đừng hỏi)
- Picker hay `<select>`? → `EntityPicker` của khung, kể cả khi danh sách ngắn.
- Danh sách sản phẩm dài thì sao? → `getProducts()` chỉ lấy trang đầu, lọc ở client là đủ cho slice này. Ghi `ponytail:` comment nêu giới hạn đó. Cần `query` phía server thì ghi vào "Yêu cầu khung".
- Sửa `lib/api/sales.ts` được không? → Không (ngoài 5 file của slice).
- Test gọi API thật? → Không. Unit test stub `fetch`/hook tại biên. Kiểm bằng tay trên `npm run dev` với tài khoản QA.
- Chữ hiển thị: tiếng Việt, động từ cụ thể. Không "OK".
- Gặp ô ID khác ngoài B2/B4/B5 → không sửa, ghi vào handback.

## ACTION
1. `SDLC_ACTOR=antigravity python3 ~/agent_skills/sdlc/engine/sdlc.py claim --task PORTAL-UI-REBUILD-001 --slice F1 --by antigravity`
2. Chạy phần "Bạn chạy" ở trên, xác nhận khung xanh.
3. Viết test đỏ → `python3 ~/agent_skills/sdlc/engine/sdlc.py verify --task PORTAL-UI-REBUILD-001 --cwd ~/wt/portal-ui-f1 unit="npm test"` (ghi đỏ).
4. Code cho xanh → chạy lại verify với `unit="npm test" lint="npm run lint"`.
5. Mở `/platform/audit` và `/production/targets` trên `npm run dev`, chụp 1440px trước/sau, lưu vào `.aidlc/runs/PORTAL-UI-REBUILD-001/evidence/f1/{audit,targets}-{before,after}.png`.
6. Commit trong worktree: `fix(portal): chọn công ty/sản phẩm theo tên thay vì gõ UUID (F1)`.
7. Viết `.aidlc/runs/PORTAL-UI-REBUILD-001/handback.md` + `python3 ~/agent_skills/sdlc/engine/sdlc.py handback --task PORTAL-UI-REBUILD-001`, rồi báo Dawn đường dẫn handback + dòng Tier 1.

## OUTPUT (kết quả Claude nghiệm thu)
- `npm test` và `npm run lint` xanh. `frame-lock` xanh. `git diff portal-ui-rebuild...HEAD --name-only` chỉ chứa 5 file slice và `evidence/f1/*`.
- `app/ui-rules-baseline.txt` còn đúng 10 dòng (không còn B2, B4, B5).
- Test bắt payload: chọn công ty "X" → request audit có `root_branch_id` = id của X; chọn sản phẩm → `lines[].product_ref` = id SKU.
- Mutation (Claude chạy): đổi id gửi đi thành id khác → test phải đỏ.
- 4 ảnh trước/sau trong `evidence/f1/`.
- `handback.md` kết thúc bằng:
  ```
  Tier 1: build PASS · unit x/y · lint PASS · frame-lock PASS · arch PASS (0 new)
  Tier 2: touched-line cover 0.xx · self 0.x
  Tier 3: bar from .aidlc/stage-policy.json → ABOVE|BELOW
  Evidence: .aidlc/runs/PORTAL-UI-REBUILD-001/artifacts/verification.json
  Yêu cầu khung: <danh sách hoặc "không">
  Ô ID khác phát hiện: <danh sách hoặc "không">
  ```
