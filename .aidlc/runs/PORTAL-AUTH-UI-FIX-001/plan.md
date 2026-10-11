# Plan: PORTAL-AUTH-UI-FIX-001 — sửa 4 lỗi UI auth/RBAC pha 1 (login sai logic, thiếu đăng xuất, ma trận quyền, lệch design)

- **Task ID**: `PORTAL-AUTH-UI-FIX-001`
- **Mode**: `hard`
- **Story**: US-UI-002
- **Sprint**: 04
- **Nhánh / worktree**: `auth-rbac-001` @ `~/wt/auth-rbac-001/portal` (đã có 4 commit CRUDIE S12b–e trên `portal-ui-rebuild` 3fb9d64). Không tạo nhánh mới.
- **Issue**: Dawn 11/10 bấm UI pha 1 ra 4 lỗi (login/register khách + login nhân viên sai logic; không có đăng xuất; ma trận quyền là đống text; UI "AI đại trà").

## Scope
- Outcome: khách và nhân viên đăng nhập đúng luồng + đăng xuất được từ mọi khung; ma trận quyền là bảng tài nguyên × CRUDIE có checkbox, một nút "Lưu thay đổi"; màn auth + ma trận đúng design canvas.
- Decision: EXTEND. Chỉ sửa file **ngoài** `frame.lock.json` (53 file: `components/ui/*`, `components/layout/*`, `app/globals.css`…). Dùng lại `Checkbox` 3 trạng thái (`components/ui/checkbox.tsx`), `Segmented`, `Table`, `InlineAlert`, `replaceRole` (`lib/api/platform-client.ts:28`), `logout()` (`lib/auth/client.ts:27`).
- Quan hệ với PORTAL-UI-REBUILD-001 (chống làm 2 nơi):

  | Lỗi | Thuộc | Lý do |
  |---|---|---|
  | 1 màn chưa đúng design | REBUILD U2–U8, U10, U11 (Antigravity) giữ nguyên; task này chỉ thêm S6 (skin màn auth + ma trận) vì REBUILD không có trang `/login` `/register` đầy đủ, chỉ popup U4b và U9 (đã xong) | `PORTAL-UI-REBUILD-001/plan.md` U4b, U9 |
  | 2 login/register | task này (S2, S3). REBUILD U4b (popup khách) **phải gọi lại** `login()`/`register()` đã sửa, không viết logic mới | tránh 2 bản logic |
  | 3 đăng xuất | task này (S1). REBUILD K5/K6 chỉ làm prop `onLogout?` (`console-header.tsx:18`, `store-header.tsx:27`), không frame nào truyền | không trùng |
  | 4 ma trận | task này (S4). REBUILD FR-11/P1 chỉ lọc menu theo quyền | không trùng |

