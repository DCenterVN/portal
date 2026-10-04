# PORTAL-REBRAND-001 — S7 report

## Where it started

Resumed the approved S7 slice after the previous usage-limit cutoff. Read plan Requirements, Technical definition, UX, Design/token table and S7; s6-report.md; testkit/check-brand.py (gate B), environment, errors, mutation evidence and browser protocol; project/workspace instructions, frontend standard and brand v4. ui-ux.md remains absent, a known plan prerequisite gap. Current explicit authorization takes precedence over the original plan-only header and the older package-manager instruction: npm only.

Inspected git diff for all four S7 views before implementation. Targets and sales orders had no partial diff; cart had Button-class cleanup and product creation had two Button-class removals. Retained those edits. Pre-resume snapshots: /tmp/portal-s7-evidence/before. The existing app/rebrand.test.ts tests were correct and remain byte-identical; no rewrite or weakening.

Harness: hs-run cook next returned no_plan (exit 0), searching /home/dawn/plans. hs-run cook prompt developer --phase S7 returned waiting_on_model (exit 10), posture_mode in_place, measuring 0 declared files. This is posture evidence, not registered approval or delivery attestation. Followed the user's approved slice and exact output boundary. No ACTIVE, approval, stage, receipts, baseline, staging, commit or ship edits/actions.

Graph-first discovery/coverage was attempted after list_projects; the MCP calls were rejected because approval policy is never. Used direct reads of the exact authorized paths instead.

## Decisions + implementation

All four surfaces now use solid role-token styling: bg/surface/tint/ink/muted/line, accessible link/focus roles and semantic states with readable labels/icons. No owned raw palette/hex, gradient or blur remains. Quicksand/Nunito and light-sidebar overrides remain governed by the existing pipeline; no global token changes in S7.

Targets prioritize create, then submit while its form is open. With create unavailable, the first existing eligible approval or BOM action receives primary emphasis; other row actions use outline. No action is added or permission condition changed. Success/approval cues use leaf alongside existing text, with primary-ink on the icon when inside the primary button. Existing badges preserve status strings and semantic indicators. Native target inputs use h-11, radius-md, 1.5px input-border and visible focus.

Cart keeps derived quantity, line amounts and total, Sales submission/error flow and product data. Totals use ink. Checkout is primary; when success opens, checkout becomes outline and the dialog continuation becomes primary. The disabled empty-cart checkout is retained. Success retains its check icon, leaf cue, status message and order code.

Sales orders keep refresh neutral; there is no purchase/submit action to promote. Status text remains CREATED/CANCELLED, now within shared active/revoked Badge variants. Loading, empty and error feedback remains visible; the error retains role=alert, text and icon. Links use primary-hover in light mode, primary in dark, and visible focus.

Product creation keeps all values, UOM options, required/min/step constraints, submission, validation/toast messages and callbacks. Save remains primary, cancel outline. Native UOM select uses h-11, radius-md, 1.5px input-border and visible focus. Shared Input supplies the same roles for other fields. Button changes use existing variants; caller classes only retain layout, with no colour/radius/height/padding overrides.

Behavior AST comparison against pre-resume snapshots passed 4/4. Normalization excludes className/style/variant, the visual-only primaryTargetId declaration and the new sales-order Badge import/wrapper. All other AST content, including props, handlers, labels, aria, size props, permissions, data flow and totals, is identical. app/rebrand.test.ts is byte-identical. git diff --check passed for the five scoped source/test paths.

## ui-ux-pro-max evidence used

Read [SKILL.md](/home/dawn/.claude/plugins/marketplaces/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max/SKILL.md). Searches ran without persistence; all exited 0:

```bash
D=/home/dawn/.claude/plugins/marketplaces/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max
python3 "$D/scripts/search.py" "primary call to action hierarchy one per screen" --domain ux
python3 "$D/scripts/search.py" "cart checkout totals form validation error" --domain ux
python3 "$D/scripts/search.py" "primary CTA" --domain ux
```

