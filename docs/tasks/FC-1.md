# FC-1 — Một sidebar, bỏ fix cứng ở portal

Trạng thái: DONE · Repo: portal · Nguồn: `platform-docs/planning/sprints/261108-handoff/fix-cung.md` (#1, #2, #4, #10 phần portal, #12) · Sau: PORTAL-HOSO (đã merge main).

## CONTEXT
- Portal còn 2 khung menu: console (`lib/navigation.ts` `CONSOLE_NAV`) và workspace (`WORKSPACE_NAV` + `navFor`, dùng ở `features/platform/workspace.tsx`, `app/company/layout.tsx`, `app/platform/layout.tsx`). Các trang dưới `/company`, `/platform` hiện chỉ là redirect (`/company` → `/roles`, `/platform/role-matrix` → `/roles`, `/platform/audit` → `/audit`) và 2 trang tài khoản trùng `/account`.
- Route nhân viên chép 3 chỗ: `lib/fetcher.ts` `CONSOLE_ROUTES`, `isEmployeeRoute`, `proxy.ts` (`[...CONSOLE_ROUTES, "/company/account"]`).
- org đã có `GET /org/company` → `{id, name}` (org `docs/specs/branches.md:74`). Portal lấy tên công ty từ bếp đầu tiên (`lib/api/branches-client.ts:18`). Org nay cho nhiều bếp (ORG-MULTI-KITCHEN, org main `9afbaee`), nên "bếp đầu tiên" sai.
- `GET /org/company/roles` đã trả `{code, name, branch_types}`.

## REQUIRED
1. **Một sidebar:** xoá `WORKSPACE_NAV`, `navFor`, `WorkspaceRule`, `CompanyWorkspace`/`PlatformWorkspace` và `app/company/*`, `app/platform/*`. Đường cũ (`/company`, `/company/account`, `/platform`, `/platform/*`) redirect cố định về trang console tương ứng (`/roles`, `/account`, `/audit`) qua `redirects()` trong `next.config` hoặc `proxy.ts`, chọn chỗ ít code nhất. Không giữ song song.
2. **Một nguồn route:** `CONSOLE_ROUTES` và `isEmployeeRoute` và `proxy.ts` đọc cùng một danh sách. Giữ test drift route-group đang có (nó so `app/(console)` với danh sách). Bỏ `"/company"`, `"/platform"` khỏi `isEmployeeRoute` sau bước 1.
3. **Vai trò không `z.enum`** (#1): `lib/api/platform-client.ts` `role_codes` → `z.array(z.string())`. Rà mọi `z.enum` khác parse dữ liệu của service khác trong `lib/api/` (vd `branches-client.ts` `type`) → `z.string()`. Giữ `z.enum` chỉ cho trạng thái có CHECK ở DB (`ACTIVE/SUSPENDED/CLOSED`). `employeeRoles` nếu còn dùng làm danh sách hiển thị thì để nguyên, FC-3 xử lý.
4. **Không bỏ loại chi nhánh lạ** (#2, #10): `lib/branch-choices.ts:11` không loại `branch_type` khác 2 loại; `BranchType` thành `string`; `branchTypeLabel` trả nhãn cho 2 loại đã biết, loại lạ hiện mã thô. Sắp xếp: CENTRAL_KITCHEN trước, còn lại theo tên.
5. **Tên công ty từ `GET /org/company`** (#4 Dawn lượt 2): thêm rule `GET ^company$` vào `lib/api/company-bff.ts`; `companyBranches()` lấy `org` từ API đó, không từ bếp đầu tiên. Gọi song song với danh sách chi nhánh.
6. **BFF thiếu env báo lỗi** (#12): mọi `process.env.X || "http://localhost:80xx"` trong `app/api/**` và `lib/api/**` → một hàm đọc URL service: có env thì dùng; thiếu env và `NODE_ENV !== "production"` thì dùng localhost như cũ; thiếu env ở production thì ném lỗi rõ tên biến (BFF trả 500 `{error:"SERVICE_URL_MISSING"}` hoặc mã có sẵn trong `platform-docs/docs/api/error-code-usage.md`, không tự đặt mã mới). Tìm helper có sẵn trước (`lib/api/service-bff.ts`), đặt hàm ở đó nếu chưa có.

## CONSTRAINT
- Chỉ repo portal, worktree `ticket/.cache/worktrees/portal-fc1` từ `main`. Không commit, không push.
- Không comment trong code. File ≤400 dòng. Không thêm dependency. Không helper trùng: xem `lib/` trước.
- Không đổi giao diện màn khác ngoài sidebar/redirect. Không làm FC-3 (nhãn vai trò từ catalog) ở lô này.
- Không test thừa: sửa test cũ theo hành vi mới; thêm test chỉ cho: (a) chi nhánh loại lạ vẫn hiện, (b) role code lạ parse được, (c) BFF thiếu env ở production báo lỗi, (d) đường cũ `/company/account` về `/account`.

## ACTION
1. Đọc `portal/AGENTS.md`, các file ở CONTEXT.
2. Làm REQUIRED 1→6, mỗi bước chạy vitest của vùng đó.
3. Cuối: `npx vitest run` (full), `npx tsc --noEmit`, `npm run lint`, `npx next build --webpack`. Đỏ có sẵn trên main: `supplier-contract-bff.test.ts`, lint `no-control-regex` ở `e2e/dev-walkthrough`.

## OUTPUT
- File `docs/tasks/FC-1.md` cập nhật trạng thái DONE + mục "Kết quả": file đổi, lệnh đã chạy với số pass/fail, phần chưa làm.
- Câu hỏi nào chưa rõ: ghi vào cuối file này, dừng, không tự đoán.

## Kết quả
- 1 Một sidebar: xoá `app/company/*`, `app/platform/*`, `features/platform/workspace.tsx`, `WORKSPACE_NAV`/`navFor`; redirect cố định trong `next.config.mjs` (`/company`, `/platform`, `/platform/*` về `/roles`; `/company/account`, `/platform/account` về `/account`; `/platform/audit` về `/audit`). `app/layout-gate.test.ts` sửa theo (file khoá khung) và chạy lại `node scripts/frame-lock.mjs --write` (chỉ đổi hash layout-gate).
- 2 Một nguồn route: `proxy.ts` dùng thẳng `CONSOLE_ROUTES`; bỏ `/company`, `/platform` khỏi `isEmployeeRoute`; test drift giữ nguyên.
- 3 `role_codes` và `branchSchema.type` thành `z.string()`; `z.enum` còn lại là trạng thái/enum của chính portal.
- 4 `lib/branch-choices.ts` không loại loại lạ; `BranchType = string`; `branchTypeLabel` trả mã thô cho loại lạ.
- 5 `GET ^company$` thêm vào `company-bff.ts`; `companyBranches()` gọi song song `company` và `company/branches`.
- 6 `serviceUrl(service)` trong `lib/api/service-bff.ts`; mọi `process.env.X || "http://localhost:80xx"` trong `app/api/**`, `lib/api/**`, `lib/dishes/**` dùng nó. Thiếu env ở production ném `SERVICE_URL_MISSING: <TÊN>_SERVICE_URL` (Next trả 500 mặc định; không bọc `{error}` riêng).
- Test thêm: `next.config.test.ts` (d), `service-bff.test.ts` (c), `company-bff.test.ts` (a, b), `branch-label.test.ts` (a).
- Lệnh: vitest (không e2e) 1672 pass / 1 fail (đỏ có sẵn `supplier-contract-bff`); `tsc --noEmit` 0 lỗi; `npm run lint` 1 lỗi (đỏ có sẵn `no-control-regex`); `next build --webpack` OK.
- Chưa làm: FC-3 (nhãn vai trò từ catalog); `messages/vi.json` mục `platform` nay không còn dùng; (đã sửa ở lượt sau: landing admin là `/roles`).
- Lượt bổ sung: landing admin `/platform` thành `/roles` trong `lib/api/auth-journey-bff.ts` (+ `auth-journey-bff.test.ts`, `app/api/auth/staff/bff.test.ts`); xoá khối `platform` khỏi `messages/vi.json`, `messages/en.json` (grep: không còn key nào được dùng); giữ `lib/access-context.ts` vì `PlaneAccess` còn dùng.

## Phần thêm 08/11
1. e2e `rbac.spec.ts`: `/platform` và `/platform/role-matrix` thành `/roles`; điều kiện redirect của test 3 đổi sang `/roles`. Xong.
2. Tạo bếp từ UI: `branch-form-dialog.tsx` thêm "Loại chi nhánh" (NativeSelect, RHF + zod enum, mặc định Cửa hàng, nhãn qua `branchTypeLabel`), chỉ ở form tạo; `createBranch` nhận và gửi `type`. Thêm `branch-form-dialog.test.tsx` (chưa có test cũ). Xong.
3. Chép `inventory/api/openapi.public.yaml` vào `lib/contracts/inventory.public.yaml`; không phải sửa thêm code hay test nào. Xong.
4. Lint `no-control-regex`: dùng `stripVTControlCharacters` của `node:util` trong `e2e/dev-walkthrough/dev-walkthrough.spec.ts`. Xong.
