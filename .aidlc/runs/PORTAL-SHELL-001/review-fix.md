# PORTAL-SHELL-001 review fixes — PASS

Verdict: **PASS for the coordinator-authorized review fixes**. All four requested gates pass; acceptance mutations killed **6/6**. This report is evidence, not an approval or receipt.

## Findings and coordinator decision

1. Store session reads `display_name`; its regression test uses a complete, typed `UserProfile`.
2. Removed unused `Building2` from the store page. Fixed `no-useless-escape` in the mock-import gate regex.
3. Kept AC-1(a/b/c) and relative mock import detection. Finished negative fixture verification inside `app/layout-gate.test.ts`: unassigned route, misleading shell-root prefix, shell import from a page, shell subpath import from a view, and legacy navbar import. Eleven positive fixtures cover the five roots and six allowed shell-import locations.
4. **Coordinator-directed revert:** removed only the Button AST detector and its two strengthening-specific fixture cases. Restored the exact pre-session Button regex from the previous session evidence: `/<Button(?:(?!>).)*className\s*=\s*"[^"]*(?:bg-|rounded|h-[0-9]|px-)/s`. The file is untracked here, so Git has no original diff. Retained TypeScript AST inspection for workspace landmarks. Neither roles-view nor memberships-view was edited.
5. Console navigation includes branches, memberships and roles; every href is checked against its actual console `page.tsx`.
6. Gate, CompanyPicker and Suspense fallback retain `main#main`; sidebar navigation retains its accessible label.
7. Store preserves 401 guest handling and rejects service/network/JSON failures. Console distinguishes 401, reports failures, and retains the profile on context failure. Corrected all three TS2345 mocks using `vi.fn<typeof fetch>()` with `String(url)`; no `any`.
8. Removed the hard-coded live-status export and its shell prop.
9. Both store JSON-LD scripts escape `<`; the regression also verifies JSON data round-trips.

## Red → green evidence

Previous session full-suite red evidence, retained:

```text
/tmp/portal-shell-red.log
Test Files  4 failed | 33 passed (37)
     Tests  18 failed | 203 passed (221)

/tmp/portal-shell-red-gates.log
Test Files  4 failed | 33 passed (37)
     Tests  21 failed | 203 passed (224)
```

The accidental initial scan of `components/ui/page.tsx` was corrected to app pages; that failure is not behavior evidence.

AC-1 fixture verification: on the scratch copy, replacing the shared boundary detector with `return false` made all five negative fixtures fail. Full-suite log: `/tmp/portal-shell-ac1-negative-red.log`.

```text
Test Files  1 failed | 36 passed (37)
     Tests  5 failed | 233 passed (238)
```

Restoring the detector returns the full scratch suite to 37 files / 238 tests passing (`/tmp/portal-shell-scratch-restored.log`). The repository suite also passes below.

## Gate tails

All test runs used `ESBUILD_BINARY_PATH=/home/dawn/.local/share/esbuild/esbuild-0.21.5`. npm only; full suites only.

`npm test` — PASS, exit 0 (`/tmp/portal-shell-resume-test.log`):

```text
 Test Files  37 passed (37)
      Tests  238 passed (238)
   Start at  07:58:33
   Duration  4.03s (transform 4.51s, setup 0ms, collect 20.14s, tests 2.28s, environment 6ms, prepare 22.55s)
```

`npm run lint` — PASS, exit 0; 0 errors / 0 warnings (`/tmp/portal-shell-resume-lint.log`):

```text
> @dcentervn/portal@0.1.0 lint
> node node_modules/eslint/bin/eslint.js .
```

`rm -rf .next/types .next/dev/types && npm run typecheck` — PASS, exit 0; 0 diagnostics (`/tmp/portal-shell-resume-typecheck.log`):

```text
> @dcentervn/portal@0.1.0 typecheck
> node node_modules/typescript/bin/tsc --noEmit
```