First search returned three ux-guidelines.csv matches: Heading Hierarchy, Bulk Actions and Breadcrumbs. These do not establish CTA competition; preserved existing headings and did not introduce bulk actions/navigation. One narrower retry, primary CTA, returned 0 results. No verified CTA-hierarchy database match is claimed: the one-primary rule comes directly from the approved plan.

Second search returned Focusable Error Summary, Error Messages and Submit Feedback. Used Error Messages (announced errors via existing role=alert/toast) and Submit Feedback (preserved loading, success/error text and disabled controls). Focusable Error Summary would require behavior/aria changes outside this styling slice; it was not added. Skill priority guidance on semantic tokens and non-colour status cues supports the shared Badge + text treatment. All palette/font/effect decisions follow the plan's table and explicit Dawn overrides, ahead of skill recommendations.

## Red evidence

Ran the full npm test BEFORE implementation with ESBUILD_BINARY_PATH=/home/dawn/.local/share/esbuild/esbuild-0.21.5. Exit 1: 12 failed / 328 passed (340), 1 failed / 37 passed files (38). Failures were the intended S7 rendered assertions: raw green/emerald/rose styling and missing role surfaces, including product creation. Full transcript: /tmp/s7-red.log. Final tail:

```text

- Expected: 
null

+ Received: 
"text-emerald-600"

 ❯ expectRoleSurface app/rebrand.test.ts:393:48
    391|   // caller actions and content remain in the rendered scan, including…
    392|   const owned = html.replace(/class="flex size-9 items-center justify-…
    393|   expect(owned.match(rawSurface)?.[0] ?? null).toBeNull();
       |                                                ^
    394|   expect(html).toContain("text-[var(--color-ink)]");
    395|   expect(html).toContain("bg-[var(--color-surface)]");
 ❯ expectS7Roles app/rebrand.test.ts:630:3
 ❯ app/rebrand.test.ts:713:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[8/12]⎯

 Test Files  1 failed | 37 passed (38)
      Tests  12 failed | 328 passed (340)
   Start at  12:40:35
   Duration  2.65s (transform 3.26s, setup 0ms, collect 15.31s, tests 1.97s, environment 6ms, prepare 13.42s)

```

## Final gates

Every npm test invocation ran the full suite, with the required ESBUILD_BINARY_PATH. No targeted-suite invocation. Final exit codes captured in /tmp/s7-gates.json.

Gate B — exit 0, 0 errors:

```bash
python3 .aidlc/runs/PORTAL-REBRAND-001/testkit/check-brand.py --scan-path 'features/production/targets-view.tsx' --scan-path 'features/products/cart-view.tsx' --scan-path 'features/products/orders-view.tsx' --scan-path 'features/products/product-create-dialog.tsx'
```

```text
brand gate: 0 errors (all)
```

npm test — exit 0, 340/340 tests; 38/38 files. Rebrand 67/67; layout-gate 58/58. Tail:

```text
 ✓ features/platform/role-matrix.test.ts (3 tests) 3ms
 ✓ app/(store)/traceability/traceability-page.test.tsx (1 test) 2ms
 ✓ app/(store)/layout.test.ts (1 test) 323ms
   ✓ escapes less-than in both JSON-LD scripts while preserving data 322ms

 Test Files  38 passed (38)
      Tests  340 passed (340)
   Start at  12:43:37
   Duration  3.39s (transform 3.49s, setup 0ms, collect 17.43s, tests 2.59s, environment 6ms, prepare 17.34s)

```

npm run lint — exit 0, no diagnostics:

```text

> @dcentervn/portal@0.1.0 lint
> node node_modules/eslint/bin/eslint.js .

```

rm -rf .next/types .next/dev/types && npm run typecheck — exit 0, no diagnostics:

```text

> @dcentervn/portal@0.1.0 typecheck
> node node_modules/typescript/bin/tsc --noEmit

```

python3 ~/agent_skills/sdlc/engine/archcheck.py — exit 1 solely for stale FIXED baseline entries. 66 violations, all 66 baselined; **0 new violations, 4 newly FIXED FE-09 entries** below. Initial probe found two new FE-10 violations from border-[1.5px]; replaced those with inline borderWidth: 1.5, matching the shared Input approach. Final tail:

