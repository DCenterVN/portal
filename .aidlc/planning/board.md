# Board: portal

Pipeline: discovery > technical > ux > design > build > integration > e2e > release

## Sprint 00-legacy

### US-UI-001 Operator portal UI and auth screens [0/1 tasks]
- [ ] PORTAL-IAM-CONSOLE-001 - ux (awaiting_work) - worker - - next: approval: no plan-approval.json

## Sprint 01

### US-ARCH-001 [0/1 tasks]
- [ ] ARCH-ALIGN-001 - design (awaiting_review) - worker - - next: approval: no plan-approval.json
  - [ ] S1: FE-03 features/inventory/shelves-view.tsx (files: features/inventory/shelves-view.tsx; test: python3 ~/agent_skills/sdlc/engine/archcheck.py && npm test)
  - [ ] S2: FE-03 features/production/food-plans-view.tsx (files: features/production/food-plans-view.tsx; test: python3 ~/agent_skills/sdlc/engine/archcheck.py && npm test)
  - [ ] S3: FE-03 features/production/orders-view.tsx (files: features/production/orders-view.tsx; test: python3 ~/agent_skills/sdlc/engine/archcheck.py && npm test)
  - [ ] S4: FE-03 features/production/targets-view.tsx (files: features/production/targets-view.tsx; test: python3 ~/agent_skills/sdlc/engine/archcheck.py && npm test)
  - [ ] S5: FE-03 features/sales/pricing-floor-view.tsx (files: features/sales/pricing-floor-view.tsx; test: python3 ~/agent_skills/sdlc/engine/archcheck.py && npm test)
  - [ ] S6: FE-05 components/navbar.tsx (files: components/navbar.tsx; test: python3 ~/agent_skills/sdlc/engine/archcheck.py && npm test)

