# Handback — PORTAL-STAFF-PROFILE-001

Điều phối: Claude Opus. Code: Claude Sonnet (S1–S5). Góp ý gốc: Dawn 11/10 (ma trận phải là checkbox; hồ sơ nhân viên/khách tách riêng).

## Done
- S1 `4c69ae6`: `features/platform/permission-grid.tsx` tách từ `role-matrix-view.tsx`; `/console` "Quyền đã phân giải" = lưới checkbox chỉ đọc (không `onToggle` → disabled); `/company` vẫn sửa được.
- S2 `db69156`: `features/staff-profile/staff-profile-view.tsx` + `/account`; `ConsoleHeader` mặc định `accountHref="/account"`.
- S3 `aa32a2b`: `/platform/account`, `/company/account`; `workspace.tsx` truyền `accountHref` theo plane; `/me` bỏ tab tổ chức, nhân viên (`memberships.length>0`) → `router.replace("/account")`.
- S4 `e1d098e` + `621690f`: `/account` vào `CONSOLE_ROUTES` (`lib/fetcher.ts:2`); `frame.lock.json` (chỉ console-header); baseline rút 1 dòng (`#5`).
- S5 `3b539ea` + `50fe3ad`: nút "Đổi tổ chức" → `/staff/switch-org` trong hồ sơ nhân viên; test cũ theo chỗ mới, giữ test `/me` tab general/security.
- Receipt `artifacts/verification.json` PASS 5/5: lint, typecheck, unit 1002/1002, integration `evidence/live.sh` (5 mục), e2e `evidence/e2e.sh` (2 luồng).

## Files changed
- app/(console)/account/page.tsx
- app/(store)/me/profile-client.tsx
- app/company/account/page.tsx
- app/platform/account/page.tsx
- app/rebrand.test.ts
- app/ui-rules-baseline.txt
- components/layout/console-header.tsx
- features/console/live-console.tsx
- features/employee-auth/journey.test.tsx
- features/platform/permission-grid.tsx
- features/platform/role-matrix-view.tsx
- features/platform/workspace.tsx
- features/staff-profile/staff-profile-view.tsx
- frame.lock.json
- lib/fetcher.ts

## Decisions
- Hồ sơ nhân viên ở `/account` (+ `/platform/account`, `/company/account`), khách giữ `/me` — Dawn duyệt plan 11/10.
- Nhân viên = `memberships.length > 0` (ADR-024, `ticket/AGENTS.md:74`).
- Không thêm test mới (Dawn 11/10); chỉ sửa test cũ đỏ theo hành vi mới.

## Left over
- R1: test hồ sơ nhân viên trong `app/rebrand.test.ts` dùng `expectRoleSurface(html, true)` — chỉ kiểm không màu thô, bỏ kiểm token `--color-ink/surface/line` + role heading (staff view dùng token mới `text-fg`, `divide-line`).
- R2: khách vào `/account` → 307 `/staff/switch-org` (giống mọi route console, `proxy.ts:33`), không phải `/me`.
- R3: hồ sơ khách vẫn lấy `/auth/me`, chưa dùng customer service (`/customer/me`, địa chỉ) — PORTAL-BASE-UI-001 S3.
- Design chưa tính đạt tới khi Dawn xem trên :3000.
