# Plan: PORTAL-ACCOUNT-EDIT-001

- **Task ID**: `PORTAL-ACCOUNT-EDIT-001`
- **Mode**: `hard`
- **Story**: US-UI-001
- **Sprint**: 05
- **Status**: Chỉ plan R32, chưa approve, chưa triển khai.

## Scope

Mục tiêu do brief giao: khách tại `/me` và nhân viên tại `/account`, `/company/account`, `/platform/account` tự đổi tên, ảnh, mật khẩu và email trên web; Dawn xem được màn và quyết định duyệt. Ưu tiên tên/mật khẩu trước ảnh/email. Đề xuất nghiệm thu: 4/4 luồng API/runtime đạt cho từng tài khoản QA khách và nhân viên; 4/4 điểm vào UI có form. [ASSUMED] Đây là chỉ tiêu nghiệm thu đề xuất, chưa có số đo adoption production.

Quyết định EXTEND BFF/client/profile có sẵn; REUSE primitive, PasswordInput, SWR, fetcher và decoder; CREATE chỉ module account còn thiếu. Không đổi quyền/membership, số điện thoại, auth DB, session policy hoặc registry generated.

Bản R32 tại `../plans/261025-account-edit/codex-plan-r32.md` thắng brief gốc. Chỉ ghi trong run này và `../plans/261025-account-edit/`; không new/use/approve/board/claim, không commit/stash/reset. Không chạm thay đổi của worker SUPPLIER, `eslint.config.mjs`, `eslint.harden.mjs`, baseline hay policy. `Files planned` bên dưới là phạm vi triển khai tương lai, không phải quyền sửa code trong lượt lập plan.

Bằng chứng đọc tại workspace ngày 2026-10-26:

| Bằng chứng | Kết luận và ảnh hưởng |
|---|---|
| `features/staff-profile/staff-profile-view.tsx:14`, `:35`, `:61` | View nhân viên tự fetch; nút mật khẩu dẫn quên mật khẩu; fallback tên tổ chức đang hiện UUID, cần bỏ. |
| `app/(console)/account/page.tsx:1`, `app/company/account/page.tsx:1`, `app/platform/account/page.tsx:1` | Cùng StaffProfileView. Graph search + trace_path xác nhận đúng 3 callers này. |
| `app/(store)/me/profile-client.tsx:22`, `:36`, `:133`, `:220` | Khách giữ hai tab; redirect người có membership; có mã cắt từ UUID và nút quên mật khẩu cần sửa. |
| `app/api/auth/me/route.ts:7`, `:11`; `lib/auth/client.ts:11`, `:40` | Có BFF GET và getProfile; client chưa khai avatar. Không sao chép catch đang lộ lỗi thô. |
| `../auth/internal/bootstrap/http.go:293`; `lib/contracts/operations.generated.ts:5` | Đủ endpoint backend/operation; không sửa tay generated. |
| `../auth/internal/transport/http/context_profile.go:85`, `:107`, `:133`, `:161`, `:179`, `:212`, `:237`; `password_recovery.go:125` cùng thư mục | GET me/email response phẳng; profile/avatar bọc envelope; password 204. Không ép tất cả thành cùng một shape. |
| `lib/api/auth-journey-bff.ts:55`, `:89`; `lib/api/platform-contract.ts:46`; `lib/api/client-ip.ts` | Có mẫu CSRF, sanitization, Retry-After, decoder và client IP; cân nhắc tái dùng helper public, không sao chép nguyên module journey. |
| `lib/fetcher.ts:73` | Mọi 401 mặc định refresh và replay. Account mutation phải chặn replay tự động để sai mật khẩu không thành vòng refresh. |
| `proxy.ts:6`, `:23`; `vitest.config.ts:4` | Confirm page mới cần public-prefix chính xác; test integration chỉ được include khi argv có đúng `tests/integration`. |
| `.aidlc/planning/backlog.md:7`; `.aidlc/runs/PORTAL-ACCOUNT-EDIT-001.json:1` | US-UI-001 là story UI/auth gần nhất; giữ story/sprint của run hiện có, không tạo lại. |

Graph index chỉ dùng để định vị; nội dung và line lấy từ checkout thật. Graph snippet bị tool từ chối do approval policy never, đã dùng đọc file tại chỗ. Không index/mutate graph. Một số đường dẫn auth UI cũ đã chuyển sang `features/customer-auth` và `features/employee-auth`, không lấy đường dẫn cũ trong board làm nguồn code.

## Requirements