### US-UI-001 Operator portal UI and auth screens [0/4 tasks]
- [ ] PORTAL-AUTH-UI-001 - integration (awaiting_work) - worker - - next: verification: stale (code changed since verify: .aidlc/arch-baseline.txt, .aidlc/stage-policy.json, AGENTS.md)
  - [x] S1: login routes by audience (files: features/auth/home-for.ts, features/auth/home-for.test.ts, features/auth/login-form.tsx, components/layout/auth-shell.tsx, app/login/page.tsx; test: npm test -- features/auth)
  - [x] S2: register, customer only (files: features/auth/register-form.tsx, app/register/page.tsx; test: npm test && archcheck)
  - [x] S2b: activate + resend (files: features/auth/activate-view.tsx, app/activate/page.tsx, app/api/auth/activate/resend/route.ts, lib/auth/client.ts; test: npm test && archcheck)
  - [x] S3: forgot + reset (files: features/auth/forgot-form.tsx, features/auth/reset-form.tsx, app/forgot-password/page.tsx, app/reset-password/page.tsx; test: npm test && archcheck)
  - [x] S4: Anti grader (files: .aidlc/runs/PORTAL-AUTH-UI-001/anti-test.md, .aidlc/runs/PORTAL-AUTH-UI-001/anti.sh, .aidlc/runs/PORTAL-AUTH-UI-001/anti_check.py; test: python3 anti_check.py fails on an empty run and passes on Claude's own run)
- [ ] PORTAL-BASE-UI-001 - design (awaiting_review) - worker - - next: approval: no plan-approval.json
  - [ ] S1: Màn A nhận lời mời tài khoản và đặt mật khẩu (files: app/(auth)/invite/accept/page.tsx, features/auth/invite-accept-form.tsx, app/api/auth/invite-accept/route.ts, lib/fetcher.ts, features/auth/invite-accept.test.tsx; test: npm test && npm run lint)
  - [ ] S2: Màn B quản lý và duyệt lời mời nhân viên trong console (files: lib/api/company-bff.ts, features/memberships/use-invitations.ts, features/memberships/invitations-view.tsx, features/memberships/invite-form.tsx, app/(console)/memberships/invitations/page.tsx; test: npm test && npm run lint)
  - [ ] S3: Màn C hồ sơ khách hàng cá nhân và sổ địa chỉ tại store (files: lib/api/customer-contract.ts, lib/api/customer-client.ts, app/api/customer/[...path]/route.ts, features/customer-profile/use-customer-me.ts, app/(store)/me/profile-client.tsx; test: npm test && npm run lint)
  - [ ] S4: Màn D quản lý tìm kiếm xem chi tiết và khoá khách hàng trong console (files: features/customers/use-customers.ts, features/customers/customers-view.tsx, features/customers/customer-detail-view.tsx, app/(console)/customers/page.tsx, app/(console)/customers/[id]/page.tsx; test: npm test && npm run lint)
  - [ ] S5: Màn E chuẩn hoá các màn auth hiện có theo hợp đồng mới (files: lib/auth/client.ts, features/auth/login-form.tsx, features/auth/register-form.tsx, features/auth/activate-view.tsx, app/(auth)/switch-org/page.tsx; test: npm test && npm run lint)
- [ ] PORTAL-BRAND-001 - integration (awaiting_work) - worker - - next: verification: stale (code changed since verify: .aidlc/arch-baseline.txt, .aidlc/stage-policy.json, AGENTS.md)
  - [x] S1: tokens drive the theme (files: app/tokens.generated.css, app/globals.css, app/layout.tsx; test: (cd .. && python3 platform-docs/scripts/uigen.py check --root .) && npm test)
  - [x] S2: buttons follow the kit (files: components/ui/button.tsx; test: npm test && ! grep -nE '#[0-9A-Fa-f]{6}|emerald-|teal-|backdrop-blur' components/ui/button.tsx)
  - [x] S3: one PasswordInput on every password field (files: components/patterns/password-input.tsx, components/patterns/password-input.test.tsx, features/auth/login-form.tsx, features/auth/register-form.tsx, features/auth/reset-form.tsx; test: npm test -- components/patterns features/auth)
  - [x] S4: brand favicon, served to logged-out visitors, no 404 on /favicon.ico (files: app/icon.svg, proxy.ts, proxy.test.ts; test: npm test -- proxy && curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/icon.svg = 200 and the grader's G7 console gate is clean)
- [ ] PORTAL-PLATFORM-001 - integration (awaiting_work) - worker claude - next: verification: stale (code changed since verify: .aidlc/arch-baseline.txt, .aidlc/stage-policy.json, AGENTS.md)
  - [x] S0: Một bộ UI kit dùng chung cho mọi màn hình mới: Skeleton/EmptyState/ErrorState/InlineAlert, Field/TextInput/Select/Textarea/Checkbox, TablePager, ConfirmDialog, Button size touch 44px (files: components/ui/state.tsx, components/ui/field.tsx, components/ui/button.tsx, components/ui/table.tsx, components/ui/dialog.tsx; test: npm run typecheck && npm run lint)
  - [x] S0c: Tabs WAI-ARIA dùng chung + test bàn phím cho dialog/tabs (files: components/ui/tabs.tsx, components/ui/keyboard.test.ts; test: npm test)
  - [x] S0b: Navbar toàn cục (chi nhánh mẫu cứng, D-064) không hiện trên /platform và /company (files: components/navbar.tsx; test: npm run typecheck)
  - [x] S1: Contract D-078, DTO fixtures và kiểm tra envelope (files: contracts/org.public.yaml, contracts/README.md, lib/api/platform-contract.ts, lib/api/platform-contract.test.ts; test: npm test -- lib/api/platform-contract)
  - [x] S2: BFF platform allow-list và chuyển tiếp token (files: lib/api/platform-bff.ts, app/api/platform/[...path]/route.ts, lib/api/platform-bff.test.ts; test: npm test -- lib/api/platform-bff)
  - [x] S3: BFF công ty MAIN và quyền theo scope (files: lib/api/company-bff.ts, app/api/org/[...path]/route.ts, lib/api/company-bff.test.ts; test: npm test -- lib/api/company-bff)
  - [x] S4: Guard quyền, client và trạng thái lỗi dùng chung (files: features/platform/access.ts, features/platform/access.test.ts, lib/api/platform-client.ts, lib/api/platform-client.test.ts, features/platform/access-boundary.tsx; test: npm test -- features/platform/access lib/api/platform-client)
  - [x] S5: Điều hướng login có mặt phẳng nền tảng (files: features/auth/home-for.ts, features/auth/home-for.test.ts; test: npm test -- features/auth/home-for)
  - [x] S6: Shell Đồng xanh, navigation theo quyền và bản dịch cục bộ (files: components/layout/platform-shell.tsx, features/platform/workspace.tsx, app/platform/layout.tsx, messages/vi.json, messages/en.json; test: npm run typecheck && npm run lint)
  - [x] S7: Danh sách và onboard công ty (files: app/platform/companies/page.tsx, features/platform/companies-view.tsx, features/platform/company-onboard-form.tsx, features/platform/use-companies.ts, features/platform/companies.test.ts; test: npm test -- features/platform/companies)
  - [x] S8: Chi tiết công ty và bật tắt module (files: app/platform/companies/[id]/page.tsx, features/platform/company-detail-view.tsx, features/platform/company-modules.tsx, features/platform/use-company.ts, features/platform/company-modules.test.ts; test: npm test -- features/platform/company-modules)
  - [x] S9: Ma trận công ty và thay action theo role (files: app/platform/companies/[id]/role-matrix/page.tsx, features/platform/role-matrix-view.tsx, features/platform/use-role-matrix.ts, features/platform/role-matrix.test.ts; test: npm test -- features/platform/role-matrix)
  - [x] S10: Xin hỗ trợ, break-glass và grant của tôi (files: app/platform/support-access/page.tsx, features/platform/support-view.tsx, features/platform/support-request-form.tsx, features/platform/use-support.ts, features/platform/support.test.ts; test: npm test -- features/platform/support)
  - [x] S11: Cấp và thu hồi nhân sự nền tảng (files: app/platform/staff/page.tsx, features/platform/staff-view.tsx, features/platform/use-staff.ts, features/platform/staff.test.ts; test: npm test -- features/platform/staff)
  - [x] S12: Audit nền tảng có lọc và phân trang (files: app/platform/audit/page.tsx, features/platform/audit-view.tsx, features/platform/use-audit.ts, features/platform/audit.test.ts; test: npm test -- features/platform/audit)
  - [x] S13: Công ty của tôi: lắp guard/provider ở layout trước màn hình module, ma trận và consent (files: app/company/page.tsx, features/platform/my-company-view.tsx, features/platform/use-my-company.ts, features/platform/my-company.test.ts, app/company/layout.tsx; test: npm test -- features/platform/my-company)
  - [x] S14: Duyệt thu hồi hỗ trợ và audit công ty (files: app/company/support-access/page.tsx, features/platform/company-support-view.tsx, features/platform/use-company-support.ts, features/platform/company-support.test.ts; test: npm test -- features/platform/company-support)
  - [x] S15: Kiểm tra live do Claude chạy với dữ liệu cô lập (files: tests/integration/platform-plane.it.test.ts, tests/integration/company-support.it.test.ts; test: npm test -- tests/integration)
  - [x] S16: Kiểm tra UI và bằng chứng mọi màn hình (files: .aidlc/runs/PORTAL-PLATFORM-001/ui-cases.md, .aidlc/runs/PORTAL-PLATFORM-001/anti_check.py, .aidlc/runs/PORTAL-PLATFORM-001/evidence; test: python3 .aidlc/runs/PORTAL-PLATFORM-001/anti_check.py)

## Sprint 02

### US-UI-002 As a customer, employee, or organization owner I want separate API-backed journeys for shopping, branch work, and organization administration so I can complete my tasks with no cross-scope access (specs: ../sales/.aidlc/specs/order-lifecycle.md, ../org/.aidlc/specs/org-admin.md, ../org/.aidlc/specs/employee-onboard.md). [0/4 tasks]
- [ ] PORTAL-CUSTOMER-001 - design (awaiting_review) - worker - - next: approval: no plan-approval.json
  - [ ] S1: Separate customer landing/catalog from employee product management (files: features/auth/home-for.ts, features/auth/home-for.test.ts, app/shop/page.tsx, features/customer/storefront-view.tsx, features/customer/storefront.test.ts; test: npm test -- features/customer/storefront features/auth/home-for)
  - [ ] S2: Customer product detail (files: app/shop/products/[id]/page.tsx, features/customer/product-detail-view.tsx, features/customer/use-catalog.ts, features/customer/product-detail.test.ts; test: npm test -- features/customer/product-detail)
  - [ ] S3: Cart and checkout against Sales DTOs (files: app/cart/page.tsx, features/customer/checkout-view.tsx, features/customer/use-cart.ts, features/customer/checkout.test.ts, lib/api/sales.ts; test: npm test -- features/customer/checkout)
  - [ ] S4: Customer order history (files: app/orders/page.tsx, features/customer/orders-view.tsx, features/customer/use-orders.ts, features/customer/orders.test.ts; test: npm test -- features/customer/orders)
  - [ ] S5: Customer order detail and cancellation rules (files: app/orders/[id]/page.tsx, features/customer/order-detail-view.tsx, features/customer/order-detail.test.ts; test: npm test -- features/customer/order-detail)
  - [ ] S6: Locale, UI evidence, and full regression (files: messages/vi.json, messages/en.json, .aidlc/runs/PORTAL-CUSTOMER-001/ui-cases.md, .aidlc/runs/PORTAL-CUSTOMER-001/anti_check.py, .aidlc/runs/PORTAL-CUSTOMER-001/evidence/; test: python3 .aidlc/runs/PORTAL-CUSTOMER-001/anti_check.py)
  - [ ] S7: Installable browser E2E harness (files: package.json, pnpm-lock.yaml, playwright.config.ts; test: npm run test:e2e -- --list)
  - [ ] S8: Customer happy-path browser E2E (files: tests/e2e/customer-flow.spec.ts, .aidlc/runs/PORTAL-CUSTOMER-001/testkit/env.md, .aidlc/runs/PORTAL-CUSTOMER-001/testkit/happy.md; test: PORTAL_E2E_BASE=http://127.0.0.1:3000 npm run test:e2e -- tests/e2e/customer-flow.spec.ts)
  - [ ] S9: Customer UI failure states and browser evidence (files: tests/e2e/customer-errors.spec.ts, .aidlc/runs/PORTAL-CUSTOMER-001/testkit/errors.md, .aidlc/runs/PORTAL-CUSTOMER-001/e2e-results.md; test: PORTAL_E2E_BASE=http://127.0.0.1:3000 npm run test:e2e -- tests/e2e/customer-errors.spec.ts)
- [ ] PORTAL-EMPLOYEE-001 - design (awaiting_review) - worker - - next: approval: no plan-approval.json
  - [ ] S1: Employee dashboard shell with current branch and permission summary (files: app/console/page.tsx, features/console/live-console.tsx, components/layout/employee-shell.tsx, features/employee/navigation.ts, features/employee/navigation.test.ts; test: npm test -- features/employee/navigation)
  - [ ] S2: Branch chooser and switch behavior preserve active context on failure (files: app/switch-branch/page.tsx, app/api/auth/switch-branch/route.ts, app/api/auth/bff.test.ts; test: npm test -- app/api/auth/bff)
  - [ ] S3: Align existing operational routes with capability navigation and active-branch states (files: features/inventory/shelves-view.tsx, features/production/targets-view.tsx, features/production/food-plans-view.tsx, features/production/orders-view.tsx, features/production/qc-view.tsx; test: npm test -- features/inventory features/production)
  - [ ] S4: Apply the same route boundary to pricing and traceability (files: features/sales/pricing-floor-view.tsx, features/traceability/trace-view.tsx; test: npm test -- features/sales/pricing-floor features/traceability)
  - [ ] S5: Localized UI evidence and regression (files: messages/vi.json, messages/en.json, .aidlc/runs/PORTAL-EMPLOYEE-001/ui-cases.md, .aidlc/runs/PORTAL-EMPLOYEE-001/anti_check.py, .aidlc/runs/PORTAL-EMPLOYEE-001/evidence/; test: python3 .aidlc/runs/PORTAL-EMPLOYEE-001/anti_check.py)
  - [ ] S6: Employee browser E2E workspace journey (files: tests/e2e/employee-workspace.spec.ts, .aidlc/runs/PORTAL-EMPLOYEE-001/testkit/env.md, .aidlc/runs/PORTAL-EMPLOYEE-001/testkit/happy.md, .aidlc/runs/PORTAL-EMPLOYEE-001/testkit/errors.md; test: PORTAL_E2E_BASE=http://127.0.0.1:3000 npm run test:e2e -- tests/e2e/employee-workspace.spec.ts)
  - [ ] S7: Verify customer boundary in the rendered UI (files: proxy.ts, proxy.test.ts, tests/e2e/customer-employee-boundary.spec.ts; test: PORTAL_E2E_BASE=http://127.0.0.1:3000 npm run test:e2e -- tests/e2e/customer-employee-boundary.spec.ts)
- [ ] PORTAL-ORG-001 - design (awaiting_review) - worker - - next: approval: no plan-approval.json
  - [ ] S1: Allow-listed Org BFF and client with query/body validation (files: lib/api/org-admin-bff.ts, lib/api/org-admin-bff.test.ts, app/api/orgs/[...path]/route.ts, lib/api/org-admin.ts, lib/api/org-admin.test.ts; test: npm test -- lib/api/org-admin)
  - [ ] S2: Branch creation and API-backed branch state (files: app/branches/page.tsx, features/branches/branches-view.tsx, features/branches/use-branches.ts, features/branches/branches.test.ts; test: npm test -- features/branches)
  - [ ] S3: Membership list and safe status/role changes (files: app/memberships/page.tsx, features/memberships/memberships-view.tsx, features/memberships/use-memberships.ts, features/memberships/memberships.test.ts; test: npm test -- features/memberships)
  - [ ] S4: Retire unsupported role editor; use read-only canonical matrix (files: features/roles/roles-view.tsx, app/roles/page.tsx; test: npm test -- features/roles)
  - [ ] S5: Localization and UI evidence (files: messages/vi.json, messages/en.json, .aidlc/runs/PORTAL-ORG-001/ui-cases.md, .aidlc/runs/PORTAL-ORG-001/anti_check.py, .aidlc/runs/PORTAL-ORG-001/evidence/; test: python3 .aidlc/runs/PORTAL-ORG-001/anti_check.py)
  - [ ] S6: Org administration browser E2E (files: tests/e2e/org-admin.spec.ts, .aidlc/runs/PORTAL-ORG-001/testkit/env.md, .aidlc/runs/PORTAL-ORG-001/testkit/happy.md, .aidlc/runs/PORTAL-ORG-001/testkit/errors.md; test: PORTAL_E2E_BASE=http://127.0.0.1:3000 npm run test:e2e -- tests/e2e/org-admin.spec.ts)
  - [ ] S7: Org UI failure states and browser evidence (files: tests/e2e/org-admin-errors.spec.ts, .aidlc/runs/PORTAL-ORG-001/e2e-results.md; test: PORTAL_E2E_BASE=http://127.0.0.1:3000 npm run test:e2e -- tests/e2e/org-admin-errors.spec.ts)
- [ ] PORTAL-SHELL-001 - integration (awaiting_work) - worker codex - next: verification: stale (code changed since verify: .aidlc/stage-policy.json)
  - [x] S0: token chrome vào portal + loại artefact AIDLC khỏi Vitest (files: app/tokens.generated.css, app/globals.css, vitest.config.ts; test: npm test && test "$(grep -c -- '--color-chrome: #14291A;' app/tokens.generated.css)" -eq 1 && test "$(grep -c -- '--color-chrome: #0A120C;' app/tokens.generated.css)" -eq 2)
  - [x] S1: Button theo kit, giữ tên variant/size (files: components/ui/button.tsx, components/ui/button.test.tsx; test: npm test -- components/ui/button && npm run typecheck)
  - [x] S2: ConsoleShell CRM chỉ nhận props, export ShellNavItem, index.ts bỏ export shell cũ (files: components/layout/console-shell.tsx, components/layout/console-sidebar.tsx, components/layout/console-header.tsx, components/layout/console-shell.test.tsx, components/layout/index.ts; test: npm test -- components/layout/console-shell && npm run typecheck)
  - [x] S3: StoreShell landing, header đặc, footer chrome (files: components/layout/store-shell.tsx, components/layout/store-header.tsx, components/layout/site-footer.tsx, components/layout/store-shell.test.tsx, components/layout/index.ts; test: npm test -- components/layout/store-shell)
  - [x] S4a: Khung (auth): layout nhóm card + MiniFooter, AuthHeading (files: app/(auth)/, components/layout/auth-shell.tsx, components/patterns/auth-heading.tsx; test: npm run typecheck)
  - [x] S4b: Dời login/register/activate vào (auth) (files: app/(auth)/, app/login/, app/register/, app/activate/, features/auth/; test: rm -rf .next/types .next/dev/types && npm run typecheck && npm test -- features/auth)
  - [x] S4c: Dời forgot/reset/switch-branch/switch-org vào (auth) (files: app/(auth)/, app/forgot-password/, app/reset-password/, app/switch-branch/, app/switch-org/; test: rm -rf .next/types .next/dev/types && npm run typecheck && npm test -- features/auth)
  - [x] S5a: store-frame (fetch thô, 401 → khách vãng lai) + mocks/store.ts + layout (store) (files: app/(store)/, features/store/store-frame.tsx, features/store/store-frame.test.ts, mocks/; test: npm test -- features/store)
  - [x] S5b: Root layout chỉ còn provider, SEO về (store), dời trang chủ, not-found (files: app/layout.tsx, app/page.tsx, app/not-found.tsx, app/(store)/; test: rm -rf .next/types .next/dev/types && npm run typecheck)
  - [x] S5c: Dời products/cart vào (store) (files: app/(store)/, app/products/, app/cart/; test: rm -rf .next/types .next/dev/types && npm run typecheck)
  - [x] S5d: Dời orders/me/traceability vào (store) (files: app/(store)/, app/orders/, app/me/, app/traceability/; test: rm -rf .next/types .next/dev/types && npm run typecheck && npm test)
  - [x] S6: Một `<main>` mỗi trang (files: components/ui/page.tsx, components/ui/page.test.tsx, app/(store)/page.tsx, features/traceability/trace-view.tsx; test: npm test && ! grep -n '<main' components/ui/page.tsx features/traceability/trace-view.tsx app/\(store\)/page.tsx)
  - [x] S7a: console-frame dữ liệu thật + mocks/console.ts + layout (console) (files: app/(console)/, features/console/console-frame.tsx, features/console/console-frame.test.ts, mocks/; test: npm test -- features/console)
  - [x] S7b: Dời console/branches, gỡ SAMPLE khỏi branches (files: app/(console)/, app/console/, app/branches/, features/branches/branches-view.tsx; test: rm -rf .next/types .next/dev/types && npm run typecheck && npm test -- features/branches)
  - [x] S7c: Dời memberships/roles/inventory (files: app/(console)/, app/memberships/, app/roles/, app/inventory/; test: rm -rf .next/types .next/dev/types && npm run typecheck)
  - [x] S7d: Dời production/sales (files: app/(console)/, app/production/, app/sales/; test: rm -rf .next/types .next/dev/types && npm run typecheck)
  - [x] S7e: Xoá navbar/header/sidebar/app-shell, chuyển regression test sang console nav (files: components/navbar.tsx, components/layout/app-shell.tsx, components/layout/header.tsx, components/layout/sidebar.tsx, components/ui/overlay.test.tsx; test: rm -rf .next/types .next/dev/types && npm run typecheck && npm test)
  - [x] S8: Nền tảng/công ty dùng ConsoleShell, workspace bỏ `<main>`, xoá PlatformShell (files: features/platform/workspace.tsx, components/layout/platform-shell.tsx; test: npm test -- features/platform && npm run typecheck)
  - [x] S9a: Dọn glass và fixture khỏi toast/membership; dialog giữ scrim glass (files: components/ui/dialog.tsx, components/ui/toast.tsx, features/memberships/memberships-view.tsx; test: ! grep -n 'backdrop-blur' components/ui/toast.tsx features/memberships/memberships-view.tsx)
  - [x] S9b: Gate layout/glass/main/mocks và dọn dependency cuối (files: app/layout-gate.test.ts, features/traceability/trace-view.tsx, components/modals/session-timeout-modal.tsx, app/(console)/memberships/page.tsx; test: npm test -- app/layout-gate && npm run typecheck)
  - [x] S10: Bỏ override nút ở auth (files: features/auth/; test: npm test -- features/auth)
  - [x] S11: Bỏ override nút + `<button>` thô ở khách/kho (files: features/products/cart-view.tsx, features/products/product-detail-view.tsx, features/console/live-console.tsx, features/inventory/shelves-view.tsx, app/(store)/me/; test: npm test -- features/products features/inventory features/console)
  - [x] S12a: Bỏ override nút màu thô ở sản phẩm/sản xuất (files: features/products/products-view.tsx, features/products/product-create-dialog.tsx, features/production/orders-view.tsx, features/production/qc-view.tsx; test: npm test -- features/products features/production)
  - [x] S12b: switch-branch + bật gate nút toàn cây (files: app/(auth)/switch-branch/, app/layout-gate.test.ts, features/memberships/memberships-view.tsx; test: npm test -- app/layout-gate && npm test)
  - [x] S13: Bằng chứng UI 3 vai × 2 cỡ × 2 theme + máy chấm (files: .aidlc/runs/PORTAL-SHELL-001/; test: python3 .aidlc/runs/PORTAL-SHELL-001/anti_check.py)
