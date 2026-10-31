# Plan: PORTAL-ACTIVATE-001

- **Task ID**: `PORTAL-ACTIVATE-001`
- **Mode**: `hard`
- **Story**: US-UI-003
- **Sprint**: 05
- **Issue**: D-147 / SEC-FIX-AUTH-001: consumer bắt buộc trước release; đây là bản kế hoạch chưa duyệt, không sửa code hoặc tạo receipt.

## Scope
- Outcome: 100% request kích hoạt khách gửi `{token,password}` sau thao tác chủ động; 0 POST khi mở link; chỉ mật khẩu chủ email chọn ở bước kích hoạt đăng nhập được. [ASSUMED: mục tiêu, chưa đo runtime]
- Decision: EXTEND customer activation/BFF; REUSE shell khách, `PasswordInput`, `passwordError`, transport và primitives; không tạo design system mới.
- Impact (codebase-memory trace_path / serena find_referencing_symbols): graph search `activation` trong portal trả 0; coverage báo `not_tracked`/`metadata_changed`, nên đọc source trực tiếp, không suy ra không có caller. Client chỉ gửi token (`lib/api/customer-auth.ts:9`); BFF allowlist token-only (`lib/api/auth-journey-bff.ts:159`); view tự POST trong effect (`features/customer-auth/activate-view.tsx:39`). Route mỏng đã có (`app/api/auth/activate/route.ts:3`), public route/refresh exemption đã có (`proxy.ts:7`, `lib/fetcher.ts:30`).
- Dependency: D-147 và OD-1 tại `../.aidlc/runs/SEC-FIX-AUTH-001/plan.md:69,259`; kế thừa isolation/BFF của `.aidlc/runs/PORTAL-AUTH-SPLIT-001/plan.md:47,50`. Không đổi register, staff invite, credentials/session, org authorization, DB, mail, gateway hoặc backend trong task portal (`AGENTS.md:3`).

## Requirements
- FR-1: `/activate?token=…` có mật khẩu mới, xác nhận, hai toggle hiện/ẩn; submit chủ động rồi thành công → link cố định `/login`, không tự login.
  - AC-1: Given link mới/resent/legacy còn hạn, When mở trang và nhập password C khớp confirm rồi submit, Then trước submit có 0 POST; sau submit đúng 1 POST chứa token+C, không confirm; loading rồi thông báo thành công và `/login` (`features/customer-auth/activate-view.tsx:36`, auth spec ở Technical definition).
- FR-2: validation client+BFF khớp auth: ≥12 Unicode code points và ≤256 byte UTF-8; không trim/normalize mật khẩu; confirm chỉ ở client.
  - AC-2: Given 11/12 code points, ASCII 256/257 bytes, `é`×128/129 và emoji×11/12, When submit trực tiếp UI/BFF, Then đúng biên pass/reject; missing/wrong-type password/token và extra `confirm` bị BFF từ chối trước upstream; mismatch focus confirm, policy focus password. Không tự thêm luật hoa/số/ký hiệu.
- FR-3: public BFF giữ same-origin/JSON allowlist, no-store, status/code/retry; mọi lỗi có đường phục hồi phù hợp.
  - AC-3: Given token thiếu/sai/hết hạn/đã dùng/wrong-purpose/invite-ineligible, When mở hoặc submit, Then không báo thành công; thiếu token không POST, lỗi token có resend trung tính và link đăng nhập; token sai không tiết lộ user status. Weak password cho sửa field; 429/503 cho retry thủ công theo thời gian chờ, không tự POST lại.
  - AC-4: Given upstream 200 ACTIVE idempotence, 400 validation/token, 429, 503 busy, network lỗi hoặc JSON/envelope hỏng, When gọi BFF, Then chỉ 200 hợp lệ là success; preserve wire status/code/Retry-After khi hợp lệ, lỗi transport/schema →503 `INTERNAL_ERROR`; không cookie/session/secret response. Double click/Enter trong pending có đúng 1 POST, late response của link cũ không đổi trạng thái link mới.
