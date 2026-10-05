# PORTAL-REBRAND-001 review fix report

## Result and scope

Both review findings fixed. Only the five authorized source/test files and this report were edited. No staging, commit, approval, or other `.aidlc/` write was performed. Existing `.aidlc/` changes and the existing `anti/` directory were left in place. The requested generated-type cleanup was run before typecheck.

- Status filters use the existing `destructive` variant when selected and `outline` otherwise, with `aria-pressed` on all three buttons. No Button style override was added; the catalogue retains exactly one primary CTA.
- Selected versus unselected fill contrast, calculated from the actual theme tokens: **7.278624:1 light**, **5.018274:1 dark**, both above 3:1.
- `useId()` supplies matching `htmlFor`/`id` values for all five product fields, the session PIN input, and the QC temperature input and sensory textarea. The QC radio controls already have wrapping labels; rendered queries also cover both. Label text, handlers, validation, and data flow were preserved.
- Added 13 rendered regression cases to the existing SSR harness: 10 label queries, one handler-driven selection test, and two theme contrast tests. The `getByLabelText` helper resolves labels against rendered controls without assuming generated IDs. The selection test invokes the actual Button handler and observes the subsequent rendered state; it does not inject the expected filter. The contrast oracle resolves rendered background tokens and calculates their luminance ratio independently of the selected variant.

These checks cover SSR label associations, handler-driven state, and token contrast. They do not claim browser event dispatch, focus, keyboard, or screen-reader audits.

## TDD red evidence

Before any component fix, ran **full `npm test`**, with no path argument. Exit **1**: 11 new assertions failed, 352 tests passed; 1 test file failed, 37 passed. Eight label associations were missing, no filter exposed pressed state, and fill contrast failed in both themes. The two already-associated radio controls passed.

Observed failures:

```text
 FAIL  app/rebrand.test.ts > review fix rendered accessibility and filter selection > finds the product control by its label: Tên sản phẩm (*)
AssertionError: control named by label: Tên sản phẩm (*): expected [] to have a length of 1 but got +0
 FAIL  app/rebrand.test.ts > review fix rendered accessibility and filter selection > finds the product control by its label: Mã định danh SKU (*)
AssertionError: control named by label: Mã định danh SKU (*): expected [] to have a length of 1 but got +0
 FAIL  app/rebrand.test.ts > review fix rendered accessibility and filter selection > finds the product control by its label: Đơn vị tính (UOM) (*)
AssertionError: control named by label: Đơn vị tính (UOM) (*): expected [] to have a length of 1 but got +0
 FAIL  app/rebrand.test.ts > review fix rendered accessibility and filter selection > finds the product control by its label: Giá niêm yết (VND) (*)
AssertionError: control named by label: Giá niêm yết (VND) (*): expected [] to have a length of 1 but got +0
 FAIL  app/rebrand.test.ts > review fix rendered accessibility and filter selection > finds the product control by its label: Mô tả sản phẩm & Quy cách bảo quản
AssertionError: control named by label: Mô tả sản phẩm & Quy cách bảo quản: expected [] to have a length of 1 but got +0
 FAIL  app/rebrand.test.ts > review fix rendered accessibility and filter selection > finds the session PIN control by its label
AssertionError: control named by label: Mật khẩu hoặc mã PIN 6 số: expected [] to have a length of 1 but got +0
 FAIL  app/rebrand.test.ts > review fix rendered accessibility and filter selection > finds the QC control by its label: Nhiệt độ tâm sau cấp đông (°C)
AssertionError: control named by label: Nhiệt độ tâm sau cấp đông (°C): expected [] to have a length of 1 but got +0
 FAIL  app/rebrand.test.ts > review fix rendered accessibility and filter selection > finds the QC control by its label: Ghi nhận kiểm tra cảm quan
AssertionError: control named by label: Ghi nhận kiểm tra cảm quan: expected [] to have a length of 1 but got +0
 FAIL  app/rebrand.test.ts > review fix rendered accessibility and filter selection > has exactly one pressed filter and moves it through the rendered click handlers
AssertionError: expected [] to have a length of 1 but got +0
 FAIL  app/rebrand.test.ts > review fix rendered accessibility and filter selection > distinguishes every selected filter by at least 3:1 fill contrast in light
AssertionError: expected 1.075887900379789 to be greater than or equal to 3
 FAIL  app/rebrand.test.ts > review fix rendered accessibility and filter selection > distinguishes every selected filter by at least 3:1 fill contrast in dark
AssertionError: expected 1.1247839880272725 to be greater than or equal to 3
```

