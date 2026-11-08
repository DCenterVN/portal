# PORTAL-HOSO: trang hồ sơ (Tài khoản, Chi tiết nhân viên) trong shell có sidebar

Trạng thái: DONE

## CONTEXT
- Dawn 08/11 xem video Tài khoản:
  - Bấm "Tài khoản" thì mở sang trang mới, mất sidebar.
  - Lớp UI trang thông tin người dùng chưa chuẩn.
  - Trang nhân sự cũng vậy.
- Nguyên nhân mất sidebar: `app/(console)/account/page.tsx` redirect sang `/company/account`. Trang đó nằm dưới `CompanyWorkspace` (`features/platform/workspace.tsx`), mà khi không có `org_id` thì shell này render `CompanyPicker` trần, không có `ConsoleShell`.
- Dawn chốt bố cục **như ảnh mẫu** (ServiceCall client detail) và **dùng chung một khuôn** cho Tài khoản và Chi tiết nhân viên. Thứ tự từ trên xuống:
  1. Breadcrumb.
  2. **Thẻ đầu trang** nằm ngang: ảnh (vuông bo nhẹ, khoảng 96–120px); tên lớn kèm icon gọi/email; một dòng meta có icon nhỏ (chi nhánh, vai trò, ngày tham gia); một dòng "Trạng thái" và "Vai trò" dạng badge. Nút hành động (Sửa, Khoá…) nằm góc phải, dạng outline nhỏ có icon.
  3. Dòng "Cập nhật lần cuối" mờ, căn giữa, có kẻ ngang hai bên.
  4. **Thanh tab** ngang, tab đang chọn có viền và nền trắng.
  5. Nội dung mỗi tab là **các thẻ nhóm field xếp lưới 2 cột**. Mỗi thẻ có tiêu đề đậm; trong thẻ, label nhỏ nằm trên ô, các ô xếp 2 cột.
- Tham khảo (đã nghiên cứu):
  - ERPNext User form: tab theo nhóm nghiệp vụ, section 2 cột.
  - twenty record page: header có avatar, tên, trạng thái, tab ngay dưới.
  - Không lấy layout kéo thả của twenty; không lấy sidebar phụ của frappe.
- Có sẵn để dùng lại, không đổi logic:
  - `features/account/`: `AvatarEditor`, `NameForm`, `PhoneSetting`, `PasswordSetting`, `SessionsCard`, `AccountGate`, `use-account*`. `UserProfile` (`lib/auth/client.ts`) có `avatar_url, email, phone, display_name, status, created_at, memberships[]`.
  - `features/memberships/`: `people.ts` (`groupByPerson`, `Person`, `Assignment`), `assignment-row.tsx`, `assign-sheet.tsx`, `use-assignment.ts`, `memberships-view.tsx`.
  - UI: `components/ui` (`avatar, badge, breadcrumb, button, card, field, input, separator, tabs, …`), `components/patterns` (`page-heading`, `status-badge`, `confirm-dialog`, …), `components/layout/console-shell.tsx`, `console-sidebar.tsx` (`accountHref` mặc định `/account`). Route console khai trong `lib/fetcher.ts` (`CONSOLE_ROUTES`).
  - Chuẩn: `platform-docs/standards/frontend.md`, `platform-docs/ui/` (ui-ux, shadcn), luật trong `app/ui-rules-gate.test.ts`, `app/layout-gate.test.ts`, `app/frame-lock.test.ts`.

## REQUIRED
1. **Sửa shell:** `/account` render trang Tài khoản nhân viên ngay trong `(console)` (`ConsoleFrame`), không redirect. `/company/account` và `/platform/account` giữ nguyên hành vi, dùng chung view mới.
2. **Khuôn chung** `components/patterns/record-page.tsx` (chỉ render, không gọi API), gồm:
   - `RecordHeader` (ảnh hoặc chữ viết tắt, tên, icon liên hệ, meta có icon, dòng trạng thái và vai trò, vùng nút).
   - `RecordUpdated`.
   - `RecordTabs`: shadcn Tabs; tab lưu ở `?tab=` để tải lại vẫn giữ tab.
   - `RecordSection`: Card có tiêu đề và lưới 2 cột; dưới 768px thì 1 cột.
