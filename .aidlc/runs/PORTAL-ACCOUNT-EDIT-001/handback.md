# Bàn giao S6b–S16, 2026-10-26, trạng thái hiện tại

## Done

Đã sửa WIP và thêm code/test S6b–S16 theo card. Done 0/18 vì receipt BLOCKED. Unit 1253/1254; tsc PASS; arch 0 new/0 stale; spec lint PASS. Integration/e2e FAIL preflight, chưa gửi HTTP. Chi tiết số test từng slice nằm ở đầu progress-code.md.

## Files changed

- components/patterns/account/
- features/account-edit/
- features/staff-profile/
- app/rebrand.test.ts
- features/employee-auth/journey.test.tsx
- lib/ux-no-uuid.test.ts
- frame.lock.json
- app/ui-rules-baseline.txt
- app/api/auth/bff.test.ts
- app/api/auth/profile/avatar/
- app/api/auth/email/
- app/(auth)/email/confirm/page.tsx
- lib/api/account-bff.ts
- lib/api/account-client.ts
- lib/api/account-avatar.ts
- lib/api/account-avatar.test.ts
- lib/api/account-email-bff.test.ts
- lib/api/account-errors.test.ts
- messages/vi.json
- messages/en.json
- proxy.ts
- proxy.test.ts
- tests/integration/account-fixtures.ts
- tests/integration/account-fixtures.test.ts
- tests/integration/account-http.ts
- tests/integration/account-profile.it.test.ts
- tests/integration/account-avatar.it.test.ts
- tests/integration/account-security.it.test.ts
- tests/integration/account-email.it.test.ts

## Decisions

Giữ test đỏ và server-only guard. Provider account ở container. Frame lock sinh bằng script; UI baseline chỉ thu nhỏ 4 dòng. Không sửa plan/testkit/policy/arch baseline/env/artifacts bằng tay. Không commit/push/approve. e2e-browser: hoãn R32.

## Left over

R26: console-frame.test.ts:141–142 import BFF nhưng chưa mock server-only, file ngoài card. Cần coordinator mở scope trước sửa. Chưa có baseline chứng minh lỗi có sẵn. Thiếu lintcheck.py ở đường dẫn engine. Thiếu fixture account riêng/email B/runtime origins; đã hỏi owner, chưa trả lời. Runtime, cleanup, OD-1/link thật, redaction và UAT chưa chứng minh. Phải verify xanh đủ check trước done 18 slice rồi gate push.

Where it started: WIP S2–S6, test đỏ S7. Decisions: thực hiện scope mở, giữ gate. Key files: progress-code.md, verification.json, runtime-profile.md, runtime-security.md. Pick up here: xử lý scope console test/tool lint/fixture; verify lại, không tick done bằng unit riêng.

# Lịch sử S2–S16, không phải trạng thái hiện tại

## Done

Chưa hoàn thành brief. Done 0/16. S2–S6 có code và test riêng xanh; full regression đỏ. S7 mới có test đỏ, chưa implementation; S8–S16 chưa bắt đầu. Xem `/home/dawn/work/ticket/plans/261025-account-edit/progress-code.md`, mục S2–S16, để lấy số test từng slice và lệnh verify.

## Files changed

- lib/api/account-client.ts
- lib/api/account-client.test.ts
- lib/auth/client.ts
- lib/auth/client.test.ts
- app/api/auth/me/route.ts
- components/patterns/account/name-form.tsx
- components/patterns/account/password-form.tsx
- features/account-edit/account-edit-container.tsx
- features/account-edit/use-account-edit.ts
- features/account-edit/account-edit.test.tsx
- app/(store)/me/profile-client.tsx
- messages/vi.json
- messages/en.json
- features/account-edit/customer-profile.test.tsx
- features/staff-profile/staff-profile-container.tsx
- features/staff-profile/use-staff-profile.ts
- features/staff-profile/staff-profile-panel.tsx
- features/staff-profile/staff-profile.test.tsx
- app/(console)/account/page.tsx
- app/company/account/page.tsx
- app/platform/account/page.tsx
- features/staff-profile/staff-profile-view.tsx
- features/account-edit/staff-entrypoints.test.tsx
- lib/api/account-avatar-bff.test.ts

View staff cũ bị xóa theo S6. S1 có sẵn, không đổi implementation S1. Engine tự ghi receipt/log/trace, không sửa baseline đã dirty từ trước.

## Decisions

Tiếp S2–S6 theo brief mới, dừng theo R26 khi cần sửa test caller ngoài card. Không giữ shim trái yêu cầu xóa legacy; không đổi plan/testkit/baseline/policy/lock/test ngoài scope. Không done khi verification BLOCKED. Không approve/commit/push, không dùng :3000; e2e-browser: hoãn R32. Không gọi parser handback theo brief mới; chưa có handback receipt mới.

## Left over

