# Known errors / unresolved prerequisites

| Finding | Observed evidence | Treatment |
|---|---|---|
| Missing UI standard | Initial cat: `.../platform-docs/standards/ui-ux.md: No such file or directory`; standards inventory has frontend.md but no ui-ux.md | Record gap; no new standard outside allowed outputs. Recover and read before cook if provided. |
| Brand doc contradicts requested fonts/sidebar | v4 lines 72–74,88,100 choose Noto Serif/Be Vietnam Pro and dark sidebar | Current explicit prompt overrides; documented in plan. No hidden source-document edit. |
| No hero glass exception | v4 lines 86–87 prohibit all glass and gradients | Gate rejects blur/gradient everywhere, including arbitrary CSS syntax. |
| Generated-token drift | Actual uigen check: `ERROR portal/app/tokens.generated.css drift, run uigen.py tokens --write` | Future update JSON then regenerate together; no live generation this turn. |
| Unrelated operations drift | Actual uigen check: `ERROR portal/lib/contracts/operations.generated.ts drift, run uigen.py operations --write` | Separate ownership; no edit/regeneration here. Full integration check cannot be called passing until resolved. |
| Portal startup blocked | Isolated `npm run dev -- --hostname 127.0.0.1 --port 3199`: listen EPERM, errno -1 | Sandbox cannot bind. No HTTP/font/visual/Lighthouse evidence; rerun later outside restricted runtime. |
| Missing local browser runner | node resolve: @playwright/test and playwright MISSING | Use enabled browser tooling/manual protocol later; no install/package edits during planning. |
| Skill's initial stack search empty | nextjs tailwind --stack nextjs: Found 0 results | One retry font optimization returned next/font/layout guidelines. Original empty match retained honestly. |
| No exact requested font pair returned | Quicksand Nunito query and rounded friendly retry returned other pairs | Prompt-selected pair; do not attribute it to a matching skill record. |
| Brand contrast example differs from table | Dark info example #B9D0F2 vs token-table #8DB8E8, v4 line 46 | Table wins; compute #8DB8E8/bg as 8.57:1. |
| Two invalid text/background uses | Computed light primary/bg 4.33:1, primary/tint 3.89:1; info/tint 4.39:1 | Primary-hover text links; ink text on info-tint badges. Retain exact approved source hexes. |
| Chrome source/output mismatch | Source tokens.json has no chrome; shell-generated CSS does | Resolve after shell handoff; preserve any actual new source key, otherwise use existing aliases. Never hand-edit CSS. |
| Harness shape unresolved | hs-run plan next exited 0 but state unresolved: no phases/phase-*.md | Requested file boundary excludes scaffold, graph and receipt files. No claim of completed harness approval. |
| Implementation checks pending | npm test/lint/typecheck/archcheck/build were not run | These are mandatory future slice gates, not current planning passes. |
| Cross-repo token edit unavailable here | platform-docs is outside current writable project roots | Needs authorized writable checkout before implementation; plan-only cannot solve it by modifying sibling repo. |

The full gate is expected to return 1 on the old brand. `baseline-brand-gate.txt` is a probe transcript, not debt allowance. The positive fixture and nine mutants passed; runtime UI acceptance remains pending.

During gate development, the first positive fixture rejected light info/tint at 4.39:1; the final plan prohibits that pairing and checks allowed ink text instead. An early broad glass regex incorrectly matched business break-glass variables. The final gate checks visual string/selector uses and preserves business terminology, with a positive regression fixture. These fixes did not waive old brand or gradient/blur checks.

## S9 Anti kit Fix 2 — observed run 1 / plan deviation for Dawn

Run 1: runner exit **126**; Lighthouse `Permission denied` from `anti/out/npm-cache` on NTFS. Build actually compiled (Next 16.3.0 Turbopack) and emitted route table, but no `First Load JS` column; server warned `next start` incompatible with `output: standalone`. Grader reported **31 errors**, **16/56 BLOCKED**; claimed 40 PASS cells were not reliable: duplicate UI-2/3/4/7 screenshot hashes and authenticated UI-4-dark-1024 login screenshot. Preserved first run as archived evidence; never feed it to new brief/grader.

**Plan deviation (Dawn):** replace unavailable Turbopack First Load JS source with Lighthouse `resource-summary` script `transferSize`, ceiling **200000 bytes (200 kB)** per audited route/form; record `total-byte-weight` separately. This measures transferred scripts rather than First Load JS; do not call the two equivalent. Keep `Compiled successfully` + required route table as independent build proof. User explicitly authorized this kit change; root plan unchanged under requested write boundary.

