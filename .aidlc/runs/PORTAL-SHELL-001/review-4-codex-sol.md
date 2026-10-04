# Independent re-review #4 — PORTAL-SHELL-001

Verdict: **BLOCKED**

Reviewer: Codex; independent of implementation, `in-place:true`. Read review-3, coordinator decision, review-fix §S15–S16, and plan AC-6/S15/S16. Restricted `git diff` to the listed S15–S16 paths; inspected the untracked `app/layout-gate.test.ts` directly. Concurrent rebrand files assessed only where they break this run’s gates.

## Confirmed findings

1. **MEDIUM — A status-color Button override remains and the detector misses it.** `components/modals/session-timeout-modal.tsx:127` retains `hover:text-rose-600` on “Đăng nhập bằng tài khoản khác”. This overrides the shared ghost styling with a bespoke status color, contrary to FR-6 and the requested zero status-color overrides. `app/layout-gate.test.ts:42` only detects `bg-`, `rounded`, numeric `h-`, and `px-`; the filesystem Button assertion therefore passes despite this remaining override. Remove the palette override and cover status-color overrides through the actual detector. This is pre-existing code left behind by the cleanup, not a newly introduced handler regression.

2. **MEDIUM — Concurrent rebrand changes break the Shell acceptance gate.** `app/layout-gate.test.ts:79` requires the backdrop-blur file set to equal `["components/ui/dialog.tsx"]`, but the current dialog contains no backdrop-blur. Baseline and restored full suites both fail this assertion. The concurrent `app/rebrand.test.ts:90` expressly forbids backdrop-blur in that same dialog, so the two gates currently demand incompatible behavior. Reconcile the approved contracts and assertions before accepting this combined working tree. This blocker comes from concurrent PORTAL-REBRAND S3, not the S15–S16 Button replacements.

## Verified

- All 15 previously reported bg/radius/height/padding overrides are removed. Independent AST traversal of **121 Button elements / 28 className attributes**, plus multiline `rg`, found **zero** bg-/rounded/numeric-height/px-/gradient overrides and **one** status-color override (finding #1). Other palette colors found in modal content/icons are not Button className overrides.
- Disposal and suspension use destructive; secondary/cancel/close actions use outline; confirm/submit actions use default (primary). Scoped diff and source inspection found no lost labels, aria, disabled/loading states, types or handlers, and no additional S15–S16 regression. The session identity defaults changed earlier in the cumulative diff remain generic fallbacks.
- The gate scans components/. Its app/features/components fixtures call the same `buttonOverrideFiles` filter and `hasButtonOverride` detector as the filesystem assertion. They are not tautological; M-k independently confirms the scope fixture catches filter regression.

## Independent execution

Scratch: `/tmp/portal-review-4-sol-36s5gon9/portal`; created with `cp -r`, excluding node_modules/.next/.aidlc/.git and compiler cache; repository node_modules and sibling platform-docs symlinked. Every test run used full `npm test` with `ESBUILD_BINARY_PATH=/home/dawn/.local/share/esbuild/esbuild-0.21.5`.

| Check | Result |
|---|---|
| Baseline and restored baseline | FAIL, exit 1; 37 files passed / 1 failed; 274 tests passed / 1 failed (dialog gate only) |
| M-j: add rounded-xl to allergen Button | KILLED; new filesystem Button assertion failure names allergen-warning-modal.tsx; 273 passed / 2 failed, exit 1 |
| M-k: remove components/ from real filter | KILLED; new components/modals/fixture.tsx scope assertion failure; 273 passed / 2 failed, exit 1 |
| npm run lint | PASS, exit 0 |
| Read-only hs-cli gates on scratch | Completed, exit 0; policy inventory, not acceptance proof |

Mutations killed **2/2**, demonstrated by additional targeted assertion failures beyond the known baseline failure. All scratch mutations restored. Logs: `/tmp/portal-review-4-{baseline,M-j,M-k,restored,lint,harness,audit}.log`; results: `/tmp/portal-review-4-results.json`.

Graph discovery/coverage calls were denied by tool policy; direct source inspection used. No browser/backend verification performed. Hash checks confirm all nine scoped repository source/test files unchanged. This report is the only repository write.
