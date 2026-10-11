# Plan: PORTAL-STAFF-PROFILE-001

- **Task ID**: `PORTAL-STAFF-PROFILE-001`
- **Mode**: `hard`
- **Story**: US-UI-001
- **Sprint**: 01
- **Issue**: 

## Scope
- Outcome: Dawn xem trên UI: (1) `/console` hiện quyền dạng ma trận checkbox tài nguyên × CRUDIE (chỉ đọc) thay vì list chip; (2) bấm avatar → hồ sơ: nhân viên vào trang hồ sơ nhân viên riêng trong shell console, khách vào `/me` của store; không dùng chung.
- Decision: REUSE (lưới ma trận đã có trong `features/platform/role-matrix-view.tsx:101-156`, `VERBS`/`resourcesOf` ở `features/platform/use-role-matrix.ts:12,15`, `getProfile` ở `lib/auth/client.ts`) + CREATE (trang hồ sơ nhân viên).
- Impact: `ConsoleHeader` mặc định `accountHref = "/me"` (`components/layout/console-header.tsx:56`) → mọi shell nhân viên (`features/console/console-frame.tsx:91`, `features/platform/workspace.tsx:70`) đang đẩy nhân viên sang `/me` của store; `/me` (`app/(store)/me/profile-client.tsx:29`) trộn tab "Tổ chức & Chi nhánh" của nhân viên vào hồ sơ khách.

## Requirements
- FR-1: Thẻ "Quyền đã phân giải" ở `/console` là ma trận tài nguyên × (create/read/update/delete/import/export) + cột "Khác", ô = checkbox disabled, tick khi phiên có key `resource:verb`.
  - AC-1: OWNER đăng nhập `/console` → thấy bảng checkbox, không còn chip `code`; key ngoài CRUDIE nằm ở cột "Khác".
  - AC-2: `/company` ma trận role vẫn sửa được như cũ (superadmin) — cùng 1 component lưới.
- FR-2: Hồ sơ nhân viên riêng: `/account` (console), `/platform/account`, `/company/account` — hiển thị tên, email, SĐT, trạng thái, danh sách tổ chức/chi nhánh/role, nút đổi mật khẩu/đăng xuất; nằm trong shell console.
  - AC-3: Nhân viên bấm avatar → "Tài khoản" → tới trang hồ sơ nhân viên của đúng shell, không sang store.
- FR-3: `/me` chỉ cho khách: bỏ tab "Tổ chức & Chi nhánh"; tài khoản có membership (nhân viên) mở `/me` → `router.replace("/account")`.
  - AC-4: Khách vào `/me` không thấy tab tổ chức; nhân viên gõ `/me` bị chuyển sang `/account`.
- Ngoài phạm vi: hồ sơ khách lấy từ customer service (`/customer/me`, địa chỉ) — thuộc PORTAL-BASE-UI-001 S3; sửa thông tin nhân viên (chỉ xem).

## Technical definition
- ADR-024 (`ticket/AGENTS.md:74`: "customer = activated user (no membership)") → `memberships.length > 0` là nhân viên.
- Dawn chốt 11/10: không viết test mới; chỉ sửa test cũ đỏ. Cổng: lint + typecheck + npm test + archcheck.

## UX
- Lưới dùng lại y nguyên style bảng ma trận ở `/company` (token, `Checkbox` `components/ui/checkbox`), mobile giữ dạng thẻ như role-matrix-view.
- Hồ sơ nhân viên: `PageShell`/`PageHeader` + `Card` như các trang console khác; không glass.

## Design
- `features/platform/permission-grid.tsx`: tách phần bảng (desktop + mobile) từ `role-matrix-view.tsx`; props `{ actions: string[]; resources: string[]; onToggle?: (key, on) => void }` — không có `onToggle` = chỉ đọc (disabled).
- `features/console/live-console.tsx`: thay chip bằng `<PermissionGrid actions={data.permissions} resources={resourcesOf({ me: data.permissions })} />`.
- `features/staff-profile/staff-profile-view.tsx`: client, `getProfile()`; 3 route page 1 dòng render view.
- `console-header.tsx` mặc định `accountHref = "/account"`; `workspace.tsx` truyền `/platform/account` | `/company/account` theo `plane`.

