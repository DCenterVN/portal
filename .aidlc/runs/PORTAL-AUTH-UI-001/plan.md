# Plan: PORTAL-AUTH-UI-001

- **Task ID**: `PORTAL-AUTH-UI-001`
- **Mode**: `hard`
- **Story**: US-UI-001
- **Sprint**: 01
- **Issue**: 

## Scope
- Outcome: auth screens (login, register, activate, forgot, reset) follow frontend.md v2 and send each audience to the right home after login. The task also serves as the first UI task graded by Anti (anti-test.md, anti.sh, anti_check.py).
- Decision: EXTEND. Keep the BFF routes in `app/api/auth/*` and the `login()` helper. Move client code out of `app/*/page.tsx` into `features/auth/`.
- Impact: `app/login/page.tsx:40` sends everyone to `/branches`, customers included. `proxy.ts` is unchanged.

## Requirements
Customer vs employee (ADR-024 §3–4): one auth account and one login screen. The difference is in org:
- **Customer**: self-registers, activates by email, and has no membership.
- **Employee**: provisioned by an admin (auth `/internal/users/provision`), sets a password through activate/reset, and has an EMPLOYEE membership and a role per branch.

- FR-1: after login, route by `/api/auth/context`.
  - AC-1: With 0 access contexts (customer), go to the safe `redirect`, otherwise `/`.
  - AC-2: With 1 context (employee), go to `/console`. With more than 1, go to `/switch-branch`. Exception: a valid same-site `?redirect=` wins, including customer pages such as `/cart`, because staff can also shop (Dawn, 2026-09-26).
  - AC-3: A `redirect` to a console route is ignored for a customer.
- FR-2: login.
  - AC-4: A wrong password shows `role="alert"`, keeps the user on `/login` and returns no 5xx.
  - AC-5: While submitting, the button is disabled and `aria-busy` is set.
- FR-3: register (customer only).
  - AC-6: A 202 shows the "check your email" state.
  - AC-7: An existing email or invalid input shows `role="alert"`.
  - AC-8: The screen states that staff do not register here.
- FR-4: activate.
  - AC-9: A valid token shows success with a login link.
  - AC-10: An invalid or expired token shows `role="alert"` and a resend option (`/auth/activate/resend`).
- FR-5: forgot/reset.
  - AC-11: Forgot always shows the same neutral message.
  - AC-12: A bad reset token shows `role="alert"`, and a successful reset goes to `/login`.
- FR-6: frontend.md v2.
  - AC-13: The FE-06/09/10/11 baseline lines for the 5 auth pages disappear, and archcheck reports 0 new.
  - AC-14: Each screen has 4 distinct PNGs, a11y ≥ 90, 0 console errors and 0 5xx (anti_check.py).
- Out of scope: the landing page (see Open decisions), social login, the customer profile page, and `/me`.

## Technical definition
ADR-024 §3–4 applies, along with [frontend.md v2](../../../../platform-docs/standards/frontend.md).
- NFR security: the redirect goes through the existing `sanitizeRedirectUrl`, and the neutral message on forgot prevents account enumeration.
- NFR performance: route First Load JS ≤ 200 kB.

## UX
`AuthShell` is a split layout: brand panel on the left, form on the right, and a single column at 375 px.
- Tokens only: `bg-surface`, `text-ink`, `bg-primary`; no hex or palette classes.
- Every screen has 4 states: idle (success), submitting (loading), error (`role="alert"`) and done (confirmation).
- Copy is inline Vietnamese (next-intl is not wired yet).

## Design
- `features/auth/home-for.ts`: `homeFor(contexts, redirect)` is a pure function implementing AC-1..3.
- `features/auth/*-form.tsx` are client leaves; `app/<route>/page.tsx` is a Server Component that renders `<AuthShell><XForm/></AuthShell>`.
- BFF: the existing `/api/auth/{login,register,activate,forgot,reset,context}` routes stay. Add `POST /api/auth/activate/resend {email}` → auth `/auth/activate/resend`, using `lib/api/service-bff.forwardService` (no raw fetch). Add `resendActivation(email)` to `lib/auth/client.ts`.
- next-intl is not wired anywhere in portal yet, so copy stays inline `vi` (i18n wiring is a separate task).

## Files planned
- features/auth/
- components/layout/auth-shell.tsx
- app/login/page.tsx
- app/register/page.tsx
- app/activate/page.tsx
- app/forgot-password/page.tsx
- app/reset-password/page.tsx
- app/api/auth/activate/resend/route.ts
- lib/auth/client.ts
- .aidlc/runs/PORTAL-AUTH-UI-001/

## Tests planned
TC-1 | AC-1..3 | unit | npm test -- features/auth/home-for
TC-2 | AC-4..12 | ui (Anti) | bash .aidlc/runs/PORTAL-AUTH-UI-001/anti.sh
TC-3 | AC-13 | arch | python3 ~/agent_skills/sdlc/engine/archcheck.py
TC-4 | AC-14 | grader | python3 .aidlc/runs/PORTAL-AUTH-UI-001/anti_check.py

## Slices
- [x] S1: login routes by audience (files: features/auth/home-for.ts, features/auth/home-for.test.ts, features/auth/login-form.tsx, components/layout/auth-shell.tsx, app/login/page.tsx; test: npm test -- features/auth)
- [x] S2: register, customer only (files: features/auth/register-form.tsx, app/register/page.tsx; test: npm test && archcheck)
- [x] S2b: activate + resend (files: features/auth/activate-view.tsx, app/activate/page.tsx, app/api/auth/activate/resend/route.ts, lib/auth/client.ts; test: npm test && archcheck)
- [x] S3: forgot + reset (files: features/auth/forgot-form.tsx, features/auth/reset-form.tsx, app/forgot-password/page.tsx, app/reset-password/page.tsx; test: npm test && archcheck)
- [x] S4: Anti grader (files: .aidlc/runs/PORTAL-AUTH-UI-001/anti-test.md, .aidlc/runs/PORTAL-AUTH-UI-001/anti.sh, .aidlc/runs/PORTAL-AUTH-UI-001/anti_check.py; test: python3 anti_check.py fails on an empty run and passes on Claude's own run)

## Risks / rollback
- Paying the debt makes archcheck report FIXED lines, and the baseline is protected, so Dawn deletes those lines.
- Rollback is a revert of the commit; no API or DB changes.

## Open decisions
- D1 (resolved 2026-09-25, Dawn: "triển khai"): one login for both audiences, routed by context.
- D2: Landing. `app/page.tsx` already exists (Việt Sạch, light/dark). Gaps:
  - Every "Mua sản phẩm/Xem sản phẩm" CTA goes to `/products`, which is not public, so guests land on login.
  - Images are hotlinked from Unsplash.
  - The stats (−18°C, 100%, 3 miền) are marketing copy with no data source.

  Needs a separate task (PORTAL-LANDING-001) once Dawn decides whether guests may browse products.
