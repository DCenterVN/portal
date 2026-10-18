# Review 2 — delta sau sửa (Claude Opus, điều phối, không viết code)

Đối chiếu `review.md` (Sonnet độc lập, BLOCKED) với commit eb4492c + `evidence/review-fix.txt` + receipt PASS 6/6 (head 4ad13f8).

| Mục | Kết luận | Bằng chứng |
|---|---|---|
| B1 xoá `__Host-refresh_token` thiếu Secure | Đã sửa | `logout/route.ts` `clearSession` set `secure` cho tiền tố `__Host-/__Secure-`; Set-Cookie thật có `Path=/; Max-Age=0; Secure`, không Domain |
| N1 đổi file khung shell auth | Không phải lỗi | Dawn chốt 11/10 mở khoá 2 shell, canvas thắng test cũ |
| N2 ô CRUDIE ngoài catalog | Đã sửa | 234 → 69 ô bấm được/role, khớp 69 key |
| N3 đổi role khi đang lưu | Đã sửa | `<fieldset disabled={busy}>` quanh Segmented |
| N4 code trùng | Một phần | SHAKE_STYLE khách gộp; staff không gộp vì `auth-boundary.test.ts` cấm import chéo hành trình |
| N5 toast khi logout lỗi | Đã sửa | `logoutTo(path, onError)` + `toast.error` ở 3 khung |

Rủi ro còn lại:
- Catalog = hợp action của mọi role trong response: key chưa role nào có thì superadmin không bật được qua UI, cần API catalog riêng.
- B1 chỉ chứng minh bằng header trên dev HTTP; chưa chạy trình duyệt HTTPS, nhánh 429/500 chưa kích hoạt live.
- T1–T6 trong `review.md` để sau.

Verdict: PASS_WITH_RISK.