3. **Tài khoản của tôi** (`features/account/staff/staff-account.tsx`, view mới):
   - Header: ảnh (đổi ảnh qua `AvatarEditor`, mở bằng nút trên ảnh), tên, email, SĐT, chi nhánh đang dùng, các vai trò, "Tham gia dd/mm/yyyy" lấy từ `created_at`, trạng thái.
   - Tab **Thông tin** gồm 2 thẻ:
     - "Thông tin cá nhân": tên qua `NameForm`.
     - "Liên hệ": email chỉ đọc kèm ghi chú "quản trị viên đổi"; SĐT qua `PhoneSetting`.
   - Tab **Vai trò & chi nhánh**: bảng chi nhánh → vai trò (badge), nút đổi chi nhánh như hiện có.
   - Tab **Bảo mật** gồm 2 thẻ: "Mật khẩu" (`PasswordSetting`) và "Phiên đăng nhập" (`SessionsCard`).
4. **Chi tiết nhân viên** (route mới `app/(console)/memberships/[userId]/page.tsx`, thêm vào `CONSOLE_ROUTES`):
   - Ở danh sách `/memberships`, bấm tên người thì mở trang này. Sheet phân công cũ thay bằng tab trong trang chi tiết; nếu còn chỗ dùng sheet thì giữ.
   - Header: chữ viết tắt (không có ảnh người khác), tên, email, badge "Mọi chi nhánh" nếu có cờ, trạng thái (Khoá khi mọi phân công bị khoá), số chi nhánh.
   - Tab **Phân công**: dùng lại `AssignmentRow` và `use-assignment`, thao tác như sheet cũ.
   - Tab **Thông tin**: tên và email chỉ đọc, kèm ghi chú "nhân viên tự sửa ở Tài khoản".
   - Dữ liệu lấy từ API membership sẵn có, lọc theo `userId`. Không thêm API mới.
5. Chữ tiếng Việt qua next-intl như hiện có. Không hiện UUID cho người dùng. Ngày dạng dd/mm/yyyy.

## CONSTRAINT
- **Trước khi code, chạy skill ui-ux-pro-max** (bố cục, khoảng cách, chữ, trạng thái loading/lỗi/rỗng). Bố cục phải đúng mục CONTEXT, không tự thiết kế lại.
- shadcn sẵn có + token màu hiện có (xanh lá, neutral). Không thêm dependency. Không bo góc to, không màu gắt, icon cùng cỡ.
- Logic ở hook; view chỉ render. Không comment code. File ≤ 400 dòng. Desktop 1280 trước; 768 vẫn đọc được.
- Test trước (đỏ) rồi code (xanh), vitest:
  - `/account` nằm trong `ConsoleFrame` (có sidebar).
  - `RecordTabs` đọc và ghi `?tab=`.
  - Trang chi tiết nhân viên render phân công của đúng người, không lộ UUID.
  - Danh sách `/memberships` có link sang chi tiết.
- Sửa `e2e/account/account.spec.ts` theo màn mới, thêm 1 kịch bản: mở Tài khoản từ sidebar thì sidebar vẫn còn; mở chi tiết nhân viên từ danh sách. Video do omp quay sau, không bắt buộc chạy e2e ở lô này.
- Nếu `frame.lock.json` lệch vì file khung bị đổi có chủ đích thì ghi lại lock và nói rõ file nào.
- Không commit, không push, không /tmp (trừ esbuild mà script `test` tự chép), không cờ bỏ qua quyền, không in mật khẩu/token. Chỉ sửa trong worktree này.

## ACTION
Worktree `/home/dawn/work/ticket/.cache/worktrees/portal-hoso`, nhánh `feat/PORTAL-HOSO`.
Chuẩn bị: `pnpm install --frozen-lockfile`.
Kiểm: `pnpm typecheck && pnpm lint && pnpm test && node node_modules/next/dist/bin/next build --webpack`. Lỗi đỏ có từ trước, không do lô này (`lib/contracts/supplier-contract-bff.test.ts`, lint `no-control-regex` ở `e2e/dev-walkthrough`): ghi rõ, không sửa.

## OUTPUT
Cuối file thêm `## Kết quả`:
- File đổi; component và hook dùng lại / mới.
- Ảnh chụp desktop 1280 của 3 tab Tài khoản và 2 tab Chi tiết nhân viên, nếu chụp được bằng test render; lưu ở `.cache/agent-logs/261108/hoso/`.
- Tên test mới; typecheck/lint/test/build (số pass/fail, lỗi có sẵn).

Đổi `Trạng thái:` thành `Chờ soát`.
Gợi ý commit: `feat(portal): trang hồ sơ tài khoản và nhân viên trong shell (PORTAL-HOSO)`.