- Gộp nhánh: `portal-ui-rebuild` chưa đi quá 3fb9d64 → sau S5 xanh, merge `auth-rbac-001`(portal) vào `portal-ui-rebuild` TRƯỚC khi Antigravity bắt đầu U2+ (OD-1).
- Impact (đọc code; stack Kong :8000 và portal :3000 đang tắt, auth/org không publish cổng host nên chưa curl được — mọi mô tả runtime là [ASSUMED] tới S5):
  - Đăng xuất: `onLogout` chỉ được khai báo ở shell/header, **không frame nào truyền** → mục "Đăng xuất" (render có điều kiện `store-header.tsx:98`, `console-header.tsx:46`) không bao giờ hiện: `features/store/store-frame.tsx:47-53`, `features/console/console-frame.tsx:82`, `features/platform/workspace.tsx:67-75`. BFF `app/api/auth/logout/route.ts` có sẵn nhưng không xoá cookie `portal_plane` (set ở `lib/api/auth-journey-bff.ts:73`) và trả 429 mà không xoá cookie nào.
  - Login khách: `features/customer-auth/login-form.tsx:28` render `EmptyState` với mô tả = chuỗi lỗi `invalidCredentials` (`messages/vi.json:33`) ngay khi chưa nhập gì → trông như đã lỗi. `:25` mọi lỗi (sai mật khẩu, 403 chưa kích hoạt, 503) gom thành "Đăng nhập không thành công." dù BFF phân biệt 403 "Tài khoản chưa được kích hoạt" (`auth-journey-bff.ts:144`). `:24` luôn `router.push(next_path)` = "/" (`auth-journey-bff.ts:145`); `proxy.ts:25` gắn `?redirect=/cart` mà không form nào đọc (vi phạm luồng giỏ → đăng nhập → quay lại, REBUILD FR-6). Đăng ký → user `PROVISIONED`, phải kích hoạt qua mail (`auth/.aidlc/specs/register.md` Usecase 3–5) nhưng đăng nhập sớm chỉ ra lỗi chung. `store-frame.tsx:51` nút Đăng nhập trên header đi `/login` (trang riêng) thay vì popup canvas (U4b).
  - Login nhân viên: `features/employee-auth/staff-login.tsx:34` cùng lỗi EmptyState-như-lỗi (`messages/vi.json:105`); `:25` chỉ phân biệt 403; `auth-journey-bff.ts:44` whitelist landing nhân viên chỉ 4 đường dẫn cố định → `?redirect=/sales/orders` (`proxy.ts:25`) bị bỏ.
  - Ma trận: `features/platform/role-matrix-view.tsx:56-83` mỗi role là Card + `Badge` cho từng action (đống text), sửa bằng `Textarea` mỗi action một dòng (`parseActions`, `use-role-matrix.ts:11`). Màn `/roles` (`features/roles/roles-view.tsx`, 528 dòng) là **mock cứng** (`ROLES_COLUMNS` VT-xx, không `fetch`) mà `console-nav.ts:13` vẫn trỏ tới (`action: org:company:read`) — gây nhầm "đã có ma trận".
  - Spec org: `GET /platform/companies/{root}/role-matrix`, `GET /org/company/role-matrix` (OWNER xem), `PUT /platform/companies/{root}/role-matrix/roles/{role_code}` body `{actions: string[]}` thay toàn bộ action của **một** role ở mọi chi nhánh, 400 nếu action thuộc module chưa mua, 404 role ngoài danh mục (`org/.aidlc/specs/platform-plane.md` mục 11–12; `org/api/openapi.public.yaml:128-146,205`). Không có PUT cả ma trận; không có endpoint danh mục key [ASSUMED: tập hàng = hợp action của mọi role; OWNER có mọi action nên đủ].

## Requirements
- FR-1 Đăng xuất: khách (menu avatar store) và nhân viên (console + `/platform` + `/company`) có "Đăng xuất"; bấm → `POST /api/auth/logout` → xoá `access_token`, refresh, CSRF **và `portal_plane`** → về trang đăng nhập đúng mặt phẳng.
  - AC-1: Given khách đã đăng nhập, When mở menu avatar, Then thấy "Đăng xuất"; bấm xong tải lại `/cart` bị chuyển `/login?redirect=/cart`.
  - AC-2: Given nhân viên ở `/console`, `/platform/companies`, `/company`, Then cả 3 khung có "Đăng xuất"; sau khi bấm, `/console` chuyển `/staff/login`.
  - AC-3: Given auth trả 429/lỗi mạng khi logout, Then cookie phiên phía portal vẫn bị xoá và có toast báo.
- FR-2 Login/đăng ký khách đúng logic.
  - AC-4: Form mới mở không hiện câu lỗi nào; lỗi chỉ hiện sau submit.
  - AC-5: Phân biệt: 401 sai thông tin; 403 chưa kích hoạt (kèm link `/activate` gửi lại); 429 + Retry-After; 5xx/503 "dịch vụ bận". Mỗi nhánh một chuỗi vi/en riêng.
  - AC-6: Vào từ `/cart` bị chặn → sau login về đúng `redirect` nếu thuộc `products|cart|checkout|orders|me` (`safeLanding`, `auth-journey-bff.ts:45`), ngoài whitelist về `/`. Redirect ngoài site hoặc `//` bị bỏ.
  - AC-7: Đăng ký xong (202 `accepted`, `register.md`) form chuyển trạng thái "Kiểm tra email để kích hoạt" + nút gửi lại (`/auth/activate/resend` đã có ở `customer-auth.ts`).