FR-1. Cả khách và nhân viên đổi tên của chính mình, persist và đọc lại được sau tải trang.
AC-1. Given phiên hợp lệ ở mỗi điểm vào, When lưu tên hợp lệ, Then PATCH qua BFF, GET me trả tên NFC đã trim và UI hiển thị tên mới. Tên rỗng, >50 Unicode code points hoặc ký tự điều khiển bị từ chối; lỗi nằm cạnh trường. Nguồn `../auth/internal/application/account/profile.go:58`.
FR-2. Đổi/xóa avatar theo presign -> upload trực tiếp -> finalize, chỉ attach khi thành công.
AC-2. Given chọn ảnh JPEG/PNG/WebP 1..2097152 byte, tối đa 2048 mỗi chiều và 4194304 pixels, When chỉ chọn/hủy, Then 0 presign; When Lưu ảnh, Then dùng upload_method/form_fields đúng response, finalize rồi GET me trả ảnh mới. Lỗi PUT/POST/finalize giữ ảnh cũ, cho thử lại có chủ ý; xóa thành công hiện initials. Nguồn `../auth/internal/application/account/profile.go:25`, `:87`; UP-13 theo brief.
FR-3. Đổi mật khẩu bằng mật khẩu hiện tại và mật khẩu mới xác nhận hai lần.
AC-3. Given mật khẩu hiện tại đúng, When mật khẩu mới >=12 code points, <=256 byte UTF-8 và khác mật khẩu cũ, Then BFF nhận 204 không parse JSON; xóa cookie cục bộ, thông báo đăng nhập lại đúng audience. Sai mật khẩu giữ form và hiện lỗi Việt, không refresh/replay. Refresh của cả phiên A/B cũ bị từ chối; đăng nhập mật khẩu mới thành công, mật khẩu cũ thất bại. Nguồn `../auth/internal/transport/http/error_mapper.go:69`, `:96`; `../auth/internal/application/recovery/service.go:305`.
FR-4. Yêu cầu đổi email có mật khẩu hiện tại, gửi link xác nhận tới email mới; chỉ đổi sau confirm đúng chủ.
AC-4. Given email mới hợp lệ và proof đúng, When gửi, Then 202 pending, email hiện tại và phiên còn nguyên. Mailpit nhận thư mới đúng recipient/time window; người dùng mở link confirm nhận token, token bị gỡ khỏi URL trước request tiếp theo. Bấm xác nhận bằng phiên đúng chủ -> 200, đăng nhập lại email mới, email cũ không đăng nhập được. Token sai chủ/sai mục đích/hết hạn/replay bị từ chối và không đổi hồ sơ. Điều kiện link thực bị chặn bởi OD-1, không dựng link trong test rồi tuyên bố mail có link.
FR-5. BFF bảo vệ self-service và không làm suy yếu auth.
AC-5. Given thiếu cookie hoặc request cross-origin/CSRF giả, When gọi mutation, Then bị từ chối trước fetch upstream; body user_id/org_id/branch_id/URL tùy ý bị từ chối. Bearer chỉ từ cookie HttpOnly; không chuyển password/token vào response/log/URL/receipt. 429 giữ Retry-After; 503 không tự retry mutation. Nguồn mẫu `lib/api/auth-journey-bff.ts:55` và email budget tại `../auth/.aidlc/specs/email-change-security.md`.
FR-6. Giữ bố cục, trạng thái và khả năng thao tác; lỗi tiếng Việt theo mã có thật.
AC-6. Given loading/empty/error/success, Then có Skeleton/initials hoặc EmptyState/ErrorState và Thử lại; không hiện UUID đầy đủ hay cắt ngắn. Form có label, aria-invalid/describedby, pending latch khóa double submit, nút “Đang lưu…” và success rõ ràng. Giữ tab khách và thẻ nhân viên. Không đo browser/Lighthouse trong task này.
FR-7. Có bằng chứng runtime qua BFF, dữ liệu cố định và hoàn tác QA.
AC-7. Given QA_ROLE_ENV, portal/auth/storage/notification/Mailpit sẵn sàng, When chạy S15/S16 tuần tự cho khách và nhân viên, Then đủ 8 lượt happy-flow, không skip test account được chọn, có GET/read-back và kiểm session, cleanup khôi phục tên/ảnh/mật khẩu/email. Fixture giữ bytes và MIME ảnh gốc trong RAM trước mutation, không chỉ URL/key có TTL; nếu tải ảnh gốc thất bại thì dừng trước khi đổi ảnh, không tuyên bố rollback khả dụng. Thiếu env là FAIL preflight, không PASS nhờ skip. Không tạo user ngẫu nhiên. `e2e-browser: hoãn R32`.

Ngoài scope: viết/sửa backend và notification, đổi API cũ/headers cũ, DB reset, thư viện UI/test mới, tái thiết kế layout, Playwright desktop/mobile hoặc spec browser mới. API/runtime không chứng minh form chạy trong browser; Dawn kiểm màn sau từng vertical slice.

## Technical definition

Contract portal nằm trong [account-edit-spec.md](account-edit-spec.md), hoàn tất ngay lượt plan, không đẩy việc viết spec sang slice code. Tham chiếu [email-change-security](../auth/.aidlc/specs/email-change-security.md) và [login-session](../auth/.aidlc/specs/login-session.md) cần resolve từ portal root bằng đường dẫn `../auth/.aidlc/specs/email-change-security.md` và `../auth/.aidlc/specs/login-session.md` khi engine đọc. Không sửa spec auth.

Theo `../platform-docs/standards/frontend.md`: fetch chỉ ở lib/api; DTO request/response ở `lib/api/auth/types.ts`; hook .ts, data container .tsx và UI props có tên; không import chéo feature. Staff page compose StaffProfileContainer và AccountEditContainer qua slot editor. S5 tạo panel mới thuần props, chưa sửa view đang có callers; S6 migrate cả ba callers rồi xóa view cũ. Profile khách là app client nên có thể compose feature container trực tiếp. Container staff chịu trách nhiệm GET me/states, panel nhận props; editor được app truyền qua slot, không import feature account-edit từ feature staff-profile. Dùng đúng primitives hiện có, className <=8 literal tokens; code tay <=400 dòng và components/features <=300 dòng theo FE-13. Không thêm baseline để né lỗi.

Tất cả mutating BFF allow-list method/path và field chính xác, JSON với body cap không lớn hơn auth 16384 byte, theo `../auth/internal/transport/http/validation.go:66`, cookie principal, trusted configured origin. Origin khác origin cấu hình bị chặn dù Sec-Fetch-Site khai same-origin; không tin Host/X-Forwarded-Host từ client. Khi thiếu Origin chỉ chấp nhận chính sách được kiểm thử, mặc định fail closed. DELETE dùng cùng guard, không gửi file byte. CSRF double-submit nếu dùng phải so cookie/header, không lấy HttpOnly token làm CSRF. Các mã FORBIDDEN/UNAUTHORIZED/BAD_REQUEST/VALIDATION_ERROR đã tồn tại tại `lib/api/auth-journey-bff.ts:60`.

