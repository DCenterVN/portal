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

### US-UI-001 Operator portal UI and auth screens [1/3 tasks]
- [ ] PORTAL-AUTH-UI-001 - integration (awaiting_work) - worker - - next: verification: stale (code changed since verify: app/activate/page.tsx, app/api/auth/activate/resend/route.ts, app/forgot-password/page.tsx)
  - [x] S1: login routes by audience (files: features/auth/home-for.ts, features/auth/home-for.test.ts, features/auth/login-form.tsx, components/layout/auth-shell.tsx, app/login/page.tsx; test: npm test -- features/auth)
  - [x] S2: register, customer only (files: features/auth/register-form.tsx, app/register/page.tsx; test: npm test && archcheck)
  - [x] S2b: activate + resend (files: features/auth/activate-view.tsx, app/activate/page.tsx, app/api/auth/activate/resend/route.ts, lib/auth/client.ts; test: npm test && archcheck)
  - [x] S3: forgot + reset (files: features/auth/forgot-form.tsx, features/auth/reset-form.tsx, app/forgot-password/page.tsx, app/reset-password/page.tsx; test: npm test && archcheck)
  - [x] S4: Anti grader (files: .aidlc/runs/PORTAL-AUTH-UI-001/anti-test.md, .aidlc/runs/PORTAL-AUTH-UI-001/anti.sh, .aidlc/runs/PORTAL-AUTH-UI-001/anti_check.py; test: python3 anti_check.py fails on an empty run and passes on Claude's own run)
- [x] PORTAL-BRAND-001 - done - worker -
  - [x] S1: tokens drive the theme (files: app/tokens.generated.css, app/globals.css, app/layout.tsx; test: (cd .. && python3 platform-docs/scripts/uigen.py check --root .) && npm test)
  - [x] S2: buttons follow the kit (files: components/ui/button.tsx; test: npm test && ! grep -nE '#[0-9A-Fa-f]{6}|emerald-|teal-|backdrop-blur' components/ui/button.tsx)
  - [x] S3: one PasswordInput on every password field (files: components/patterns/password-input.tsx, components/patterns/password-input.test.tsx, features/auth/login-form.tsx, features/auth/register-form.tsx, features/auth/reset-form.tsx; test: npm test -- components/patterns features/auth)
  - [x] S4: brand favicon, served to logged-out visitors, no 404 on /favicon.ico (files: app/icon.svg, proxy.ts, proxy.test.ts; test: npm test -- proxy && curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/icon.svg = 200 and the grader's G7 console gate is clean)
- [ ] PORTAL-PLATFORM-001 - build (awaiting_work) - worker codex - next: verification: no 'integration*' check (pipeline stage integration)
  - [ ] S1: Contract D-078, DTO fixtures và kiểm tra envelope (files: contracts/org.public.yaml, contracts/README.md, lib/api/platform-contract.ts, lib/api/platform-contract.test.ts; test: npm test -- lib/api/platform-contract)
  - [ ] S2: BFF platform allow-list và chuyển tiếp token (files: lib/api/platform-bff.ts, app/api/platform/[...path]/route.ts, lib/api/platform-bff.test.ts; test: npm test -- lib/api/platform-bff)
  - [ ] S3: BFF công ty MAIN và quyền theo scope (files: lib/api/company-bff.ts, app/api/org/[...path]/route.ts, lib/api/company-bff.test.ts; test: npm test -- lib/api/company-bff)
  - [ ] S4: Guard quyền, client và trạng thái lỗi dùng chung (files: features/platform/access.ts, features/platform/access.test.ts, lib/api/platform-client.ts, lib/api/platform-client.test.ts, features/platform/access-boundary.tsx; test: npm test -- features/platform/access lib/api/platform-client)
  - [ ] S5: Điều hướng login có mặt phẳng nền tảng (files: features/auth/home-for.ts, features/auth/home-for.test.ts; test: npm test -- features/auth/home-for)
  - [ ] S6: Shell Đồng xanh, navigation theo quyền và bản dịch cục bộ (files: components/layout/platform-shell.tsx, features/platform/workspace.tsx, app/platform/layout.tsx, messages/vi.json, messages/en.json; test: npm run typecheck && npm run lint)
  - [ ] S7: Danh sách và onboard công ty (files: app/platform/companies/page.tsx, features/platform/companies-view.tsx, features/platform/company-onboard-form.tsx, features/platform/use-companies.ts, features/platform/companies.test.ts; test: npm test -- features/platform/companies)
  - [ ] S8: Chi tiết công ty và bật tắt module (files: app/platform/companies/[id]/page.tsx, features/platform/company-detail-view.tsx, features/platform/company-modules.tsx, features/platform/use-company.ts, features/platform/company-modules.test.ts; test: npm test -- features/platform/company-modules)
  - [ ] S9: Ma trận công ty và thay action theo role (files: app/platform/companies/[id]/role-matrix/page.tsx, features/platform/role-matrix-view.tsx, features/platform/use-role-matrix.ts, features/platform/role-matrix.test.ts; test: npm test -- features/platform/role-matrix)
  - [ ] S10: Xin hỗ trợ, break-glass và grant của tôi (files: app/platform/support-access/page.tsx, features/platform/support-view.tsx, features/platform/support-request-form.tsx, features/platform/use-support.ts, features/platform/support.test.ts; test: npm test -- features/platform/support)
  - [ ] S11: Cấp và thu hồi nhân sự nền tảng (files: app/platform/staff/page.tsx, features/platform/staff-view.tsx, features/platform/use-staff.ts, features/platform/staff.test.ts; test: npm test -- features/platform/staff)
  - [ ] S12: Audit nền tảng có lọc và phân trang (files: app/platform/audit/page.tsx, features/platform/audit-view.tsx, features/platform/use-audit.ts, features/platform/audit.test.ts; test: npm test -- features/platform/audit)
  - [ ] S13: Công ty của tôi: lắp guard/provider ở layout trước màn hình module, ma trận và consent (files: app/company/page.tsx, features/platform/my-company-view.tsx, features/platform/use-my-company.ts, features/platform/my-company.test.ts, app/company/layout.tsx; test: npm test -- features/platform/my-company)
  - [ ] S14: Duyệt thu hồi hỗ trợ và audit công ty (files: app/company/support-access/page.tsx, features/platform/company-support-view.tsx, features/platform/use-company-support.ts, features/platform/company-support.test.ts; test: npm test -- features/platform/company-support)
  - [ ] S15: Kiểm tra live do Claude chạy với dữ liệu cô lập (files: tests/integration/platform-plane.it.test.ts, tests/integration/company-support.it.test.ts; test: npm test -- tests/integration)
  - [ ] S16: Kiểm tra UI và bằng chứng mọi màn hình (files: .aidlc/runs/PORTAL-PLATFORM-001/ui-cases.md, .aidlc/runs/PORTAL-PLATFORM-001/anti_check.py, .aidlc/runs/PORTAL-PLATFORM-001/evidence; test: python3 .aidlc/runs/PORTAL-PLATFORM-001/anti_check.py)

## Sprint 02

### US-UI-002 As a customer, employee, or organization owner I want separate API-backed journeys for shopping, branch work, and organization administration so I can complete my tasks with no cross-scope access (specs: ../sales/.aidlc/specs/order-lifecycle.md, ../org/.aidlc/specs/org-admin.md, ../org/.aidlc/specs/employee-onboard.md). [0/3 tasks]
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