## Vòng 2 (Claude soát ảnh 08/11)
Sửa đúng các điểm dưới, không đổi bố cục đã đạt:
1. Topbar trang Tài khoản trống, trong khi trang nhân viên có breadcrumb "Tổ chức › Nhân viên". Topbar Tài khoản hiện "Tài khoản của tôi"; breadcrumb trong trang dùng cùng component với trang nhân viên, không phải chữ trơn.
2. Dòng "Cập nhật lần cuối: chưa có thông tin" là chữ thừa. Không có dữ liệu thì không render `RecordUpdated`; chỉ hiện khi có ngày.
3. Thẻ "Liên hệ" lệch kiểu: label "Email" nhỏ xám, còn "Số điện thoại" và "Tên hiển thị" đậm. Mọi label trong `RecordSection` cùng một kiểu (dùng `Field`/`FieldLabel` sẵn có). Email chỉ đọc hiện như ô disabled cùng chiều cao, không giống ô sửa được.
4. Header Tài khoản lặp vai trò: dòng meta có "Bán hàng, Kho" và dòng badge "Vai trò" cũng có. Bỏ vai trò khỏi dòng meta, giữ badge.
5. Nút "Sửa" ở header Tài khoản và "Sửa phân công" ở header nhân viên: phải làm việc rõ ràng (chuyển sang tab sửa và focus ô đầu). Nếu đang ở tab đó thì chỉ focus. Có test.
6. Ảnh và log chỉ ghi ở `/home/dawn/work/ticket/.cache/agent-logs/261108/hoso/` (đường tuyệt đối), không tạo `.cache/` trong worktree.
Chụp lại 5 ảnh 1280 sau sửa, ghi đè ảnh cũ. Chạy lại typecheck/lint/test/build. Ghi `### Vòng 2` ở cuối mục Kết quả. `Trạng thái: Chờ soát`.


## Kết quả

Đã triển khai trong worktree `portal-hoso`, nhánh `feat/PORTAL-HOSO`. Không commit, không push, không thêm dependency. Đã chạy `pnpm install --frozen-lockfile`.

### Giao diện và quyết định

- Đã đọc AGENTS.md, AI_CONTEXT.md, chuẩn frontend/ui-ux và chạy ui-ux-pro-max trước khi code giao diện: dùng Tabs shadcn, tab mặc định rõ ràng và skeleton theo hình nội dung. Giữ token xanh lá/neutral, bố cục đã chốt trong CONTEXT.
- `/account` render `StaffAccount` trực tiếp trong layout `ConsoleFrame`, giữ sidebar. `/company/account` và `/platform/account` tiếp tục dùng cùng view, không sửa route/layout của hai workspace này.
- Khuôn chung có breadcrumb, ảnh/chữ viết tắt 112px bo nhẹ, tên và liên hệ, meta, badge, hành động outline góc phải, dòng cập nhật, tab và thẻ nhóm field. Desktop xếp hai thẻ cạnh nhau; tại 768px xếp thẻ dọc để field đủ rộng, field trong thẻ vẫn hai cột; dưới 768px field một cột.
- Tab lưu bằng `?tab=`, giữ các query khác như `org_id`; tab không hợp lệ về tab đầu. Dùng `formatDate` sẵn có cho ngày tham gia.
- API hiện không có thời điểm cập nhật hồ sơ: dòng cập nhật ghi “Cập nhật lần cuối: chưa có thông tin”, không dùng ngày tham gia thay thế.
- Danh sách nhân viên mở `/memberships/[userId]` qua link tên. Trang mới lọc đúng người từ membership API sẵn có, chỉ hiện tên chi nhánh/vai trò. Sheet được giữ cho đường dẫn cũ `?membership=`, dùng chung panel/hook phân công.

### File đổi và phần dùng lại

