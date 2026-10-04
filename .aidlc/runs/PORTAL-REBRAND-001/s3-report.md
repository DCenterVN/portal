# PORTAL-REBRAND-001 — S3 report

## Outcome / decisions

Implemented the explicitly approved S3 slice. Sidebar uses theme surface/ink/muted roles, tint selection, a tomato left indicator and inset visible keyboard focus. The context sun is replaced by a building icon. Collapse widths, route matching, navigation items and existing aria attributes are preserved.

Input defaults to h-11 (44px), surface/ink, input-border colour, 12px radius-md and a 2px focus-role ring. The approved 1.5px border width uses native React CSS (`borderWidth: 1.5`) with caller `style` merged last. Disabled inputs remain disabled with their cursor behavior; tint replaces opacity dimming to keep labels readable. Existing props/ref/export are retained.

All three dialog layers use a solid token scrim at the existing 60/75/85% opacity. Content uses surface/ink, radius-lg (16px), elevation-shadow-pop and visible focus. Blur and palette literals are removed. Layer ranks, sizes, props/exports, portal lifecycle, dismissal policy, focus trap, return focus and scroll lock code are unchanged. Added reduced-motion handling and 150/200ms ease-out transitions.

S3 contract tests: **6/6 passing**; all rebrand tests: **19/19 passing**. Full suite: **274/275 passing**, with one conflicting assertion owned outside this slice. Mutations: **3/3 killed (100%)**. Brand/lint/typecheck exit 0; archcheck has **0 new** violations but exits 1 for **2 stale** baseline entries. This is implementation/static evidence; browser acceptance is pending.

## Scope / references / harness

Read the approved plan Requirements, Technical definition, UX, Design/token table and S3, S1/S2 reports, testkit gate/environment/errors/browser protocol, brand v4, project instructions and frontend standard. The missing ui-ux.md standard remains recorded in the prior reports/testkit; no replacement was created. Plan/brand exact values and Dawn's Quicksand+Nunito/light-sidebar overrides take precedence over skill suggestions. No glass is permitted in S3; the approved plan/v4 also grant no hero exception.

Applied ui-ux-pro-max, SDLC and surgical-patch skills (three relevant skills). `hs-run cook next --plan /mnt/win_d/feature/ticket/portal/.aidlc/runs/PORTAL-REBRAND-001/plan.md` returned exit 2, `not_startable`, `plan status is None — cook cannot act on it`, reproducing the S1/S2 harness-format mismatch. Explicit user approval governed this slice. No approval, receipt, stage advancement, ACTIVE edit, staging, commit or ship attestation. Concurrent auth/modal/layout-gate edits were left untouched.

## UI skill searches used

Read `/home/dawn/.claude/plugins/marketplaces/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max/SKILL.md`. With `D=/home/dawn/.claude/plugins/marketplaces/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max`, ran each command with exit 0, without persistence:

```sh
python3 "$D/scripts/search.py" "light sidebar navigation active state" --domain ux
python3 "$D/scripts/search.py" "form input height touch target focus ring" --domain ux
python3 "$D/scripts/search.py" "modal dialog surface overlay" --domain ux
```

- Sidebar: 3 results (Active State, Deep Linking, Sticky Navigation). Used Active State: visibly indicate the current section. Implemented tint/ink plus tomato border and preserved aria-current/route matching; the example text-primary does not override the plan's contrast-safe ink text.
- Input: 3 results (Touch Target Size, Line Height, Input Types). Used platform-specific sizing guidance and preserving the caller's input type. The search distinguishes web WCAG sizing from iOS 44pt/Android 48dp; **44 CSS px here comes from the approved plan**, not a claim that the database mandates it universally. No unrelated typography/layout changes.
- Dialog: 1 result (Focus States). Used a visible 2px focus ring on the surface and retained the close control's ring. Its blue example is replaced by the approved focus token. Surface/scrim/radius/shadow values come from the plan, not a purported skill surface recommendation.

Literal search output: `/tmp/rebrand-s3-evidence/search-1.txt`, `search-2.txt`, `search-3.txt`.

## TDD red evidence

Extended app/rebrand.test.ts before production edits, then ran the full `npm test` with `ESBUILD_BINARY_PATH=$HOME/.local/share/esbuild/esbuild-0.21.5`. Exit 1: **1 failed / 37 passed files (38); 6 failed / 269 passed tests (275)**. Failures are both rendered sidebar modes, default Input height and all three dialog layers. No collection/mock/environment failure substituted for the expected brand failures.

