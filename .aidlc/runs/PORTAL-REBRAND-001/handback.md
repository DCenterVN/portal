## Done
- S1–S9 PORTAL-REBRAND-001: Bếp Tươi brand (đỏ cà chua, Quicksand + Nunito, sidebar sáng, không glass ngoài hero) applied through role tokens from `../platform-docs/ui/tokens.json` → `app/tokens.generated.css`; one primary CTA per view; no raw palette/gradient/blur outside allowed surfaces.
- Restyled shared UI (button, input, dialog, badge, toast), console sidebar, modals, login form, profile and 15 feature views without changing props, handlers, labels, aria or data flow.
- Brand gate `testkit/check-brand.py` (B) + self-test; S9 browser acceptance kit `anti/` (runner `anti.sh start|lighthouse|stop`, grader `anti_check.py`, runner self-test `anti_runner_selftest.py`).
- Review fix (codex review #1 PASS_WITH_RISK, 2 findings): status filter selected state = `secondary` + aria-hidden `Check` + `aria-pressed` (was `ghost`, ~1.08:1); `useId`/`htmlFor` for UOM select, PIN input, QC temperature inputs. Round 2 replaced a wrong `destructive` choice.

## Files changed
- ../platform-docs/ui/tokens.json
- app/tokens.generated.css
- app/globals.css
- app/rebrand.test.ts
- app/layout.tsx
- app/icon.svg
- public/manifest.json
- components/ui/button.tsx
- components/ui/input.tsx
- components/ui/dialog.tsx
- components/ui/badge.tsx
- components/ui/toast.tsx
- components/layout/console-sidebar.tsx
- components/modals/confirm-qc-decision-modal.tsx
- components/modals/session-timeout-modal.tsx
- components/auth/login-form.tsx
- app/(store)/me/profile-client.tsx
- features/branches/branches-view.tsx
- features/memberships/memberships-view.tsx
- features/inventory/shelves-view.tsx
- features/roles/roles-view.tsx
- features/production/orders-view.tsx
- features/production/qc-view.tsx
- features/production/targets-view.tsx
- features/products/cart-view.tsx
- features/products/orders-view.tsx
- features/products/product-create-dialog.tsx
- features/products/product-detail-view.tsx
- features/products/products-view.tsx
- features/traceability/trace-view.tsx

## Decisions
- Dawn 4/10: "web như thế được rồi, sau a tối ưu hiệu năng sau" — S9 lab-performance failures waived for this task (recorded exemption, not an AC-10 PASS): mobile LCP home 3616 / login 3076 / console 4080 ms, /console script 204 kB. Moved to `ticket/.aidlc/planning/debt.md` D-138 (root cause: 830 KiB raw Unsplash images incl. login, 150 KiB fonts, shared chunks, sidebar prefetch).
- `operations.generated.ts` drift (TC-8, pre-existing) not regenerated per plan → D-139.
- S9 lab metric: Lighthouse `resource-summary` script transferSize ≤ 200 kB replaces Turbopack First Load JS (Dawn deviation, `testkit/errors.md` Fix 2).

## Left over
- D-138 performance, D-139 operations drift (debt ledger).
- Pending Dawn: login brand name "Việt Sạch" vs "Bếp Tươi"; 4 proposed debt rows from the S9 handoff (dev-infra platform-go version skew, Antigravity guard stub, Tailwind scanning `.aidlc/`).
- Commit/push and the joint Shell+Rebrand PR are Dawn's (branch `portal-shell-platform-wip`, local commits 18e9edb, 53a8e16 + this uncommitted review fix).

## Verification
- Tier 1: verify 2026-10-04 after review fix round 2 — brand gate full repo 0 errors, gate self-test, runner self-test 8/8, grader self-test 15/15, lint, typecheck, `npm test` 364/364, arch PASS (`artifacts/verification.json`).
- S9 Anti run 4 (`anti/out/`): UI cells 56/56 PASS, 56 shots, 6/6 Lighthouse; grader `FAIL errors=4 blocked=0`, all 4 = waived lab performance (above). Runs 1–3 archived (`anti/out-run{1,2,3}/`).
- Tier 2: mutation S2–S8 3/3 each (s2..s8-report.md), review fix 3/3 + round 2 1/1 (`review-fix-report.md`), runner login-200 mutation killed; review #1 `review-1-codex-sol.md` (fixed), review #2 `review-2-codex-sol.md`.
- Tier 3: evaluated by `gate pr`.
