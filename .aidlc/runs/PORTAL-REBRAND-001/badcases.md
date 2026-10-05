# Bad cases — PORTAL-REBRAND-001

UI rebrand task: bad cases are the negative fixtures of the brand gate (`check-brand.py --self-test`), the S9 grader (`anti_check.py --self-test`) and the runner (`anti_runner_selftest.py`). Each must be rejected; all ran in `sdlc.py verify` (logs in `artifacts/logs/`).

| id | category | derived from | expected | test |
|---|---|---|---|---|
| BC-1 | missing_field | UI cell recorded PASS | EVIDENCE_MISSING | reject missing cell |
| BC-2 | missing_field | PASS cell with measurements | EVIDENCE_MISSING | reject PASS without measurements |
| BC-3 | missing_field | authenticated cell final URLs | EVIDENCE_MISSING | reject missing final_urls |
| BC-4 | wrong_type | screenshot at viewport width | EVIDENCE_INVALID | reject wrong-width PNG |
| BC-5 | wrong_type | build log with route table | EVIDENCE_INVALID | reject build without route table |
| BC-6 | wrong_type | v4 palette source | BRAND_RAW_PALETTE | M1 old green hex -> red scan |
| BC-7 | wrong_type | Quicksand + Nunito | BRAND_FONT | M2 old font -> red scan |
| BC-8 | wrong_type | solid dialog surface | BRAND_GLASS_GRADIENT | M3 dialog blur -> red scan |
| BC-9 | wrong_type | generated tokens CSS | TOKEN_DRIFT | M7 generated CSS edit -> red drift |
| BC-10 | boundary | text contrast ≥ 4.5 | CONTRAST_LOW | reject contrast 4.3 |
| BC-11 | boundary | body text contrast | CONTRAST_LOW | M9 pale body text -> red contrast |
| BC-12 | boundary | Lighthouse a11y ≥ 0.90 | PERF_BUDGET | reject LH a11y 0.89 |
| BC-13 | boundary | mobile LCP ≤ 2500 ms | PERF_BUDGET | reject mobile LCP 2501 |
| BC-14 | boundary | script ≤ 200 kB | PERF_BUDGET | reject LH script 210 kB |
| BC-15 | authz | authenticated cell stays on /console | AUTH_REDIRECT_LOGIN | reject authenticated final_url /login |
| BC-16 | authz | authenticated screenshot | AUTH_REDIRECT_LOGIN | reject authenticated screenshot /login |
| BC-17 | authz | console Lighthouse with real session | AUTH_REDIRECT_LOGIN | runner console redirect |
| BC-18 | authz | BFF login 200 before run | RUNNER_BLOCKED | runner login 500 |
| BC-19 | replay | Lighthouse inside run window | EVIDENCE_REPLAY | reject LH fetchTime outside window |
| BC-20 | replay | one screenshot per cell | EVIDENCE_REPLAY | reject duplicate screenshot |
| BC-21 | replay | one run per out/ | EVIDENCE_REPLAY | runner existing run |
| BC-22 | tenant | — | N/A: rebrand changes styling only; no query, BFF route, org scope or tenant filter changed (handlers/data flow asserted unchanged in app/rebrand.test.ts) | N/A |
| BC-23 | expired_token | — | N/A: no token/session code changed; session-timeout modal only restyled + label association, its behaviour tests unchanged in npm test | N/A |