- FR-4: giữ độc lập customer activation và staff invite; token purpose/eligibility do auth quyết định.
  - AC-5: Given invite `ACCEPT_INVITE` hoặc tự đăng ký rồi được mời (password_hash đã xóa), When thử customer activate, Then auth từ chối; nhận invite đúng `/staff/invite/accept` → `/auth/invite/accept` → `/staff/login`; ACTIVE invite không đổi credential. Không chuyển token giữa hai API (`.aidlc/runs/PORTAL-AUTH-SPLIT-001/plan.md:52`, auth `invite.md:49`).
- FR-5: accessibility/i18n/brand, bảo vệ bí mật xuyên UI/BFF/evidence.
  - AC-6: Given vi/en, keyboard, light/dark, mobile/desktop, When sửa lỗi/toggle/submit, Then labels liên kết IDs, `new-password`, described errors và focus đúng, `role=alert/status`, `aria-busy`, toggle có tên/pressed; không tràn ngang, không secret trong persistent storage/log/ảnh/artifact; pass ngưỡng Anti dưới Tests planned.
- Ngoài phạm vi: staff self-register, staff recovery redesign, phone/SMS ownership, password strength score, tự chọn membership, đổi policy auth, sửa shared shell/tokens, credential/token audit hoặc production deploy trong lượt plan.

## Technical definition
- Nguồn auth thực đọc: `A=/home/dawn/orca/workspaces/auth/sec-fix-auth-001`, HEAD `86294eecfa9aa8c6513da77f5585d960a557edff`; các anchor `A/...` dưới đây thuộc worktree này, không coi auth main đã có thay đổi.
- Contract: `A/api/openapi.public.yaml:58,512` yêu cầu token+password, `additionalProperties:false`; `A/.aidlc/specs/activation-security.md:10,13,16,26` bảo vệ replay/invite và release dependency. `A/internal/transport/http/activate.go:36,41,46` gọi `ActivateWithPassword` và trả `response.Success(nil)`.
- Policy thực: `A/internal/adapter/crypto/password/password.go:136` dùng RuneCount≥12 và len(bytes)≤256; OpenAPI maxLength=256 ký tự (`:521`) chưa mô tả byte ceiling. Dùng cả schema và oracle UTF-8 độc lập; gate auth-owner đồng bộ mô tả, không nới policy để chiều schema.
- Reuse: `features/customer-auth/form-feedback.tsx:17` đã có code-point/byte validator; BFF `lib/api/auth-journey-bff.ts:170` đã có cùng phép kiểm nhưng hiện activate chọn nhầm `new_password` (`:169`). Không import customer feature vào shared BFF; mở rộng nhánh password có sẵn cho activate, giữ register/reset/staff contract.
- NFR: chỉ `lib/api/*`/`lib/fetcher.ts` fetch; page Server Component; mọi copy mới qua next-intl; giữ guards và sanitized client-IP (`../platform-docs/standards/frontend.md:15,31,34,59`, `lib/api/auth-journey-bff.ts:50,173`). Không dependency runtime mới.
- Password/token chỉ tồn tại tạm trong input/request memory; không console, audit, exception message, URL mới, cookie, local/sessionStorage, SWR/cache hoặc analytics. Clear password/confirm sau success, token sau kết thúc/unmount; không echo message upstream chứa input. Password trong request body, không query.
- Link nhận token qua query là contract hiện có: thêm metadata `referrer: no-referrer`; sau capture token vào memory, bỏ query bằng history replace (không router redirect/POST, không làm mất token đang dùng). Trang/link mới phải reset state và bỏ late response cũ; refresh URL sạch hiện trạng thái thiếu link. [ASSUMED: hành vi UX đề xuất]
- Secret đã tới ingress trước JS: release yêu cầu coordinator xác minh query/body redaction ở Kong/Next/APM; task portal không sửa gateway. Anti không xuất HAR/trace/network body, che password cả khi toggle; fixture token không ghi ra report. Runtime correctness chưa kiểm trong lượt plan.
- Constraint-scan: `standards/ui-ux.md` đã đọc từ platform-docs `origin/main` (`4ba5d7674e8f659f75f372633b14178475dd9e60`) bằng `git -C ../platform-docs show origin/main:standards/ui-ux.md`; `/home/dawn/Dawn-Brain/START.md` cũng thiếu. Read-only `hs-run plan next --plan /mnt/win_d/feature/ticket/portal/.aidlc/runs/PORTAL-ACTIVATE-001` trả `unresolved` vì template AIDLC không có `phases/`; không scaffold/approve để né giới hạn brief. `hs-cli --help` chạy được; cook→test→ship chỉ sau duyệt và coordinator chọn workflow tương thích. [ASSUMED: dependency trước cook]

