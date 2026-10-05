# PORTAL-REBRAND-001 — S5 report

## Outcome / decisions

S5 implemented against Dawn's approved scope: legacy login, profile, branches and memberships use warm role colours, solid surfaces, token elevations, Quicksand display headings and 44px editable controls. Semantic success is an icon alongside readable text; membership counts use ink, with distinct success/warning/danger icons. Links use the contrast-safe primary-hover role in light mode. Selects retain focus and use 1.5px input-border and the 12px radius role. Existing Input supplies the same boundary and focus roles.

No auth ownership migration/deletion. A TypeScript AST comparison with the pre-S5 snapshots, excluding only className/style, was identical for all four files: props, handlers, labels, aria, validation, state and data flow preserved. Every Button opening tag was byte-identical, including variants, sizes and handlers. app/layout-gate.test.ts was untouched and passed in the full suite. Existing behavior/accessibility gaps were not silently expanded into this visual slice.

Only the five allowed source/test files and this report were edited by S5. No ACTIVE, baseline, approval, stage, receipts, staging or commits. The user explicitly authorized removal of .next/types and .next/dev/types before typecheck; that cleanup was performed.

Harness: `hs-run cook prompt developer --phase S5` returned `waiting_on_model`, exit 10, `posture_mode: in_place`. Its envelope resolved HARNESS_DATA_ROOT to /home/dawn and measured 0 declared files, so it is posture evidence, not proof that this task's approved plan or delivery was registered. The existing plan/testkit documents the single-plan/no-phase scaffold mismatch. No harness receipts or ship attestation were created. The user's current “plan approved” instruction supersedes the plan's historical plan-only text.

## ui-ux-pro-max evidence used

Read `/home/dawn/.claude/plugins/marketplaces/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max/SKILL.md`. Both required searches exited 0, found three results from ux-guidelines.csv, and ran without persistence:

```bash
D=/home/dawn/.claude/plugins/marketplaces/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max
python3 "$D/scripts/search.py" "login form auth screen accessibility error" --domain ux
python3 "$D/scripts/search.py" "settings profile list table empty state" --domain ux
```

- Login search: Focusable Error Summary, Error Messages, Form Labels. Used the associated-label guidance to preserve login label/field associations and validation; kept readable profile error text and distinct retry/reauth actions. Adding error summaries, focus transfer or aria-live would change behavior/aria and is deferred under the explicit preservation rule.
- Settings search: Table Handling, Empty States, Active State. Preserved the existing table's horizontal-scroll wrapper, membership/profile empty messages, tab selection variants and selected/unselected branch cues. Selection uses neutral tint/ink and a tomato focus boundary; success is labelled with a semantic icon.
- Skill priority table: semantic colour tokens, visible keyboard focus and 44px controls informed removal of raw palettes and short control overrides. Quicksand/Nunito, exact palette, light sidebar and solid effects come from the approved plan/Dawn override, not invented search results. Skill suggestions lose to the plan/token table and brand v4.

`../platform-docs/standards/ui-ux.md` remains absent, as already recorded in the approved plan/S4. Read the available frontend standard and supplied brand v4. No replacement standard was authored.

## TDD red evidence

Extended app/rebrand.test.ts before production changes. Added 11 rendered tests for legacy login; profile general/membership/security, loading/error/empty states; selected/unselected branches; populated/empty membership tables and invite form. React state injection exposes client branches in the existing node SSR environment; no jsdom or production hook changes.

Intentional full-suite red: exit 1, **11 failed / 304 passed, 1 failed file / 37 passed (38)**. The assertion failures were rendered visual leftovers (including gradient and text-emerald-600), not collection failures. A preliminary test regex typo was corrected before this valid red evidence run.

Command: `ESBUILD_BINARY_PATH=~/.local/share/esbuild/esbuild-0.21.5 npm test` (full suite, no path filter).

```text

+ Received: 
"text-emerald-600"

 ❯ expectRoleSurface app/rebrand.test.ts:379:48
    377|   // caller actions and content remain in the rendered scan, including…
    378|   const owned = html.replace(/class="flex size-9 items-center justify-…
    379|   expect(owned.match(rawSurface)?.[0] ?? null).toBeNull();
       |                                                ^
    380|   expect(html).toContain("text-[var(--color-ink)]");
    381|   expect(html).toContain("bg-[var(--color-surface)]");
 ❯ app/rebrand.test.ts:455:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[7/11]⎯

 Test Files  1 failed | 37 passed (38)
      Tests  11 failed | 304 passed (315)
   Start at  09:01:59
   Duration  2.59s (transform 3.05s, setup 0ms, collect 14.39s, tests 1.80s, environment 6ms, prepare 14.24s)

```