- Route/đăng ký: `app/(console)/account/page.tsx`, mới `app/(console)/memberships/[userId]/page.tsx`, `lib/fetcher.ts`.
- Khuôn mới: `components/patterns/record-page.tsx` với `RecordHeader`, `RecordUpdated`, `RecordTabs`, `RecordSection`; hook mới `lib/use-record-tab.ts`.
- Tài khoản: `features/account/staff/staff-account.tsx`, hook mới `features/account/staff/use-staff-record.ts`; thêm chế độ ảnh gọn cho `features/account/avatar-editor.tsx` và tùy chọn hiện label cho `features/account/name-form.tsx`. Dùng lại `AccountGate`, `AvatarEditor`, `NameForm`, `PhoneSetting`, `PasswordSetting`, `SessionsCard` và các hook tài khoản hiện có.
- Nhân viên: `features/memberships/memberships-view.tsx`, `features/memberships/assign-sheet.tsx`; mới `person-detail.tsx`, `use-person-detail.ts`, `assignment-panel.tsx`, `use-assignment-editor.ts` trong cùng thư mục. Dùng lại `groupByPerson`, `diffAssignments`, `AssignmentRow`, `applyChanges` trong `use-assignment.ts`, `useMemberships`, `useBranches`, `useRoleCatalog`; giữ kiểm tra quyền, cấm tự sửa phân công và cách xử lý lỗi từng chi nhánh.
- Dịch: `messages/vi.json`, `messages/en.json`, namespace `record`.
- Test mới: `components/patterns/record-page.test.tsx`, `features/account/staff/staff-account.test.tsx`, `features/account/staff/staff-record-view.test.tsx`, `features/memberships/person-detail.test.tsx`; helper render mới `tests/record-render.tsx`.
- Test cập nhật: `features/memberships/memberships-view.test.tsx`, `app/rebrand.test.ts`, `e2e/account/account.spec.ts`, `e2e/account/helpers.ts`.
- `frame.lock.json`: ghi lại bằng `node scripts/frame-lock.mjs --write` vì thêm đúng hai file `components/patterns/record-page.tsx` và `components/patterns/record-page.test.tsx`. Không sửa file shell/sidebar/header hay primitive UI. Kiểm lại lock khớp 95 file.
- File task này cập nhật trạng thái và kết quả. `next-env.d.ts` do build sinh thay đổi đã được trả về nội dung ban đầu.

### Test đỏ → xanh

Đã thêm test rồi chạy trước khi triển khai. Lượt đỏ bắt được `/account` redirect khỏi console, danh sách chưa có link chi tiết và hai module `record-page`/`person-detail` chưa tồn tại. Sau triển khai, 12 test mới và test danh sách được bổ sung assertion đều xanh.

Tên test mới:

- `account renders inside ConsoleFrame without redirect`.
- `RecordTabs reads the selected tab from URL`.
- `RecordTabs writes tab while preserving other query parameters`.
- `RecordTabs falls back for an unknown tab`.
- `detail renders only the requested person's assignments without visible UUID`.
- `detail information tab is read only`.
- `detail handles loading`, `detail handles error`, `detail handles empty`.
- `staff information uses the record header, editable name and phone, and managed email`.
- `staff roles tab shows branch roles and the existing branch switch`.
- `staff security tab reuses password and sessions controls`.

`memberships_group_by_person_no_uuid` bổ sung kiểm tra href chi tiết. Test thương hiệu hiện có được cập nhật theo tab mới và kiểm tra UUID trong nội dung hiển thị, cho phép UUID trong href. E2E cập nhật màn nhân viên và thêm kịch bản `05 Sidebar giữ nguyên khi mở Tài khoản; danh sách mở chi tiết nhân viên`; không chạy E2E/backend thật trong lô này.

### Kiểm tra cuối

| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS, không lỗi |
| `pnpm lint` | FAIL, 1 lỗi có sẵn: `e2e/dev-walkthrough/dev-walkthrough.spec.ts:20:24`, `no-control-regex`; 0 warning; không sửa |
| `pnpm test` | 102 file pass / 1 file fail; 1.668 test pass / 1 test fail |
| Test tập trung hồ sơ + rebrand + frame lock | 7 file, 87 test PASS |
| `node node_modules/next/dist/bin/next build --webpack` | PASS, compile + TypeScript + sinh 90/90 trang tĩnh |
| `node scripts/frame-lock.mjs` | PASS, khớp 95 file |
| `git diff --check` | PASS |

Test fail còn lại là lỗi có sẵn `lib/api/supplier-contract-bff.test.ts:20`, test `metadata taxonomy sinh từ inventory và snapshot giữ nguyên bytes` do snapshot bytes khác nguồn inventory. Đường dẫn thực tế là `lib/api/`, không phải `lib/contracts/` ghi trong phần ACTION. Không sửa test/snapshot này.

Log lệnh và ảnh nằm tại `.cache/agent-logs/261108/hoso/`: `typecheck.log`, `lint.log`, `test.log`, `targeted.log`, `build.log`, `render.log`, `responsive.json`.