- FR-3 Login nhân viên đúng logic.
  - AC-8: Như AC-4/AC-5 cho form nhân viên; 403 `FORBIDDEN` (không có membership EMPLOYEE) có link sang `/login`.
  - AC-9: `?redirect=` thuộc `CONSOLE_ROUTES` (`lib/fetcher`) được giữ khi chỉ có 1 ngữ cảnh; nhiều org → `/staff/switch-org`; nền tảng → `/platform/companies`.
- FR-4 Ma trận quyền là bảng.
  - AC-10: Hàng = `service:tài nguyên` (nhóm theo service), cột = C R U D I E (create/read/update/delete/import/export), mỗi ô là `Checkbox`; chọn role bằng `Segmented`. Key có động từ ngoài CRUDIE hiện ở cột "Khác" chỉ đọc, không mất khi lưu.
  - AC-11: Đổi ô → role đánh dấu "chưa lưu"; thanh đáy hiện số thay đổi và **1 nút "Lưu thay đổi"** (+ "Huỷ"). Bấm → `PUT .../roles/{role}` cho từng role đã đổi (`replaceRole`); thành công hết → toast; role lỗi → giữ nháp role đó và báo tên role + lý do (400 module chưa mua / 404).
  - AC-12: `editable=false` (OWNER xem, `/company`) → checkbox disabled, không có nút lưu (cờ `editable` đã có ở `role-matrix-view.tsx`).
  - AC-13: `/roles` mock bị bỏ khỏi `console-nav.ts` hoặc trỏ sang bảng thật chỉ đọc (OD-2).
- FR-5 Design: màn auth khách/nhân viên + bảng ma trận dùng token canvas (đỏ cà chua, Be Vietnam Pro/Nunito, 1 màu chính, glass chỉ hero/L2-L3); animation tách S6.
  - AC-14: `npm run lint` 0 lỗi; `app/layout-gate.test.ts`, `app/ui-rules-gate.test.ts`, `app/frame-lock.test.ts` xanh (không file khung nào đổi byte).
  - AC-15: Antigravity chụp 5 màn (login khách, đăng ký, login nhân viên, ma trận platform, menu avatar) so canvas XuyqU2bzEpihN9Cb4sfqx4, ghi walkthrough (S7).
- Ngoài phạm vi: viết test mới (Dawn chốt không test thừa, chỉ sửa test cũ đỏ); sửa BE auth/org; popup khách U4b (REBUILD); phòng ban/chức danh; PUT toàn ma trận.

## Technical definition
- Spec: [register.md](../../../../auth/.aidlc/specs/register.md), [role-matrix.md](../../../../org/.aidlc/specs/role-matrix.md), [platform-plane.md](../../../../org/.aidlc/specs/platform-plane.md), [REBUILD plan](../PORTAL-UI-REBUILD-001/plan.md). (Đường dẫn tương đối tính từ thư mục ticket/; worktree dùng bản main.)
- NFR bảo mật: redirect chỉ qua `safeLanding` phía server (BFF nhận thêm field tuỳ chọn `redirect`; allow-list ở `auth-journey-bff.ts:130` phải thêm); không lộ token; logout xoá cookie kể cả khi upstream lỗi. RBAC thuần role × CRUDIE, cấm so tên role.
- Ràng buộc: không sửa file trong `frame.lock.json`; chạy `npm test` toàn bộ — **không** dùng `npm test -- <path>` (script bọc `sh -c`, đối số bị nuốt, PASS giả).

## UX
- Bảng ma trận: cột tên tài nguyên dính trái, nhóm service thu gọn được, thanh lưu dính đáy khi có thay đổi; mobile 390: không cuộn ngang, mỗi tài nguyên là 1 hàng 6 chip bấm được.
- Menu avatar giữ cấu trúc K5/K6; "Đăng xuất" màu `text-err` (có sẵn).
- Wireframe: canvas XuyqU2bzEpihN9Cb4sfqx4, bản sao `~/dawn-dotfiles/brain/inbox/portal-ui-preview/` (BRIEF.md).