## Final gates

All npm commands used `ESBUILD_BINARY_PATH=~/.local/share/esbuild/esbuild-0.21.5`; npm only, full suite only. Logs are in /tmp/portal-s5-evidence. Final gates were rerun after the last visual edits.

| Gate | Exit | Counts / result |
|---|---:|---|
| B, four S5 paths | 0 | 0 errors, including roles/font/contrast/generated drift checks |
| npm test | 0 | 38 files / 315 tests passed; app/rebrand.test.ts has 42 tests |
| npm run lint | 0 | 0 diagnostics |
| clean generated types + npm run typecheck | 0 | 0 diagnostics |
| archcheck | 1 | 74 violations, all 74 baselined; 0 new; 9 stale FIXED entries |

B command and literal tail:

```bash
python3 .aidlc/runs/PORTAL-REBRAND-001/testkit/check-brand.py --scan-path components/auth/login-form.tsx --scan-path 'app/(store)/me/profile-client.tsx' --scan-path features/branches/branches-view.tsx --scan-path features/memberships/memberships-view.tsx
```

```text
brand gate: 0 errors (all)
```

`npm test` literal tail:

```text
 ✓ features/platform/staff.test.ts (2 tests) 3ms
 ✓ features/platform/my-company.test.ts (3 tests) 5ms
 ✓ features/platform/role-matrix.test.ts (3 tests) 3ms
 ✓ app/(store)/traceability/traceability-page.test.tsx (1 test) 2ms
 ✓ app/(store)/layout.test.ts (1 test) 832ms
   ✓ escapes less-than in both JSON-LD scripts while preserving data 831ms

 Test Files  38 passed (38)
      Tests  315 passed (315)
   Start at  09:05:10
   Duration  5.57s (transform 5.13s, setup 0ms, collect 23.46s, tests 3.25s, environment 5ms, prepare 23.89s)

```

`npm run lint` literal tail:

```text

> @dcentervn/portal@0.1.0 lint
> node node_modules/eslint/bin/eslint.js .

```

`rm -rf .next/types .next/dev/types && npm run typecheck` literal tail:

```text

> @dcentervn/portal@0.1.0 typecheck
> node node_modules/typescript/bin/tsc --noEmit

```

`python3 ~/agent_skills/sdlc/engine/archcheck.py` complete output (also its tail):

```text
FIXED FE-09 components/auth/login-form.tsx  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-09 components/modals/confirm-qc-decision-modal.tsx  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-09 components/modals/session-timeout-modal.tsx  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-09 components/ui/badge.tsx  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-09 components/ui/dialog.tsx  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-09 components/ui/toast.tsx  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-09 features/branches/branches-view.tsx  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-09 features/memberships/memberships-view.tsx  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-11 components/ui/dialog.tsx  (delete this line from .aidlc/arch-baseline.txt)
archcheck: 74 violations, 74 baselined, 0 new, 9 stale
```

The six known stale lines (FE-09/FE-11 dialog; FE-09 badge/toast/confirm-qc/session-timeout) are ignored only as directed. **Three additional newly FIXED S5 baseline entries** must be removed by Dawn/baseline owner:

- FE-09 components/auth/login-form.tsx
- FE-09 features/branches/branches-view.tsx
- FE-09 features/memberships/memberships-view.tsx

No other new finding. Raw archcheck exit 1 is reported honestly; it is not a clean exit-0 gate. Baseline was not edited or inflated.

## Scratch mutations

Scratch: /tmp/portal-s5-mutations/portal. Created with cp -r, excluding node_modules/.next/.aidlc (also .git and .env files). Symlinked node_modules to the live installation and ../platform-docs to the existing source. Control and each mutation ran an entire npm test with the required esbuild binary. Each mutation started from final sources and was restored afterwards; scratch/live source bytes match for all four S5 surfaces. Live sources were never mutated.

