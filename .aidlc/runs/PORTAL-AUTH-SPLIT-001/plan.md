# Plan: PORTAL-AUTH-SPLIT-001

- **Task ID**: `PORTAL-AUTH-SPLIT-001`
- **Mode**: `hard`
- **Story**: US-UI-002
- **Sprint**: 04
- **Issue**: Dawn 04/10: “thêm 1 màn đăng ký/đăng nhập cho user (customer), employee riêng 1 bản, không chung đụng gì nhau”. Bản kế hoạch hard chưa được duyệt; không thực thi hoặc tự duyệt. Red-first/mutation/browser bên dưới là công việc tương lai, chưa chạy kiểm thử implementation trong lượt plan.

## Scope
- Outcome: hai hành trình độc lập; 0 import trực tiếp/gián tiếp giữa `features/customer-auth` và `features/employee-auth`; 0 trang dựng cả hai form hoặc đổi hành trình bằng `mode`; 2/2 hành trình hoàn thành từ đầu đến cuối; 0 cookie phiên mới được gửi trước khi BFF chấp nhận hành trình.
- Decision: EXTEND route khách, CREATE route/form/shell/BFF nhân viên, REMOVE module/form/shell auth chung; REUSE primitives `components/ui/*`, tokens và transport phiên.
- Impact (đã đọc source): `app/(auth)/layout.tsx:2-5` dùng một `AuthShell`; `app/(auth)/login/page.tsx:11` và `app/(auth)/reset-password/page.tsx:11` quảng bá màn chung; `features/auth/login-form.tsx:30-31` chọn landing ở client. `lib/auth/client.ts:33-97` dùng một bộ BFF; `app/api/auth/login/route.ts:18-35` gửi cookie ngay sau auth. `proxy.ts:19-25` và `lib/fetcher.ts:62-65` đều đẩy về `/login`.
- Ranh giới: portal chỉ sở hữu UI/BFF; credentials/session thuộc auth, quyền cuối cùng thuộc org (`AGENTS.md:3-5`). Không thay DB, backend, membership, mail hoặc quy trình OWNER duyệt; endpoint/contract thực sự thiếu là dependency trước slice liên quan.

## Requirements
- FR-1: customer có `/login`, `/register`, `/activate`, `/forgot-password`, `/reset-password`; employee có `/staff/login`, `/staff/forgot-password`, `/staff/reset-password`, `/staff/invite/accept`, `/staff/switch-branch`, `/staff/switch-org`; không có employee self-register.
  - AC-1: Given khách vãng lai hoặc nhân viên được mời, When mở từng URL, Then 11/11 route có đúng shell/form của hành trình; `/staff/register` trả 404, 0 link tự đăng ký trong staff; 2/2 chuỗi register→activate→login và invite→set-password→login thành công.
- FR-2: tách mọi page/form/client/shell/BFF entry point; chỉ dùng chung primitives thiết kế và infrastructure, không generic form nhận `customer|employee`.
  - AC-2: Given toàn bộ source và dependency graph, When chạy gate, Then cross-import hai chiều = 0, trang chứa cả hai form = 0, màn đổi journey bằng nhánh runtime = 0; ba mutation tại Technical definition đều làm test đỏ.
- FR-3: BFF quyết định eligibility và `next_path` bằng auth/org đã xác minh; không tin `account_type`, số membership hoặc `redirect` từ client.
  - AC-3: Given ACTIVE customer-only, When gọi staff login với DTO hợp lệ, Then 403 `FORBIDDEN`, thông báo “Tài khoản này chưa có quyền nhân viên. Đăng nhập mua hàng tại /login”, không cookie mới; body thêm `account_type`/`roles` không thuộc DTO trả400 `BAD_REQUEST`; staff org lỗi/schema sai thì fail closed, không suy ra customer; customer ACTIVE không cần org membership.
  - AC-4: Given ACTIVE user, When login khách, Then `next_path=/` hoặc allowlist store; Given employee, When staff login, Then nhiều org → `/staff/switch-org`, một org/nhiều branch → `/staff/switch-branch`, một branch → BFF chọn context thành công rồi `/console`; 0 redirect khác origin/cross-plane. [ASSUMED D1] ACTIVE employee được dùng vai customer nhưng chỉ landing store; đây không phải wrong-account theo hợp đồng đa vai.