## Design
- Không thêm module. Hàm mới tối thiểu: `useLogout()` dùng chung đặt trong `lib/auth/client.ts`; `matrixRows(data)` + `diffByRole()` trong `features/platform/use-role-matrix.ts` (thay `parseActions` nếu hết nơi dùng).
- BFF: `/api/auth/login` và `/api/auth/staff/login` nhận `{identifier, password, redirect?}`.

## Files planned
- features/store/store-frame.tsx
- features/console/console-frame.tsx
- features/platform/workspace.tsx
- lib/auth/client.ts
- app/api/auth/logout/route.ts
- lib/api/auth-journey-bff.ts
- lib/api/customer-auth.ts
- lib/api/employee-auth.ts
- lib/api/auth-journey-bff.test.ts
- app/api/auth/bff.test.ts
- features/customer-auth/login-form.tsx
- features/customer-auth/register-form.tsx
- features/employee-auth/staff-login.tsx
- features/customer-auth/auth-popup.tsx
- features/customer-auth/form-feedback.tsx
- messages/vi.json
- messages/en.json
- features/platform/role-matrix-view.tsx
- features/platform/use-role-matrix.ts
- features/platform/role-matrix.test.ts
- features/console/console-nav.ts
- .aidlc/runs/PORTAL-AUTH-UI-FIX-001/

## Tests planned
| TC | AC | layer | command |
|---|---|---|---|
| TC-1 | AC-1..3 | unit cũ | `npm run lint && npm run typecheck && npm test` (bff.test, client.test, store-shell.test hiện có) |
| TC-2 | AC-4..9 | unit cũ | như trên (customer-auth/employee-auth `journey.test.tsx`, `auth-journey-bff.test.ts`); chỉ sửa assertion đỏ do đổi chuỗi/UI |
| TC-3 | AC-10..13 | unit cũ | như trên (`role-matrix.test.ts`) |
| TC-4 | AC-1,2,6,11 | live (Claude, không thêm file test) | Kong :8000 + portal :3000; curl BFF login/logout bằng tài khoản `PORTAL-REBRAND-001/anti/accounts.local.md` (pass `REDACTED`); PUT thật trên công ty QA |
| TC-5 | AC-14,15 | Anti | Playwright Brave so canvas |