### Ảnh test render

Ảnh dùng dữ liệu fixture, component thật trong `ConsoleShell`, CSS và font của build thật, chụp bằng Chromium. Đây là kiểm tra bố cục, không phải bằng chứng thao tác với backend thật. Đã mở ảnh kiểm tra trực quan. Cả 5 màn đều không tràn ngang tại 1280/768/375px: 15/15 phép đo PASS trong `responsive.json`.

Ảnh desktop 1280:

- `.cache/agent-logs/261108/hoso/account-info-1280.png`.
- `.cache/agent-logs/261108/hoso/account-roles-1280.png`.
- `.cache/agent-logs/261108/hoso/account-security-1280.png`.
- `.cache/agent-logs/261108/hoso/employee-assignments-1280.png`.
- `.cache/agent-logs/261108/hoso/employee-info-1280.png`.

Có thêm 5 ảnh tương ứng hậu tố `-768.png` và 5 file HTML từ test render. Có thể xuất lại HTML bằng `HOSO_CAPTURE=1 ESBUILD_BINARY_PATH=/tmp/esbuild node node_modules/vitest/vitest.mjs run features/account/staff/staff-record-view.test.tsx features/memberships/person-detail.test.tsx`.

### Bàn giao

Dawn/omp soát 5 ảnh desktop và quay video E2E sau. Phần cần xác nhận bằng môi trường thật là đổi ảnh/tên/SĐT/mật khẩu, phiên đăng nhập và lưu phân công qua API. Không có thay đổi API hoặc dữ liệu backend trong phiên này.


### Vòng 2

Đã sửa đúng phạm vi Vòng 2, giữ bố cục Vòng 1. Không commit, không push, không thêm dependency. Đã chạy lại `pnpm install --frozen-lockfile`.

- Topbar Tài khoản hiện nhãn `account.title` từ messages. Breadcrumb trong trang đã dùng cùng các primitive `Breadcrumb`/`BreadcrumbList`/`BreadcrumbPage` như trang nhân viên; thêm test xác nhận ngữ nghĩa breadcrumb và tiêu đề topbar.
- Bỏ `RecordUpdated` ở cả hai trang vì API chưa có ngày cập nhật. Không còn dòng “Cập nhật lần cuối: chưa có thông tin”. Giữ component dùng cho trường hợp có dữ liệu về sau.
- Email Tài khoản và các field chỉ đọc ở Chi tiết nhân viên dùng `Field`/`FieldLabel`, cùng kiểu label với `NameForm`/`PhoneSetting`. Input chỉ đọc có `disabled`, giữ chiều cao Input sẵn có; hint liên kết bằng `aria-describedby`.
- Header Tài khoản chỉ còn vai trò ở hàng badge, bỏ khỏi meta.
- `useRecordTab` bổ sung `edit` và callback ref `editTarget`. Nút Sửa chuyển tab rồi focus ô đầu khi form gắn vào DOM; đã ở tab đích thì chỉ focus, không gọi router. Tài khoản focus Tên hiển thị; nhân viên focus ô vai trò đầu có thể sửa, bỏ qua nút xoá phân công và control disabled. Giữ các query khác như `org_id`.
- Chromium phát hiện Radix mount nội dung tab sau effect của trang. Đã lưu lượt đỏ này và sửa bằng callback ref khi mount, không dùng timeout. Hook vẫn sở hữu logic; view chỉ gắn ref và handler.

File sửa riêng Vòng 2:

- `components/layout/console-shell.tsx`.
- `features/account/staff/staff-account.tsx`, `features/account/staff/use-staff-record.ts`, `features/account/staff/staff-record-view.test.tsx`.
- `features/memberships/person-detail.tsx`, `features/memberships/use-person-detail.ts`, `features/memberships/person-detail.test.tsx`.
- `lib/use-record-tab.ts`; test mới `lib/use-record-tab.test.tsx`.
- `tests/record-render.tsx`, `frame.lock.json`, file task này.

`frame.lock.json` ghi lại bằng `node scripts/frame-lock.mjs --write` vì chủ đích sửa **`components/layout/console-shell.tsx`** để thêm tiêu đề topbar Tài khoản. Không đổi primitive UI, sidebar, header hoặc khuôn record. Lock vẫn 95 file. `next-env.d.ts` do build sinh được trả về nội dung ban đầu.