Red tail:

```text
- 1
+ 0

 ❯ app/rebrand.test.ts:832:25
    830|         expect(filters).toHaveLength(3);
    831|         const pressed = filters.filter((button) => button.includes('ar…
    832|         expect(pressed).toHaveLength(1);
       |                         ^
    833|         expect(pressed[0]).toContain(`>${label}</button>`);
    834|         for (const button of filters.filter((button) => button !== pre…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[9/11]⎯

 FAIL  app/rebrand.test.ts > review fix rendered accessibility and filter selection > distinguishes every selected filter by at least 3:1 fill contrast in light
AssertionError: expected 1.075887900379789 to be greater than or equal to 3
 ❯ app/rebrand.test.ts:850:69
    848|       const selected = renderedBackground(filters[index], mode);
    849|       for (const other of filters.filter((_, otherIndex) => otherIndex…
    850|         expect(contrast(selected, renderedBackground(other, mode))).to…
       |                                                                     ^
    851|       }
    852|       expectS7Roles(html, 1);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/11]⎯

 FAIL  app/rebrand.test.ts > review fix rendered accessibility and filter selection > distinguishes every selected filter by at least 3:1 fill contrast in dark
AssertionError: expected 1.1247839880272725 to be greater than or equal to 3
 ❯ app/rebrand.test.ts:850:69
    848|       const selected = renderedBackground(filters[index], mode);
    849|       for (const other of filters.filter((_, otherIndex) => otherIndex…
    850|         expect(contrast(selected, renderedBackground(other, mode))).to…
       |                                                                     ^
    851|       }
    852|       expectS7Roles(html, 1);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[11/11]⎯

 Test Files  1 failed | 37 passed (38)
      Tests  11 failed | 352 passed (363)
   Start at  16:39:14
   Duration  3.44s (transform 4.81s, setup 0ms, collect 19.99s, tests 2.24s, environment 6ms, prepare 18.35s)
```

Full red log: `/tmp/portal-rebrand-review-red.log`.

## Required gates

| Gate | Exit | Counts/result |
|---|---:|---|
| `ESBUILD_BINARY_PATH=~/.local/share/esbuild/esbuild-0.21.5 npm test` | 0 | 38/38 files, 363/363 tests; rebrand file 90/90 |
| `npm run lint` | 0 | No errors or warnings emitted |
| `rm -rf .next/types .next/dev/types && npm run typecheck` | 0 | No TypeScript errors emitted |
| `python3 .aidlc/runs/PORTAL-REBRAND-001/testkit/check-brand.py` | 0 | 0 errors, full `all` scope |
| `python3 ~/agent_skills/sdlc/engine/archcheck.py` | 0 | 63 violations, 63 baselined, 0 new, 0 stale |

Full-suite tail:

```text
Test Files  38 passed (38)
      Tests  363 passed (363)
   Start at  16:40:10
   Duration  3.29s (transform 4.89s, setup 0ms, collect 19.64s, tests 2.15s, environment 7ms, prepare 18.32s)
```

Lint tail:

```text
> @dcentervn/portal@0.1.0 lint
> node node_modules/eslint/bin/eslint.js .
```

Typecheck tail:

```text
> @dcentervn/portal@0.1.0 typecheck
> node node_modules/typescript/bin/tsc --noEmit
```

Brand tail:

```text
brand gate: 0 errors (all)
```

Architecture tail:

```text
archcheck: 63 violations, 63 baselined, 0 new, 0 stale
```

