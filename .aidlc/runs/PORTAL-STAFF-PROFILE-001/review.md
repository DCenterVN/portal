# Review PORTAL-STAFF-PROFILE-001

## Verdict: PASS_WITH_RISK

Không có lỗi Chặn. 4 điểm Nên/Tuỳ bên dưới.

## Findings
| ID | Mức | file:line | Vấn đề | Đề xuất |
|---|---|---|---|---|
| F1 | Nên | features/staff-profile/staff-profile-view.tsx:33-37 | FR-2 ghi "nút đổi mật khẩu/đăng xuất", view chỉ có Đăng xuất; không có đổi mật khẩu. | Thêm link tới luồng đổi mật khẩu hoặc ghi rõ hoãn trong handback. |
| F2 | Nên | features/console/live-console.tsx:27 + features/platform/use-role-matrix.ts:15-23 | `resourcesOf` chỉ giữ resource có ít nhất 1 verb CRUDIE. Key như `audit:view` (resource không có verb CRUDIE) không có hàng, cũng không vào cột "Khác"; AC-1 nói key ngoài CRUDIE nằm ở "Khác". Nếu mọi key đều ngoài CRUDIE thì chỉ thấy header rỗng. Lỗi này cũng có sẵn ở /company. | Với /console, suy resource từ phần trước dấu `:` cuối của mọi key; hoặc ghi giới hạn đã biết. |
| F3 | Tuỳ | app/rebrand.test.ts (expectRoleSurface rawOnly) | R1 xác nhận: hồ sơ nhân viên bỏ 3 assertion token (`text-[var(--color-ink)]`, `bg-[var(--color-surface)]`, `border-[var(--color-line)]`), chỉ giữ quét raw-colour. Do view dùng token mới (`text-fg`...) nên hợp lý, nhưng là giảm kiểm tra. Test redirect `/me` cho nhân viên (AC-4) không có test nào phủ. | Chấp nhận (Dawn chốt không viết test mới); ghi nhận nợ. |
| F4 | Tuỳ | lib/fetcher.ts:2-4 | `/company` không nằm trong CONSOLE_ROUTES/isEmployeeRoute (`/platform` có trong isEmployeeRoute). `/company/account` được bảo vệ y hệt `/company`: chỉ bằng `Gate` client (workspace.tsx:54-66, kiểm /access từ org), không có proxy gate cookie `portal_plane`. Hết phiên (401, refresh lỗi) trên /company/account bị đẩy sang `/login` khách thay vì `/staff/login`. Có sẵn từ trước, không do diff này. | Thêm `/company` vào isEmployeeRoute (không vào CONSOLE_ROUTES nếu muốn giữ hành vi proxy). Task riêng. |

## Checked
- PermissionGrid (permission-grid.tsx:19): không có `onToggle` thì `locked()` luôn true, Checkbox và Button mobile đều `disabled`. Handler `onCheckedChange`/`onClick` vẫn gắn nhưng no-op và không kích hoạt được khi disabled. Cột "Khác" (dòng 20-21, 58-70) khớp bản gốc.
- /company: role-matrix-view.tsx:94 truyền `catalog`, `disabled={!editable||busy}`, `onToggle`. So với dd3d9f0, điều kiện disabled tương đương `!editable||busy||!catalog.has(key)`; markup desktop/mobile giữ nguyên. Hành vi sửa không đổi.
- Hồ sơ nhân viên: có loading (Skeleton), error + retry, empty memberships; logout qua `logoutTo("/staff/login")`; nút đổi tổ chức tới `/staff/switch-org`; key SWR "staff-profile" duy nhất; không có dữ liệu khách (chỉ `getProfile`, hiển thị trường hồ sơ + membership).
- `/me`: profile-client.tsx:36-39 redirect `/account` khi `memberships.length>0`, `return` trước `setLoading(false)` nên giữ skeleton, không flash dữ liệu nhân viên. `/account` không redirect ngược về `/me` nên không loop. Khách (0 membership) không đổi; tab tổ chức đã bỏ. Nhân viên chưa chọn org: /account bị proxy.ts:32-36 chuyển sang /staff/switch-org (đúng).
- Route guard: `/account` đã vào CONSOLE_ROUTES (fetcher.ts:2) nên proxy.ts:32 chặn khi không có `portal_plane=employee`, và isEmployeeRoute chuyển login nhân viên. `/platform/account` nằm dưới `/platform` (isEmployeeRoute) và Gate; `/company/account` xem F4. `accountHref` truyền qua ConsoleShell -> ConsoleHeader (console-shell.tsx:98, console-header.tsx:42) đúng; mặc định `/account`.
- Test đổi: journey.test.tsx chỉ trỏ file mới, assertion giữ nguyên; rebrand.test.ts xem F3. ui-rules-baseline bỏ 1 dòng tương ứng code đã xoá.
- Ponytail: tách PermissionGrid là hợp lý (2 nơi dùng). `catalog`+`disabled`+`onToggle` đủ gọn; chip "Khác" gom thành hằng `otherChip`. Không thấy abstraction thừa.
- Không chạy lại lint/typecheck/test (tin receipt PASS).

## Sau review
- F1 đã sửa: d93078f (nút Đổi mật khẩu → /staff/forgot-password), verify PASS 5/5.
- F2, F4 có từ trước → sổ nợ D-191, D-192. F3 = R1 handback.
