# Review 6 — delta R5 (Claude, 2026-10-05)

Phạm vi: chỉ phần sửa R5-1, R5-2 của `review-5-codex-sol.md`. Codex đã soát phần còn lại ở review 1–5.

## R5-1: `/api/console` thiếu marker phải trả 403
- `proxy.ts`: request vào `/api/console*` có `access_token` hoặc refresh cookie nhưng thiếu `portal_plane=employee` → `403 {"error":"FORBIDDEN"}`, `Cache-Control: no-store`. Payload dùng chung `AUTH_FORBIDDEN_ERROR` (`lib/api/auth-journey-bff.ts:32`).
- Matcher của proxy (`proxy.ts:40`) phủ `/api/*`, nên cổng chặn này chạy được.
- Request không có session vẫn đi theo nhánh redirect login như trước; hành vi đó có sẵn, không thuộc R5.
- Mutation M1 (tắt cổng `/api/console`): `proxy.test.ts` 5 failed / 74 → test giết được mutant.

## R5-2: SameSite của marker = SameSite của refresh cookie
- `lib/api/auth-journey-bff.ts:70-73`: đọc SameSite từ `Set-Cookie` refresh, không có thì mặc định `strict`; cookie là httpOnly.
- Mutation M2 (ép `lax`): `auth-journey-bff.test.ts` + `staff/bff.test.ts` 9 failed / 93 → test giết được mutant.

## Cổng (chạy ngoài sandbox)
`sdlc.py verify --task PORTAL-AUTH-SPLIT-001`: unit, lint, integration_typecheck, e2e_regression (`npm test` ≥ 763), spec, arch, build → 7/7 PASS.

## Kết luận
PASS. Không còn phát hiện mở nào từ review 4–5. Rủi ro còn lại đều đã ghi sổ nợ: D-140, D-143, D-144 (đang làm ở AUTH-CLIENT-IP-001), mobile chưa nghiệm thu.