The full suite also emitted the existing React `asChild` DOM-prop warning in an S7 test; it did not fail the suite. Gate logs are `/tmp/portal-rebrand-review-{green,lint,types,brand,arch}.log`.

## Mutation proof

Scratch root: `/tmp/portal-rebrand-review-mutants/portal`. Copied the repository entries with **`cp -r`**, excluding `node_modules`, `.next`, `.aidlc`, `.git`, `.agents`, `.codex`, and `.aws`. Symlinked scratch `node_modules` to the live dependency directory and scratch `../platform-docs` to the existing platform docs. No mutation touched the live repository. Each mutant ran a **full `npm test`** with the specified esbuild binary; the two source files were restored from live source before every mutant and again afterward.

Unmutated scratch baseline, exit 0:

```text
Test Files  38 passed (38)
      Tests  363 passed (363)
   Start at  16:41:15
   Duration  2.96s (transform 1.54s, setup 0ms, collect 15.84s, tests 975ms, environment 6ms, prepare 17.82s)
```

| Mutant | Change | Exit | Failed/passed tests | Result |
|---|---|---:|---|---|
| A, requested | Remove all three filter `aria-pressed` props | 1 | 1 failed / 362 passed (363); 1 failed / 37 passed files (38) | Killed by exactly-one-pressed assertion |
| B, requested | Remove only the UOM label's `htmlFor`, retain select `id` | 1 | 1 failed / 362 passed (363); 1 failed / 37 passed files (38) | Killed by UOM `getByLabelText` query |
| C, conditional sensitivity | Replace all three selected variant conditionals with constant `outline`, retain `aria-pressed` | 1 | 2 failed / 361 passed (363); 1 failed / 37 passed files (38) | Killed by independent light/dark contrast assertions (1:1) |

**Requested mutants killed: 2/2. Total killed: 3/3 (100%).**

a-aria-pressed tail (exit 1):

```text
Test Files  1 failed | 37 passed (38)
      Tests  1 failed | 362 passed (363)
   Start at  16:41:45
   Duration  3.01s (transform 2.29s, setup 0ms, collect 14.44s, tests 1.09s, environment 6ms, prepare 19.63s)
```

Log: `/tmp/portal-rebrand-review-mutant-a-aria-pressed.log`.

b-htmlFor tail (exit 1):

```text
Test Files  1 failed | 37 passed (38)
      Tests  1 failed | 362 passed (363)
   Start at  16:41:48
   Duration  2.76s (transform 1.74s, setup 0ms, collect 14.13s, tests 1.03s, environment 6ms, prepare 16.54s)
```

Log: `/tmp/portal-rebrand-review-mutant-b-htmlFor.log`.

c-selected-conditional tail (exit 1):

```text
Test Files  1 failed | 37 passed (38)
      Tests  2 failed | 361 passed (363)
   Start at  16:41:52
   Duration  2.68s (transform 1.77s, setup 0ms, collect 12.84s, tests 996ms, environment 6ms, prepare 16.45s)
```

Log: `/tmp/portal-rebrand-review-mutant-c-selected-conditional.log`.

## Workflow observations

Read the existing board, approved task plan, frontend standard, SDLC skill, and surgical-patch skill. `../platform-docs/standards/ui-ux.md` is absent, consistent with the plan's recorded prerequisite. The read-only `hs-run cook status --plan .../PORTAL-REBRAND-001` probe returned exit 2 / `no_plan_graph`; no metadata or receipt was generated to change that result. Proceeded under the user's explicit plan approval and exact edit authorization. Graph discovery/coverage calls were denied by the tool approval policy, so direct source inspection supplied the evidence. The report is the authorized handoff; no external handoff file was written.

## Files changed

1. `app/rebrand.test.ts` — rendered label, click-following pressed-state, and independent contrast assertions.
2. `features/products/products-view.tsx` — distinct existing selected variant and `aria-pressed`.
3. `features/products/product-create-dialog.tsx` — `useId()` label associations for all five controls.
4. `components/modals/session-timeout-modal.tsx` — `useId()` association for PIN input.
5. `features/production/qc-view.tsx` — `useId()` associations for temperature and sensory controls.
6. `.aidlc/runs/PORTAL-REBRAND-001/review-fix-report.md` — this sole authorized `.aidlc/` write.