## Phương án
- A — EXTEND customer view/BFF hiện có, reuse password primitive/validator, submit token+password. Khuyến nghị: ít surface thay đổi, đúng D-147 và isolation; explicit deployment window giải quyết compatibility. [ASSUMED]
- B — Trang/API activation mới song song và feature flag server. Tăng route/caller/deploy coordination; chỉ dùng nếu cần rollout nhiều phiên bản, flag OFF phải disable activation chứ không token-only; cần replan scope/config trước cook. [ASSUMED]
- C — Registration-intent-bound challenge giữ credential theo intent. Chuyển trách nhiệm sang auth/schema/Redis, vượt task consumer; không chọn cho đợt này (OD-1 `../.aidlc/runs/SEC-FIX-AUTH-001/plan.md:259`).

## UX
- Chuẩn đã đối chiếu: platform-docs `origin/main:standards/ui-ux.md` tại `4ba5d7674e8f659f75f372633b14178475dd9e60`: UX-01/02 tokens + control khách44–48px, UX-03 auth một card giữa màn, UX-04 lỗi dưới field/focus, UX-05 không toast trùng trang success, UX-06 trạng thái/pending/hint/bàn phím, UX-07/08 reuse primitives. Không cần open decision về file chuẩn; S4 và S6 giữ nguyên phạm vi.
- Wireframe trong plan: `[customer shell/logo hiện có] → [heading Kích hoạt tài khoản + hướng dẫn đặt mật khẩu ở bước này] → [password + hint + toggle] → [confirm + toggle] → [CTA Kích hoạt] → [feedback / đăng nhập / resend khi link lỗi]`. Idle → invalid hoặc pending → success/recoverable error/token error; không có auto-check effect redeem token.
- Fresh Meal Kit, đỏ cà chua qua `--color-primary`, nền/surface/ink/line/focus/danger/radius có sẵn; reuse customer shell, Button/Label/PasswordInput/EmptyState/ErrorState/FormNotice. Không palette/font/hero mới, không glass. Source `../platform-docs/ui/tokens.json:2,27,192,196`, `app/tokens.generated.css:8,28`; fonts override Quicksand/Nunito trong tokens thắng bản nháp brand v4 `../platform-docs/ui/2026-09-29-brand-dna-v4-bep-tuoi.md:72`.
- Skill search đã chạy bằng bản cài thực (path brief thiếu): `python3 /home/dawn/.claude/plugins/marketplaces/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max/scripts/search.py "password form validation labels focus" --domain ux`; 3 kết quả: labels thật, show/hide, loading→success/error. Search `"auth form accessibility" --stack nextjs` trả 3 kết quả; giữ BFF theo chuẩn dự án, không đổi sang Server Actions/cache theo recommendation chung.
- Toggle reuse `components/patterns/password-input.tsx:9,14`, default hidden, độc lập, `type=button`, không reset value/focus hoặc submit. Control hiện40px (`:13,16`); S4 nâng input/toggle lên scale44px và thêm props tên hiện/ẩn do activation caller truyền từ catalog vi/en, giữ defaults/callers cũ tương thích. Kiểm kích thước browser và regression login/register/reset dùng primitive; không tạo toggle mới.
- Hai field `autocomplete=new-password`, cho paste/password manager, không khoá Unicode; Enter submit, Tab/Shift+Tab toggle, focus ring không bị che; lỗi field focus first invalid, server alert focus được; pending disable submit, screen reader đọc trạng thái, không mất toàn bộ form khi 503. Reduced motion theo shell.
- Missing/expired/used token: thông báo chung “Liên kết không hợp lệ hoặc đã hết hạn”, resend email trung tính, `/login` cố định; không khẳng định tài khoản ACTIVE chỉ vì token used. ACTIVE idempotence chỉ là 200 được auth xác nhận, không endpoint dò trạng thái. Success xóa input và hiển thị “Tài khoản đã được kích hoạt. Đăng nhập để tiếp tục.” [ASSUMED: copy vi/en cần reviewer chốt]