The node-environment dialog tests mock mounted state and portal transport only to render the content tree. They do not claim browser keyboard/focus-trap or computed-layout validation. No jsdom/dependency added.

Initial red tail:

```text
 ✓ components/layout/console-shell.test.tsx (4 tests) 14ms
 ✓ proxy.test.ts (4 tests) 7ms
 ✓ features/platform/staff.test.ts (2 tests) 4ms
 ✓ app/layout-gate.test.ts (41 tests) 1306ms
   ✓ layout architecture gate > keeps Button color, radius, height, and padding in shared variants 344ms
 ✓ features/store/store-frame.test.ts (6 tests) 7ms
 ✓ lib/auth/operator.test.ts (3 tests) 3ms
 ✓ components/layout/store-shell.test.tsx (2 tests) 12ms
 ✓ features/platform/my-company.test.ts (3 tests) 3ms
 ✓ features/platform/role-matrix.test.ts (3 tests) 4ms
 ✓ app/(store)/traceability/traceability-page.test.tsx (1 test) 3ms
 ✓ app/(store)/layout.test.ts (1 test) 237ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 6 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  app/rebrand.test.ts > S3 rendered sidebar and controls > uses warm surface roles and focused tomato selection (collapsed=false)
 FAIL  app/rebrand.test.ts > S3 rendered sidebar and controls > uses warm surface roles and focused tomato selection (collapsed=true)
AssertionError: expected 'flex min-h-screen flex-col overflow-h…' to contain 'bg-[var(--color-surface)]'

Expected: "bg-[var(--color-surface)]"
Received: "flex min-h-screen flex-col overflow-hidden bg-[var(--color-chrome)] text-[color:color-mix(in_srgb,white_85%,transparent)] transition-[width] motion-reduce:transition-none w-60"

 ❯ app/rebrand.test.ts:40:19
     38|     }));
     39|     const aside = classesFor(html, "aside");
     40|     expect(aside).toContain("bg-[var(--color-surface)]");
       |                   ^
     41|     expect(aside).toContain("text-[var(--color-ink)]");
     42|     expect(aside).toContain(collapsed ? "w-17" : "w-60");

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/6]⎯

 FAIL  app/rebrand.test.ts > S3 rendered sidebar and controls > renders a 44px input with role border, radius, surface and visible focus
AssertionError: expected 'flex h-9 w-full rounded-md border bor…' to contain 'h-11'

Expected: "h-11"
Received: "flex h-9 w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50"

 ❯ app/rebrand.test.ts:62:260


⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/6]⎯

 FAIL  app/rebrand.test.ts > S3 rendered sidebar and controls > renders solid token dialog/overlay in layer standard
 FAIL  app/rebrand.test.ts > S3 rendered sidebar and controls > renders solid token dialog/overlay in layer critical
 FAIL  app/rebrand.test.ts > S3 rendered sidebar and controls > renders solid token dialog/overlay in layer session
AssertionError: expected 'relative w-full rounded-2xl outline-n…' to contain 'bg-[var(--color-surface)]'

Expected: "bg-[var(--color-surface)]"
Received: "relative w-full rounded-2xl outline-none border border-[var(--border)] bg-[var(--card)] p-6 text-[var(--card-foreground)] shadow-2xl transition-all animate-in fade-in-0 zoom-in-95 duration-200 will-change-transform z-[71] max-w-sm"

 ❯ app/rebrand.test.ts:78:238


⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/6]⎯

 Test Files  1 failed | 37 passed (38)
      Tests  6 failed | 269 passed (275)
   Start at  08:40:37
   Duration  2.80s (transform 3.23s, setup 0ms, collect 15.32s, tests 1.90s, environment 6ms, prepare 14.98s)

```

After archcheck rejected the arbitrary border-width utility, its rendered assertion was updated to check native CSS border-width:1.5px. Replayed the **final** tests against all three pre-S3 component snapshots in scratch, full suite exit 1 with the same six expected failures:

```text
 ❯ app/rebrand.test.ts:79:238


⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/6]⎯

 Test Files  1 failed | 37 passed (38)
      Tests  6 failed | 269 passed (275)
   Start at  08:44:55
   Duration  2.44s (transform 1.98s, setup 0ms, collect 12.22s, tests 770ms, environment 6ms, prepare 14.54s)

```

## Gate commands / tails / counts

All npm commands used npm and the specified ESBUILD_BINARY_PATH; all test runs were full suite (`npm test`), never path-filtered. Repeated full-suite runs confirmed the same out-of-scope conflict.

### B — scoped brand gate

```sh
python3 .aidlc/runs/PORTAL-REBRAND-001/testkit/check-brand.py --scan-path components/layout/console-sidebar.tsx --scan-path components/ui/input.tsx --scan-path components/ui/dialog.tsx
```