- Chặn R26: plan.md:196 xóa staff-profile-view, nhưng `app/rebrand.test.ts:17` vẫn import và `features/employee-auth/journey.test.tsx:67` vẫn đọc source cũ. Các test này không nằm trong card/Files planned. Coordinator cần sửa phạm vi, Dawn duyệt lại.
- Verify WIP cuối: unit exit 1, 1092/1099 PASS, 7 fail và 2 suite collect fail, tổng 9/58 suite fail. Typecheck exit 1: import legacy và 3 route avatar chưa triển khai. Arch exit 1: 0 NEW, 2 stale. Spec lint exit 0. Gate push exit 1, `verification: verdict BLOCKED != PASS`.
- Ngoài scope còn frame.lock.json cho pattern mới, UI baseline/UUID allowlist stale và BFF mock cũ thiếu field/kỳ vọng headers cũ. Không sửa các file đó.
- Code mới cần sửa trước nghiệm thu: Button radius overrides bị layout-gate từ chối, chuỗi Việt hardcode chưa nối i18n, chưa có deferred hook/ref-latch test. S7 giữ test đỏ do chưa có route. Chưa nghiệm thu đủ AC S2–S6.
- Console-frame lỗi load server-only, chưa xác minh baseline nên không nhận lỗi có sẵn. Full unit đầu thu nhầm spec Playwright, lỗi lúc collect; lượt cuối exclude thư mục browser và giữ test unit đỏ. Không chạy trình duyệt.
- Runtime/integration/e2e NOT RUN; OD-1 chưa đo lại, không ghép link giả. `e2e fail` trong DONE-code.txt nghĩa là chưa đạt.
- Receipt do engine ghi: `.aidlc/runs/PORTAL-ACCOUNT-EDIT-001/artifacts/verification.json`; logs `artifacts/logs/{unit,typecheck,arch,spec}.log`.

Where it started: S1 code xanh, chưa done. Decisions: làm S2–S6, giữ scope/gate, dừng ở caller ngoài card. Key files: progress-code.md, receipt và các test nêu trên. Pick up here: sửa/duyệt lại phạm vi, sửa WIP S2–S6, hoàn tất S7 rồi S8–S16; verify thật đủ integration/e2e, PASS mới done S1–S16 và gate push.

# Lịch sử lượt trước, không phải trạng thái hiện tại

## Done

Lượt tiếp ngày 2026-10-26 đã kiểm lại S1 qua engine: unit 23/23 PASS, typecheck PASS, arch PASS, spec lint PASS. Mỗi check exit 0, verification verdict PASS. Arch có 65 violations, 65 baselined, 0 new, 0 stale. Hai blocker baseline cũ đã hết.

`done S1 --task PORTAL-ACCOUNT-EDIT-001` và `gate push --task PORTAL-ACCOUNT-EDIT-001` vẫn exit 1 do thiếu `integration*` và `e2e*`. Tổng done 0/6; S2–S6 chưa triển khai. Chưa chạy full unit portal vì chưa tới sau S6.

## Files changed

Không sửa code trong lượt tiếp này. Năm file S1 từ lượt trước còn trong worktree, đã kiểm lại:

- lib/api/auth/types.ts
- lib/api/account-bff.ts
- app/api/auth/profile/route.ts
- app/api/auth/password/change/route.ts
- lib/api/account-bff.test.ts

Đã tạo badcases.md trước vòng kiểm lại verbose, cập nhật handback.md và progress-code.md, DONE-code.txt theo brief. Engine tự ghi receipt/log/trace; không sửa artifacts bằng tay.

## Decisions

Giữ thứ tự S1–S6 và R26. Không sửa plan, baseline, policy, testkit, env, backend hoặc engine. Không commit/push/approve; không dùng cổng 3000; `e2e-browser: hoãn R32`. Không đặt tên integration/e2e cho unit có fetch mock để vượt gate.

Spec check dùng đúng lệnh plan.md:187, chỉ lint hình dạng tài liệu. Unit BFF kiểm envelope và HTTP handler với upstream mock; không chứng minh auth/session revoke thật.

badcases.md mô tả ca S1 đã có, chỉ kỳ vọng của vòng kiểm lại được ghi trước vòng chạy này. Không nhận là oracle trước lượt TDD ban đầu. Ca expired_token challenge không áp dụng endpoint S1; các ca token email/avatar và runtime thuộc S7–S16 vẫn chưa kiểm.

## Left over

`chan done-S1-doi-integration-e2e-ngoai-card`. `/home/dawn/agent_skills/sdlc/engine/sdlc.py:831` gọi gate push cho done; `:398` đòi tất cả prefix check của pipeline. `.aidlc/runs/PORTAL-ACCOUNT-EDIT-001/plan.md:187` yêu cầu unit/arch từng slice, runtime cuối; `:204`–`:206` dành fixture và API E2E cho S14–S16. Brief chỉ cho S1–S6 theo thứ tự và R26 không cho mở card runtime sớm. Cần owner điều chỉnh gate done theo slice hoặc giao phương án runtime S1 được duyệt. Agent không tự đổi engine/policy hay approval.

Receipt hiện tại: `.aidlc/runs/PORTAL-ACCOUNT-EDIT-001/artifacts/verification.json`; logs: `artifacts/logs/unit.log`, `typecheck.log`, `arch.log`, `spec.log`. `verification PASS` không đồng nghĩa `gate push PASS`.

Where it started: S1 code có sẵn, chưa done. Decisions: kiểm chứng lại, giữ gate và scope. Key files: verification.json, badcases.md, plan.md:187, engine sdlc.py:831. Pick up here: owner xử lý gate done đang yêu cầu S14–S16 ngay ở S1; verify/done S1 rồi mới triển khai S2–S6.

Handback đã gọi sau khi tạo badcases.md và verify verbose: exit 1, không có handback receipt thành công. Engine báo S1-BC-01..06 expected không thuộc mã trong testkit/errors.md. Nguồn `/home/dawn/agent_skills/sdlc/engine/sdlc.py:292` chỉ trích mã đầu dòng bullet; errors.md ghi `missing_field:`, `wrong_type:`, `authz:` và các nhãn có dấu `:`. Những mã wire như UNAUTHORIZED/VALIDATION_ERROR/FORBIDDEN/BAD_REQUEST nằm trong phần văn bản sau nhãn nên parser không nhận. Nhãn `invalid_current_password:` còn dấu `:` cũng không khớp token code không dấu `:`. Không đổi expected thành mã giả hoặc sửa testkit sau approve để vượt gate. Cần owner sửa hợp đồng định dạng testkit/parser theo quy trình trước handback lại.
