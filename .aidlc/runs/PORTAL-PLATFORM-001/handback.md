# Handback: PORTAL-PLATFORM-001

Worker: Claude. Ngày 2026-09-28. Claude làm lại toàn bộ UI vì bản codex chỉ là khung rỗng và mọi trang đều trả 500.

## Done
- 8 màn hình ở hai mặt phẳng:
  - Nền tảng: Công ty, Chi tiết + Module, Ma trận quyền, Hỗ trợ truy cập + break-glass, Nhân sự, Audit.
  - Công ty: Công ty của tôi (consent, module, ma trận chỉ đọc), Duyệt hỗ trợ + audit công ty.
- Slice 19/19 (S0–S16, S0c).
- Sửa theo 3 vòng review codex (`review.md`, `review-2.md`, `review-3.md`):
  - Hộp thoại: Tab chạy vòng trong hộp, Esc trả focus về nút mở, nút đóng 44px, gõ liên tục không mất focus.
  - Tab WAI-ARIA dùng chung.
  - Form hỗ trợ fail closed khi không đọc được danh sách công ty.
  - Module có ngày bắt đầu và nút "Huỷ lịch".
  - Mỗi trường báo lỗi riêng.
  - Nút "Trang trước" khi trang rỗng.
  - Allow-list query của BFF tách theo từng endpoint.

### Tier 1
| check | kết quả | receipt |
|---|---|---|
| unit | 177/177 (30 file) | `artifacts/logs/unit.log` |
| types, lint, build | PASS | `artifacts/logs/` |
| integration live (BFF → Kong → org/auth) | 22/22 (3 file), 0 skip, gọi vitest trực tiếp | `artifacts/logs/integration.log` |
| spec | PASS: `org/.aidlc/specs/platform-plane.md`, `role-matrix.md` | `artifacts/logs/spec.log` |
| e2e (Anti, RUN M7K2P9, `anti_check.py`, sha256 máy chấm khớp `grader.sha256`) | PASS: 64 ảnh trạng thái + 17 ảnh luồng (81 ảnh khác nhau), 24/24 Lighthouse đạt ngưỡng, marker DB đúng, git sạch. Bàn phím: Tab vòng, Esc trả focus, ← → đổi tab đều đạt. Không fail-open, không vùng bấm < 44px. | `artifacts/logs/e2e.log`, `evidence/` (lượt cũ T9M2K4 ở `evidence-T9M2K4/`) |
| arch | 0 vi phạm mới, 1 dòng stale (D-096). Check để ngoài verify vì baseline là file được bảo vệ. | `archcheck.py` |

Speccheck toàn bộ org exit 1 vì `org-admin.md` và các spec khác lệch mã lỗi/response. Lỗi đó có trước task này và nằm ngoài các spec task liên kết.

### Tier 2
- Mutation: 16/16 bị test bắt ở lượt đầu, và 12/12 ở các bản sửa theo review.
  - Các chỗ phá: guard 403/404/5xx, CORE không toggle, lọc CORE/module lạ, dedupe org_id, EMPLOYEE-only, `hasNext`, diff action ma trận, UUID staff, 409 break-glass, giờ break-glass, ISO filter audit, root filter chỉ ở nền tảng, `consentText` null, `decisionsFor`, idempotency key, fail-closed khi không có provider.
- Review độc lập: codex 3 vòng, cả ba BLOCKED. Mọi finding đã sửa và được lượt e2e M7K2P9 kiểm lại. Dawn quyết không gửi codex vòng 4 (28/9).

### Tier 3
Dawn chấm.