Exit **0**, **0 errors**; includes token shape/exact values, generated-byte drift, approved contrast pairs and scoped component scan.

```text
brand gate: 0 errors (all)
```

### Full npm test

Exit **1**, **37 passed / 1 failed files (38)**; **274 passed / 1 failed tests (275)**. app/rebrand.test.ts is **19/19**, including S3 **6/6**. Only failure: `app/layout-gate.test.ts > layout architecture gate > keeps backdrop blur only in the dialog scrim`, line 79. It expects `["components/ui/dialog.tsx"]`; the approved solid-dialog implementation correctly yields `[]`. This owner-held assertion conflicts with AC-7 and was not edited. The first implementation run, required rerun and final run all reproduced this same failure; no auth/modal failures observed.

```text

 FAIL  app/layout-gate.test.ts > layout architecture gate > keeps backdrop blur only in the dialog scrim
AssertionError: expected [] to deeply equal [ 'components/ui/dialog.tsx' ]

- Expected
+ Received

- Array [
-   "components/ui/dialog.tsx",
- ]
+ Array []

 ❯ app/layout-gate.test.ts:79:19
     77|   it("keeps backdrop blur only in the dialog scrim", () => {
     78|     const files = matches(/backdrop-blur/).filter((file) => !/\.test\.…
     79|     expect(files).toEqual(["components/ui/dialog.tsx"]);
       |                   ^
     80|   });
     81| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed | 37 passed (38)
      Tests  1 failed | 274 passed (275)
   Start at  08:44:00
   Duration  3.38s (transform 3.35s, setup 0ms, collect 14.28s, tests 1.79s, environment 6ms, prepare 16.48s)

```

### npm run lint

Exit **0**, **0 diagnostics**.

```text

> @dcentervn/portal@0.1.0 lint
> node node_modules/eslint/bin/eslint.js .

```

### Typecheck

```sh
rm -rf .next/types .next/dev/types && npm run typecheck
```

Ran the authorized cleanup and then typecheck sequentially. Exit **0**, **0 diagnostics**.

```text

> @dcentervn/portal@0.1.0 typecheck
> node node_modules/typescript/bin/tsc --noEmit

```

### Architecture

```sh
python3 ~/agent_skills/sdlc/engine/archcheck.py
```

Final exit **1**: **81 violations, 81 baselined, 0 new, 2 stale**. Removing dialog palette/blur fixed FE-09 and FE-11; the corresponding stale baseline entries need the baseline owner's cleanup. The baseline is outside S3 and was not changed. Initial arch run flagged one new FE-10 for border-[1.5px]; replaced that utility with the plan-required native CSS borderWidth default and reran to establish zero new violations.

```text
FIXED FE-09 components/ui/dialog.tsx  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-11 components/ui/dialog.tsx  (delete this line from .aidlc/arch-baseline.txt)
archcheck: 81 violations, 81 baselined, 0 new, 2 stale
```

## Mutation proof — scratch only

Scratch: `/tmp/rebrand-s3-workspace/portal`. Copied sources with `cp -r`, excluding node_modules/.next/.aidlc (also .git, environment secrets and agent/config-private folders), then symlinked installed node_modules and sibling ../platform-docs. No mutant changed live components, tokens or sibling docs. Each mutation was isolated and restored before the next. Every run used the full `npm test` with the specified esbuild path. The final scratch control has the same **274 pass / 1 conflicting layout assertion** as live; kill credit is based on **new S3 failures**, not merely exit 1. M7 was repeated after the native border assertion adjustment with the same result.

