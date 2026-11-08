# ROLE-NAMES — tên vai trò lấy từ /auth/me + ROLE_INFO, test không đọc repo org

Status: DONE

## CONTEXT
- Dawn chốt 08/11: vai trò của người dùng hiện tại lấy từ `/auth/me` (`memberships[].roles`, auth đã hỏi org khi gọi). Không gọi thêm `/permissions/me` hay API vai trò của org chỉ để lấy tên.
- Tên tiếng Việt của mã vai trò đã có ở `lib/permission-labels.ts` (`ROLE_INFO`). Danh mục vai trò cố định (ADR-024).
- `lib/permission-labels.test.ts` đọc `${homedir()}/work/ticket/org/api/role-templates.yaml`, có `skipIf` khi thiếu file, nên trên CI test này luôn bị bỏ qua.

## REQUIRED
1. Thêm bản chép `lib/contracts/org.role-templates.yaml`, copy y nguyên từ `/home/dawn/work/ticket/org/api/role-templates.yaml`. Ghi nguồn vào `lib/contracts/README.md` theo đúng cách các file contract khác đang ghi.
2. `lib/permission-labels.test.ts` đọc bản chép đó (đường dẫn trong portal), bỏ `homedir`/`skipIf`. Test phải chạy thật và PASS.
3. Rà những màn hiển thị vai trò của người dùng đang đăng nhập (shell/header/hồ sơ/ngữ cảnh chi nhánh…). Nếu màn nào lấy tên vai trò bằng cách gọi API vai trò của org (`/org/roles`… cần `org:role:read`) thay vì dùng roles từ `/auth/me` + `ROLE_INFO`, thì sửa sang `/auth/me` + `ROLE_INFO`. Không sửa màn /roles (màn quản trị vai trò, cần org:role:read là đúng).
4. Nếu không có màn nào sai: không sửa code app, chỉ ghi danh sách màn đã rà vào Kết quả.

## CONSTRAINT
- Reuse `ROLE_INFO`, hook/context auth có sẵn. Không tạo helper mới trùng chức năng. Code không comment.
- Không đổi API, không sửa repo khác. Không commit, push, stash. Không dùng /tmp; tạm dùng /home/dawn/work/ticket/.cache.

## ACTION
- `TMPDIR=/home/dawn/work/ticket/.cache npx --no-install vitest run lib/permission-labels.test.ts` và các test của file đã sửa.
- `npx --no-install tsc --noEmit`, `npm run lint`, `git diff --check`.

## OUTPUT
- File này: Status DONE + "## Kết quả" (file đổi, màn đã rà, lệnh + kết quả). Câu hỏi ghi cuối.

## Kết quả

### File đổi

- `lib/contracts/org.role-templates.yaml`: chép nguyên byte từ `/home/dawn/work/ticket/org/api/role-templates.yaml`, HEAD `80f6e2c320e6f0a807e47f65fe60d8af69f3398c`. File nguồn không có thay đổi chưa commit. SHA256 `c6ced2dfa2622ac5b7f3c46dfc4160daf7c6208ff54d9aa3488fd1d81a1dd12e`.
- `lib/contracts/README.md`: ghi nguồn repo, commit, ngày chụp, SHA256 và mục đích snapshot theo cách các contract khác đang ghi.
- `lib/permission-labels.test.ts`: đọc snapshot bằng URL tương đối với file test; bỏ `homedir`, `existsSync`, `skipIf`. Giữ nguyên kiểm tra số lượng quyền và nhãn còn thiếu.
- `docs/tasks/ROLE-NAMES.md`: cập nhật trạng thái và kết quả.

### Màn đã rà

| Màn / luồng | File đã rà | Kết quả |
| --- | --- | --- |
| Shell, header, sidebar, menu tài khoản | `features/console/console-frame.tsx`, `components/layout/console-shell.tsx`, `console-header.tsx`, `console-sidebar.tsx`, `lib/use-header-profile.ts` | Header không hiển thị vai trò; menu tài khoản dùng `getProfile` từ `/api/auth/me` → `/auth/me`. Shell lấy roles trong access context cho scope, không gọi danh mục vai trò org. |
| Hồ sơ nhân viên, badge vai trò và tab vai trò / chi nhánh | `features/account/staff/staff-account.tsx`, `use-staff-record.ts`, `features/account/account-gate.tsx`, `use-account.ts`, `lib/auth/client.ts`, `app/api/auth/me/route.ts` | Roles lấy từ `/auth/me.memberships[].roles`, tên qua `roleName` → `ROLE_INFO`. Không gọi API danh mục vai trò. |
| Chọn / đổi chi nhánh | `features/employee-auth/branch-chooser.tsx`, `components/layout/branch-switcher.tsx`, `components/patterns/branch-list.tsx`, `lib/branch-choices.ts`, `lib/branch-label.ts` | Roles đã có trong access context từ `/api/auth/context`; nhãn trong danh sách qua `branchMeta` → `roleName` → `ROLE_INFO`. Không gọi danh mục vai trò để lấy tên. |
| Tổng quan vận hành `/console` | `features/console/live-console.tsx`, `app/api/console/route.ts`, `app/api/auth/context/route.ts` | Roles trong access context qua `/api/console`, tên qua `roleName` → `ROLE_INFO`. `/permissions/me` được dùng để kiểm tra quyền và hiển thị danh sách việc được phép làm, không dùng để lấy tên vai trò. |
| Các nơi gọi danh mục vai trò | `features/roles/use-roles.ts`, `lib/api/platform-client.ts`, `features/roles/roles-view.tsx`, `features/memberships/memberships-view.tsx`, `use-assignment-editor.ts`, `features/branches/add-staff-dialog.tsx` | Các caller của `companyRoles` / `useRoleCatalog` phục vụ quản trị vai trò, danh sách nhân viên và gán vai trò. Không có caller trong hồ sơ, shell, chọn chi nhánh hoặc tổng quan để lấy tên vai trò người đang đăng nhập. Giữ nguyên `/roles`. |

Không phát hiện màn lấy tên vai trò người đang đăng nhập bằng API danh mục vai trò org cần `org:role:read`. Theo REQUIRED 4, không sửa code app. Các luồng access context hiện dùng `/org/access-contexts/me`; giữ nguyên API và cơ chế kiểm tra quyền theo phạm vi brief.

### Kiểm tra

Các lệnh được chạy qua `rtk proxy`; `git diff --check` qua `rtk git`. Mọi lệnh Node đặt `TMPDIR=/home/dawn/work/ticket/.cache`, không chạy script `npm test` vì script đó dùng `/tmp`.

- Trước khi thêm snapshot, chạy test đã bỏ `skipIf`: FAIL đúng tại test nhãn quyền với `ENOENT` cho `lib/contracts/org.role-templates.yaml`; 4 test khác PASS. Xác nhận thiếu contract sẽ làm test lỗi thay vì bị skip.
- `TMPDIR=/home/dawn/work/ticket/.cache npx --no-install vitest run lib/permission-labels.test.ts`: PASS, 1 file, 5 test, 0 skip. Đây là toàn bộ test của file code đã sửa.
- `TMPDIR=/home/dawn/work/ticket/.cache npx --no-install tsc --noEmit`: PASS, exit 0.
- `TMPDIR=/home/dawn/work/ticket/.cache npm run lint`: PASS, exit 0.
- `cmp /home/dawn/work/ticket/org/api/role-templates.yaml lib/contracts/org.role-templates.yaml`: PASS, exit 0, bản chép khớp từng byte.
- `git diff --check`: PASS, exit 0.

Không commit, push, stash; không sửa repo khác.

Câu hỏi: Không có.
