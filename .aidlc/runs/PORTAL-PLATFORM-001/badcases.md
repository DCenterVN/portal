# Derived bad cases

Mỗi dòng suy ra từ happy case (`testkit/happy.http`), mã lỗi lấy từ `testkit/errors.md`, test là tên thật trong log verify.

| id | category | derived from | expected | test |
|---|---|---|---|---|
| S1-1 | missing_field | GET platform/me trả actions | apperror.ErrCodeForbidden: thiếu hoặc sai actions thì chặn, không cấp quyền nào | fails closed for malformed or missing actions |
| S1-2 | wrong_type | GET company/modules?org_id=MAIN | apperror.ErrCodeValidation: org_id không phải UUID, lặp, hoặc thêm query lạ → 400, không gọi org | requires UUID MAIN scope and rejects query injection |
| S1-3 | boundary | PATCH module | apperror.ErrCodeValidation: tắt CORE → 400 | modules: CORE cannot be switched off, a new module reads back ACTIVE |
| S1-4 | authz | PLATFORM_SUPPORT gọi API admin | apperror.ErrCodeForbidden: 403 | PLATFORM_SUPPORT gets read actions only; admin-only calls are 403 |
| S1-5 | tenant | OWNER công ty A sửa org_id sang B | apperror.ErrCodeForbidden: 403 | cannot read or act on another company, even by editing org_id |
| S1-6 | replay | OWNER duyệt lại grant đã thu hồi | apperror.ErrCodeConflict: 409 | approve gives 24h, revoke ends it, deciding a revoked grant is 409, and B cannot decide A's grant |
| S1-7 | expired_token | request không có cookie/token | apperror.ErrCodeUnauthorized: 401, không gọi org | rejects missing credentials without contacting org |
| S1-8 | replay | break-glass lần 2 trong 24h | apperror.ErrCodeConflict: 409 | support: request without consent stays pending; break-glass is ≤4h and a second one is 409 |
| S1-9 | replay | cấp quyền cho người đã là staff | apperror.ErrCodeConflict: 409 | staff: granting an existing staff member is 409 |
| S1-10 | boundary | role matrix có action của module chưa mua | apperror.ErrCodeValidation: 400, role lạ → 404 | role matrix: unknown role 404, action of an unpurchased module 400, valid replace reads back |
| S1-11 | authz | org chết hoặc 502/503 | 503: chặn truy cập, không coi là được phép | treats network failure, 502 and 503 as blocked, not as allowed |