`python3 ~/agent_skills/sdlc/engine/archcheck.py` — PASS, exit 0 (`/tmp/portal-shell-resume-arch.log`):

```text
archcheck: 83 violations, 83 baselined, 0 new, 0 stale
```

## Mutation table

Scratch copy: `/tmp/portal-shell-review-oxa8djuy`, outside the repository. Copied top-level entries with `cp -r`, excluding `node_modules`, `.git` and `.next`; symlinked repository `node_modules`. Baseline passed 37 files / 238 tests. Each mutant ran its own full `npm test`; originals were restored between mutants. Every mutant exited 1 with an assertion failure, not an infrastructure failure.

| Mutant | Result | Failing test name | Full-suite counts |
|---|---|---|---|
| M-a: store reads payload.name | KILLED | store session > uses the name returned by the session endpoint | 1 file / 1 test failed; 36 files / 237 tests passed |
| M-b: 5xx becomes guest/signed-out in store and console | KILLED | store session > rejects 5xx instead of presenting a guest; console failure distinctions and navigation > keeps the profile when context has 5xx; console failure distinctions and navigation > reports profile HTTP 503 or malformed JSON as an error | 2 files / 3 tests failed; 35 files / 235 tests passed |
| M-c: CONSOLE_NAV href /missing-review-route lacks page.tsx | KILLED | console failure distinctions and navigation > TC-5: every console nav href has a page | 1 file / 1 test failed; 36 files / 237 tests passed |
| M-d: workspace Gate renders div instead of main | KILLED | review regression gates > gives Gate, CompanyPicker and Suspense fallback main landmarks | 1 file / 1 test failed; 36 files / 237 tests passed |
| M-e: sidebar nav drops aria-label | KILLED | review regression gates > labels the console sidebar navigation landmark | 1 file / 1 test failed; 36 files / 237 tests passed |
| M-f: both JSON-LD scripts stop escaping < | KILLED | escapes less-than in both JSON-LD scripts while preserving data | 1 file / 1 test failed; 36 files / 237 tests passed |

Killed/total: **6/6**; executed: **6**. Every suite contained 37 files / 238 tests. Logs: `/tmp/portal-shell-M-a.log` through `/tmp/portal-shell-M-f.log`; structured results: `/tmp/portal-shell-mutations.json`.

## Left over

- Button overrides at `features/roles/roles-view.tsx:430,478` and `features/memberships/memberships-view.tsx:123` → handed to **PORTAL-REBRAND-001 (Button variants rewrite)**. The pre-session regex retains its callback/JSX-expression detection limitations by coordinator decision.
- No remaining blocker within this authorized review-fix scope.

## Files changed

Combined review-fix changes, including the previous session's retained work; one path per bullet:

- features/store/store-frame.tsx
- features/store/store-frame.test.ts
- features/console/console-frame.tsx
- features/console/console-frame.test.ts
- app/layout-gate.test.ts
- app/(store)/page.tsx
- app/(store)/layout.tsx
- app/(store)/layout.test.ts
- features/platform/workspace.tsx
- components/layout/console-sidebar.tsx
- mocks/console.ts
- .aidlc/runs/PORTAL-SHELL-001/review-fix.md

This continuation edited only `app/layout-gate.test.ts`, `features/console/console-frame.test.ts`, and this report. All are inside plan.md “Files planned”. No staging, commit, approval, receipt, ACTIVE edit, or PORTAL-BASE-UI-001 / PORTAL-REBRAND-001 run edit was performed. Protected-file hash comparison found no differences.

## S14

**PASS — findings #1 and #2 fixed; all four gates pass; mutations killed 3/3.** Evidence only, no approval or receipt.

### Findings and scope

