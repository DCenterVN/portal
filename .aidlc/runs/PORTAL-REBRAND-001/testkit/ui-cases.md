# Future browser acceptance protocol (TC-6 / TC-9)

Not executed: isolated startup failed sandbox listen EPERM. This document specifies tests; it is not screenshot/audit evidence. Start the live portal only in a later authorized phase with `npm run dev -- --hostname 127.0.0.1 --port 3000`. For production audit use `npm run build` then `npm run start -- --hostname 127.0.0.1 --port 3000`. Existing local Playwright modules are absent; use the enabled browser controls/manual inspector, with the same pass/fail oracles. Starting the server alone does not satisfy any case.

For each representative route, test 375, 768, 1024 and 1440px, light and dark, Tab/Shift+Tab/Esc and reduced-motion. Authenticate through real seeded role accounts; do not fake credentials or add production fixtures.

| Case | Routes | Pass/fail oracle | AC |
|---|---|---|---|
| UI-1 landing/theme | / | Solid warm surfaces, tomato CTA, no glass/gradient, no decorative green; heading Quicksand and body Nunito after document.fonts.ready; inspect the actual loaded font faces with Vietnamese diacritics, not just fallback family text | 2–7,10 |
| UI-2 auth/form | /login, /register, /forgot-password, /reset-password | Editable inputs' bounding heights 44–48px; 1.5px borders and visible labels; keyboard focus clear; independent password toggles, autocomplete/name/disabled behavior unchanged. No placeholders as sole labels | 3,6,7,9,10 |
| UI-3 operator shell | /console, /branches, /memberships, /roles, /inventory/shelves | Light sidebar surface/ink/muted; warm dark counterpart; active tint/ink and tomato indicator; aria-current page; collapse and keyboard navigation unchanged. Text contrast checked against actual adjacent computed background; no opacity shortcut | 5–10 |
| UI-4 business surfaces | /products, /products/[seeded-id], /cart, /orders, /me, /production/targets, /production/orders, /production/qc | One primary tomato CTA; success green only indicator plus readable label; loading/empty/error/success distinct for changed data views; totals and submissions behave as before | 4–7,9,10 |
| UI-5 traceability/modal | /traceability/[seeded-code], accessible product-create/QC/session-timeout dialogs | No gradient trace banner; solid modal scrim and surfaces; focus trap, dismissal policy, Esc and return-focus unchanged; loading/error/status text readable | 5–7,9,10 |
| UI-6 role shells | /platform and /company with authorized seeded accounts | Shared light/dark sidebar colours/font behavior correct; navigation/role visibility unchanged; preserve emergency break-glass authorization terminology and actions | 3,5–10 |
| UI-7 performance/runtime | /, /login, /console, representative changed data routes above | 0 browser console errors and 0 HTTP ≥500; no horizontal viewport overflow; Lighthouse accessibility ≥90 and mobile LCP ≤2.5s; next build First Load JS ≤200kB per route | 10 |

Measure normal text contrast ≥4.5:1 from computed/composited colours, including placeholders, badge labels, link/hover/destructive variants. For info on light tint, require ink label + info indicator rather than blue text (4.39:1 fails). Light primary as small text on cream also fails; require primary-hover role. Interactive border/focus contrasts ≥3:1. Surface/ink sidebar ratios are specified in plan.md.

When a future case fails, record route/role/theme/viewport/state and actual expected-versus-observed measurement in errors.md, amend the plan if a new file is needed, then fix under an authorized implementation phase. Do not create delivery receipts or screenshot files during PLAN ONLY; no future evidence path is implied to be authorized by this protocol.