## Files changed
- components/navbar.tsx
- components/ui/button.tsx
- components/ui/dialog.tsx
- components/ui/table.tsx
- components/ui/tabs.tsx
- components/ui/keyboard.test.ts
- contracts/README.md
- features/auth/home-for.test.ts
- features/auth/home-for.ts
- messages/en.json
- messages/vi.json
- app/api/org/[...path]/route.ts
- app/api/platform/[...path]/route.ts
- app/company/layout.tsx
- app/company/page.tsx
- app/company/support-access/page.tsx
- app/platform/audit/page.tsx
- app/platform/companies/[id]/page.tsx
- app/platform/companies/[id]/role-matrix/page.tsx
- app/platform/companies/page.tsx
- app/platform/layout.tsx
- app/platform/staff/page.tsx
- app/platform/support-access/page.tsx
- components/layout/platform-shell.tsx
- components/ui/field.tsx
- components/ui/state.tsx
- contracts/org.public.yaml
- features/platform/access-boundary.tsx
- features/platform/access.test.ts
- features/platform/access.ts
- features/platform/audit-view.tsx
- features/platform/audit.test.ts
- features/platform/companies-view.tsx
- features/platform/companies.test.ts
- features/platform/company-detail-view.tsx
- features/platform/company-modules.test.ts
- features/platform/company-modules.tsx
- features/platform/company-onboard-form.tsx
- features/platform/company-support-view.tsx
- features/platform/company-support.test.ts
- features/platform/my-company-view.tsx
- features/platform/my-company.test.ts
- features/platform/role-matrix-view.tsx
- features/platform/role-matrix.test.ts
- features/platform/staff-view.tsx
- features/platform/staff.test.ts
- features/platform/support-request-form.tsx
- features/platform/support-view.tsx
- features/platform/support.test.ts
- features/platform/use-audit.ts
- features/platform/use-companies.ts
- features/platform/use-company-support.ts
- features/platform/use-company.ts
- features/platform/use-my-company.ts
- features/platform/use-role-matrix.ts
- features/platform/use-staff.ts
- features/platform/use-support.ts
- features/platform/workspace.tsx
- lib/api/company-bff.test.ts
- lib/api/company-bff.ts
- lib/api/platform-bff.test.ts
- lib/api/platform-bff.ts
- lib/api/platform-client.test.ts
- lib/api/platform-client.ts
- lib/api/platform-contract.test.ts
- lib/api/platform-contract.ts
- tests/integration/company-support.it.test.ts
- tests/integration/platform-plane.it.test.ts

## Decisions
- Chỉ dùng một bộ component `components/ui`, màn hình không tự viết component riêng. Mọi trạng thái (tải, rỗng, lỗi, bị từ chối) đều đi qua `state.tsx`.
- Guard chỉ dựa vào action mà org trả về, không so tên role. Khi org lỗi hoặc có lỗi 5xx thì chặn truy cập (fail closed). Mọi view kiểm `error || !data` trước, nên dữ liệu SWR cache không bao giờ hiện khi org lỗi.
- View không import `lib/api` mà gọi qua hook (FE-14/archcheck).
- `NextIntlClientProvider` đặt trong workspace client. Đặt trong server layout thì mọi trang trả 500.
- Integration test ném lỗi khi thiếu env, không tự skip. Verify gọi vitest trực tiếp, vì `npm test -- path` chạy lại bộ unit và cho PASS giả.
- Ghi chú của Anti, đã xét và không phải lỗi:
  - Form audit chỉ lọc khi bấm "Lọc", không đọc `?action=` trên URL; plan không yêu cầu.
  - SWR hiện cache khi chuyển route rồi mới tải lại; đây là hành vi mặc định có chủ đích.

## Left over
- D-095 (Chặn, auth/org): OWNER được onboard bằng email mới bị kẹt ở PROVISIONED, không có mật khẩu và không nhận mail. Câu "OWNER sẽ nhận email kích hoạt" chỉ đúng khi D-095 đã sửa.
- D-096: Dawn xoá dòng `FE-11 components/ui/button.tsx` trong `.aidlc/arch-baseline.txt`.
- D-097: test cũ đòi localhost và gây 429.
- D-098: Kong giữ DNS cũ.
- Last-admin 409 không test UI trên stack dùng chung; mapping 409 đã có unit và integration test.
- Anti đo Lighthouse trên `npm run dev`; build production chưa được đo.
- `vitest.config.ts` (loại `*.it.test.ts` khỏi unit) và `tests/integration/portal-backend.it.test.ts` là thay đổi baseline 27/9, không thuộc task này (plan dòng 16) nhưng check integration dựa vào chúng: phải commit cùng hoặc trước PR này.
- D-099: form chọn công ty chỉ lấy 100 công ty đầu, chờ Dawn chốt số công ty ở MVP.
- Chưa commit.