## Design
- Tạo spec nhỏ `.aidlc/specs/customer-activation.md` trước code, liên kết auth activation-security/invite và API/error table; không ADR mới nếu chọn A. Snapshot `contracts/auth.public.yaml` byte-for-byte từ auth commit release; ghi SHA/path trong `contracts/README.md` theo `:3,15`; không hand-edit generated types/snapshot.
- `ActivateView` chứa form/lifecycle; `activateAccount(token,password)` gọi `mutationFetcher` với đúng hai field. BFF route POST hiện có giữ delegation `customerOperation(request,"activate")`; thay allowlist/required thành token+password và validate password trước fetch. Server không nhận confirm, journey, email, roles, return URL.
- Browser POST `/api/auth/activate` → server POST `${AUTH_SERVICE_URL}/auth/activate` JSON `{token,password}`; server-only URL, sanitized IP, same-origin check + JSON content type; tất cả response `Cache-Control:no-store`, không Set-Cookie. Upstream 200 envelope `{code:200,status:"success",message:"OK"}` không bắt `data` tồn tại (`../platform-go/response/response.go:39`, `A/internal/transport/http/activate.go:46`). BFF activation trả allowlisted `{status:"success"}`, không suy success từ mọi object; malformed success fail closed, không ảnh hưởng resend202.
- Client không hiển thị raw upstream `message`; ánh xạ code/status sang catalog. `FetchError.info` đã chứa `retry_after_ms` (`lib/fetcher.ts:7,107`); bổ sung thời gian chờ lấy từ response Retry-After (seconds hoặc HTTP date, clamp hợp lệ), fallback milliseconds, generic retry nếu thiếu/sai; giữ constructor callers tương thích. Không retry tự động hoặc refresh cho activate (`lib/fetcher.ts:23,73`).
- Mã có sẵn: `BAD_REQUEST`400, `VALIDATION_ERROR`400, `rate_limit_exceeded`429, `INTERNAL_ERROR`500/503 (`../platform-docs/docs/api/error-code-usage.md:60,72,74,77,96`); preserve public projection/status/Retry-After hiện có (`lib/api/auth-journey-bff.ts:13,84`). Không mã mới.
| Tình huống | Wire / UI / phục hồi |
|---|---|
| input thiếu/sai type/extra/JSON hỏng | 400 validation/BAD_REQUEST, không upstream; UI input/password/confirm có lỗi và focus |
| token sai/hết hạn/used/wrong-purpose/invite-ineligible | spec `invalid_token`400 nhưng handler hiện `BAD_REQUEST`400 (`A/internal/transport/http/error_mapper.go:29`, activation-security.md:58); preserve cả hai, cùng token-error copy + resend; auth owner chốt mismatch trước release |
| password weak/UTF-8 quá dài | 400 `VALIDATION_ERROR` (`A/internal/transport/http/error_mapper.go:67`); giữ link, focus password, không resend vì password sai |
| 429 | `rate_limit_exceeded`, Retry-After; delay hiển thị và ngăn submit trong cooldown, resend bucket riêng; activate OpenAPI chưa liệt kê429 (`A/api/openapi.public.yaml:75`), xử lý phòng vệ/gateway, không khẳng định auth activation có limiter |
| 503 busy | `service_busy` + Retry-After (`A/internal/transport/http/error_mapper.go:26`); giữ form, thử lại thủ công sau chờ; lỗi mạng/JSON/schema →503 `INTERNAL_ERROR` |
| ACTIVE idempotence / concurrent replay | 200 khi challenge còn hợp lệ →success, tuyệt đối không đổi password; token consumed →400. Auth quyết định (`A/internal/application/account/activate.go:26,87,93`), BFF không đổi used thành200 |
| resend | giữ `/api/auth/activate/resend` `{email}` →202 trung tính; lỗi429/network có feedback, không đưa token vào email request (`features/customer-auth/activate-view.tsx:15`) |
- Không migration/DB/event/session mới trong portal; no-store và redaction áp dụng cả lỗi. Staff invite giữ endpoint/schema/code riêng, không cross-import screen (`.aidlc/runs/PORTAL-AUTH-SPLIT-001/plan.md:50,52`).