```text
FIXED FE-09 features/production/targets-view.tsx  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-09 features/products/cart-view.tsx  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-09 features/products/orders-view.tsx  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-09 features/products/product-create-dialog.tsx  (delete this line from .aidlc/arch-baseline.txt)
archcheck: 66 violations, 66 baselined, 0 new, 4 stale
```

Dawn owns deleting those four baseline lines. Baseline was untouched. The existing asChild DOM-prop warning appears in both red and green runs; it comes from shared Button implementation and is outside S7 ownership. No claim of warning-free runtime.

## Scratch mutations

Created /tmp/portal-s7-mutations/portal using cp -r for each included root entry; omitted node_modules, .next, .aidlc, .git and .env*. Symlinked node_modules and ../platform-docs to the live dependencies/read-only source. Copied final four S7 sources into scratch. Ran full npm test for the unmodified control and each mutant; restored each file before the next mutation. Live sources were never mutated.

| Mutation | Scratch change | Full suite | Outcome |
|---|---|---|---|
| Control | Final implementation unchanged | 340 passed / 0 failed | Valid baseline, exit 0 |
| M19 | Add a second default primary Button next to checkout | 3 failed / 337 passed | Killed: expected 1 primary, received 2 |
| M20 | Remove order.status text, leaving only status-coloured Badge/dot | 1 failed / 339 passed | Killed: CREATED text label missing |
| M21 | Add text-[#00ff00] to product dialog | 2 failed / 338 passed | Killed: rendered raw hex detected |

**Killed/total: 3/3 (100%).** Each mutant exited 1 for the intended S7 assertion, not startup/transform errors. Tails:

```text
CONTROL

 Test Files  38 passed (38)
      Tests  340 passed (340)
   Start at  12:43:39
   Duration  3.40s (transform 1.54s, setup 0ms, collect 12.97s, tests 810ms, environment 6ms, prepare 20.00s)


M19

 Test Files  1 failed | 37 passed (38)
      Tests  3 failed | 337 passed (340)
   Start at  12:43:42
   Duration  2.63s (transform 2.01s, setup 0ms, collect 12.98s, tests 917ms, environment 6ms, prepare 17.24s)


M20

 Test Files  1 failed | 37 passed (38)
      Tests  1 failed | 339 passed (340)
   Start at  12:43:45
   Duration  2.51s (transform 1.63s, setup 0ms, collect 12.87s, tests 954ms, environment 7ms, prepare 14.97s)


M21

 Test Files  1 failed | 37 passed (38)
      Tests  2 failed | 338 passed (340)
   Start at  12:43:48
   Duration  2.46s (transform 1.70s, setup 0ms, collect 12.04s, tests 960ms, environment 5ms, prepare 15.35s)

```

## Files changed in this resumed run

- features/production/targets-view.tsx
- features/products/cart-view.tsx
- features/products/orders-view.tsx
- features/products/product-create-dialog.tsx
- .aidlc/runs/PORTAL-REBRAND-001/s7-report.md

app/rebrand.test.ts remains the previous run's S7 test contribution, unchanged in this resumed run. app/layout-gate.test.ts was untouched.

## Pick up here / later slices

S7 implementation and requested local/mutation gates are complete, with baseline cleanup owned by Dawn. Shared PageHeader's old icon wrapper and remaining raw styles belong to later slices, as explicitly excluded by the existing rendered helper. Keep S8/S9 ownership intact.

Browser acceptance from testkit/ui-cases.md remains pending: both themes, 375/768/1024/1440px, real loaded font faces, keyboard focus/dismissal, actual control dimensions, overflow, real backend submissions, console/HTTP and Lighthouse/performance budgets. SSR/AST/static checks do not establish those runtime ACs. Existing labels/toast validation were preserved rather than redesigned. Shared Button asChild warning remains for its owner. No broader release/ship completion is claimed.