- FR-4: switch context chỉ thuộc employee, lựa chọn phải được org xác minh; link cũ không dựng màn auth chung.
  - AC-5: Given customer-only/employee hoặc context tenant khác, When switch, Then customer 403, thiếu phiên 401, tenant khác không được chọn; Given link `/switch-branch`, `/switch-org`, `/invite/accept?token=…`, When mở, Then redirect đúng `/staff/*`, giữ token cần thiết, không loop; 0 import/link tới module đã xoá.
- FR-5: validation, loading, lỗi và a11y riêng theo journey, không lộ token/account enumeration.
  - AC-6: Given input sai hoặc request đang chạy, When submit, Then 1 request tối đa, lỗi gắn field/focus, nút có trạng thái bận; forgot trả thông báo trung tính; token replay/hết hạn không thành công; 22/22 kiểm tra route×viewport, keyboard và a11y đạt ngưỡng trong Anti checklist.
- Ngoài phạm vi: onboarding/admin duyệt lời mời, sửa auth/org/platform backend hoặc mail templates, đổi quyền, tạo tài khoản employee bằng register, redesign toàn portal, tách kho session/cookie theo journey.

## Technical definition
- Căn cứ: [register](../../../../auth/.aidlc/specs/register.md):9,13,18 (password ≥12 ký tự/≤256 byte UTF-8, 202; byte policy đối chiếu `../auth/internal/domain/password.go:7-8` và `../auth/internal/transport/http/error_mapper.go:67-68`); [invite](../../../../auth/.aidlc/specs/invite.md):49-58,70 (đặt password rồi login); [employee-onboard](../../../../org/.aidlc/specs/employee-onboard.md):41-49 (duyệt trước membership EMPLOYEE). [ADR-024](../../../../platform-docs/docs/adr/ADR-024-kien-truc-mvp.md):27-29: customer là activated user, không cần membership.
- ADR-026 có trên branch local `platform-docs:adr-026-platform-plane`, `docs/adr/ADR-026-ba-mat-phang-owner-hop-dong-duyet-moi.md:3,23-35`: ACCEPTED, một danh tính/multiple planes, không `account_type`; employee `/console`, platform `/platform`. Snapshot branch là nguồn tham chiếu, không coi working tree đã có file.
- Gate đỏ trước: thêm `features/auth-boundary.test.ts` dùng Vitest/node + TypeScript AST; quét `.ts/.tsx`; ownership customer gồm `features/customer-auth/*`, `lib/api/customer-auth.ts`, `components/layout/customer-auth-shell.tsx`, customer routes/BFF; employee gồm các path staff/employee tương ứng; resolve alias/relative/barrel/dynamic import literal, lần theo dependency transitive; fail cross-import cả hai chiều và route dependency/render tree chứa cả hai journey, generic mode branch hoặc copy màn chung. Source hiện tại tại Scope phải làm gate đỏ trước di chuyển; không allowlist legacy để né đỏ.
- Oracle gate: thiếu một trong hai module/shell hoặc 11 route chưa có ownership đúng đều fail; tồn tại/import `features/auth/*`, `components/auth/login-form.tsx`, `components/layout/auth-shell.tsx` đều fail. Graph production loại file test nhưng detector vẫn chạy trên fixtures âm/dương; mỗi page chỉ được tới form/client/shell của mình; không cho dynamic import không resolve được trong module auth. Kiểm JSX/AST props và conditional chứa lựa chọn journey; static render hai shell/form độc lập kiểm marker `data-auth-journey` duy nhất. Copy chung tại `app/(auth)/login/page.tsx:11` và reset `:11` là regression fixture, không chỉ kiểm tên file.
- Mutation sau xanh: (1) customer login import employee login; (2) employee reset import customer reset; (3) một page import/render cả hai login form hoặc thêm `mode === "customer"` để chọn form. Mỗi edit riêng phải làm `npm test` exit khác 0, sau đó hoàn tác mutation; test kiểm behavior/graph thực, không chỉ snapshot tên file.
- NFR: BFF/login/token response `no-store`, không log password/token, không đưa access token vào JSON; giữ Secure/HttpOnly/SameSite cookie như `app/api/auth/login/route.ts:18-35`. Session tạm của auth bị BFF từ chối phải revoke bằng upstream logout với cookie/CSRF, trước khi trả lỗi; cơ chế logout hiện tại `app/api/auth/logout/route.ts:7-18`.
- Proxy chỉ nhận biết route/phiên sơ bộ, không tự phân loại bằng sự có cookie (`proxy.ts:16-25`); eligibility thuộc BFF. Full unit chạy `npm test`, rồi `npm run lint` và `npm run typecheck`; không dùng `npm test -- path`.
- Proxy mở chính xác staff login/forgot/reset/invite, giữ switch routes cần phiên; `/staff/register` trả404 ngay cả khi chưa có cookie, không redirect vòng. Cookie sẵn có không đủ để bypass màn login hoặc suy eligibility; test phiên customer đang mở staff và phiên employee đang mở customer theo D1.
- Dependencies trước cutover: [ASSUMED D2] giữ khả năng login platform bằng entry point riêng thuộc task platform; hiện `features/auth/home-for.ts:25-46` chọn `/platform/companies` nên bỏ nhánh chung khi chưa có replacement sẽ gây regression. [ASSUMED D3] phải chốt trusted metadata và return URL cho recovery trước nối staff recovery; không suy account type từ email/token client. [ASSUMED D4] bổ sung/đối chiếu spec login/activation/recovery và `standards/ui-ux.md` thiếu trong working tree; không tự bịa endpoint hoặc policy.

