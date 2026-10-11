# Handback — PORTAL-AUTH-UI-FIX-001

Điều phối: Claude Opus. Code: Claude Sonnet (S1–S4, S8, S9, làm lại design + popup). Skin/nghiệm thu: Antigravity (S6, S7).

## Done
- S1 đăng xuất mọi khung, xoá access/refresh/CSRF/portal_plane cả khi upstream lỗi.
- S2 BFF nhận `?redirect` an toàn, whitelist landing nhân viên, lỗi 401/403 NOT_ACTIVATED/429 retry_after_ms/5xx.
- S3 form khách/nhân viên: lỗi phân biệt, đếm ngược 429, gửi lại kích hoạt.
- S4 ma trận role × CRUDIE, 1 role/lần, PUT từng role; OWNER chỉ đọc; `/roles` → `/company`.
- S5 live: `live.md` (merge vào `portal-ui-rebuild` đi qua PR theo Dawn chốt).
- S6 Anti: Segmented, chip mobile, cột "Khác", hiệu ứng. S7 Anti: walkthrough + 29 ảnh, đối chiếu log Kong.
- Design: 2 shell auth port từ canvas; placeholder; popup khách trên `/` (`?auth=login|register&redirect=`), `/login` `/register` 307 sang popup.
- S8 sidebar console lọc theo key quyền (`/org/permissions/me`), vào thẳng URL không quyền → trang cấm.
- S9 popup giữ `redirect` khi đổi tab, theo locale `NEXT_LOCALE`.
- Receipt `artifacts/verification.json` PASS 6/6 (unit 999, lint, typecheck, integration live.sh 21 mục, e2e, spec).

## Files changed
Task này: `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`, `app/(console)/roles/page.tsx`, `app/api/auth/logout/route.ts`, `components/layout/{customer,employee}-auth-shell.tsx`, `features/console/console-{frame.tsx,nav.ts}`, `features/customer-auth/{auth-popup,form-feedback,login-form,register-form}.tsx`, `features/employee-auth/staff-login.tsx`, `features/platform/{role-matrix-view.tsx,use-role-matrix.ts,workspace.tsx}`, `features/store/store-frame.tsx`, `lib/api/{auth-journey-bff,customer-auth,employee-auth}.ts`, `lib/auth/client.ts`, `messages/{vi,en}.json`, `frame.lock.json`, `app/ui-rules-baseline.txt`; test cũ sửa assertion: `app/rebrand.test.ts`, `features/{customer,employee}-auth/journey.test.tsx`, `features/platform/role-matrix.test.ts`, `lib/api/auth-journey-bff.test.ts`.
Phần còn lại của diff so với `portal-ui-rebuild` (platform/production/sales views, `operations.generated.ts`, tests/integration) là pha 1 AUTH-RBAC-001 có sẵn trên nhánh trước task này.

## Decisions
- OD-1 gộp vào `portal-ui-rebuild` (qua PR, vì checkout chính đang có file .aidlc dở của REBUILD).
- OD-2 `/roles` → `/company` bảng thật chỉ đọc. OD-3 1 role/lần. OD-3b PUT từng role.
- OD-4/OD-5 [ASSUMED], Dawn duyệt `--accept-assumed`.
- Canvas thắng test rebrand cũ (Dawn chốt); mở khoá 2 shell auth.
- Login/đăng ký khách là popup trên landing (Dawn chốt).
- Không viết test mới (Dawn chốt 11/10), kiểm bằng live + Anti.

## Left over
- Popup và trang cấm render ở client: chưa có ảnh trình duyệt sau S8/S9; popup tiếng Anh chưa ai xem.
- `/api/auth/context` không có org_id/branch_id thì lấy context đầu: nhân viên nhiều chi nhánh có thể thấy sidebar sai chi nhánh.
- 429 thật chưa đo. Panel ưu đãi khách là chữ tĩnh, chờ nội dung.
- Kong dev thiếu route customer (S12 dev-infra). Số test 999 (bỏ 1 assert icon cũ theo canvas).
- Design chỉ tính là đạt khi Dawn xem.