## Files planned
- next.config.mjs
- .aidlc/specs/customer-activation.md
- contracts/auth.public.yaml
- contracts/README.md
- lib/api/activation-contract.test.ts
- lib/api/auth-journey-bff.test.ts
- app/api/auth/bff.test.ts
- lib/fetcher.test.ts
- proxy.test.ts
- components/patterns/password-input.tsx
- components/patterns/password-input.test.tsx
- lib/api/auth-journey-bff.ts
- lib/api/customer-auth.ts
- lib/fetcher.ts
- features/customer-auth/journey.test.tsx
- features/customer-auth/activate-view.tsx
- app/(auth)/activate/page.tsx
- messages/vi.json
- messages/en.json
- .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti-test.md
- .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti.sh
- .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti_check.py
- .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti_runner_selftest.py

## Tests planned
- Tất cả command bên dưới là công việc tương lai sau approval, chạy từ portal; prefix `rtk proxy` khi thực thi. Vitest qua `npm test`, không pnpm trên NTFS và không dùng `npm test -- path` (`package.json:13`, `.aidlc/runs/PORTAL-AUTH-SPLIT-001/plan.md:32`).
| TC-id | AC | layer | command / oracle |
|---|---|---|---|
| TC-01 | AC-1,2,4,6 | Vitest UI/client | `npm test`: form idle không POST/effect; invalid/confirm/focus; deferred request double submit; token+password exact; success `/login`; new link/late response; vi/en và localized toggle/non-submit/disabled; legacy effect assertions thay bằng oracle mới, không bỏ coverage (`features/customer-auth/journey.test.tsx:58`) |
| TC-02 | AC-2,3,4 | BFF route/transport | `npm test`: gọi POST route thật với NextRequest, chỉ mock upstream; policy boundaries/no-fetch negatives; JSON/origin/extra fields; real envelope/status/code/Retry-After/cookie redaction; rejected401 không refresh; update legacy activate fixture ở `lib/api/auth-journey-bff.test.ts:148` |
| TC-03 | AC-2,4,5 | OpenAPI contract | `npm test`: activation-contract test capture actual outbound JSON, dùng Python PyYAML+jsonschema resolve `$ref` OpenAPI3.1/schema từ snapshot, validate payload; token-only/confirm/wrong-type mutants phải fail; kiểm operation/method/path/responses; byte ceiling có oracle riêng; không regex/snapshot tên field thay schema validation |
| TC-04 | AC-5,6 | regression/static | `npm test` + `npm run lint` + `npm run typecheck` + `python3 ~/agent_skills/sdlc/engine/archcheck.py`; giữ boundary gate/staff invite/proxy public có và không cookie, no cross-import; build bằng `npm run build` trước Anti |
| TC-05 | AC-1..6 | Anti live/browser | `bash .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti.sh start`; Antigravity làm checklist bằng browser; `bash .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti.sh stop`; `python3 .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti_check.py` |
- TC-03 test-only Python prerequisites đã import được: PyYAML6.0.3, jsonschema4.26.0; thiếu dependency →fail rõ, không skip. Contract response chưa có JSON schema (`A/api/openapi.public.yaml:76`), nên kiểm wire envelope độc lập bằng fixture từ `response.Success`; không tuyên bố đã validate response schema OpenAPI không tồn tại.
- Anti kit reuse cơ chế riêng của `.aidlc/runs/PORTAL-AUTH-SPLIT-001/anti/anti.sh:150,179,201`: private runtime, process ownership, cleanup; chỉ capture bằng chứng sanitized. Test grader RED thiếu ảnh/case/Kong provenance/readback hoặc không đủ response assertions, GREEN bằng run đủ thật; không tự sinh ảnh PASS.
- Checklist live: attacker register A→duplicate B→owner activate C→login A401/C200; new/resent/live legacy links đều cần C; token-only không mutate; consumed/expired thực (test-owned Redis TTL), random/wrong-purpose/invite-ineligible bị từ chối; concurrent D không thay C; snapshot DB status/security_version/audit/outbox chỉ đếm/id không secret. ACTIVE idempotence cần challenge còn live do fixture cô lập, không giả used-token là idempotent.
- Staff regression: invite mới đặt password→staff login; ACTIVE customer nhận invite giữ credential; customer activation không grant org role. Fixture/auth-state setup do coordinator cấp ở stack cô lập, không nới guard để chạy test. [ASSUMED: fixture commands nằm trong Anti kit S7]
- Real stack: browser→portal→Kong `http://127.0.0.1:8000`→auth SEC-FIX branch + PG/Redis/Mailpit; xác minh AUTH_SERVICE_URL qua Kong, deployed auth SHA, correlation/status/route và readback. GET `/healthz` trên :8000 hiện404 chỉ chứng minh listener phản hồi, không chứng minh auth đã deploy. Thiếu infra/fixture/provenance →BLOCKED, không skip/pass.
- 429 thật qua resend bucket hoặc isolated Kong policy, 503 busy thật qua bounded concurrent hashing trên stack test (không mock auth); dừng load/restore test config sau case. Nếu không tạo được state thì báo BLOCKED; unit fixtures không thay receipt live. Expected injected503 tách khỏi gate unexpected5xx=0, console errors=0.
- `/activate`: 375/768/1024/1440px × light/dark =8/8 layout; keyboard/paste/password manager và toggle visibility; chữ contrast≥4.5:1, axe serious/critical=0, Lighthouse accessibility≥90, mobile LCP≤2.5s, First Load JS≤200kB (`../platform-docs/standards/frontend.md:48`). 4 ảnh khác nhau loading/empty/error/success, thêm idle form; selectors role/label, không secret/URL token trong ảnh.
- Anti-tautology: sau GREEN coordinator tạm sửa riêng (1) drop password ở client/BFF, (2) cho activate bypass byte limit, (3) auto redeem khi mount, (4) biến lỗi token thành success; mỗi mutant phải đỏ đúng oracle rồi hoàn tác, không xóa/skip/weaken test. 0 mutation/runtime receipt trong lượt plan.