## UX
- Brand Dawn chốt: Bếp Tươi, đỏ cà chua `#D2402A`, display Quicksand + body Nunito; lấy token từ `../platform-docs/ui/tokens.json:2,27,192,196`, không hardcode palette/font mới. Chốt hiện tại thắng kit Đồng xanh/AuthShell dùng chung của `.aidlc/runs/PORTAL-SHELL-001/plan.md:20-27,84-89`.
- Customer: khung cửa hàng ấm, logo + card rõ ràng, hero ảnh thực phẩm được phép; glass chỉ trong hero. Employee: khung console gọn, nền đặc, logo + nhãn “Dành cho nhân viên”, không hero/glass, không register. Form, heading, feedback và link hành trình nằm riêng; dùng Button/Input/Label cùng tokens.
- Wireframe chữ: customer = `[logo] [hero tùy chọn | form] [điều khoản]`; employee = `[logo/nhân viên] [form hoặc chọn context] [hỗ trợ quản trị]`; shell sở hữu đúng 1 `main#main`, SkipLink; mobile một cột, không tràn ngang.
- Skill `ui-ux-pro-max` đã chạy 04/10, `D=/home/dawn/.claude/plugins/marketplaces/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max`: `python3 $D/scripts/search.py "login register ecommerce food customer" --domain ux` và `"staff login internal console" --domain ux` đều 0 kết quả; không xem đó là recommendation.
- Tra cứu UX bổ sung `"form validation labels" --domain ux`, `"keyboard focus navigation" --domain ux`: output khuyến nghị labels rõ, validation khi blur, feedback submit, keyboard/visible focus; áp dụng focus không bị che, không bắt buộc toàn bộ chuẩn AAA. `python3 $D/scripts/search.py "auth form" --stack nextjs`: output nhắc Server Actions và proxy guards; giữ BFF contract hiện có, không chuyển Server Actions; bỏ lời khuyên cache không liên quan auth.
- Mỗi journey có autocomplete phù hợp, label thật, `aria-describedby`/`aria-invalid`, lỗi `role=alert`, trạng thái thành công `role=status`, focus lỗi đầu tiên, bàn phím Enter/Tab, nút chạm ≥44px, reduced motion; customer reset→customer login, staff reset/invite→staff login.

