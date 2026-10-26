# Ca lỗi S1 khi kiểm lại

Oracle dưới đây ghi trước vòng verify verbose của lượt tiếp ngày 2026-10-26, sau khi các test S1 đã tồn tại. Đây không phải bằng chứng đã viết oracle trước lượt TDD ban đầu. Chỉ mô tả phạm vi S1; không chứng nhận các ca client/UI/runtime S2–S16.

| id | category | derived from | expected | test |
|---|---|---|---|---|
| S1-BC-01 | missing_field | PATCH hồ sơ, bỏ cookie access_token | UNAUTHORIZED; từ chối trước upstream. Test hiện assert HTTP 401, chưa assert wire code ở nhánh thiếu cookie. | rejects missing session and injected principal |
| S1-BC-02 | wrong_type | PATCH tên, thay chuỗi bằng null/array/number | VALIDATION_ERROR, HTTP 400, upstream count 0 | rejects invalid names before upstream |
| S1-BC-03 | boundary | PATCH tên rỗng, 51 code points hoặc control character | VALIDATION_ERROR, HTTP 400, upstream count 0 | rejects invalid names before upstream |
| S1-BC-04 | authz | PATCH từ Origin khác/thiếu, Sec-Fetch-Site mâu thuẫn hoặc content type sai | FORBIDDEN, HTTP 403, upstream count 0 | rejects CSRF contradictions |
| S1-BC-05 | tenant | PATCH tên kèm user_id của người khác | BAD_REQUEST, HTTP 400, upstream count 0; không thử tài khoản tenant thật | rejects missing session and injected principal |
| S1-BC-06 | replay | POST mật khẩu nhận upstream 401/429/503 | invalid_current_password, rate_limit_exceeded hoặc service_busy theo status; đúng 1 upstream call, giữ cookie. Chưa chứng minh client không refresh/replay ở S2. | preserves error code/status/retry without cookies or raw messages |
| S1-BC-07 | expired_token | Challenge email/avatar hết hạn | Không áp dụng cho endpoint tên/mật khẩu S1 vì không nhận challenge/grant; thuộc S7–S16. Chưa kiểm JWT hết hạn qua auth thật. | N/A |

Kết quả thực tế lấy từ `artifacts/logs/unit.log` sau verify. Browser E2E hoãn R32. Các assertions hiện có không chứng minh revoke session A/B ở auth thật.