Final source diff whitespace check: `git diff --check`, exit 0. Staged diff was empty.

Pickup: review the five-file patch and this evidence report. No additional implementation or requested verification remains.


## Round 2

Request: selected catalogue filters must use existing `secondary` semantics (primary text), with a leading lucide `Check` icon rendered only on the selected filter and `aria-hidden="true"`. Unselected filters remain `outline`; `aria-pressed` stays. No Button className overrides were added.

Round 2 edited only `features/products/products-view.tsx`, `app/rebrand.test.ts`, and this appended report section. Existing Round 1 and other working-tree changes were preserved. No staging or commit.

Tests changed first: replaced the superseded light/dark fill-contrast assertions with three rendered secondary/outline semantics cases rejecting destructive/danger classes. Extended the rendered click-handler test to assert exactly one pressed filter, exactly one leading hidden Check on it, no Check on either unselected filter, and movement through ALL → ACTIVE → DRAFT → ALL. The click-capture helper uses visible label text so the decorative icon does not change handler lookup. Removed the unused fill-resolution helper.

Full red `npm test`: **1 failed / 37 passed files (38); 4 failed / 360 passed tests (364)**. Failures were the missing selected Check and destructive styling in all three selected states. Log: `/tmp/portal-rebrand-round2-red.log`.

| Gate | Result | Counts |
|---|---|---|
| `ESBUILD_BINARY_PATH=~/.local/share/esbuild/esbuild-0.21.5 npm test` | PASS | 38/38 files; 364/364 tests; rebrand 91/91; layout gate 58/58 |
| `npm run lint` | PASS | No errors or warnings emitted |
| `rm -rf .next/types .next/dev/types && npm run typecheck` | PASS | No TypeScript errors emitted |
| `python3 .aidlc/runs/PORTAL-REBRAND-001/testkit/check-brand.py` | PASS | 0 errors, all scope |
| `python3 ~/agent_skills/sdlc/engine/archcheck.py` | PASS | 63 violations, 63 baselined, 0 new, 0 stale |

Logs: `/tmp/portal-rebrand-round2-{green,lint,types}.log`. Brand and architecture output were captured in the tool transcript. The existing React `asChild` warning remains in the full suite and does not fail it.

Scratch mutation root: `/tmp/portal-rebrand-round2-mutants/portal`. Copied repository entries with `cp -r`, excluding `node_modules`, `.next`, `.aidlc`, `.git`, `.agents`, `.codex`, `.aws`; symlinked live dependencies and sibling platform docs. Unmutated scratch full suite: exit 0, **38/38 files, 364/364 tests** (`/tmp/portal-rebrand-round2-scratch-baseline.log`).

Requested mutant: remove all three `statusFilter === ... &&` Check conditions, leaving unconditional hidden Check icons. Full suite: exit 1, **1 failed / 37 passed files; 1 failed / 363 passed tests (364)**. Killed by the assertion that unselected filters contain no `lucide-check`. **Mutation kill count: 1/1 (100%)**. Log: `/tmp/portal-rebrand-round2-mutant.log`. Restored scratch source from live afterward; live source was never mutated.

Workflow: read existing task/board and frontend standard, applied SDLC and surgical-patch skills. Read-only `hs-run cook status --plan .../PORTAL-REBRAND-001` returned envelope `no_plan_graph` / exit_code 2; no plan graph or harness receipt was fabricated. Graph discovery/coverage calls were denied by the never-approval tool policy, so direct source inspection was used. The missing referenced `START.md` and `ui-ux.md` were observed; the user's precise Round 2 scope and implementation instructions supplied authorization. No other tracked metadata or handoff file was written. This appended report is the scoped handoff: requirements implemented, requested gates and mutation complete; pickup is review of these authorized changes. `git diff --check` passed, and staged diff was empty.