## Design
- `app/(auth)` trở thành customer-only; `app/(employee-auth)/staff` có layout riêng. Mỗi page chỉ import module mình; fetch chỉ ở `lib/api/*`, route handler mỏng gọi BFF helper theo `../platform-docs/standards/frontend.md:15-17,31`; nội dung mới qua next-intl theo `:59`. Xoá toàn bộ `features/auth/*`, `components/auth/login-form.tsx`, `components/layout/auth-shell.tsx`; sửa importer `app/rebrand.test.ts:14`, layout export và gate. Màn switch cũ thành redirect-only; thêm `/invite/accept` redirect vì mail đã dùng URL đó (`../auth/.aidlc/specs/invite.md:43`).
- `lib/auth/client.ts` chỉ còn shared transport/profile/logout/refresh, primitives sanitization; chuyển login/register/activate/recovery/switch sang client từng journey. `lib/api/auth-journey-bff.ts` là helper server-only cho BFF, không form/screen; không client import. Cập nhật `lib/fetcher.ts:13-21,62-65` và proxy theo route family để 401 console/staff về staff login, store về customer login.
- Login policy: lấy profile/status từ auth, staff lấy org `/org/access-contexts/me` bằng access token tạm; `../auth/internal/transport/http/dto/auth_dto.go:30-43` không có account_type. Danh sách chọn context lấy org đã xác minh, không dùng `UserProfile.memberships` thiếu member_type (`lib/auth/client.ts:23-29`). Org trả `member_type`, `branch_id`, `roles` (`../org/internal/transport/http/access_contexts.go:14-22`) và chỉ rows memberships/branches ACTIVE (`../org/internal/repository/query/authorization.sql:107-124`); dedupe branch, không count role rows. Customer không tạo membership; staff bắt buộc ≥1 EMPLOYEE ACTIVE; org lỗi không biến thành 0 context. Platform quyết định độc lập theo D2.
- Sau phân loại, BFF trả `next_path` cố định/allowlist theo journey; parse URL, từ chối origin ngoài và URL chuẩn hoá thoát plane, kể cả encoded/backslash. Nhiều org chọn org trước branch; chọn org chỉ chuyển tới danh sách branch đã được server xác minh, chưa gọi auth với branch rỗng. Cả hai switch BFF chỉ mutate khi có cặp `{org_id,branch_id}` hợp lệ; upstream yêu cầu cả hai (`../auth/internal/transport/http/dto/profile_dto.go:52-55`, `../auth/internal/application/session/context.go:12-14`). Một branch tự chọn trên server; thất bại chọn context không gửi cookie mới hoặc `/console`.
- API proposed, tất cả POST: customer `/api/auth/login` `{identifier,password}` → auth `/auth/web/login`, email/phone nằm trong identifier, response thêm `next_path`; `/api/auth/register` → `/auth/register` `{email|phone,password,display_name?}` →202; `/api/auth/activate` `{token}`, `/activate/resend` `{email}`, `/forgot` `{email}`, `/reset` `{token,new_password}` giữ upstream contract sau đối chiếu D4 (`lib/auth/client.ts:33-97`).
- Staff POST `/api/auth/staff/login`, `/api/auth/staff/forgot`, `/api/auth/staff/reset` có DTO tương ứng nhưng BFF riêng; `/api/auth/staff/invite/accept` `{token,password}` → auth `/auth/invite/accept` →200 `{status:"activated"}`; `/api/auth/staff/switch-branch`, `/api/auth/staff/switch-org` `{org_id,branch_id}` → auth context switch (hiện `app/api/auth/switch-org/route.ts:13-27`). Legacy BFF `/api/auth/switch-*` xoá; cập nhật caller `app/(store)/me/profile-client.tsx:234` sang staff client/link.
- Invite user mới dùng token `ACCEPT_INVITE`, không chuyển sang password reset; user đã ACTIVE được auth trả `EXISTING` thì giữ credential và vào `/staff/login`, không bắt nhận token/set-password mới (`../auth/.aidlc/specs/invite.md:17,49-58`, `../org/.aidlc/specs/employee-onboard.md:45`).
- Shared session `/api/auth/{me,context,logout,refresh}` là transport, không shared journey screen. Không schema migration; auth/org vẫn quyết định token purpose, password, replay và quyền tenant. Recovery DTO chỉ email/token+new_password (`../auth/internal/transport/http/dto/recovery_dto.go:3-9`), mail luôn `/reset-password` (`../auth/internal/adapter/notification/email.go:128`), unknown/suspended silent success (`../auth/internal/application/recovery/service.go:146-155`): D3 là dependency route-aware delivery/token provenance thật sự, không thêm backend slice hoặc workaround URL/localStorage ở đây.
- Errors: dùng wire codes từ `../platform-docs/docs/api/error-code-usage.md:60-77,88-98`: `VALIDATION_ERROR` 400, `BAD_REQUEST` 400, `UNAUTHORIZED` 401, `FORBIDDEN` 403, `INTERNAL_ERROR` 500/503, `rate_limit_exceeded` 429. BFF không sáng tạo `WRONG_ACCOUNT_TYPE`; wrong journey = `FORBIDDEN` + message/link rõ. Preserve upstream status/code/Retry-After; `invalid_token`, `service_busy` đã có mapper (`../auth/internal/transport/http/error_mapper.go:26,41-42,101-102`) nhưng chưa có trong bảng usage: dependency đồng bộ registry, không tự đặt mã canonical.