## Slices
- [x] S1: Đăng xuất mọi khung + xoá cookie đủ kể cả `portal_plane` và khi upstream 429/lỗi (files: features/store/store-frame.tsx, features/console/console-frame.tsx, features/platform/workspace.tsx, lib/auth/client.ts, app/api/auth/logout/route.ts; test: npm run lint && npm run typecheck && npm test)
- [x] S2: BFF + client nhận `redirect` an toàn cho cả hai hành trình, whitelist landing nhân viên theo `CONSOLE_ROUTES`, lỗi login phân biệt 401/403/429/5xx (files: lib/api/auth-journey-bff.ts, lib/api/customer-auth.ts, lib/api/employee-auth.ts, lib/api/auth-journey-bff.test.ts, app/api/auth/bff.test.ts; test: npm run lint && npm run typecheck && npm test)
- [x] S3: Form login khách + đăng ký + login nhân viên: bỏ EmptyState-như-lỗi, đọc `?redirect`, trạng thái chưa kích hoạt/gửi lại, chuỗi vi/en (files: features/customer-auth/login-form.tsx, features/customer-auth/register-form.tsx, features/employee-auth/staff-login.tsx, messages/vi.json, messages/en.json; test: npm run lint && npm run typecheck && npm test — sửa journey.test.tsx hiện có nếu đỏ)
- [x] S4: Ma trận quyền dạng bảng tài nguyên × CRUDIE, checkbox, 1 nút "Lưu thay đổi" (PUT từng role đổi), chỉ-đọc cho OWNER, bỏ mock `/roles` khỏi menu (files: features/platform/role-matrix-view.tsx, features/platform/use-role-matrix.ts, features/platform/role-matrix.test.ts, features/console/console-nav.ts; test: npm run lint && npm run typecheck && npm test)
- [ ] S5: Claude chạy live + gộp nhánh: curl login/logout 2 mặt phẳng, PUT ma trận thật, `verify --task PORTAL-AUTH-UI-FIX-001`, merge `auth-rbac-001`(portal) → `portal-ui-rebuild` (files: .aidlc/runs/PORTAL-AUTH-UI-FIX-001/live.md; test: test -s .aidlc/runs/PORTAL-AUTH-UI-FIX-001/live.md và curl x3 xanh)
- [x] S6: Antigravity — skin theo canvas + hiệu ứng/animation theo token cho login khách/nhân viên, đăng ký, bảng ma trận (hover hàng, chuyển checkbox, thanh lưu trượt lên, rung nhẹ khi lỗi); không đổi logic, không đụng file khung (files: features/customer-auth/login-form.tsx, features/customer-auth/register-form.tsx, features/employee-auth/staff-login.tsx, features/platform/role-matrix-view.tsx; test: npm run lint && npm run typecheck && npm test)
- [x] S7: Nghiệm thu UI bởi Antigravity — không code: Playwright Brave chụp 5 màn desktop 1440 + mobile 390, so canvas, đối chiếu log Kong, walkthrough cho Dawn comment (files: .aidlc/runs/PORTAL-AUTH-UI-FIX-001/anti-walkthrough.md; test: test -s .aidlc/runs/PORTAL-AUTH-UI-FIX-001/anti-walkthrough.md)
- [x] S8: Sidebar nhân viên lọc theo key quyền + trang "Không có quyền truy cập" khi vào thẳng URL (files: features/console/console-nav.ts, features/console/console-frame.tsx, lib/api/auth-journey-bff.ts; test: npm run lint && npm run typecheck && npm test)
- [x] S9: Popup đăng nhập/đăng ký giữ `redirect` khi đổi tab + theo locale NEXT_LOCALE (files: features/customer-auth/auth-popup.tsx, features/customer-auth/form-feedback.tsx, features/customer-auth/login-form.tsx, features/customer-auth/register-form.tsx; test: npm run lint && npm run typecheck && npm test)

Giao: S1–S4 → Sonnet (tuần tự S1→S2→S3→S4, S2/S3 chung BFF/messages; mỗi slice ≤150k token); S5 → Claude; S6–S7 → Antigravity (brief 5 phần).

## Risks / rollback
- `auth-journey-bff.ts` đã dày test AUTH-SPLIT → S2 chỉ thêm field `redirect` + map lỗi, chạy lại toàn bộ `npm test`.
- PUT từng role không nguyên tử: lưu dở có thể lệch → báo rõ role nào đã/chưa lưu; không retry tự động.
- Merge sang `portal-ui-rebuild` có thể đụng `staff-login.tsx` nếu Antigravity đã sửa → S5 làm trước khi U2+ bắt đầu.
- Rollback: bỏ commit S1–S4 trên `auth-rbac-001`.

## Open decisions
- OD-1 CHỐT (Dawn 11/10): gộp `auth-rbac-001`(portal) vào `portal-ui-rebuild` sau S5, trước U2.
- OD-2 CHỐT (Dawn 11/10): `/roles` thay bằng bảng thật chỉ đọc (`GET /org/company/role-matrix`, OWNER xem).
- OD-3 CHỐT (Dawn 11/10): 1 role/lần (hàng tài nguyên × 6 cột CRUDIE), vừa 1440 và 390.
- OD-3b CHỐT (Dawn 11/10): chấp nhận PUT từng role (không nguyên tử); bố cục 1 role/lần nên mỗi lần Lưu chỉ 1 PUT.
- OD-4 Nhân viên đăng nhập ở form khách: hiện được cấp phiên khách (`auth-journey-bff.ts:145`). Mặc định: giữ (customer = user đã kích hoạt, ADR-024). [ASSUMED]
- OD-5 Chưa curl được luồng thật vì Kong/portal tắt: bật stack ở S5. [ASSUMED] mọi mô tả runtime ở Impact.