- #1: Both frames accept a valid 200 profile with `display_name: ""`. The account label falls back to its email; console retains the email detail, including when context loading fails. Tests use typed `UserProfile` fixtures with all auth DTO fields, including nullable `avatar_key`/`avatar_url` via a local intersection because the existing client type omits those fields. Named profiles and the required 401-versus-other-failure distinction remain covered.
- #2: The shared filesystem gate now parses TSX with the installed TypeScript AST. It inspects Button `className` string literals and JSX expressions for `bg-`, `rounded`, `h-<n>` and `px-`, regardless of preceding callbacks. Negative fixtures cover callbacks, quoted JSX expressions and template literals; positive fixtures protect allowed props/classes, other components and source text containing JSX.
- Removed all five memberships and both roles overrides using existing Button props: primary/sm invite, outline/sm suspend/activate/cancel, destructive/sm revoke, ghost/sm group toggle and ghost/icon permission toggle. No new variants needed.
- Roles approval was initially stale. `status --task PORTAL-SHELL-001` is unsupported by this installed engine, so the requested mtime comparison was used. Roles stayed untouched until approval became newer: plan `2026-10-04T01:10:16.906256Z`, approval `2026-10-04T01:13:29.963921Z`. The timestamp condition was asserted immediately before editing roles.
- Finding #3 declined: no four-way failure model added. No staging, commit, approval, receipt or ACTIVE write performed. Hash comparison: ACTIVE plus 429 other-run files unchanged. Concurrent coordinator updates to this run's approval/state/trace were preserved.

### Red evidence

Tests were added before changing frame behavior or restoring the AST detector. Full `npm test`, exit 1 (`/tmp/portal-S14-red.log`):

```text
 Test Files  3 failed | 34 passed (37)
      Tests  11 failed | 242 passed (253)
```

Five failures reproduce valid empty-name profile rejection/email loss; six expose detector false negatives or its source-text false positive. After the fixes, before roles approval arrived, the only remaining failure named `features/roles/roles-view.tsx`. After the timestamp gate opened and roles were fixed, the full suite passed.

### Gate tails and counts

npm only; every test invocation was a full suite. `ESBUILD_BINARY_PATH=/home/dawn/.local/share/esbuild/esbuild-0.21.5` for npm commands.

`npm test` — PASS, exit 0 (`/tmp/portal-S14-test.log`):

```text
 Test Files  37 passed (37)
      Tests  253 passed (253)
   Start at  08:15:10
   Duration  3.32s (transform 3.11s, setup 0ms, collect 16.89s, tests 2.24s, environment 5ms, prepare 19.01s)
```

`npm run lint` — PASS, exit 0; 0 errors / 0 warnings (`/tmp/portal-S14-lint.log`):

```text
> @dcentervn/portal@0.1.0 lint
> node node_modules/eslint/bin/eslint.js .
```

`rm -rf .next/types .next/dev/types && npm run typecheck` — PASS, exit 0; 0 diagnostics (`/tmp/portal-S14-typecheck.log`):

```text
> @dcentervn/portal@0.1.0 typecheck
> node node_modules/typescript/bin/tsc --noEmit
```

`python3 ~/agent_skills/sdlc/engine/archcheck.py` — PASS, exit 0 (`/tmp/portal-S14-arch.log`):

```text
archcheck: 83 violations, 83 baselined, 0 new, 0 stale
```

Read-only `hs-cli gates` ran on scratch, exit 0; no delivery receipt written.

### Mutation table

Scratch: `/tmp/portal-S14-ktvu6478`, outside the repository; copied source/config, excluded `.git`, `.next`, `node_modules`, and symlinked repository dependencies. Final scratch baseline and restored suite: **37 files / 253 tests PASS**, exit 0. Each mutation ran full `npm test` and was restored before the next. Final mutation results below were repeated after roles approval/fix against the green baseline; earlier blocked-baseline runs are not used as acceptance evidence.

| Mutation | Result | Assertion evidence | Full-suite counts |
|---|---|---|---|
| M-g: empty display_name treated as error again in both frames | KILLED, exit 1 | Store empty-name acceptance; console empty-name/email and three context-failure retention tests | 2 files / 5 tests failed; 35 files / 248 tests passed |
| M-h: detector skips className after an earlier => callback | KILLED, exit 1 | Both callback fixtures, rounded-lg and bg-primary, fail | 1 file / 2 tests failed; 36 files / 251 tests passed |
| M-i: re-add rounded-lg to memberships invite Button | KILLED, exit 1 | Filesystem Button gate reports memberships-view.tsx | 1 file / 1 test failed; 36 files / 252 tests passed |

