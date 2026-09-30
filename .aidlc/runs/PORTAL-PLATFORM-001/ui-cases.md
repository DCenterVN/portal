# Platform UI evidence cases

Runner: Claude with isolated dev stack, seeded staff/OWNER fixtures, Chrome and Lighthouse installed. Evidence output: `.aidlc/runs/PORTAL-PLATFORM-001/evidence/`. Captures are real browser screenshots, never generated or resized.

| route | state | desktop 1440 | mobile 390 |
|---|---|---|---|
| `/platform/companies` | loading, empty, error, success | `companies-{state}-1440.png` | `companies-{state}-390.png` |
| `/platform/companies/:main` | loading, empty, error, success | `company-{state}-1440.png` | `company-{state}-390.png` |
| `/platform/companies/:main/role-matrix` | loading, empty, error, success | `matrix-{state}-1440.png` | `matrix-{state}-390.png` |
| `/platform/support-access` | loading, empty, error, success | `support-{state}-1440.png` | `support-{state}-390.png` |
| `/platform/staff` | loading, empty, error, success | `staff-{state}-1440.png` | `staff-{state}-390.png` |
| `/platform/audit` | loading, empty, error, success | `audit-{state}-1440.png` | `audit-{state}-390.png` |
| `/company?org_id=:main` | loading, empty, error, success | `my-company-{state}-1440.png` | `my-company-{state}-390.png` |
| `/company/support-access?org_id=:main` | loading, empty, error, success | `company-support-{state}-1440.png` | `company-support-{state}-390.png` |

Additional captures: onboard form validation/success, CORE locked and other module change/error, matrix edit/409, break-glass confirm/409 copy, last-admin 409 exact copy, consent unknown/saved/error, OWNER approve/revoke/409, audit filter, customer denied, 503 fail-closed. Add `data` anonymized fixture manifest, Lighthouse JSON/HAR per plan; no real PII/token.

For each route: repeat at desktop width 1440 and mobile width 390; load each state from controlled fixture/API response; confirm keyboard tab/focus and light/dark; measure interactive control height ≥44 CSS px. Healthy screenshots must show no console errors and no 5xx. Error-state screenshots use isolated fault injection and record the injected status.