Fix runner cache to external executable filesystem, temp Brave profile, standalone server with copied static/public outputs; retain tracked diff check. Require every non-BLOCKED cell final_urls + screenshot_url, authenticate and verify URL/heading before each authenticated cell, re-login on redirect within one runner run. Current environment only auth/org/customer/integration/notification plus VT-21: sales/inventory/production and seeded customer/employee/platform-admin/company-owner accounts, product id and trace code are Dawn prerequisites. Missing prerequisites legitimately BLOCKED; no new browser acceptance claimed by this kit fix.

Fix 2 focused verification: extended fixtures first returned **11/14 FAIL** (missing script-size, authenticated URL, and final_urls checks). Final `python3 -B anti/anti_check.py --self-test`: **15/15 PASS**, exit 0; `bash -n anti/anti.sh`: exit 0. Temp-copy mutations: remove login checks → **13/15 FAIL**, exit 1; remove script-size ceiling → **14/15 FAIL**, exit 1. **Killed/total 2/2**. Full output: `anti/fix2-validation.txt`. `git check-ignore anti/accounts.local.md` confirms exclusion. Only allowed kit files and this append changed; no live run or S9 PASS asserted.

## S9 run 4 (Anti, 2026-10-04 08:38–08:53Z) — observed result + Dawn decision

Runner Fix 3 (phases `start|lighthouse|stop`, `node --env-file`, BFF login-200 check, cookie session for /console): runner self-test **8/8**, grader self-test **15/15**, mutation "drop login-200 check" → **7/8 FAIL (KILLED)**. Evidence: `anti/fix3-validation.txt`; runs 1–3 archived in `anti/out-run{1,2,3}/`.

Run 4 (`anti/out/`, run.json exit_code 0): independent grader `VERDICT: FAIL errors=4 blocked=0`. **UI cells 56/56 PASS, 56 shots, 6/6 Lighthouse files.** All 4 errors are lab performance (Lighthouse 13.5.0, `throttlingMethod=simulate`):

| file | LCP sim ms | LCP observed ms | perf | a11y | script KiB | rule broken |
|---|---|---|---|---|---|---|
| lh-home-mobile | 3616 | 174 | 0.90 | 1.00 | 182 | LCP > 2500 |
| lh-login-mobile | 3076 | 100 | 0.91 | 1.00 | 186 | LCP > 2500 |
| lh-console-mobile | 4080 | 248 | 0.62 | 0.98 | 199 (204 kB) | script > 200 kB (LCP > 2500 also, grader stops at first error) |
| lh-console-desktop | 819 | — | 1.00 | 0.98 | 199 (204 kB) | script > 200 kB |
| lh-home/login-desktop | 1083 / 622 | — | 0.98 / 1.00 | 1.00 | 182 / 186 | — |

Cause (bytes, not CPU: TTFB 4–8 ms, TBT 10–20 ms): home + login load 4 raw Unsplash images 830 KiB (hero `w=1400&q=85` 383 KiB, priority High, no `next/image`/`sizes`; login does not need them); 6 font files 150 KiB (4 preloaded); shared JS chunks 70 + 42 KiB; console sidebar RSC-prefetches ~13 routes ×2; CSS render-blocking ~300 ms.

Other S9 gates: full `B` (no `--scan-path`) **0 errors**; TC-8 `uigen.py check --root ..` → token OK, **1 error `operations.generated.ts` drift** (pre-existing, plan forbids regenerating unrelated operations; tracked as debt).

**Dawn decision 2026-10-04:** "web như thế được rồi, sau a tối ưu hiệu năng sau" — UI accepted; the 4 lab-performance failures are waived for this task and moved to `ticket/.aidlc/planning/debt.md` **D-138** (perf) and **D-139** (operations drift). This is a recorded exemption, not a PASS of AC-10 performance.

## Error codes (gate/grader/runner rejection kinds, used by badcases.md)
- BRAND_RAW_PALETTE
- BRAND_FONT
- BRAND_GLASS_GRADIENT
- TOKEN_DRIFT
- CONTRAST_LOW
- EVIDENCE_MISSING
- EVIDENCE_INVALID
- EVIDENCE_REPLAY
- AUTH_REDIRECT_LOGIN
- PERF_BUDGET
- RUNNER_BLOCKED
