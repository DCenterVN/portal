# Independent re-review #5 — PORTAL-SHELL-001

Verdict: **PASS**

Reviewer: Codex; independent of implementation, `in-place:true`. Read review-4, review-fix §S15-S16/§Fix-4, and plan AC-6/S15/S16. Restricted `git diff` to the files listed in those fix sections; inspected the untracked `app/layout-gate.test.ts` directly. Applied the coordinator ruling: brand has no glass; allowed blur set is empty. Concurrent PORTAL-REBRAND S3 files considered only for gate compatibility.

**Confirmed defects: none.**

## Verified

- Finding #1 fixed: independent TypeScript AST traversal of 173 non-test source files in app/features/components found 121 Button elements and 28 className attributes. Inspected every attribute and cross-checked with multiline grep: zero bg-, rounded, numeric h-, px-, gradient or palette/status-color overrides. The session timeout logout Button no longer has `hover:text-rose-600`; its label, ghost variant and onLogout handler remain.
- Disposal/suspension use destructive; secondary/cancel/close use outline; confirm/submit use default (primary). AST-normalized comparison against HEAD for all eight scoped components, removing only Button className/variant/size and accounting for the earlier generic session identity defaults, is identical. No lost labels, aria, disabled/loading states, types or handlers; no new S15-S16 regression found.
- `app/layout-gate.test.ts:58` includes components/ in the real filter. Scope fixtures at line 108 call that same filter and detector; callback, expression, template, palette and hex fixtures exercise the real AST detector. M-k demonstrates that the components fixture fails when actual filtering regresses, so it is not tautological.
- Finding #2 fixed: the filesystem blur assertion at `app/layout-gate.test.ts:78` expects an empty set. Both Shell and concurrent rebrand gates pass together; M-m proves the Shell gate itself rejects dialog blur.

## Independent execution

Scratch: `/tmp/portal-review-5-sol-d7szdlhb/portal`; source/config copied with `cp -r`, excluding node_modules/.next/.aidlc/.git and compiler cache; repository node_modules and sibling platform-docs symlinked. All baseline, mutation and restoration runs used full `npm test` with `ESBUILD_BINARY_PATH=/home/dawn/.local/share/esbuild/esbuild-0.21.5`. Each mutation was restored before the next.

| Check | Result |
|---|---|
| Baseline and restored baseline | PASS, exit 0; 38 files / 292 tests |
| M-j: rounded-xl on allergen Button | KILLED, exit 1; real Button gate names allergen-warning-modal.tsx; 291 passed / 1 failed |
| M-k: remove components/ from real filter | KILLED, exit 1; components/modals/fixture.tsx scope assertion fails; 291 passed / 1 failed |
| M-l: hover:text-rose-600 on session logout Button | KILLED, exit 1; real Button gate names session-timeout-modal.tsx; 291 passed / 1 failed |
| M-m: backdrop-blur-sm on scratch standard dialog backdrop | KILLED, exit 1; real empty-set blur gate names dialog.tsx, plus three rebrand assertions fail; 288 passed / 4 failed |
| npm run lint | PASS, exit 0; no diagnostics |
| npm run typecheck | PASS, exit 0; no diagnostics |
| Repository archcheck | Exit 1; 81 violations, 81 baselined, 0 new, 2 stale: FE-09/FE-11 dialog.tsx. Acknowledged S3 debt cleanup, not a defect per coordinator |
| hs-cli gates on scratch | Exit 0; policy inventory, not acceptance proof |

Mutations killed **4/4**, through assertion failures rather than infrastructure errors. An initial M-m insertion selector did not match the current tokenized scrim; no mutation was applied in that attempt. Corrected insertion and full-suite execution produced the result above.

Evidence: `/tmp/portal-review-5-{baseline,M-j,M-k,M-l,M-m,restored,lint,typecheck,harness,audit}.log`; structured exits: `/tmp/portal-review-5-results.json`. Graph search/coverage were unavailable under tool approval policy; exhaustive direct source inspection used. No browser/backend verification performed.

All nine scoped repository source/test files match the restored scratch snapshot by SHA-256. This report is the only repository write; no approval, receipt, ACTIVE, staging, commit or concurrent source edits.