No-store cho cả GET me và mutations; timeout/abort bounded; lỗi network/upstream JSON hỏng thành lỗi Việt chung không lộ host/SQL/S3. Giữ status, code, fields an toàn và Retry-After. BFF xóa access_token, refresh_token, __Host-refresh_token, CSRF-Token, portal_plane bằng scope/path/secure tương ứng sau password/confirm thành công. Không xóa cookie trên sai mật khẩu; không gọi logout sau khi session đã revoke để biến 204 thành lỗi. Backend sở hữu revoke/security_version.

Client reuse apiFetch với isRetry=true cho account mutation, tức vô hiệu refresh/replay tự động trên 401. Expired-session có CTA đăng nhập; invalid_current_password hoặc UNAUTHORIZED từ email proof hiện lỗi tại password. Với UNAUTHORIZED mơ hồ, một GET me không mutation xác minh phiên rồi mới quyết định; không phát lại body cũ sau refresh. Không tự resend email khi 429/503/timeout. Ref latch ngăn double click trước React render.

Tách triển khai thành 16 slice để mỗi card <=5 file. Không sửa helper journey lớn hay lib/fetcher toàn cục nếu không cần. getProfile giữ API tương thích, delegate client decode mới và bổ sung avatar nullable. Nguồn backend `../auth/internal/transport/http/dto/profile_dto.go:13`.

[ASSUMED] Chưa gọi runtime, chưa biết listener/CORS storage và QA fixture thực tế. Không bật app/build/stack trong lượt này. docs/code-standards.md, docs/system-architecture.md và /home/dawn/Dawn-Brain/START.md không có tại checkout/máy; dùng standards repo đã được brief dẫn, không scaffold ngoài scope.

## UX

Giữ cấu trúc từ `features/staff-profile/staff-profile-view.tsx:27` và `app/(store)/me/profile-client.tsx:104`. Trong thẻ thông tin có tên + Lưu thay đổi; thẻ/tab bảo mật có form mật khẩu hiện tại/mới/xác nhận; ảnh có preview, Lưu ảnh, Hủy và Xóa ảnh; email hiển thị hiện tại, trường email mới/password và trạng thái “Đã gửi xác nhận tới email mới”. Form nhỏ tại chỗ, không thêm dialog/sheet hay sửa sidebar.

Dùng Button, Input, Field/Label, PasswordInput, Card, Skeleton/ErrorState/EmptyState, useToast và token hiện có. Không bảng màu/font/design system mới. Skill ui-ux-pro-max đã chạy truy vấn domain ux “form validation accessible account profile password”, 3 kết quả: Password Visibility, Submit Feedback, Form Labels; áp dụng toggle mật khẩu, pending/result, label liên kết. Không sinh design-system output nên không có artifact cần đẩy Stitch. Quy tắc ui-ux repo thắng gợi ý thẩm mỹ.

Loading dùng skeleton cùng layout; memberships trống là trạng thái hợp lệ, không ngăn self-edit; dữ liệu profile vắng thì ErrorState/Thử lại. Bỏ “Mã NV” cắt id, dùng “Chưa có tên tổ chức” thay UUID fallback, giữ tên tổ chức/chi nhánh/role dễ hiểu. Lỗi validation inline, toast chỉ mutation thành công hoặc lỗi chung. Nút disable khi thiếu dữ liệu, có hint; phản hồi chờ >300ms; không autosave bí mật hoặc ảnh. Revoke object URL khi đổi file/hủy/unmount; ảnh cũ còn hiển thị cho tới finalize thành công.

Confirm page public để xử lý link mà không proxy redirect trước khi gỡ token. Capture một lần vào ref trong RAM, history.replaceState xóa query và fragment ngay, không local/sessionStorage, không đưa token vào login redirect. Không auto-confirm bằng GET hoặc effect để mail scanner/StrictMode không consume token. Nếu không có phiên, hiện đăng nhập ở tab khác rồi quay lại tab này; reload/mất RAM thì mở lại thư. Chỉ nút Xác nhận mới POST; URL sạch không có token là empty state. Header Referrer-Policy no-referrer và cache no-store cho page; không tải ảnh/analytics ngoài khi còn query. Nếu đường link query đã vào access log ở edge, portal không thể xóa ngược log; preflight phải xác nhận query redaction ở runtime, nếu không cần quyết định link fragment/config phía owner.

Dawn kiểm tay 375/768/1024/1440, sáng/tối, Tab/Enter/Esc, label/focus và state tại 4 điểm vào sau S4/S6/S9/S11/S12. Đây là UAT cần ghi kết quả sau triển khai, không tuyên bố hiện đã PASS. Không chạy browser automation.

## Design