## Files planned
- features/auth-boundary.test.ts
- app/layout-gate.test.ts
- lib/api/auth-journey-bff.ts
- lib/api/auth-journey-bff.test.ts
- app/api/auth/login/route.ts
- app/api/auth/staff/login/route.ts
- app/api/auth/bff.test.ts
- app/api/auth/staff/bff.test.ts
- lib/api/customer-auth.ts
- components/layout/customer-auth-shell.tsx
- features/customer-auth/form-feedback.tsx
- features/customer-auth/login-form.tsx
- features/customer-auth/register-form.tsx
- features/customer-auth/activate-view.tsx
- features/customer-auth/forgot-form.tsx
- features/customer-auth/reset-form.tsx
- features/customer-auth/journey.test.tsx
- app/(auth)/layout.tsx
- app/(auth)/login/page.tsx
- app/(auth)/register/page.tsx
- app/(auth)/activate/page.tsx
- app/(auth)/forgot-password/page.tsx
- app/(auth)/reset-password/page.tsx
- lib/api/employee-auth.ts
- components/layout/employee-auth-shell.tsx
- features/employee-auth/form-feedback.tsx
- features/employee-auth/login-form.tsx
- features/employee-auth/forgot-form.tsx
- features/employee-auth/reset-form.tsx
- features/employee-auth/invite-form.tsx
- features/employee-auth/switch-context.tsx
- features/employee-auth/journey.test.tsx
- app/(employee-auth)/layout.tsx
- app/(employee-auth)/staff/login/page.tsx
- app/(employee-auth)/staff/forgot-password/page.tsx
- app/(employee-auth)/staff/reset-password/page.tsx
- app/(employee-auth)/staff/invite/accept/page.tsx
- app/(employee-auth)/staff/switch-branch/page.tsx
- app/(employee-auth)/staff/switch-org/page.tsx
- app/api/auth/register/route.ts
- app/api/auth/activate/route.ts
- app/api/auth/activate/resend/route.ts
- app/api/auth/forgot/route.ts
- app/api/auth/reset/route.ts
- app/api/auth/staff/forgot/route.ts
- app/api/auth/staff/reset/route.ts
- app/api/auth/staff/invite/accept/route.ts
- app/api/auth/staff/switch-branch/route.ts
- app/api/auth/staff/switch-org/route.ts
- app/api/auth/switch-branch/route.ts
- app/api/auth/switch-org/route.ts
- app/(auth)/switch-branch/page.tsx
- app/(auth)/switch-org/page.tsx
- app/(employee-auth)/invite/accept/page.tsx
- app/(store)/me/profile-client.tsx
- lib/auth/client.ts
- lib/auth/client.test.ts
- proxy.ts
- proxy.test.ts
- lib/fetcher.ts
- lib/fetcher.test.ts
- features/auth/activate-view.tsx
- features/auth/forgot-form.tsx
- features/auth/form-alert.tsx
- features/auth/home-for.test.ts
- features/auth/home-for.ts
- features/auth/login-form.tsx
- features/auth/register-form.tsx
- features/auth/reset-form.tsx
- features/auth/switch-branch-page.tsx
- components/auth/login-form.tsx
- components/layout/auth-shell.tsx
- components/layout/index.ts
- app/rebrand.test.ts
- messages/vi.json
- messages/en.json
- lib/api/auth-review-fix.test.ts
- app/(auth)/legacy-context.test.ts