**Killed/total: 3/3; executed: 3.** Logs: `/tmp/portal-S14-M-g.log`, `/tmp/portal-S14-M-h.log`, `/tmp/portal-S14-M-i.log`. Structured results: `/tmp/portal-S14-mutations.json`. Baseline/restoration: `/tmp/portal-S14-scratch-baseline.log`, `/tmp/portal-S14-scratch-restored.log`. Failures were assertions, not infrastructure errors.

### Files changed

This S14 continuation only; one path per bullet:

- features/store/store-frame.tsx
- features/store/store-frame.test.ts
- features/console/console-frame.tsx
- features/console/console-frame.test.ts
- app/layout-gate.test.ts
- features/memberships/memberships-view.tsx
- features/roles/roles-view.tsx
- .aidlc/runs/PORTAL-SHELL-001/review-fix.md

## S15-S16

**PASS — review-3-codex-sol.md finding #1 fixed: 15 Button overrides removed; AST gate covers components/; four gates pass; mutations killed 2/2.** Evidence only, no approval or receipt.

### Approval, scope and choices

First action compared nanosecond mtimes: plan.md = `1791076925637975100`; artifacts/plan-approval.json = `1791077574564624300`. Approval is newer. Read plan S15/S16, review #3 finding #1 and review-fix S14 before editing.

Read the requested ui-ux-pro-max SKILL.md and ran:

```sh
python3 /home/dawn/.claude/plugins/marketplaces/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max/scripts/search.py "modal dialog button hierarchy destructive" --domain ux
```

Result: ux-guidelines.csv, 3 matches; relevant match “Confirmation Dialogs” recommends confirmation before destructive actions. Used only to select existing variants/sizes. `default` is the API's primary variant; default size supplies the shared 44px minimum height. No variant/size API changes.

| File | Action | Variant / size |
|---|---|---|
| components/auth/login-form.tsx | Light Mode / Dark Mode | outline / sm |
| components/auth/login-form.tsx | Vào hệ thống chi nhánh | default / default |
| components/modals/allergen-warning-modal.tsx | Cách ly kệ hàng | outline / default |
| components/modals/allergen-warning-modal.tsx | Chuyển vị trí kho chỉ định | default / default |
| components/modals/cold-chain-violation-modal.tsx | Xem biểu đồ nhiệt chi tiết | outline / default |
| components/modals/cold-chain-violation-modal.tsx | Lập biên bản huỷ lô hàng | destructive / default |
| components/modals/confirm-qc-decision-modal.tsx | Huỷ bỏ | outline / default |
| components/modals/confirm-qc-decision-modal.tsx | Xác nhận nhập kho thương mại | default / default |
| components/modals/invite-member-modal.tsx | Huỷ | outline / default |
| components/modals/invite-member-modal.tsx | Gửi lời mời | default / default |
| components/modals/quantity-variance-modal.tsx | Huỷ | outline / default |
| components/modals/quantity-variance-modal.tsx | Lưu biên bản | default / default |
| components/modals/session-timeout-modal.tsx | Mở khóa tiếp tục | default / default |
| components/modals/supplier-suspension-modal.tsx | Đóng | outline / default |
| components/modals/supplier-suspension-modal.tsx | Xác nhận đình chỉ (SUSPENDED) | destructive / default |

The other session-timeout Button remains unchanged: “Đăng nhập bằng tài khoản khác”, ghost / implicit default. Outline preserves the secondary quarantine/heatmap/cancel/close hierarchy; destructive retains disposal/suspension meaning. Bespoke gradient, emerald success backgrounds, palette red backgrounds, rounded-xl and h-10 cannot be preserved through the selected existing variants; they are replaced by shared primary/destructive styling and shared size/radius. No new variants introduced. Only layout classes remain on the replaced Buttons (w-full, mt-2, gap-2).

