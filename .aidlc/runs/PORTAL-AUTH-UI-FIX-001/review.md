# Independent review — PORTAL-AUTH-UI-FIX-001

- Phạm vi: `git diff portal-ui-rebuild...auth-rbac-001 -- . ':!.aidlc' ':!package-lock.json'` (30 commit, 46 file, +979/-315).
- Reviewer: độc lập, không sửa code.
- Kiểm chạy: `npm run lint` 0 lỗi; `npm run typecheck` 0 lỗi; `npm test` 53 file / 999 test xanh.
- Bằng chứng thêm: mô phỏng `safeLanding` với 17 payload (node), in `Set-Cookie` thật của `NextResponse.cookies.delete` (node, next/server.js).

## Verdict: BLOCKED

Một lỗi Chặn (cookie `__Host-refresh_token` không bị xoá khi đăng xuất trên môi trường HTTPS). Sửa 1 dòng. Phần còn lại đạt: open redirect kín, PUT ma trận giữ key ngoài CRUDIE, không có so tên role.

## Bảng lỗi

| # | Mức | Vị trí | Kịch bản | Bằng chứng |
|---|---|---|---|---|
| B1 | Chặn | `app/api/auth/logout/route.ts:6,9` | Auth chạy secure (prod/HTTPS) đặt refresh cookie tên `__Host-refresh_token` (`auth/internal/transport/http/web_auth.go:44,48`). `res.cookies.delete(name)` phát `__Host-refresh_token=; Path=/; Expires=1970` **không có `Secure`**. Cookie có tiền tố `__Host-` mà thiếu `Secure` bị trình duyệt bỏ qua, nên cookie sống sót sau "Đăng xuất". Khi đó `proxy.ts:21,23` coi `hasRefreshToken` là đã đăng nhập: khách bấm Đăng xuất, tải `/cart`, **không** bị chuyển `/login?redirect=/cart` (AC-1 sai); nhánh 429/500 (AC-3) cũng không xoá được phiên. Live S5 trên dev HTTP dùng tên `refresh_token` nên PASS giả (`live.md:7`). | Đã in `Set-Cookie` thật: không có `Secure`. Hành vi trình duyệt theo RFC 6265bis (chưa chạy trình duyệt HTTPS). Sửa: với `__Host-refresh_token` dùng `res.cookies.set(name, "", {path:"/", expires:new Date(0), secure:true, httpOnly:true})`. |
| N1 | Nên | `frame.lock.json`, `components/layout/customer-auth-shell.tsx`, `components/layout/employee-auth-shell.tsx`, `app/ui-rules-baseline.txt` (commit `0d0a22d`, `c3d54a8`) | Plan Scope + AC-14 cấm đổi file khung ("không file khung nào đổi byte"). Hai shell bị sửa, hash trong `frame.lock.json` bị ghi đè lại cho `frame-lock.test` xanh, baseline `ui-rules` bị xoá 2 dòng. Cổng xanh vì chính lock bị sửa chứ không vì khung nguyên vẹn. Không thấy ghi chú duyệt của Dawn trong commit. | `git diff` frame.lock.json: 2 hash đổi. Cần Dawn xác nhận ngoại lệ (ghi vào plan) hoặc hoàn tác. |
| N2 | Nên | `features/platform/role-matrix-view.tsx:118-131,183-199` (VERBS.map) | Mọi tài nguyên luôn có đủ 6 ô C R U D I E có thể bấm, kể cả khi key không tồn tại trong danh mục (vd. `x:y:import`). Tick ô đó rồi Lưu: org trả 400 `unknown actions` (`org/internal/repository/platform_plane.go:164`) và **cả lần lưu của role thất bại**; thông báo lỗi chung "module chưa mua hoặc action không hợp lệ" không chỉ ra ô nào. Gợi ý: vô hiệu ô khi key không nằm trong hợp action của mọi role (đã có `resourcesOf`), hoặc báo tên key từ message. | Đọc code UI + handler org. |
| N3 | Nên | `features/platform/role-matrix-view.tsx:55-72,89-93` | `Segmented` không bị khoá khi `busy`. Bấm Lưu rồi đổi role trong lúc PUT chạy: `setDone`/`setFailure` (dòng 61, 68) gắn thông báo "Đã cập nhật ROLE_A" hoặc lỗi của ROLE_A vào màn của ROLE_B. Sau `choose()` draft B lấy từ `data` cũ trước `mutate`, nhưng `mutate` ghi đè `data` toàn ma trận bằng kết quả PUT nên không mất dữ liệu; chỉ sai thông báo. Gợi ý: `disabled` Segmented khi `busy`. | Đọc code. |
| N4 | Nên | `features/customer-auth/login-form.tsx:18-24` và `features/employee-auth/staff-login.tsx:17-25`; `SHAKE_STYLE` ở `login-form.tsx:26`, `register-form.tsx:22`, `staff-login.tsx:26` | Code thừa: `loginErrorKey` gần như giống hệt ở 2 file; khối CSS keyframes `shake` copy 3 lần, mỗi form nhúng `<style dangerouslySetInnerHTML>` riêng. Gom `animate-shake` vào một nơi (globals/tailwind) và một `loginErrorKey` dùng chung. | Đọc code. |
| N5 | Nên | `lib/auth/client.ts:31-37` (`logoutTo`) | AC-3 yêu cầu "có toast báo" khi logout lỗi (429/mạng). `logoutTo` chỉ `try/finally` rồi `window.location.assign`, không toast. Cookie được xoá (trừ B1) nên về an toàn ổn, thiếu phần UX của AC. | Đọc code. |
| T1 | Tuỳ | `lib/api/auth-journey-bff.ts:95` | Auth map `ErrUserNotActive` cho cả "chưa kích hoạt" lẫn "đã bị vô hiệu hoá" (`auth/internal/transport/http/error_mapper.go:73`). BFF luôn trả `NOT_ACTIVATED` nên tài khoản bị khoá cũng thấy "Kiểm tra email để kích hoạt" + link gửi lại. Không lộ thông tin (kiểm sau khi xác thực mật khẩu, `login.go:228`), chỉ sai gợi ý. | Đọc code. |
| T2 | Tuỳ | `features/store/store-frame.tsx:35,61` + `features/customer-auth/auth-popup.tsx:36` | `signedIn={!!user}` là false đến khi `/api/auth/me` trả về. Khách đã đăng nhập mở `/?auth=login` có thể thấy popup nháy một lần. Nghi ngờ, chưa chạy trình duyệt. | Đọc code. |
| T3 | Tuỳ | `lib/api/service-bff.ts:~23-30` (không thuộc diff) | PUT ma trận qua `forwardService` không kiểm `Origin`/`Sec-Fetch-Site`/`Content-Type` (khác `readFields` ở auth). Được che bởi `access_token` `SameSite=Strict` (`auth-journey-bff.ts:164`, `refresh/route.ts:41`); chỉ rủi ro nếu sau này nới SameSite. Có sẵn từ trước, không do diff này. | Đọc code. |
| T4 | Tuỳ | `features/employee-auth/staff-login.tsx:~72` và `login-form.tsx:~72` | `form.querySelector("input")?.focus()` chạy trong `catch` khi input còn `disabled={busy}` (busy tắt ở `finally`), nên focus không có tác dụng. | Đọc code. |
| T5 | Tuỳ | `features/platform/role-matrix-view.tsx:93` | Bấm lại đúng role đang có nháp chưa lưu vẫn mở hộp thoại "Chuyển sang <chính nó>" và bỏ nháp. | Đọc code. |
| T6 | Tuỳ | `app/(auth)/login/page.tsx`, `register/page.tsx` | `searchParams.redirect` có thể là mảng khi lặp tham số; `URLSearchParams.set` ép thành "a,b". Chỉ làm redirect rơi về `/` (đã qua `safeLanding`), không mở lỗ. | Đọc code. |

