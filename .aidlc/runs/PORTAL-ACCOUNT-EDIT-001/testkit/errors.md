# Bộ ca từ chối và oracle

Mỗi nhóm phải có test cụ thể sau cook. Mã theo error_mapper auth và BFF hiện có; không coi status 4xx bất kỳ là đạt.

- missing_field: display_name/current_password/new_password/new_email/token/upload_id thiếu -> VALIDATION_ERROR hoặc BAD_REQUEST đúng boundary; upstream count 0 khi BFF reject.
- wrong_type: null/array/object/số thay chuỗi và file_size không integer -> từ chối; không coerce ID.
- boundary: tên 0/50/51 code points + NFC/control; mật khẩu 11/12 và 256/257 byte UTF-8; ảnh 0/2097152/2097153, MIME và dimensions theo contract.
- authz: thiếu cookie -> UNAUTHORIZED; Origin khác/thiếu/mâu thuẫn -> FORBIDDEN; Sec-Fetch-Site same-origin không cứu Origin khác; auth bearers không lấy từ body/header browser.
- tenant: foreign user token/upload_id -> lỗi owner, không đổi GET me; account có membership trống vẫn self-edit được.
- replay: duplicate submit một mutation; explicit retry token đã dùng -> invalid_token; request email cũ sau replacement không đổi email; client không tự replay mutation 401/429/503.
- expired_token: email token hết hạn -> invalid_token; avatar grant hết hạn -> UPLOAD_EXPIRED; không tự xin grant khi chỉ chọn file.
- invalid_current_password: password change sai -> inline Việt, không clear cookie/refresh; email sai dùng UNAUTHORIZED, phân biệt session qua GET me.
- rate_limit_exceeded: giữ 429/Retry-After, chờ/retry có chủ ý; không vượt budget QA bằng loop vô hạn.
- service_busy: 503/Retry-After từ KDF, không hiển thị “Sai mật khẩu”.
- COMMIT_OUTCOME_UNKNOWN: finalize read-back trước khi xin grant mới; lỗi network password/email không auto-replay.
- INTERNAL_ERROR: upstream non-JSON/timeout -> message Việt chung; không lộ S3/SQL/host/raw token.

Session: password/confirm thành công chỉ chứng minh revoke khi refresh bằng session A/B cũ thất bại; cookie clear riêng không đủ. Pending email không được revoke. Mailpit phải có link thật theo AC-4 trước khi đánh dấu thành công, token chỉ trong RAM và URL scrub trước POST.

Báo cáo chỉ số pass/fail/skipped và case ID. Không response body/cookie/payload bí mật trong snapshots, log hay artifacts. e2e-browser: hoãn R32.