| Mutation | Scratch change | S3 detector / failures | Full-suite counts | Result |
|---|---|---|---|---|
| M7 | Sidebar surface background → old dark/green #14291A | Both rendered sidebar surface-role cases; 2 new failures | 2 failed / 36 passed files; 3 failed / 272 passed tests (includes 1 unrelated blur assertion) | Killed, exit 1 |
| M8 | Input h-11 → h-10 (40px) | Rendered default height; 1 new failure | 2 failed / 36 passed files; 2 failed / 273 passed tests (includes 1 unrelated blur assertion) | Killed, exit 1 |
| M9 | Dialog content → bg-[#FFFFFF] backdrop-blur-md | All 3 rendered dialog surface contracts; 3 failures | 1 failed / 37 passed files; 3 failed / 272 passed tests | Killed, exit 1 |

**Killed/total: 3/3 (100%).** Every run collected 38 files / 275 tests. M9 incidentally satisfies the obsolete blur assertion; it still fails all three S3 dialog contracts, so no unrelated failure is counted as a kill.

Final scratch control tail:

```text
     80|   });
     81| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed | 37 passed (38)
      Tests  1 failed | 274 passed (275)
   Start at  08:44:24
   Duration  2.47s (transform 1.32s, setup 0ms, collect 12.43s, tests 742ms, environment 6ms, prepare 16.02s)

```

M7 tail:

```text

 ❯ app/rebrand.test.ts:40:19
     38|     }));
     39|     const aside = classesFor(html, "aside");
     40|     expect(aside).toContain("bg-[var(--color-surface)]");
       |                   ^
     41|     expect(aside).toContain("text-[var(--color-ink)]");
     42|     expect(aside).toContain(collapsed ? "w-17" : "w-60");

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/3]⎯

 Test Files  2 failed | 36 passed (38)
      Tests  3 failed | 272 passed (275)
   Start at  08:45:27
   Duration  3.17s (transform 1.52s, setup 0ms, collect 14.37s, tests 1.37s, environment 5ms, prepare 17.22s)

```

M8 tail:

```text
 FAIL  app/rebrand.test.ts > S3 rendered sidebar and controls > renders a 44px input with role border, radius, surface and visible focus
AssertionError: expected 'flex h-10 w-full rounded-[var(--radiu…' to contain 'h-11'

Expected: "h-11"
Received: "flex h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-surface)] text-[var(--color-ink)] px-3 py-1 text-sm shadow-[var(--elevation-shadow-card)] transition-colors duration-150 ease-out motion-reduce:transition-none file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] disabled:cursor-not-allowed disabled:bg-[var(--color-tint)]"

 ❯ app/rebrand.test.ts:62:242


⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/2]⎯

 Test Files  2 failed | 36 passed (38)
      Tests  2 failed | 273 passed (275)
   Start at  08:43:30
   Duration  2.50s (transform 1.53s, setup 0ms, collect 12.24s, tests 895ms, environment 5ms, prepare 15.68s)

```

M9 tail:

```text
 FAIL  app/rebrand.test.ts > S3 rendered sidebar and controls > renders solid token dialog/overlay in layer session
AssertionError: expected 'relative w-full rounded-[var(--radius…' to contain 'bg-[var(--color-surface)]'

Expected: "bg-[var(--color-surface)]"
Received: "relative w-full rounded-[var(--radius-lg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] border border-[var(--color-line)] bg-[#FFFFFF] backdrop-blur-md p-6 text-[var(--color-ink)] shadow-[var(--elevation-shadow-pop)] transition-all animate-in fade-in-0 zoom-in-95 duration-200 ease-out motion-reduce:animate-none motion-reduce:transition-none will-change-transform z-[71] max-w-sm"

 ❯ app/rebrand.test.ts:79:238


⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/3]⎯

 Test Files  1 failed | 37 passed (38)
      Tests  3 failed | 272 passed (275)
   Start at  08:43:58
   Duration  3.29s (transform 1.35s, setup 0ms, collect 14.33s, tests 1.42s, environment 5ms, prepare 17.94s)

```

## Files changed

Paths relative to portal, one per bullet. These are S3 session changes; earlier/concurrent workspace changes were preserved.

- components/layout/console-sidebar.tsx
- components/ui/input.tsx
- components/ui/dialog.tsx
- app/rebrand.test.ts
- .aidlc/runs/PORTAL-REBRAND-001/s3-report.md

## Left for later slices / pick up here

- PORTAL-SHELL owner: reconcile the out-of-scope layout-gate assertion with the approved no-blur contract; rerun the full suite.
- Architecture baseline owner: remove the two now-fixed dialog FE-09/FE-11 entries; rerun archcheck. No baseline inflation or removal done here.
- S4+: badges/toasts/status/domain surfaces, caller input/select/raw-control overrides and any modal content overrides retain their planned ownership. S3 changes the shared default only.
- S9: computed 44px height/1.5px border/12px radius, light/dark actual contrast, keyboard navigation/collapse/dialog trap/dismissal/return focus, loaded Vietnamese font faces, 375/768/1024/1440 viewports and reduced motion. Browser/Lighthouse/performance/visual AC-10 not claimed by SSR/static tests.
- Prior font acquisition restrictions, missing UI standard and operations-generated drift remain outside S3; no fix claimed.

Evidence and session-only diffs: `/tmp/rebrand-s3-evidence/`. Scratch components restored to the final live versions. No task process left running. No full harness/test-stage/ship acceptance claimed while the two out-of-scope gate issues remain.
