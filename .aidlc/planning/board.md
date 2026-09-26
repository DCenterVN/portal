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

### US-UI-001 Operator portal UI and auth screens [0/1 tasks]
- [ ] PORTAL-AUTH-UI-001 - build (awaiting_work) - worker - - next: verification: no 'integration*' check (pipeline stage integration)
  - [ ] S1: login routes by audience (files: features/auth/home-for.ts, features/auth/home-for.test.ts, features/auth/login-form.tsx, components/layout/auth-shell.tsx, app/login/page.tsx; test: npm test -- features/auth)
  - [ ] S2: register, customer only (files: features/auth/register-form.tsx, app/register/page.tsx; test: npm test && archcheck)
  - [ ] S2b: activate + resend (files: features/auth/activate-view.tsx, app/activate/page.tsx, app/api/auth/activate/resend/route.ts, lib/auth/client.ts; test: npm test && archcheck)
  - [ ] S3: forgot + reset (files: features/auth/forgot-form.tsx, features/auth/reset-form.tsx, app/forgot-password/page.tsx, app/reset-password/page.tsx; test: npm test && archcheck)
  - [ ] S4: Anti grader (files: .aidlc/runs/PORTAL-AUTH-UI-001/anti-test.md, .aidlc/runs/PORTAL-AUTH-UI-001/anti.sh, .aidlc/runs/PORTAL-AUTH-UI-001/anti_check.py; test: python3 anti_check.py fails on an empty run and passes on Claude's own run)