## Slices
- Owner/dev là codex; browser/live là antigravity; independent review là claude. Dependency tuần tự S1→S2→S3→S4→S5→S6→S7→S8→S9; mỗi slice ≤5 files, không giao code edit cho hai owner cùng lúc. [ASSUMED: assignment sau duyệt]
- [ ] S1: codex dev — spec/snapshot trước code và contract oracle RED payload mới bị BFF từ chối (files: .aidlc/specs/customer-activation.md, contracts/auth.public.yaml, contracts/README.md, lib/api/activation-contract.test.ts; test: python3 ~/agent_skills/sdlc/engine/speccheck.py --lint .aidlc/specs/customer-activation.md && npm test)
- [ ] S2: codex dev — RED BFF token-only phải reject, valid token+password phải forward, retry/401/public-route; đổi fixture cũ sang contract mới, không sửa prod (files: lib/api/auth-journey-bff.test.ts, lib/fetcher.test.ts, proxy.test.ts; test: npm test)
- [ ] S3: codex dev — GREEN S1/S2, BFF exact body/activation policy/envelope và retry metadata; client signature đổi cùng caller tại S6 để không lỗi type giữa slices (files: lib/api/auth-journey-bff.ts, lib/fetcher.ts; test: npm test && npm run lint && npm run typecheck)
- [ ] S3b: codex dev — test-only (added 6/10, coordinator-notes.md): 5 fixture token-only cũ trong app/api/auth/bff.test.ts chuyển sang token+password và envelope success an toàn; giữ case token-only bị từ chối 400; không nới assert, không đổi prod (files: app/api/auth/bff.test.ts; test: npm test && npm run lint && npm run typecheck)
- [ ] S4: codex dev — primitive TDD trong slice: RED localized toggle/no-submit/disabled oracle, GREEN optional label props và44px token scale, giữ old callers/defaults (files: components/patterns/password-input.tsx, components/patterns/password-input.test.tsx; test: npm test && npm run lint && npm run typecheck)
- [ ] S5: codex dev — RED UI owner-password form/no POST on mount, confirm/focus/double submit/errors/late response/locale và actual client payload, cập nhật assertions legacy theo hành vi mới (files: features/customer-auth/journey.test.tsx; test: npm test)
- [ ] S6: codex dev — GREEN S5, password+confirm reuse toggle, client signature/body và state/error/retry/i18n/no-referrer/query cleanup (files: features/customer-auth/activate-view.tsx, app/(auth)/activate/page.tsx, messages/vi.json, messages/en.json, lib/api/customer-auth.ts; test: npm test && npm run lint && npm run typecheck && python3 ~/agent_skills/sdlc/engine/archcheck.py)
- [ ] S7: antigravity test — kit/checklist độc lập, grader RED empty run/forged evidence và GREEN selftest positive fixture (không coi positive fixture là app PASS) (files: .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti-test.md, .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti.sh, .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti_check.py, .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti_runner_selftest.py; test: python3 .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti_runner_selftest.py)
- [ ] S8: antigravity test — RED browser acceptance trên release trước, GREEN cùng checklist trên secure auth+portal build; sanitized run evidence + real readback (files: .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti-test.md, .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti.sh, .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti_check.py; test: python3 .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti_check.py)
- [ ] S6c: codex dev — vá review S9 (added 6/10, scratchpad/portal-s9-review.md): N2 `replaceState(null, "", pathname+hash)` để router không ghi lại token; N3 status 429 không có body chuẩn → `{error:"rate_limit_exceeded"}` giữ Retry-After; T1 test mật khẩu toàn khoảng trắng 12 ký tự được chấp nhận; T6 header `Referrer-Policy: no-referrer` cho /activate. Mỗi vá có test đỏ trước (files: features/customer-auth/activate-view.tsx, lib/api/auth-journey-bff.ts, lib/api/auth-journey-bff.test.ts, features/customer-auth/journey.test.tsx, next.config.mjs; test: npm test && npm run lint && npm run typecheck)
- [ ] S7b: antigravity test — grader đối chiếu Kong (added 6/10, review S9 C1): mỗi ô backend phải có dòng Kong khớp path + status với số đo của ô; ô CSRF phải có 0 request upstream; ô STAFF phải có /auth/invite/accept; postsSent phải bằng số dòng Kong activate trong cửa sổ ô. Selftest RED: replay out/ của S8 phải FAIL ở RATE-LIMIT, SERVICE-BUSY, CSRF, STAFF-INVITE, JOURNEY-SUCCESS, CONCURRENT-SUBMIT (files: .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti_check.py, .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti-test.md; test: python3 .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti_check.py --self-test)
- [ ] S8b: antigravity test — chạy lại GREEN sau S6c+S7b trên secure auth: 429 thật (vượt rate-limit activate) và 503 thật (dừng redis của auth trong ô, bật lại sau); ô nào không tạo được trạng thái thật thì ghi BLOCKED kèm lý do, không PASS. Grader S7b phải PASS và log Kong khớp từng ô (files: .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti-test.md, .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti.sh; test: python3 .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti_check.py)
- [ ] S9: claude review — read-only kiểm AC/contract/secret boundary, independent mutations và release ordering; coordinator chạy gates/receipts theo harness sau review, chỉ ship khi approval/tests/review đủ (files: .aidlc/specs/customer-activation.md, contracts/auth.public.yaml, lib/api/auth-journey-bff.ts, features/customer-auth/activate-view.tsx, .aidlc/runs/PORTAL-ACTIVATE-001/anti/anti-test.md; test: npm test && npm run lint && npm run typecheck && python3 ~/agent_skills/sdlc/engine/archcheck.py)
- RED→GREEN pairs: S1/S2→S3; S4 test→primitive fix; S5→S6; S7 negative grader→positive selftest; S8 same browser checklist old→new. Mỗi RED phải compile/chạy và fail vì expected behavior, không fail import/type/fixture. Intermediate suite không được gọi release GREEN trước S6/Anti; ghi từng assertion và nguyên nhân, không nới tests để qua slice.