Snapshot comparison of all eight components, removing only Button className/variant/size attributes, gives byte-identical source. Thus handlers, labels, aria, types, disabled/loading states and all other source are preserved. Gate helper is shared by the real filesystem assertion and executable app/features/components scope fixtures; M-k proves the components fixture exercises the actual filtering logic.

### Red evidence

Extended the AST gate and scope fixtures first, then ran full `npm test` before replacing any Button overrides. Exit 1; all eight files named; no unrelated failure. Log: `/tmp/portal-S15-S16-red.log`.

```text
 FAIL  app/layout-gate.test.ts > layout architecture gate > keeps Button color, radius, height, and padding in shared variants
AssertionError: expected [ …(8) ] to deeply equal []

- Expected
+ Received

- Array []
+ Array [
+   "components/auth/login-form.tsx",
+   "components/modals/allergen-warning-modal.tsx",
+   "components/modals/cold-chain-violation-modal.tsx",
+   "components/modals/confirm-qc-decision-modal.tsx",
+   "components/modals/invite-member-modal.tsx",
+   "components/modals/quantity-variance-modal.tsx",
+   "components/modals/session-timeout-modal.tsx",
+   "components/modals/supplier-suspension-modal.tsx",
+ ]

 ❯ app/layout-gate.test.ts:103:48
    101| 
    102|   it("keeps Button color, radius, height, and padding in shared varian…
    103|     expect(buttonOverrideFiles(sourceFiles())).toEqual([]);
       |                                                ^
    104|   });
    105| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed | 37 passed (38)
      Tests  1 failed | 268 passed (269)
   Start at  08:36:35
   Duration  2.42s (transform 2.59s, setup 0ms, collect 12.44s, tests 1.57s, environment 5ms, prepare 13.14s)
```

### Gates: tails and counts

npm only, full test suites only. `ESBUILD_BINARY_PATH=/home/dawn/.local/share/esbuild/esbuild-0.21.5` on all npm commands.

`npm test` — PASS, exit 0, 38 files / 269 tests (`/tmp/portal-S15-S16-test.log`):

```text
 Test Files  38 passed (38)
      Tests  269 passed (269)
   Start at  08:37:04
   Duration  2.33s (transform 2.90s, setup 0ms, collect 12.03s, tests 1.55s, environment 6ms, prepare 13.23s)
```

`npm run lint` — PASS, exit 0, 0 errors / 0 warnings (`/tmp/portal-S15-S16-lint.log`):

```text
> @dcentervn/portal@0.1.0 lint
> node node_modules/eslint/bin/eslint.js .
```

`rm -rf .next/types .next/dev/types && npm run typecheck` — PASS, exit 0, 0 diagnostics (`/tmp/portal-S15-S16-typecheck.log`):

```text
> @dcentervn/portal@0.1.0 typecheck
> node node_modules/typescript/bin/tsc --noEmit
```

`python3 ~/agent_skills/sdlc/engine/archcheck.py` — PASS, exit 0 (`/tmp/portal-S15-S16-arch.log`):

```text
archcheck: 83 violations, 83 baselined, 0 new, 0 stale
```

Read-only `hs-cli gates` ran on scratch, exit 0 (`/tmp/portal-S15-S16-harness.log`). No receipt written. Graph lookup was denied by tool policy; direct inspection of the supplied paths used. Referenced `../platform-docs/standards/ui-ux.md` is absent; read frontend.md and the explicitly requested UI skill. No browser verification performed.

### Mutation table

Scratch: `/tmp/portal-S15-S16-3izccnqd/portal`, outside the repository. Copied project source/config, excluded .git/.next/node_modules/.aidlc and incremental compiler cache; symlinked repository dependencies and sibling platform-docs for read-only token access. Initial scratch placement lacked the sibling token path and failed app/rebrand.test.ts with ENOENT; corrected scratch layout, then repeated baseline and both mutations. Only the corrected runs below are acceptance evidence; no rebrand file edited.