## Tests planned
| TC | AC | layer | command |
|---|---|---|---|
| TC-01 | AC-2 | unit/AST graph + mutation | `npm test` (full run, đỏ trước di chuyển; 3 mutations đỏ riêng) |
| TC-02 | AC-3,4 | BFF/unit mock upstream | `npm test`: customer-only→staff403; employee→staff200/store200; org503/malformed fail closed; account_type giả400; cookies/revoke; 0/1/nhiều org/branch, context switch lỗi, safe landing |
| TC-03 | AC-1,6 | unit/render + BFF contract | `npm test`: riêng forms/shells, 202 register, invite200/new user, EXISTING giữ credential, staff register404 có/không cookie, submit/loading/error, query token |
| TC-04 | AC-5 | unit/BFF/proxy | `npm test`: tenant khác, thiếu token, dedupe branches, legacy redirects, 401 route family, stale imports =0 |
| TC-05 | AC-1..6 | static/regression | `npm test` + `npm run lint` + `npm run typecheck` + `python3 ~/agent_skills/sdlc/engine/archcheck.py` (0 vi phạm mới) |
| TC-06 | AC-1,3..6 | browser/live | Anti checklist dưới đây; không giao browser cho worker |
- Bad cases theo cấu trúc `testkit/errors.md` (category → input → expected → TC; chưa tạo artifact trong lượt plan):
| Category | Input / expected | TC |
|---|---|---|
| missing_field | thiếu identifier/password/token/org_id/branch_id →400 validation/token upstream, không mutate/cookie | TC-02..04 |
| wrong_type | field array/object/null, JSON hỏng, account_type giả →400 `VALIDATION_ERROR`/`BAD_REQUEST`; không dùng claim giả | TC-02..04 |
| boundary | password 11/12 ký tự và 256/257 bytes UTF-8, Unicode vượt byte; 0/1/2 branches, 2 role rows cùng branch →validation hoặc landing chính xác | TC-02,03 |
| authz | customer-only→staff403, inactive→login từ chối, client giả role, org unavailable→fail closed | TC-02,04 |
| tenant | switch context ngoài tenant →upstream deny; 0 cookie/context đổi | TC-04 |
| replay | dùng lại activation/invite/reset token đã thành công →upstream reject; 0 phiên tạo thêm | TC-03,06 |
| expired_token | token đã cấp rồi hết hạn, không dùng token ngẫu nhiên thay expiry →upstream reject, link quay đúng journey | TC-03,06 |
- Không category N/A; hành vi token/tenant có test dù backend không đổi. Fixtures: ACTIVE customer 0 memberships, employee 1/2 branches, multi-role cùng branch, inactive, platform-only và dual-role; mật khẩu/token không nằm trong ảnh/log.
- Anti checklist: 11 routes × mobile 390×844 và desktop 1440×900 =22/22 case pass; đúng shell/hero policy, 1 main, 0 horizontal overflow, 0 link sai hành trình, target ≥44px. Ba redirect legacy ×2 viewport =6/6, token giữ đúng, 0 loop.
- Anti: 2/2 live journeys + 2/2 recovery journeys hoàn tất với mail thật; wrong-account customer-only→staff =1/1 reject/no new cookie; platform-only ở /staff/login → /platform/companies, không vào console (D2 Dawn chốt 2026-10-05); employee→customer =2/2 viewport store landing theo D1; invalid/expired/replay activation/invite/reset =9/9 reject.
- Anti: lời mời cho ACTIVE customer có sẵn → staff login thành công, user/credential không bị tạo lại =2/2 viewport; các case wrong-account lặp khi đã có cookie =2/2, không bypass nhờ cookie.
- Anti: Tab/Shift+Tab/Enter, focus visible/không bị che, labels/errors đọc được =22/22 route×viewport; axe serious/critical =0, contrast chữ thường ≥4.5:1; ghi ảnh/kết quả cho từng case, thiếu dependency D2/D3 không đánh pass.