Test đỏ trước code:

- Thêm 6 test: 3 test Tài khoản cho topbar/breadcrumb, cập nhật rỗng/vai trò lặp, FieldLabel/email disabled; 1 test Chi tiết nhân viên cho cập nhật rỗng/FieldLabel; 2 trường hợp hook cho Tài khoản và Chi tiết nhân viên.
- Lượt đầu: 6 test mới đỏ đúng lỗi, ngoài 1 lỗi supplier có sẵn. Log `round2-red.log`.
- Bổ sung mô phỏng tab mount muộn sau khi Chromium bắt hụt focus: `round2-focus-red.log` và `round2-browser-red.log`; sau sửa hook xanh, Chromium cũng xanh.
- Hai trường hợp hook kiểm tra chuyển tab trước khi focus, chờ mount, focus khi đang ở tab đích, không replace URL lần nữa và không tự focus lại khi render thông thường.

Kiểm tra cuối:

| Lệnh | Kết quả Vòng 2 |
|---|---|
| `pnpm typecheck` | PASS, không lỗi |
| `pnpm lint` | FAIL đúng 1 lỗi có sẵn: `e2e/dev-walkthrough/dev-walkthrough.spec.ts:20:24`, `no-control-regex`; 0 warning; không sửa |
| `pnpm test` | 103 file pass / 1 file fail; 1.674 test pass / 1 test fail |
| Nhóm hồ sơ/tab/frame-lock | 5 file, 20 test PASS |
| `node node_modules/next/dist/bin/next build --webpack` | PASS, compile + TypeScript + sinh 90/90 trang tĩnh |
| `node scripts/frame-lock.mjs` | PASS, khớp 95 file |
| `git diff --check` | PASS |

Test fail có sẵn vẫn là `lib/api/supplier-contract-bff.test.ts:20`, `metadata taxonomy sinh từ inventory và snapshot giữ nguyên bytes`; không sửa snapshot/test này.

Ảnh/log Vòng 2 chỉ ở **`/home/dawn/work/ticket/.cache/agent-logs/261108/hoso/`**. `recordRender` đã đổi sang đường dẫn tuyệt đối này; không có `.cache/` trong worktree. Log kiểm tra có tiền tố `round2-`: `typecheck`, `lint`, `test`, `build`, `green`, `browser`; kết quả tương tác chi tiết ở `round2-browser.json`. Script fixture tái hiện nằm ở `round2-browser.mjs`, bundle ở `round2-fixture.js` trong cùng thư mục.

Đã chụp lại và ghi đè đúng 5 ảnh desktop 1280, mở cả 5 ảnh để soát:

- `/home/dawn/work/ticket/.cache/agent-logs/261108/hoso/account-info-1280.png`.
- `/home/dawn/work/ticket/.cache/agent-logs/261108/hoso/account-roles-1280.png`.
- `/home/dawn/work/ticket/.cache/agent-logs/261108/hoso/account-security-1280.png`.
- `/home/dawn/work/ticket/.cache/agent-logs/261108/hoso/employee-assignments-1280.png`.
- `/home/dawn/work/ticket/.cache/agent-logs/261108/hoso/employee-info-1280.png`.

Ảnh và kiểm tra tương tác dùng Chromium, component/hook/Tabs thật, CSS/font từ build và dữ liệu fixture. Cả 5 màn không tràn ngang tại 1280; không lỗi JavaScript. Cả 4 thao tác Sửa PASS: mỗi trang thử từ tab khác và thử lại khi đang ở đúng tab; giữ `org_id`. Đây không phải E2E với backend thật. Ảnh 768 và `responsive.json` cũ thuộc Vòng 1, không chụp lại trong Vòng 2.

## Vòng 3 (Claude soát 08/11)
`components/layout/console-shell.tsx` vòng 2 import thẳng `messages/vi.json` và so `pathname === "/account"`: fix cứng trong khung, bỏ qua next-intl. Sửa:
1. Trả `console-shell.tsx` về như main (ghi lại `frame.lock.json`).
2. Tiêu đề topbar cho `/account` lấy từ cùng nguồn breadcrumb: thêm route không hiện trên menu vào `lib/navigation.ts` (ví dụ danh sách route phụ có `href` + khoá nhãn), `breadcrumbFor` tra cả danh sách đó; nhãn dịch qua next-intl giống các mục menu khác. Không so đường dẫn trong component khung.
3. Test: topbar `/account` hiện "Tài khoản của tôi" qua next-intl; `/memberships/[userId]` vẫn "Tổ chức › Nhân viên".
Chạy lại typecheck/lint/test/build. Ghi `### Vòng 3` cuối Kết quả. Ảnh/log chỉ ở `/home/dawn/work/ticket/.cache/agent-logs/261108/hoso/`.