## Risks / rollback
- [ASSUMED: chọn A] Không deploy portal C cho insecure auth cũ: backend cũ có thể bỏ qua password C và giữ attacker A. Ship theo maintenance window: tạm đóng self-activation bằng existing deployment control do coordinator sở hữu; deploy/verify secure auth (token-only400, owner C thắng A), deploy portal, chạy smoke TC-05 qua Kong, rồi mới mở lại. Không mở public journey trước cả hai có evidence; nếu không có control thì block ship hoặc replan B.
- Trước merge pin snapshot theo auth release SHA; contract đổi thì revalidate payload/error/byte policy và duyệt lại plan nếu scope khác. Error-code mismatch là open gate, không âm thầm sửa repo khác.
- Rollback portal chỉ về phiên bản cũng gửi password; nếu chưa có, đóng activation hoặc roll forward fix, giữ login/resend/staff hoạt động theo probe. Không rollback auth về token-only, không fallback reuse register password, không reset credential hoặc restore token đã consume. Không DB migration portal để revert.
- Memory/input/URL cleanup và secret redaction phải kiểm end-to-end; history replace không xóa ingress logs cũ. Không lưu payload trong receipts, grader/control fixtures. Busy cooldown không tự redeem token; mất response sau commit cho link đăng nhập/resend, không khẳng định password bị reset lần nữa.
- Self-review planning: đã đối chiếu auto-effect, allowlist/password selector, legacy fixtures, UTF-8/schema, response.Success(nil), token replay khác ACTIVE idempotence, staff purpose, ingress secret và rollout tới auth cũ. Independent claude review và toàn bộ runtime tests còn chờ; không tuyên bố hard gates đã pass.

## Open decisions
- OD-1 [ASSUMED]: coordinator/Dawn chọn deployment window A hay flag B; khuyến nghị A với activation đóng cho đến secure auth+portal smoke PASS, không insecure fallback.
- OD-2 [ASSUMED]: auth owner thống nhất invalid activation `BAD_REQUEST` runtime vs `invalid_token` spec, bổ sung byte-policy mô tả/429 scope; khuyến nghị preserve wire hiện có + UI tương thích hai mã, release sau contract/source alignment ở task auth.
- OD-4 [ASSUMED]: fixture cô lập cho expired/ACTIVE-live challenge, saturation503 và Kong429/query-redaction; khuyến nghị coordinator cấp test-owned stack và lệnh setup trong S7, không export raw secret hoặc chấm PASS bằng mocks.