Đường dữ liệu: form -> feature hook/container -> lib/api account client -> /api/auth/* BFF -> auth. Avatar byte là ngoại lệ upload trực tiếp từ transport lib/api tới URL presigned MinIO, credentials omit, không mang cookie/bearer auth sang storage. Không backend mới, DB/event/migration mới. AccountEditContainer dùng cache key profile thống nhất với StaffProfileContainer; khách chuyển local profile sang cùng cache qua hook, giữ nguyên bố cục. Sau name/avatar save hoặc delete, await revalidate GET me và đồng bộ hero/thẻ ngoài editor trước success. Không chỉ mutate cache của editor. Test S4/S6/S9 assert hero tên/ảnh ngoài form cập nhật ngay; email/password revoke xóa toàn bộ profile cache.

| Portal | Auth | Request | Thành công wire |
|---|---|---|---|
| GET /api/auth/me | GET /auth/me | Không | 200 profile phẳng, avatar nullable |
| PATCH /api/auth/profile | PATCH /auth/profile | display_name | 200 envelope data.display_name |
| POST /api/auth/password/change | POST /auth/password/change | current_password, new_password | 204 rỗng |
| POST /api/auth/profile/avatar/presign | POST /auth/profile/avatar/presign | file_name, content_type, file_size | 200 envelope data gồm upload_id/upload_url/upload_method/form_fields/expires_in |
| POST /api/auth/profile/avatar/finalize | POST /auth/profile/avatar/finalize | upload_id | 200 envelope data.avatar_key/avatar_url |
| DELETE /api/auth/profile/avatar | DELETE /auth/profile/avatar | Không | 200 envelope data.message |
| POST /api/auth/email/change | POST /auth/email/change | current_password, new_email | 202 phẳng status=pending |
| POST /api/auth/email/confirm | POST /auth/email/confirm | token | 200 phẳng status=success |

S1/S7/S10 tạo route mỏng delegate account-bff. Helper S1 đã có nhánh GET profile; S2 chỉ nối lại route me, không sửa helper ngoài card. S2 khai đủ client API của bốn luồng đã được giao; S4 khai trước các key dịch cần cho form, kể cả email để S11 không phụ thuộc bản dịch chưa tồn tại. S13 kiểm và hoàn thiện bản dịch/lỗi. GET me cũng cần đi qua helper và no-store, đưa sửa route này vào S2 thay vì để debt lộ exception. Client decode theo từng operation; dùng decodePlatform cho envelope thật, không cho phẳng hoặc 204. Schema mới strict không lọt trường nội bộ. Password confirmation chỉ ở UI, không gửi confirm_password; không thêm ID/header nghiệp vụ tùy ý. Lỗi đọc `errors.error_code` của auth, chuyển thành contract error hiện hữu cho FetchError và bảng dịch Việt.

Avatar: idle -> selected in RAM -> presigning chỉ khi submit -> uploading theo upload_method -> finalizing -> saved/refetch. Backend hiện cấp POST policy theo `../auth/internal/application/account/profile.go:76`; tạo FormData đủ form_fields rồi file, không tự set multipart Content-Type. Không mặc định PUT từ ADR cũ. Grant hết hạn cần hành động thử lại; finalize kết quả không rõ phải GET me trước khi xin grant mới. Xóa preview và credentials khỏi bộ nhớ sau thành công/hủy. URL storage phải https hoặc local dev được cấu hình và đúng storage origin; không dùng proxy BFF để chữa CORS.

Email: idle -> requesting -> pending -> token-captured -> confirming -> reauth-required. Request pending không revoke phiên; confirm/password thành công mới dọn cookie và profile cache. Sai proof, sai token hay 429 không đổi profile. Session A/B cũ phải thử refresh thật sau revoke, không dựa riêng cookie đã bị xóa để kết luận backend an toàn. Confirm dùng principal owner theo `../auth/internal/transport/http/context_profile.go:219`.

Bảng lỗi: invalid_current_password, UNAUTHORIZED, VALIDATION_ERROR, FORBIDDEN, invalid_token, rate_limit_exceeded, service_busy, INTERNAL_ERROR; avatar thêm UNSUPPORTED_IMAGE_FORMAT, FILE_TOO_LARGE, UPLOAD_LIMIT, UPLOAD_NOT_FOUND, UPLOAD_ABORTED, UPLOAD_EXPIRED, EMPTY_FILE, CORRUPTED_STREAM, RESOURCE_BUSY, CANCELLED, IMAGE_DIMENSIONS_EXCEEDED, STORAGE_PROMOTION_FAILED, STORAGE_VERIFICATION_FAILED, LEASE_LOST, COMMIT_OUTCOME_UNKNOWN, INVALID_IMAGE. Nguồn `../auth/internal/transport/http/error_mapper.go:26`. Không hiện message tiếng Anh/nội bộ thô; mã chưa biết dùng thông báo chung tiếng Việt, giữ mã để phân loại, không tạo mã domain mới.

## Files planned

- `app/rebrand.test.ts`
- `features/employee-auth/journey.test.tsx`
- `lib/ux-no-uuid.test.ts`
- `frame.lock.json`
- `app/ui-rules-baseline.txt`
- `app/api/auth/bff.test.ts`
- `lib/api/auth/types.ts`
- `lib/api/account-bff.ts`
- `app/api/auth/profile/route.ts`
- `app/api/auth/password/change/route.ts`
- `lib/api/account-bff.test.ts`
- `lib/api/account-client.ts`
- `lib/api/account-client.test.ts`
- `lib/auth/client.ts`
- `features/account-edit/use-account-edit.ts`
- `app/api/auth/me/route.ts`
- `components/patterns/account/name-form.tsx`
- `components/patterns/account/password-form.tsx`
- `features/account-edit/account-edit-container.tsx`
- `features/account-edit/account-edit.test.tsx`
- `app/(store)/me/profile-client.tsx`
- `messages/vi.json`
- `messages/en.json`
- `features/account-edit/customer-profile.test.tsx`
- `features/staff-profile/staff-profile-container.tsx`
- `features/staff-profile/use-staff-profile.ts`
- `features/staff-profile/staff-profile-view.tsx`
- `features/staff-profile/staff-profile-panel.tsx`
- `features/staff-profile/staff-profile.test.tsx`
- `app/(console)/account/page.tsx`
- `app/company/account/page.tsx`
- `app/platform/account/page.tsx`
- `features/account-edit/staff-entrypoints.test.tsx`
- `app/api/auth/profile/avatar/presign/route.ts`
- `app/api/auth/profile/avatar/finalize/route.ts`
- `app/api/auth/profile/avatar/route.ts`
- `lib/api/account-avatar-bff.test.ts`
- `lib/api/account-avatar.ts`
- `lib/api/account-avatar.test.ts`
- `features/account-edit/use-account-avatar.ts`
- `features/account-edit/use-account-avatar.test.ts`
- `components/patterns/account/avatar-form.tsx`
- `features/account-edit/avatar-form.test.tsx`
- `app/api/auth/email/change/route.ts`
- `app/api/auth/email/confirm/route.ts`
- `lib/api/account-email-bff.test.ts`
- `components/patterns/account/email-form.tsx`
- `features/account-edit/use-account-email.ts`
- `features/account-edit/email-form.test.tsx`
- `app/(auth)/email/confirm/page.tsx`
- `features/account-edit/email-confirm-container.tsx`
- `features/account-edit/use-email-confirm.ts`
- `features/account-edit/email-confirm.test.tsx`
- `proxy.ts`
- `proxy.test.ts`
- `lib/api/account-errors.test.ts`
- `lib/auth/client.test.ts`
- `tests/integration/account-fixtures.ts`
- `tests/integration/account-fixtures.test.ts`
- `tests/integration/account-http.ts`
- `tests/integration/account-profile.it.test.ts`
- `tests/integration/account-avatar.it.test.ts`
- `.aidlc/runs/PORTAL-ACCOUNT-EDIT-001/runtime-profile.md`
- `tests/integration/account-security.it.test.ts`
- `tests/integration/account-email.it.test.ts`
- `.aidlc/runs/PORTAL-ACCOUNT-EDIT-001/runtime-security.md`
- `.aidlc/runs/PORTAL-ACCOUNT-EDIT-001/handback.md`

## Tests planned

Chỉ mô tả lệnh tương lai; lượt plan không chạy test/lint code/build/e2e. Mỗi slice có test riêng trong Slices. Gọi Vitest trực tiếp để tránh script pnpm test hiện ghi /tmp, theo R9. Luôn --maxWorkers=2 --minWorkers=1. TC dưới đây phải assert dữ liệu/HTTP hành vi, không grep tên hàm để giả test UI.

| TC | AC | Lớp và oracle |
|---|---|---|
| TC-1 | AC-1,5 | BFF/client với handler-shaped envelope; tên NFC, boundary 0/50/51, control chars, dữ liệu dư, no-store, upstream bị chặn khi CSRF lỗi. |
| TC-2 | AC-3,5 | Password 204; current sai 401 không refresh/replay/clear cookie; success clear đủ cookie; timeout không tự gửi lại. |
| TC-3 | AC-2,5 | MIME/size/dimension/owner/grant hết hạn; 0 presign trước submit; upload_method và form_fields đúng; không forward auth sang MinIO; finalize hỏng không thay ảnh. |
| TC-4 | AC-4,5 | Pending không thay email; confirm phải bearer; token foreign/replay/expired; preserve 429 Retry-After; URL scrub trước fetch, không serialize token; 401 không auto-POST lại. |
| TC-5 | AC-6 | SSR React markup cho label/aria/state/slot tại 4 entrypoint và unit hook/controller với deferred promises để chứng minh một mutation khi submit đôi; không cần thư viện DOM mới. Khả năng dùng browser thật do UAT bổ sung. |
| TC-6 | AC-7 | HTTP runtime S15/S16 cho 2 audience, read-back qua /api/auth/me; Mailpit match recipient + mốc thời gian + message id; session cũ refresh bị deny; cleanup bằng API chính chủ. |

Lệnh unit nền: `TMPDIR=/home/dawn/work/ticket/.cache/tmp pnpm exec vitest run --maxWorkers=2 --minWorkers=1 <file>`; thư mục TMPDIR phải có khi worker chạy. Không dùng script test đang hardcode /tmp (`package.json`). Chỉ dùng test đã tồn tại của slice phụ thuộc nếu nêu trong command; file liệt kê trong slice là quyền sửa, không phải toàn bộ import đọc.

Testkit hoàn tất ở lượt plan và đóng băng khi approve, không có slice ghi testkit. S14 triển khai preflight/reset bằng code trong tests/integration, báo trạng thái trong handback; runtime-profile.md và runtime-security.md nằm trực tiếp trong run. Thay đổi tiền điều kiện fixture sau approve phải sửa plan/testkit và Dawn duyệt lại, không tự điều chỉnh để xanh.

Lệnh runtime nền: `ACCOUNT_E2E=1 TMPDIR=/home/dawn/work/ticket/.cache/tmp pnpm exec vitest run tests/integration --testNamePattern=account-profile --maxWorkers=2 --minWorkers=1 --no-file-parallelism` cho S15 và pattern `account-security` cho S16. File mới describe bắt đầu đúng prefix; account-avatar dùng prefix account-profile.avatar, account-email dùng account-security.email để không bị lọc nhầm; config include integration chỉ khi có argument `tests/integration` (`vitest.config.ts:4`). Không gọi test:e2e, visual, playwright. Preflight lỗi phải ném lỗi, không skipIf env thiếu. S15/S16 thực thi tuần tự, có exclusive lease cho fixture, không đụng tài khoản của SUPPLIER.

Khi cook/test sau approve, verify từng slice có unit cùng `arch="python3 ~/agent_skills/sdlc/engine/archcheck.py"`; có `lint="python3 ~/agent_skills/sdlc/engine/lintcheck.py"` khi policy yêu cầu và chủ động giữ check này nếu tool sẵn sàng. Verify cuối gồm unit, typecheck, arch, lint, `spec="python3 -B ~/agent_skills/sdlc/engine/speccheck.py --lint .aidlc/runs/PORTAL-ACCOUNT-EDIT-001/account-edit-spec.md"`, integration và e2e API. Doc lint chỉ kiểm hình dạng; BFF contract tests mới kiểm shape/runtime. Không tự ghi verification.json. Không next build trong lượt này; trước bước nặng tương lai kiểm MemAvailable, <3000 MB chờ rồi kiểm lại theo R28, phối hợp worker khác.

## Slices

- [ ] S1: BFF đổi tên và mật khẩu, cookie/CSRF và contract có test đỏ trước (files: lib/api/auth/types.ts, lib/api/account-bff.ts, app/api/auth/profile/route.ts, app/api/auth/password/change/route.ts, lib/api/account-bff.test.ts; test: pnpm exec vitest run lib/api/account-bff.test.ts --maxWorkers=2 --minWorkers=1)
- [ ] S2: Client tài khoản và profile có avatar, lỗi nghiệp vụ không tự replay (files: lib/api/account-client.ts, lib/api/account-client.test.ts, lib/auth/client.ts, lib/auth/client.test.ts, app/api/auth/me/route.ts; test: pnpm exec vitest run lib/api/account-client.test.ts lib/auth/client.test.ts --maxWorkers=2 --minWorkers=1)
- [ ] S3: Form tên và mật khẩu dùng chung, container truyền dữ liệu qua props (files: components/patterns/account/name-form.tsx, components/patterns/account/password-form.tsx, features/account-edit/account-edit-container.tsx, features/account-edit/use-account-edit.ts, features/account-edit/account-edit.test.tsx; test: pnpm exec vitest run features/account-edit/account-edit.test.tsx --maxWorkers=2 --minWorkers=1)
- [ ] S4: Khách đổi tên và mật khẩu ngay trên /me, giữ bố cục và tab (files: app/(store)/me/profile-client.tsx, messages/vi.json, messages/en.json, features/account-edit/customer-profile.test.tsx; test: pnpm exec vitest run features/account-edit/customer-profile.test.tsx features/account-edit/account-edit.test.tsx --maxWorkers=2 --minWorkers=1)
- [ ] S5: Chuẩn bị container và panel thuần props tương thích, chưa đổi ba callers hiện hành (files: features/staff-profile/staff-profile-container.tsx, features/staff-profile/use-staff-profile.ts, features/staff-profile/staff-profile-panel.tsx, features/staff-profile/staff-profile.test.tsx; test: pnpm exec vitest run features/staff-profile/staff-profile.test.tsx --maxWorkers=2 --minWorkers=1)
- [ ] S6: Console/company/platform ghép editor tại app, Dawn xem được cả bốn màn (files: app/(console)/account/page.tsx, app/company/account/page.tsx, app/platform/account/page.tsx, features/staff-profile/staff-profile-view.tsx, features/account-edit/staff-entrypoints.test.tsx; test: pnpm exec vitest run features/account-edit/staff-entrypoints.test.tsx features/staff-profile/staff-profile.test.tsx --maxWorkers=2 --minWorkers=1)
- [ ] S6b: dọn caller của view cũ đã xoá ở S6: test rebrand và journey chuyển sang panel/editor mới, giữ ý nghĩa assertion (link /staff/switch-org, không coi membership là bằng chứng); xoá entry allowlist UUID /me đã hết (files: app/rebrand.test.ts, features/employee-auth/journey.test.tsx, lib/ux-no-uuid.test.ts; test: pnpm exec vitest run app/rebrand.test.ts features/employee-auth/journey.test.tsx lib/ux-no-uuid.test.ts --maxWorkers=2 --minWorkers=1)
- [ ] S6c: khung FR-13 và BFF test cũ theo S1–S6: `node scripts/frame-lock.mjs --write`, chỉ xoá dòng nợ rounded đã trả trong ui-rules baseline, cập nhật mock profile/headers của bff.test theo BFF fail-closed mới, không nới kiểm (files: frame.lock.json, app/ui-rules-baseline.txt, app/api/auth/bff.test.ts; test: pnpm exec vitest run app/frame-lock.test.ts app/ui-rules-gate.test.ts app/api/auth/bff.test.ts --maxWorkers=2 --minWorkers=1)
- [ ] S7: BFF avatar presign/finalize/delete đúng envelope, không nhận byte ảnh (files: app/api/auth/profile/avatar/presign/route.ts, app/api/auth/profile/avatar/finalize/route.ts, app/api/auth/profile/avatar/route.ts, lib/api/account-bff.ts, lib/api/account-avatar-bff.test.ts; test: pnpm exec vitest run lib/api/account-avatar-bff.test.ts --maxWorkers=2 --minWorkers=1)
- [ ] S8: Transport upload trực tiếp và vòng đời RAM/object URL theo UP-13 (files: lib/api/account-avatar.ts, lib/api/account-avatar.test.ts, features/account-edit/use-account-avatar.ts, features/account-edit/use-account-avatar.test.ts; test: pnpm exec vitest run lib/api/account-avatar.test.ts features/account-edit/use-account-avatar.test.ts --maxWorkers=2 --minWorkers=1)
- [ ] S9: Ghép đổi/xóa ảnh vào editor dùng chung, preview tới khi bấm Lưu ảnh (files: components/patterns/account/avatar-form.tsx, features/account-edit/account-edit-container.tsx, features/account-edit/avatar-form.test.tsx, messages/vi.json, messages/en.json; test: pnpm exec vitest run features/account-edit/avatar-form.test.tsx features/account-edit/account-edit.test.tsx --maxWorkers=2 --minWorkers=1)
- [ ] S10: BFF yêu cầu/confirm email có principal, Retry-After và dọn cookie sau thành công (files: app/api/auth/email/change/route.ts, app/api/auth/email/confirm/route.ts, lib/api/account-bff.ts, lib/api/account-email-bff.test.ts; test: pnpm exec vitest run lib/api/account-email-bff.test.ts --maxWorkers=2 --minWorkers=1)
- [ ] S11: Form email hiện mật khẩu hiện tại và trạng thái chờ, chưa thay email trước confirm (files: components/patterns/account/email-form.tsx, features/account-edit/use-account-email.ts, features/account-edit/account-edit-container.tsx, features/account-edit/email-form.test.tsx, lib/api/account-client.ts; test: pnpm exec vitest run features/account-edit/email-form.test.tsx lib/api/account-client.test.ts --maxWorkers=2 --minWorkers=1)
- [ ] S12: Trang confirm công khai dọn URL trước tương tác, xác nhận vẫn bắt buộc phiên đúng chủ (files: app/(auth)/email/confirm/page.tsx, features/account-edit/email-confirm-container.tsx, features/account-edit/use-email-confirm.ts, features/account-edit/email-confirm.test.tsx, proxy.ts; test: pnpm exec vitest run features/account-edit/email-confirm.test.tsx --maxWorkers=2 --minWorkers=1)
- [ ] S13: Hồi quy route/token và bản dịch, lỗi hiện tiếng Việt theo wire code (files: proxy.test.ts, lib/api/account-errors.test.ts, messages/vi.json, messages/en.json, lib/auth/client.test.ts; test: pnpm exec vitest run proxy.test.ts lib/api/account-errors.test.ts features/account-edit --maxWorkers=2 --minWorkers=1)
- [ ] S14: API runtime fixture cố định và preflight fail khi thiếu môi trường, không skip xanh (files: tests/integration/account-fixtures.ts, tests/integration/account-fixtures.test.ts, tests/integration/account-http.ts; test: pnpm exec vitest run tests/integration/account-fixtures.test.ts --maxWorkers=2 --minWorkers=1)
- [ ] S15: E2E HTTP thật qua BFF cho tên và ảnh, read-back và cleanup giới hạn tài khoản QA (files: tests/integration/account-profile.it.test.ts, tests/integration/account-avatar.it.test.ts, .aidlc/runs/PORTAL-ACCOUNT-EDIT-001/runtime-profile.md; test: ACCOUNT_E2E=1 pnpm exec vitest run tests/integration --testNamePattern=account-profile --maxWorkers=2 --minWorkers=1 --no-file-parallelism)
- [ ] S16: E2E mật khẩu/email qua BFF và Mailpit, kiểm session cũ và khôi phục fixture (files: tests/integration/account-security.it.test.ts, tests/integration/account-email.it.test.ts, .aidlc/runs/PORTAL-ACCOUNT-EDIT-001/runtime-security.md, .aidlc/runs/PORTAL-ACCOUNT-EDIT-001/handback.md; test: ACCOUNT_E2E=1 pnpm exec vitest run tests/integration --testNamePattern=account-security --maxWorkers=2 --minWorkers=1 --no-file-parallelism)

S1 -> S2 -> S3 -> S4 là lát dọc đầu để Dawn xem form khách sớm. S5 giữ view cũ chạy được trong lúc chuẩn bị panel/container mới, S6 chuyển cả ba callers sang container/panel rồi xóa view cũ trong cùng card; không để commit trung gian vỡ props/typecheck. S5 -> S6 bổ sung ba audience nhân viên. S7 -> S8 -> S9 thêm ảnh. S10 -> S11 -> S12 -> S13 thêm email; không nghiệm thu AC-4 khi OD-1 chưa giải quyết. S14 -> S15 -> S16 tạo bằng chứng HTTP thật sau toàn bộ BFF/UI. Mọi slice chưa check; không start trước Dawn approve. Các tên file test mới/lệnh là thiết kế dự kiến, không phải đã chạy.

## Risks / rollback

- Chỉ revert commit của task hoặc từng vertical slice sau này, không reset tree dùng chung. UI có thể gỡ form/route mới để quay về read-only; không có migration. Không rollback dữ liệu email/password người dùng thật bằng script. Khôi phục QA bằng API chính chủ và biến bí mật trong RAM.
- Đổi password/email là mutation không idempotent và mất response có thể đã commit: không tự replay, hướng dẫn đăng nhập lại rồi GET hồ sơ. Finalize không rõ kết quả cũng read-back trước retry.
- Form/route live không đồng nghĩa backend revoke đã đúng; runtime phải thử cookie phiên thứ hai. JWT còn sống chỉ được kết luận bị revoke sau kiểm auth/session thực tế, không dựa trên UI.
- Tài khoản cố định chạy nối tiếp, email hai địa chỉ QA riêng. Cleanup trong finally, nếu mất session thì login bằng trạng thái credential hiện biết rồi hoàn nguyên qua cùng API/Mailpit. Cleanup fail phải ghi FAIL và trạng thái QA đã redacted, không ghi mật khẩu/token. Tuyệt đối không DB reset hoặc đổi user production.
- Concurrent changes của SUPPLIER làm baseline động: kiểm lại diff trước cook, không đưa thay đổi người khác vào task và không tự mở scope. Test failures ngoài phạm vi báo đúng nguyên nhân, không nới check.

## Open decisions

OD-1. BLOCK nghiệm thu AC-4. Auth chỉ lưu email/display_name/token trong notification intent (`../auth/internal/application/account/email_change.go:151`); template thực chỉ hướng dẫn nhập token, không có link (`../notification/internal/application/delivery/templates.go:30`). API không thiếu nhưng mail chưa đạt yêu cầu link. Dawn cần giao task owner auth/notification tạo action_url trỏ `/email/confirm`, thống nhất token query/fragment và redaction. Không sửa hai service trong task portal; không coi việc test tự ghép link từ token Mailpit là AC-4 PASS. Trong lúc chờ vẫn plan/triển khai được tên, mật khẩu, ảnh sau approve.

OD-2. [ASSUMED] Thiếu `../platform-docs/standards/file-upload.md`, chưa đối chiếu toàn bộ UP-xx. Áp dụng UP-13 từ brief và contract avatar thật đã đọc; cần owner cung cấp/khôi phục chuẩn trước approve phần ảnh. Tài liệu L9/ADR-016 cũ nói PUT, không thay thế POST policy avatar thật.

OD-3. [ASSUMED] D-273 chưa có nguồn trong các file brief dẫn; dùng yêu cầu bắt buộc gỡ token URL của brief, không suy đoán phần khác. Query redaction tại edge và Mailpit/QA env chưa được kiểm runtime. Testkit ghi tiền điều kiện và dừng nếu thiếu, không giả PASS. Cần owner chốt fixture identities/2 email QA, không yêu cầu dán bí mật vào chat.

OD-4. [ASSUMED] UAT do Dawn thực hiện sau cook; browser e2e/Lighthouse và screenshot grader hoãn theo R32. Mọi chỉ tiêu FE-15..19 không được ghi PASS từ unit/API. Plan này chưa phải production-ready approval hoặc triển khai xong.

## Red-team

Tự phản biện đã nhập vào thiết kế:

| Failure mode | Sửa plan / bằng chứng cần có |
|---|---|
| Refresh tự động gửi lại password/email 401 | Account client dùng apiFetch với isRetry=true; phân biệt current-password sai và session hết hạn; unit assert số upstream call và giữ cookie khi proof sai. |
| CSRF dùng cookie auth mà không guard | Allow-list fields, configured origin + JSON + no-store, chặn trước upstream; test Origin giả/same-site/thiếu/mâu thuẫn Sec-Fetch-Site và DELETE. |
| Email 202 tưởng đã đổi và đăng xuất | Giữ email cũ/phiên tới confirm, test pending và session A/B sau commit; confirm cookie clearing chỉ khi 200. |
| Mail token khác user, double click hoặc mail scanner consume | Auth bearer đúng chủ, explicit POST button, ref latch, test foreign/replay và StrictMode; không auto-confirm GET. |
| Grant/image rò qua BFF hoặc finalize sớm | Chỉ metadata BFF, File trong RAM, direct storage credentials omit, finalize sau upload thành công, không presign khi chọn file. |
| Rate limit bị retry vô hạn hoặc bỏ header | Giữ 429/503 + Retry-After, countdown/UI retry có chủ ý; email budget 5 attempts/15min theo spec auth, không thêm limiter in-memory thay backend. |
| E2E skip vì thiếu env và tạo user rác | Preflight fail closed, QA_ROLE_ENV cố định, 2 audience, cleanup tuần tự và receipt không có secrets. |
| Email thực không có link, test tự chế link rồi PASS | OD-1 là dependency thật; đợi mail action_url từ owner trước chấp nhận AC-4. |

Review độc lập bởi agent `review_account_plan` đã hoàn tất, 4 finding được sửa:

1. S5 trước đây đổi props view trước khi migrate callers. Nay chuẩn bị panel mới ở S5, S6 chuyển ba callers và xóa view cũ cùng card.
2. Các slice trước đây ghi testkit sau approve. Nay testkit đóng băng; báo cáo runtime nằm ngoài testkit, S14 chỉ thêm code preflight.
3. Editor có thể cập nhật riêng trong khi hero cũ. Nay dùng cùng profile cache key, await GET me/revalidate cho cả host/editor, có test hero read-back.
4. Snapshot ảnh chỉ URL/key không đủ để restore. Nay fixture tải bytes/MIME ảnh gốc vào RAM trước mutation, phục hồi bằng upload API, hoặc DELETE nếu ban đầu không có ảnh.

Lưu ý review: testNamePattern có thể làm suite không thuộc account bị lọc. Báo 0 skipped cho các test account được chọn, thống kê suite không thuộc account bị lọc riêng, không coi đó là coverage. Đây là review tài liệu, không phải review receipt phát hành.

## Evidence / handoff

Lượt này chỉ đọc source, graph định vị, chạy search UX và kiểm cấu trúc tài liệu/engine next. 16 slice, tối đa 5 file/slice; 0 build, 0 unit, 0 integration, 0 e2e, 0 browser run; chưa có verification.json mới. Tier 1 runtime NOT RUN, Tier 2 chưa có score, Tier 3 chưa đánh giá ngưỡng 0.95/0.995. Không suy từ plan lint thành test PASS.

Where it started: bản nháp trống của run có sẵn, brief R32 chỉ plan. Decisions: 16 slice, tên/mật khẩu lên màn trước, BFF API e2e, mail-link phụ thuộc owner. Key files: plan này, account-edit-spec.md, testkit/env.md và testkit/errors.md. Pick up here: xử lý OD-1/OD-2, Dawn review/approve rồi lấy S1 bằng engine; agent không approve.