### Vòng 3

Đã sửa đúng phạm vi Vòng 3. Trạng thái vẫn **Chờ soát**. Không commit, không push, không thêm dependency.

- `components/layout/console-shell.tsx` đã trả về đúng nội dung `main`, kiểm bằng `git show main:components/layout/console-shell.tsx | cmp - components/layout/console-shell.tsx`. Shell không import messages hoặc so đường dẫn tài khoản.
- `lib/navigation.ts` thêm danh sách route phụ với `href` và `labelKey`; `breadcrumbFor` trả khoá `account.title` cho `/account`. Route này không xuất hiện trong menu và không nhận nhầm `/account-other`.
- `components/layout/console-header.tsx` dịch crumb có `labelKey` qua `useTranslations`; crumb từ menu tiếp tục hiển thị nhãn đã có. Không có điều kiện theo đường dẫn trong header.
- `features/console/console-frame.tsx` đưa next-intl provider ra ngoài `ConsoleShell` để cả topbar nhận bản dịch, đặt múi giờ `Asia/Ho_Chi_Minh` giống workspace hiện có. Giữ việc remount nội dung theo chi nhánh bằng key trên `AccessProvider`.
- Ghi lại `frame.lock.json` bằng `node scripts/frame-lock.mjs --write`: trả hash **`components/layout/console-shell.tsx`** về main và cập nhật hash **`components/layout/console-header.tsx`**. Lock khớp 95 file; giữ hai file record từ các vòng trước. `next-env.d.ts` do build đổi đã được trả về nội dung đầu phiên.

Test đỏ trước code trong `tests/account-topbar.test.tsx`:

- `account breadcrumb resolves outside the menu`: đỏ vì `breadcrumbFor([], "/account")` trả mảng rỗng.
- `account topbar uses the next-intl account title`: đỏ vì topbar bỏ qua nhãn thay thế từ provider. Test kiểm cả nhãn thật “Tài khoản của tôi” và nhãn được đổi trong provider để bắt việc import cứng tiếng Việt.
- `employee detail keeps the organization and employee breadcrumbs`: xanh trước và sau sửa, giữ “Tổ chức › Nhân viên”, không hiện ID trong topbar.

Sau sửa cả 3 test xanh; nhóm tập trung navigation, shell, console frame, tài khoản và frame lock có **6 file / 80 test PASS**.

| Lệnh | Kết quả Vòng 3 |
|---|---|
| `pnpm typecheck` | PASS, chạy riêng sau build |
| `pnpm lint` | FAIL đúng lỗi có sẵn `e2e/dev-walkthrough/dev-walkthrough.spec.ts:20:24`, `no-control-regex`; 0 warning |
| `pnpm test` | 104 file pass / 1 file fail; 1.677 test pass / 1 test fail |
| `node node_modules/next/dist/bin/next build --webpack` | PASS, compile + TypeScript + sinh 90/90 trang tĩnh; log cuối không có `ENVIRONMENT_FALLBACK` |
| `node scripts/frame-lock.mjs` | PASS, khớp 95 file |
| `git diff --check` | PASS |

Test fail có sẵn vẫn là `lib/api/supplier-contract-bff.test.ts:20`, `metadata taxonomy sinh từ inventory và snapshot giữ nguyên bytes`; không sửa. Lượt typecheck đầu chạy đồng thời với build bị mất file `.next/types` khi build tạo lại thư mục; đã chạy lại riêng và PASS.

Log chỉ nằm ở **`/home/dawn/work/ticket/.cache/agent-logs/261108/hoso/`**, tiền tố `round3-`: `red.log`, `green.log`, `typecheck.log`, `typecheck-concurrent.log`, `lint.log`, `test.log`, `build.log`, `frame.log`, `shell-main.log`, `diff-check.log`. Vòng 3 không chụp ảnh mới và không chạy E2E/backend thật.

### Video