## Đã kiểm, không có lỗi

- Open redirect: `safeLanding` (`auth-journey-bff.ts:37-53`) chặn `//evil.com`, `/\evil.com`, `%2F%2Fevil.com`, `/%2Fevil.com`, `/%5C…`, `https://…`, `/\t/evil.com`, `/products/..//evil.com`, `/.//evil.com`, `/%252F/…`, CRLF (17 payload × 2 hành trình, đều về fallback hoặc đường dẫn cùng site). `redirect` chỉ được nhận qua BFF (`readFields` allow-list) và client chỉ dùng `next_path` do server trả.
- `redirect` nhân viên: `requested` loại `/staff/switch-branch`, chỉ áp khi `decision.next_path === "/console"`; nền tảng và nhiều org giữ landing riêng (AC-9).
- Lộ token: không thấy token ra client; cookie `access_token` httpOnly + Strict + secure.
- Cấm so tên role: grep trên diff (trừ test) không có `role ===`, `OWNER`, `PLATFORM_ADMIN`; `editable` lấy từ `can("platform:role_matrix:update")`; sidebar lọc bằng key quyền.
- PUT ma trận giữ key ngoài CRUDIE: draft khởi tạo từ `data[role]` và `toggle` chỉ đổi đúng một key, nên các key lạ được gửi lại nguyên (AC-10/11).
- Hook: không thấy lỗi deps; mọi `useState`/`useRoleMatrix` đặt trước các `return` sớm.
- Sidebar ẩn chỉ là UX: `consoleRouteAllowed` fail-open với đường dẫn không có trong nav, và org vẫn là nơi quyết quyền.
- Key đổi tên (`org:membership:read`, `production:qc:update`, `platform:staff:read`…) khớp danh mục mới `org/migrations/20261011000001_auth_rbac_catalog.sql`.
- Chưa có test cho nhánh `NOT_ACTIVATED` mới (`grep` trong `auth-journey-bff.test.ts` và `bff.test.ts` không có); phù hợp ràng buộc "không test thừa" nhưng ghi nhận.

## Điểm (0..1)

| Tiêu chí | Điểm | Lý do |
|---|---|---|
| correctness | 0.80 | lint/typecheck/999 test xanh; trừ B1, N2, N3 |
| security | 0.72 | redirect/token/CSRF ổn; B1 làm đăng xuất sót cookie refresh ở HTTPS |
| spec_fit | 0.78 | AC-1/3 sai ở HTTPS (B1), AC-3 thiếu toast (N5), AC-14 qua cổng bằng cách sửa lock (N1) |

## Điều kiện để chuyển PASS

1. Sửa B1 và chứng minh bằng test BFF kiểm `Set-Cookie` của `__Host-refresh_token` có `Secure`.
2. Dawn xác nhận hoặc hoàn tác N1.
3. N2, N3 nên sửa trong cùng PR (đều nhỏ).