## Slices
- [x] S1: Gate isolation đỏ trên màn chung hiện tại, kiểm fixtures alias/barrel/dynamic (files: features/auth-boundary.test.ts, app/layout-gate.test.ts; test: npm test; coverage: TC-01, kỳ vọng đỏ)
- [x] S2: BFF policy server-only fail closed và landing đúng plane (files: lib/api/auth-journey-bff.ts, lib/api/auth-journey-bff.test.ts, app/api/auth/login/route.ts, app/api/auth/staff/login/route.ts, app/api/auth/bff.test.ts; test: npm test; coverage: TC-02)
- [x] S3: Customer client/shell/login độc lập (files: lib/api/customer-auth.ts, components/layout/customer-auth-shell.tsx, features/customer-auth/form-feedback.tsx, features/customer-auth/login-form.tsx, features/customer-auth/journey.test.tsx; test: npm test; coverage: TC-03)
- [x] S4: Customer register/activation/recovery riêng (files: features/customer-auth/register-form.tsx, features/customer-auth/activate-view.tsx, features/customer-auth/forgot-form.tsx, features/customer-auth/reset-form.tsx; test: npm test; coverage: TC-03)
- [x] S5: Customer pages nối đúng layout (files: app/(auth)/layout.tsx, app/(auth)/login/page.tsx, app/(auth)/register/page.tsx, app/(auth)/activate/page.tsx; test: npm test; coverage: TC-01,03)
- [x] S6: Customer recovery routes/BFF đúng contract (files: app/(auth)/forgot-password/page.tsx, app/(auth)/reset-password/page.tsx, app/api/auth/forgot/route.ts, app/api/auth/reset/route.ts; test: npm test; coverage: TC-03)
- [x] S7: Customer onboarding BFF không rò hành trình (files: app/api/auth/register/route.ts, app/api/auth/activate/route.ts, app/api/auth/activate/resend/route.ts; test: npm test; coverage: TC-03)
- [x] S8: Employee client/shell/login độc lập (files: lib/api/employee-auth.ts, components/layout/employee-auth-shell.tsx, features/employee-auth/form-feedback.tsx, features/employee-auth/login-form.tsx, features/employee-auth/journey.test.tsx; test: npm test; coverage: TC-03)
- [x] S9: Employee recovery/invite/context forms riêng (files: features/employee-auth/forgot-form.tsx, features/employee-auth/reset-form.tsx, features/employee-auth/invite-form.tsx, features/employee-auth/switch-context.tsx; test: npm test; coverage: TC-03,04)
- [x] S10: Staff public pages đúng console auth layout (files: app/(employee-auth)/layout.tsx, app/(employee-auth)/staff/login/page.tsx, app/(employee-auth)/staff/forgot-password/page.tsx, app/(employee-auth)/staff/reset-password/page.tsx, app/(employee-auth)/staff/invite/accept/page.tsx; test: npm test; coverage: TC-01,03)
- [x] S11: Staff recovery/invite BFF riêng, chỉ nối sau D3 (files: app/api/auth/staff/forgot/route.ts, app/api/auth/staff/reset/route.ts, app/api/auth/staff/invite/accept/route.ts, app/api/auth/staff/bff.test.ts; test: npm test; coverage: TC-02,03)
- [x] S12: Staff context selection và authorization (files: app/(employee-auth)/staff/switch-branch/page.tsx, app/(employee-auth)/staff/switch-org/page.tsx, app/api/auth/staff/switch-branch/route.ts, app/api/auth/staff/switch-org/route.ts; test: npm test; coverage: TC-04)
- [x] S13: Legacy links chỉ redirect, caller sang staff (files: app/(auth)/switch-branch/page.tsx, app/(auth)/switch-org/page.tsx, app/(employee-auth)/invite/accept/page.tsx, app/(store)/me/profile-client.tsx; test: npm test; coverage: TC-04)
- [x] S14: Shared transport bỏ journey operations, xoá BFF switch cũ (files: lib/auth/client.ts, lib/auth/client.test.ts, app/api/auth/switch-branch/route.ts, app/api/auth/switch-org/route.ts; test: npm test; coverage: TC-04)
- [x] S15: Proxy và refresh redirect đúng route family (files: proxy.ts, proxy.test.ts, lib/fetcher.ts, lib/fetcher.test.ts; test: npm test; coverage: TC-04)
- [x] S16: Xoá customer forms/feedback cũ (files: features/auth/activate-view.tsx, features/auth/forgot-form.tsx, features/auth/form-alert.tsx, features/auth/register-form.tsx, features/auth/reset-form.tsx; test: npm test; coverage: TC-01,05)
- [x] S17: Xoá login/context resolver cũ, giữ platform entry theo D2 (files: features/auth/home-for.test.ts, features/auth/home-for.ts, features/auth/login-form.tsx, features/auth/switch-branch-page.tsx; test: npm test; coverage: TC-01,05)
- [x] S18: Xoá mock/shared AuthShell, regression theo 2 shells (files: components/auth/login-form.tsx, components/layout/auth-shell.tsx, components/layout/index.ts, app/rebrand.test.ts; test: npm test; coverage: TC-01,05; 3 mutations đỏ rồi hoàn tác)
- [x] S19: Nội dung 2 journey qua i18n, không hardcode message mới (files: messages/vi.json, messages/en.json; test: npm test; coverage: TC-03,05)
- [x] S20: Anti xác minh toàn bộ hành trình và a11y, ship chỉ sau duyệt đúng quy trình (files: features/auth-boundary.test.ts, features/customer-auth/journey.test.tsx, features/employee-auth/journey.test.tsx, app/api/auth/bff.test.ts, app/api/auth/staff/bff.test.ts; test: npm test && npm run lint && npm run typecheck; TC-05 archcheck, Anti TC-06 checklist 100%)
- [x] S21: Test hồi quy cho review fix R1–R4 (files: lib/api/auth-review-fix.test.ts, app/(auth)/legacy-context.test.ts; test: npm test; coverage: TC-01,05)