| Mutation | Result | Assertion evidence | Full-suite counts |
|---|---|---|---|
| M-j: re-add rounded-xl to allergen modal Button | KILLED, exit 1 | Filesystem AST gate reports components/modals/allergen-warning-modal.tsx | 1 file / 1 test failed; 37 files / 268 tests passed |
| M-k: gate skips components/ | KILLED, exit 1 | checks Button overrides in scope: components/modals/fixture.tsx | 1 file / 1 test failed; 37 files / 268 tests passed |

**Killed/total: 2/2; executed: 2.** Corrected scratch baseline and restored full suite: **38 files / 269 tests PASS**, exit 0. Mutations restored between runs. Logs: `/tmp/portal-S15-S16-{scratch-baseline,M-j,M-k,scratch-restored}.log`; structured exit results: `/tmp/portal-S15-S16-mutations.json`. Failures were assertions. Repository gates had no concurrent PORTAL-REBRAND failure.

### Files changed

Nine scoped source/test files, plus this requested report append:

- components/auth/login-form.tsx
- components/modals/allergen-warning-modal.tsx
- components/modals/cold-chain-violation-modal.tsx
- components/modals/confirm-qc-decision-modal.tsx
- components/modals/invite-member-modal.tsx
- components/modals/quantity-variance-modal.tsx
- components/modals/session-timeout-modal.tsx
- components/modals/supplier-suspension-modal.tsx
- app/layout-gate.test.ts
- .aidlc/runs/PORTAL-SHELL-001/review-fix.md

No ACTIVE, receipt, other-run, approval, staging or commit writes. Concurrent PORTAL-REBRAND source files left alone.

## Fix-4

**Review #4 findings #1 and #2 fixed within approved S16. Test, lint and typecheck PASS; archcheck BLOCKED by 2 stale baseline entries outside scope. Mutations killed 2/2.** Evidence only; no approval or receipt.

### Scope and behavior

Read review-4-codex-sol.md findings #1/#2, review-fix.md S15-S16 and approved plan S15/S16. Used SDLC and surgical-patch skills. Graph discovery/coverage calls were denied by tool policy; inspected supplied source directly. Read-only `hs-cli gates` ran on scratch, exit 0 (`/tmp/portal-Fix-4-harness.log`); this inventories policy and is not acceptance proof.

Extended the existing AST Button className detector for text/bg/border/ring/from/to/via palette utilities, all Tailwind palette names, black/white, arbitrary hex (3/4/6/8 digits), variant prefixes and opacity suffixes. Retained existing bg/radius/height/padding checks. Executable fixtures cover `hover:text-rose-600`, stacked/arbitrary variants, every color utility with hex, and accepted `w-full mt-2 gap-2` plus semantic tokens. The real pre-fix filesystem scan named only session-timeout-modal.tsx: no other Button overrides found in app/features/components.

Removed only `hover:text-rose-600` from the modal; ghost variant, label and onLogout handler remain. Changed the real filesystem backdrop-blur assertion to an empty allowed set, following Dawn's no-glass-outside-hero ruling and PORTAL-REBRAND S3. Repository dialog.tsx and rebrand.test.ts were not edited.

### Red evidence

Extended tests first, ran full `npm test`, then removed the modal override. Exit 1; 1 failed / 37 passed files, 1 failed / 291 passed tests. Only the real Button scan failed; all fixtures passed. Log: `/tmp/portal-Fix-4-red.log`.