Đã thực hiện kịch bản E2E quay video thực tế với backend thật theo đúng yêu cầu mục `## Video (omp)`:
- Bật dev server cổng 3000 (Kong DEV CORS hỗ trợ), source `/home/dawn/work/ticket/portal/.env.local` với cờ `set -a` để export đủ URL upstream (`AUTH_SERVICE_URL`, `ORG_SERVICE_URL` trỏ `:8000`). Tắt dev server sau khi hoàn thành, xác nhận lại cổng rảnh qua `ss -ltn`.
- Cấu hình Playwright: Chromium headless, workers=1, 1280×800, video + trace đầy đủ.
- Kịch bản `05 Sidebar giữ nguyên khi mở Tài khoản; danh sách mở chi tiết nhân viên` đạt **9/9 bước** `test.step` tiếng Việt:
  1. Đăng nhập nhân viên, mở giao diện quản trị (PASS).
  2. Bấm 'Tài khoản' ở sidebar — sidebar vẫn giữ nguyên (PASS).
  3. Header hồ sơ tài khoản: ảnh đại diện, tên, meta liên hệ, badge trạng thái và vai trò (PASS).
  4. Ba tab: Thông tin, Vai trò & chi nhánh, Bảo mật (PASS).
  5. Nút Sửa ở header tự động chuyển sang tab Thông tin và focus ô Tên (PASS).
  6. Đổi tên hiển thị rồi khôi phục lại (PASS, 2 lần PATCH profile 200).
  7. Mở danh sách Nhân viên, bấm tên người để vào chi tiết (PASS).
  8. Chi tiết nhân viên: tab Phân công và tab Thông tin chỉ đọc (PASS).
  9. Tải lại trang — vẫn giữ nguyên tab (?tab=) và không lộ UUID (PASS).
- Không có lỗi app phát sinh trong quá trình quay: các API `/api/auth/staff/login`, `/api/auth/profile`, `/api/org/...` phản hồi 200; không lộ UUID; không tạo/đổi trạng thái tài khoản.
- Đường dẫn video chính: `/home/dawn/work/ticket/.cache/video-nghiep-vu/07-tai-khoan/hoso/video-hoso.webm` (1280×800, 20.3s).
- Ảnh chụp các bước (01 đến 08) và trace nằm cùng thư mục `/home/dawn/work/ticket/.cache/video-nghiep-vu/07-tai-khoan/hoso/`.
- Đã chạy `e2e/account/redact-artifacts.py` lên toàn bộ thư mục artifacts để lọc thông tin nhạy cảm.
## Video (omp)
Code 3 vòng đã xong trong worktree này (chưa commit). Quay e2e cho Dawn xem.
- Bật dev server: theo `platform-docs/planning/sprints/261107-branch-5-ui/done-5g.md` (đường tuyệt đối dưới `/home/dawn/work/ticket/`). Trước khi bật: `source /home/dawn/work/ticket/portal/.env.local`. Kong DEV chỉ CORS cổng 3000/3002/3003: kiểm `ss -ltn`, chọn cổng rảnh, không giết tiến trình người khác.
- Chạy `e2e/account/account.spec.ts` (đã cập nhật ở vòng 1, gồm kịch bản `05 Sidebar giữ nguyên khi mở Tài khoản; danh sách mở chi tiết nhân viên`). Chromium headless, workers=1, video + trace, 1280×800. Mỗi bước `test.step` tiếng Việt.
- Kịch bản phải thấy rõ: bấm "Tài khoản" ở sidebar → sidebar còn; header (ảnh, tên, meta, badge); 3 tab Thông tin / Vai trò & chi nhánh / Bảo mật; nút Sửa chuyển tab và focus ô Tên; đổi tên rồi khôi phục; mở Nhân viên → bấm tên một người → trang chi tiết, tab Phân công và Thông tin; tải lại trang vẫn giữ tab (`?tab=`).
- Video và ảnh ở `/home/dawn/work/ticket/.cache/video-nghiep-vu/07-tai-khoan/hoso/` (video chính `video-hoso.webm`). Chạy `e2e/account/redact-artifacts.py` lên thư mục đó. Tắt dev server khi xong.
- Không commit/push, không /tmp, không cờ bỏ qua quyền, không in mật khẩu/token/JWT/DSN. Không tạo/đổi trạng thái tài khoản. Chỉ sửa `e2e/account/*` nếu spec sai; lỗi ở code app thì ghi lại (file, bước, request, mã HTTP), không tự sửa app. Tối đa 40 phút.
- Ghi `### Video` cuối mục Kết quả: số bước đạt, đường dẫn video, lỗi app thấy lúc quay.