## Risks / rollback
- D1 có thể bị hiểu là cấm một danh tính dùng hai vai; chốt trước cook. D2 thiếu platform entry làm khoá operator; D3 mail reset sai URL làm employee rơi vào customer screen; không cutover khi dependency chưa được xác minh.
- Gate cố ý đỏ đến khi xoá code chung; theo dõi lỗi mới và lỗi isolation đã biết, không gọi slice giữa chừng “full green”. AST phải resolve transitives để không lọt cross-import qua barrel; account/org không khả dụng phải fail closed.
- Rollback: mỗi slice implementation là commit riêng; revert theo thứ tự ngược nhóm consumer→BFF/module, khôi phục redirect/BFF caller cùng nhau; token/session vẫn thuộc auth, không rollback DB. Không khôi phục shared form trong release đang quảng bá hai hành trình; nếu phải rollback UI thì quay cả release trước cutover, tạm giữ API tương thích và kiểm login của các planes.

## Open decisions
- [ASSUMED D1] Dawn chốt một user nhiều vai: ACTIVE employee vẫn mua hàng qua customer journey; wrong-account staff = không có EMPLOYEE ACTIVE. Nếu Dawn muốn employee bị customer login từ chối thì phải giải quyết xung đột ADR-024/ADR-026; chưa tự thay backend/account model.
- D2 (Dawn chốt 2026-10-05): platform staff đăng nhập ở `/staff/login` → `/platform/companies` (BFF `lib/api/auth-journey-bff.ts:87-90` hỏi org `/platform/me`); entry `/platform/login` riêng để backlog, không thuộc task này.
- [ASSUMED D3] Recovery cần metadata trusted/URL mail đảm bảo staff→staff và token purpose/account eligibility do server quyết định; probe endpoint hiện có trước cook, nếu thiếu giao dependency auth riêng. Không dùng client `journey` để xác minh account; forgot vẫn bảo vệ enumeration.
- [ASSUMED D4] Chủ spec cung cấp login/activation/recovery và `standards/ui-ux.md`, thống nhất registry cho `invalid_token`/`service_busy`; spec login/activation/recovery và ui-ux chưa có trong phạm vi working tree đã probe. ADR-026 branch snapshot cần đưa vào baseline tham chiếu trước cook.
