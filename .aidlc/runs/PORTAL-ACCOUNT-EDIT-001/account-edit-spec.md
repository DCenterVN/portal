# Contract self-service tài khoản portal

## Usecase

Khách và nhân viên ACTIVE sửa chính hồ sơ qua BFF. Auth quyết định principal/credential/session; org giữ quyền cuối. Contract này là thiết kế portal theo brief R32, chưa có implementation. Mọi tác động runtime chưa đo được gắn [ASSUMED] trong plan. Không đổi DB/event/backend. Email phải có link thật từ notification; hiện chỉ có token, dependency OD-1 chặn AC-4.

## API

| method | path | request | responses |
|---|---|---|---|
| GET | /api/auth/me | - | 200, 401, 503 |
| PATCH | /api/auth/profile | auth.UpdateProfileRequest | 200, 400, 401, 403, 503 |
| POST | /api/auth/password/change | auth.ChangePasswordRequest | 204, 400, 401, 403, 429, 503 |
| POST | /api/auth/profile/avatar/presign | auth.PresignAvatarRequest | 200, 400, 401, 403, 429, 500, 503 |
| POST | /api/auth/profile/avatar/finalize | auth.FinalizeAvatarRequest | 200, 400, 401, 403, 404, 409, 500, 503 |
| DELETE | /api/auth/profile/avatar | - | 200, 401, 403, 500, 503 |
| POST | /api/auth/email/change | auth.RequestEmailChangeRequest | 202, 400, 401, 403, 429, 503 |
| POST | /api/auth/email/confirm | auth.ConfirmEmailChangeRequest | 200, 400, 401, 403, 503 |

Bảng responses là status dự kiến cho BFF, không sửa enumeration OpenAPI backend. Giữ upstream status chưa liệt kê với error projection an toàn; network/JSON hỏng trả 503. No-store mọi response. GET me/email success phẳng; profile/avatar success giữ envelope chuẩn; password 204 không body. Source: auth/internal/transport/http/context_profile.go:85,107,133,161,179,212,237 và password_recovery.go:125, tính từ ticket root. Body/response schema mới strict, bỏ unknown fields ở output và reject unknown fields ở input. Không thêm trường vào operation cũ.

## DTO

| struct | fields |
|---|---|
| auth.UpdateProfileRequest | display_name string |
| auth.ChangePasswordRequest | current_password string, new_password string |
| auth.PresignAvatarRequest | file_name string, content_type string, file_size integer |
| auth.FinalizeAvatarRequest | upload_id string |
| auth.RequestEmailChangeRequest | current_password string, new_email string |
| auth.ConfirmEmailChangeRequest | token string |
| auth.UserProfileResponse | id string, email string, phone string, display_name string, avatar_key nullable string, avatar_url nullable string, status string, created_at string, memberships array |
| auth.PresignAvatarResponse | upload_id string, upload_url string, upload_method string, form_fields string map, expires_in integer |
| auth.FinalizeAvatarResponse | avatar_key string, avatar_url string |

FE wire types chỉ ở lib/api/auth/types.ts; UI props có tên ngay file. Existing UserProfile giữ tương thích. Các tên package trong bảng là namespace contract, không đề xuất sửa Go DTO. DTO nguồn ở auth/internal/transport/http/dto/profile_dto.go:13 và auth_dto.go:73.

## DB

Không DB portal mới hoặc thay đổi schema auth. Auth giữ update profile/security_version, revoke sessions và durable email challenge theo spec auth hiện có.

## Events

Portal không phát event mới. Auth/notification giữ notification intent và delivery. Không log password/token/cookie/presigned grant.

## Errors

| code | when |
|---|---|
| UNAUTHORIZED | Cookie thiếu/phiên không hợp lệ hoặc email proof sai; client không replay mutation |
| FORBIDDEN | CSRF/origin bị chặn hoặc account không active |
| BAD_REQUEST | JSON hỏng hoặc unknown field |
| VALIDATION_ERROR | Tên/email/password/input không đúng luật |
| invalid_current_password | Mật khẩu hiện tại sai ở password change |
| invalid_token | Email token sai chủ, sai mục đích, hết hạn hoặc replay |
| rate_limit_exceeded | Backend budget hết; giữ Retry-After |
| service_busy | KDF bận; giữ Retry-After |
| FILE_TOO_LARGE | Avatar >2097152 byte |
| UNSUPPORTED_IMAGE_FORMAT | Không phải JPEG/PNG/WebP |
| IMAGE_DIMENSIONS_EXCEEDED | Chiều >2048 hoặc pixels >4194304 |
| UPLOAD_LIMIT | Quá quota upload của user |
| UPLOAD_EXPIRED | Grant hết hạn |
| COMMIT_OUTCOME_UNKNOWN | Đọc lại profile trước khi quyết định retry |
| INTERNAL_ERROR | Network/upstream không đọc được; thông báo Việt an toàn |

Danh mục đầy đủ lỗi avatar và mapping Việt trong Design của plan; source auth/internal/transport/http/error_mapper.go:26. Không thêm domain code mới. Không hiện message SQL/S3/stack/host upstream.

## Security

Allow-list fixed routes và body fields; cookie principal, không body user id. JSON + configured origin guard trước upstream; DELETE cùng chính sách. Password/email confirm thành công clear đủ local cookies đúng scope và yêu cầu login lại; pending email giữ session. Không tự refresh/replay mutation. Confirm page GET không consume token; lấy token vào RAM và xóa URL trước tương tác/network, explicit button POST authenticated. Mail scanner không thay đổi account.

## Verification

Plan-only: speccheck --lint kiểm shape tài liệu. Implementation: unit BFF/client với mock đúng handler wire shape và HTTP runtime qua BFF, read-back /api/auth/me, Mailpit đọc link thật. Chưa chạy code tests. Không browser e2e theo R32.