## Files planned
- features/platform/permission-grid.tsx
- features/platform/role-matrix-view.tsx
- features/console/live-console.tsx
- features/staff-profile/staff-profile-view.tsx
- app/(console)/account/page.tsx
- components/layout/console-header.tsx
- app/platform/account/page.tsx
- app/company/account/page.tsx
- features/platform/workspace.tsx
- app/(store)/me/profile-client.tsx
- lib/fetcher.ts
- frame.lock.json
- app/ui-rules-baseline.txt
- app/rebrand.test.ts
- features/employee-auth/journey.test.tsx

## Tests planned
TC-1 | AC-1,AC-2 | lint+type+unit | `npm run lint && npm run typecheck && npm test`
TC-2 | AC-3,AC-4 | Dawn xem UI trên :3000 (Anti chạy lại sau) | thủ công

## Slices
- [x] S1: ma trận checkbox chỉ đọc ở /console, dùng chung lưới với /company (files: features/platform/permission-grid.tsx, features/platform/role-matrix-view.tsx, features/console/live-console.tsx; test: npm run lint && npm run typecheck && npm test)
- [x] S2: hồ sơ nhân viên /account trong shell console (files: features/staff-profile/staff-profile-view.tsx, app/(console)/account/page.tsx, components/layout/console-header.tsx; test: npm run lint && npm run typecheck && npm test)
- [x] S3: hồ sơ nhân viên ở shell nền tảng/công ty + /me chỉ cho khách (files: app/platform/account/page.tsx, app/company/account/page.tsx, features/platform/workspace.tsx, app/(store)/me/profile-client.tsx; test: npm run lint && npm run typecheck && npm test)
- [x] S4: /account là route nhân viên + khoá khung/baseline theo khung mới (files: lib/fetcher.ts, frame.lock.json, app/ui-rules-baseline.txt; test: npm run lint && npm run typecheck && npm test)
- [x] S5: hồ sơ nhân viên giữ nút "Đổi tổ chức" (/staff/switch-org) từng có ở /me; 3 test cũ chuyển sang kiểm hồ sơ nhân viên (files: features/staff-profile/staff-profile-view.tsx, app/rebrand.test.ts, features/employee-auth/journey.test.tsx; test: npm run lint && npm run typecheck && npm test)

### Bổ sung sau S1–S3 (verify BLOCKED 8 test cũ đỏ, receipt `artifacts/verification.json`)
- `lib/fetcher.ts:2` `CONSOLE_ROUTES` thiếu `/account` (`proxy.ts:1` chỉ import; bản trước ghi nhầm `proxy.ts`) → chưa đăng nhập bị đẩy `/login` (khách) thay vì `/staff/login`; `proxy.test.ts` R3 kiểm registry = `app/(console)` (2 test) + `lib/fetcher.test.ts` R3 (refresh hỏng từ `/account`) xanh lại khi thêm `/account`.
- `frame.lock.json`: `console-header.tsx` là file khung (FR-13) → cập nhật hash bằng `scripts/frame-lock.mjs`.
- `app/ui-rules-baseline.txt:11-15`: dòng `profile-client.tsx` hết hiệu lực sau khi bỏ tab → rút baseline (chỉ được rút). Kết quả S4: chỉ `#5` hết hiệu lực, 4 dòng kia `/me` vẫn dùng.
- `app/rebrand.test.ts` (tab memberships + "Khách hàng vãng lai (CUSTOMER)") và `features/employee-auth/journey.test.tsx` (nút `/staff/switch-org` trong `profile-client.tsx`): hành vi chuyển sang hồ sơ nhân viên → sửa test cũ theo chỗ mới, không thêm test mới (Dawn 11/10: chỉ sửa test cũ đỏ).

## Risks / rollback
- Test cũ có thể khớp text chip/`/me` (`app/rebrand.test.ts`, `layout-gate.test.ts`) → sửa test cũ theo hành vi mới, không thêm test.
- Rollback: revert nhánh `portal-staff-profile-001`.

## Open decisions
- Chốt: hồ sơ nhân viên ở `/account` (shell console), `/platform/account`, `/company/account`; khách giữ `/me`.

- S5 bổ sung: `app/rebrand.test.ts` giữ kiểm `/me` tab general + security (ProfileClient vẫn có 2 tab đó); chỉ ca memberships chuyển sang StaffProfileView.