| Mutation | Scratch change | Rendered detection | Suite result | Verdict |
|---|---|---|---|---|
| M13 | Login logo primary background → bg-emerald-500 | legacy login rejects bg-emerald-500 | exit 1; 1 failed / 314 passed; 1 failed file / 37 passed | Killed |
| M14 | Profile avatar/header gets bg-gradient-to-r with role stops | profile tabs and empty membership branch reject gradient | exit 1; 4 failed / 311 passed; 1 failed file / 37 passed | Killed |
| M15 | Branch CardTitle uses text-[#2A1D17] | selected/unselected branch assertion rejects hex | exit 1; 1 failed / 314 passed; 1 failed file / 37 passed | Killed |

**Killed/total: 3/3 (100%)**. All kills were S5 assertions in app/rebrand.test.ts; no compile/collection failures counted.

Control full-suite literal tail:

```text
 ✓ features/platform/role-matrix.test.ts (3 tests) 3ms
 ✓ app/(store)/traceability/traceability-page.test.tsx (1 test) 4ms
 ✓ app/(store)/layout.test.ts (1 test) 800ms
   ✓ escapes less-than in both JSON-LD scripts while preserving data 799ms

 Test Files  38 passed (38)
      Tests  315 passed (315)
   Start at  09:05:08
   Duration  3.57s (transform 2.00s, setup 0ms, collect 15.90s, tests 1.43s, environment 5ms, prepare 18.31s)

```

M13 full-suite literal tail:

```text

 ❯ expectRoleSurface app/rebrand.test.ts:379:48
    377|   // caller actions and content remain in the rendered scan, including…
    378|   const owned = html.replace(/class="flex size-9 items-center justify-…
    379|   expect(owned.match(rawSurface)?.[0] ?? null).toBeNull();
       |                                                ^
    380|   expect(html).toContain("text-[var(--color-ink)]");
    381|   expect(html).toContain("bg-[var(--color-surface)]");
 ❯ app/rebrand.test.ts:393:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed | 37 passed (38)
      Tests  1 failed | 314 passed (315)
   Start at  09:05:12
   Duration  3.73s (transform 2.01s, setup 0ms, collect 17.00s, tests 957ms, environment 6ms, prepare 28.43s)

```

M14 full-suite literal tail:

```text

 ❯ expectRoleSurface app/rebrand.test.ts:379:48
    377|   // caller actions and content remain in the rendered scan, including…
    378|   const owned = html.replace(/class="flex size-9 items-center justify-…
    379|   expect(owned.match(rawSurface)?.[0] ?? null).toBeNull();
       |                                                ^
    380|   expect(html).toContain("text-[var(--color-ink)]");
    381|   expect(html).toContain("bg-[var(--color-surface)]");
 ❯ app/rebrand.test.ts:428:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/4]⎯

 Test Files  1 failed | 37 passed (38)
      Tests  4 failed | 311 passed (315)
   Start at  09:05:17
   Duration  2.26s (transform 1.64s, setup 0ms, collect 11.17s, tests 897ms, environment 6ms, prepare 13.24s)

```

M15 full-suite literal tail:

```text

 ❯ expectRoleSurface app/rebrand.test.ts:379:48
    377|   // caller actions and content remain in the rendered scan, including…
    378|   const owned = html.replace(/class="flex size-9 items-center justify-…
    379|   expect(owned.match(rawSurface)?.[0] ?? null).toBeNull();
       |                                                ^
    380|   expect(html).toContain("text-[var(--color-ink)]");
    381|   expect(html).toContain("bg-[var(--color-surface)]");
 ❯ app/rebrand.test.ts:434:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed | 37 passed (38)
      Tests  1 failed | 314 passed (315)
   Start at  09:05:19
   Duration  2.37s (transform 2.03s, setup 0ms, collect 12.12s, tests 779ms, environment 5ms, prepare 13.46s)

```

## Files changed

Paths relative to portal, one per bullet; these are S5's changes, not the entire pre-existing dirty workspace.

- components/auth/login-form.tsx
- app/(store)/me/profile-client.tsx
- features/branches/branches-view.tsx
- features/memberships/memberships-view.tsx
- app/rebrand.test.ts
- .aidlc/runs/PORTAL-REBRAND-001/s5-report.md

## Left for later slices / pick up here

- Baseline owner: delete the three new S5 FIXED entries plus the six already-known stale entries; rerun archcheck. No waiver or baseline rewrite here.
- Shared components/ui/page.tsx PageHeader still emits a bg-sky-500/10 icon wrapper. It is outside S5's allowed file list. The rendered scan excludes only that exact shared wrapper class; caller actions/inputs and all local content remain scanned. This is a bounded S5 ownership test, not a full rendered-page brand pass or an exemption for S9. Shared h1–h3 inherit the existing Quicksand display CSS; local headings explicitly use the display role, including h4. Shared Card/Table/Button aliases are preserved.
- S6–S8: untouched domain/caller surfaces remain owned by their planned slices. Do not treat the four-path B pass as full-tree brand acceptance.
- S9: loaded Vietnamese font faces, computed colours/contrast, dimensions, keyboard/focus, both themes at 375/768/1024/1440, distinct runtime states, overflow, reduced motion and Lighthouse/performance remain pending. SSR/class/token evidence does not establish AC-10. Existing placeholder-only search controls, unassociated invite labels and profile error announcement behavior were preserved by instruction and need their accessibility owner.
- No process remains running. Scratch mutations are restored; evidence remains under /tmp. No commit or ship action was requested or performed.