```text
FAIL  app/layout-gate.test.ts > layout architecture gate > keeps Button color, radius, height, and padding in shared variants
AssertionError: expected [ Array(1) ] to deeply equal []

- Expected
+ Received

- Array []
+ Array [
+   "components/modals/session-timeout-modal.tsx",
+ ]

 ❯ app/layout-gate.test.ts:104:48
    102| 
    103|   it("keeps Button color, radius, height, and padding in shared varian…
    104|     expect(buttonOverrideFiles(sourceFiles())).toEqual([]);
       |                                                ^
    105|   });
    106| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed | 37 passed (38)
      Tests  1 failed | 291 passed (292)
   Start at  08:45:28
   Duration  3.43s (transform 3.42s, setup 0ms, collect 13.10s, tests 1.61s, environment 6ms, prepare 16.45s)
```

### Gates: tails and counts

npm only; full suites only. All npm runs use `ESBUILD_BINARY_PATH=/home/dawn/.local/share/esbuild/esbuild-0.21.5`.

`npm test` — PASS, exit 0; 38 files / 292 tests (`/tmp/portal-Fix-4-test.log`):

```text
Test Files  38 passed (38)
      Tests  292 passed (292)
   Start at  08:45:48
   Duration  2.64s (transform 3.00s, setup 0ms, collect 14.09s, tests 1.84s, environment 6ms, prepare 14.81s)
```

`npm run lint` — PASS, exit 0; 0 errors / 0 warnings (`/tmp/portal-Fix-4-lint.log`):

```text
> @dcentervn/portal@0.1.0 lint
> node node_modules/eslint/bin/eslint.js .
```

`rm -rf .next/types .next/dev/types && npm run typecheck` — PASS, exit 0; 0 diagnostics (`/tmp/portal-Fix-4-typecheck.log`):

```text
> @dcentervn/portal@0.1.0 typecheck
> node node_modules/typescript/bin/tsc --noEmit
```

`python3 ~/agent_skills/sdlc/engine/archcheck.py` — FAIL, exit 1; 81 violations / 81 baselined / 0 new / 2 stale (`/tmp/portal-Fix-4-arch.log`):

```text
FIXED FE-09 components/ui/dialog.tsx  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-11 components/ui/dialog.tsx  (delete this line from .aidlc/arch-baseline.txt)
archcheck: 81 violations, 81 baselined, 0 new, 2 stale
```

The two stale FE-09/FE-11 entries belong to the concurrent dialog cleanup. `.aidlc/arch-baseline.txt` is outside the permitted files; left untouched. Full gate acceptance remains blocked until its owner reconciles those entries.

### Mutation table

Scratch: `/tmp/portal-Fix-4-avr7cs1o/portal`, outside the repository. Created with `cp -r`, excluding node_modules/.next/.aidlc/.git and compiler cache; symlinked repository node_modules and sibling ../platform-docs. Every baseline/mutation/restoration ran full `npm test`. Restored each mutation before the next run. Baseline and final restored suite: PASS, exit 0; 38 files / 292 tests.

| Mutation | Result | Assertion evidence | Full-suite counts |
|---|---|---|---|
| M-l: re-add hover:text-rose-600 to session timeout Button | KILLED, exit 1 | Real Button filesystem gate names components/modals/session-timeout-modal.tsx | 1 file / 1 test failed; 37 files / 291 tests passed |
| M-m: add backdrop-blur-sm to scratch components/ui/dialog.tsx | KILLED, exit 1 | Real empty-set blur filesystem gate names components/ui/dialog.tsx; also 3 rebrand assertions fail | 2 files / 4 tests failed; 36 files / 288 tests passed |

**Killed/total: 2/2; executed: 2.** Assertion failures, no infrastructure errors. Logs: `/tmp/portal-Fix-4-{scratch-baseline,M-l,M-m,scratch-restored}.log`; exits: `/tmp/portal-Fix-4-mutations.json`. M-m edited only the scratch dialog copy.

### Files changed

Only this Fix-4 continuation:

- components/modals/session-timeout-modal.tsx
- app/layout-gate.test.ts
- .aidlc/runs/PORTAL-SHELL-001/review-fix.md

No ACTIVE, receipts, other runs, approval, staging or commit writes. No browser verification performed.
