# PORTAL-REBRAND-001 — S2 report

## Outcome / where it started

Executed the user-approved S2 slice in place. Five new contract tests failed first; implementation then passed the full suite. Root loaders now use Quicksand 600/700 and Nunito 400/500/600/700/800, Vietnamese + Latin, swap, and the non-colliding --font-quicksand/--font-nunito variables. Existing S1 CSS consumes those variables.

Default Button and legacy accent CTA use solid primary/primary-ink and primary-hover; gradient removed. Variant names, sizes, props, forwarding and exports remain identical. Existing secondary/quiet variants are unchanged. Root descriptions and keywords now describe Fresh Meal Kit preparation and ingredients; current Việt Sạch identity, titles, URLs and providers remain. Viewport uses light/dark bg roles; manifest uses light bg/primary; icon uses primary/primary-ink. SVG geometry was verified identical after colour-only substitution.

## Skill searches used / decisions

Read `/home/dawn/.claude/plugins/marketplaces/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max/SKILL.md`. With `D=/home/dawn/.claude/plugins/marketplaces/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max`, ran both (exit 0, 3 results each):

```sh
python3 "$D/scripts/search.py" "next/font google vietnamese subset" --stack nextjs
python3 "$D/scripts/search.py" "solid CTA button states focus" --domain ux
```

Used `stacks/nextjs.csv`: “Use next/font for fonts” and “Apply font to layout”; root loader retained, no external font link. The variable-font suggestion did not replace the approved explicit weight lists. Used `ux-guidelines.csv`: “Focus States” and “Focus Appearance”; preserved the existing visible focus-visible:ring-2 and token-based ring. The 2px perimeter/3:1 guidance is AAA usability guidance, not an AA claim. The mobile back-button result is irrelevant and was not applied. No search result supplied solid CTA colours: the approved plan/token table supplies those. Dawn's Quicksand + Nunito and light-sidebar overrides take precedence over v4 and skill suggestions.

Also read hs:cook and surgical-patch; minimal changes, test-first, full regression and mutation proof. No new abstraction or dependency.

## Red evidence

Tests were added to app/rebrand.test.ts before production edits. Full `npm test` only, with `ESBUILD_BINARY_PATH=$HOME/.local/share/esbuild/esbuild-0.21.5`; exit 1. Failures covered both font configurations, solid default/accent CTA, browser/icon colours and factual positioning. Tail:

```text
+

 ❯ app/rebrand.test.ts:61:20
     59|     expect(layout).toContain('"https://vietsach.reborn.vn"');
     60|     expect(layout).toContain('siteName: "Việt Sạch"');
     61|     expect(layout).toContain("Fresh Meal Kit");
       |                    ^
     62|     expect(layout).not.toMatch(/hữu cơ|nông trại|VietGAP|GlobalGAP/);
     63|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/5]⎯

 Test Files  1 failed | 37 passed (38)
      Tests  5 failed | 261 passed (266)
   Start at  08:33:05
   Duration  2.47s (transform 3.15s, setup 0ms, collect 13.13s, tests 1.65s, environment 5ms, prepare 13.68s)
```

## Gate tails and counts

All npm gates used npm, not pnpm. No targeted test invocation. Test counts include the current concurrent tree; unrelated changes were left intact.

### Scoped B: pass, exit 0

```sh
python3 -B .aidlc/runs/PORTAL-REBRAND-001/testkit/check-brand.py --scan-path app/layout.tsx --scan-path components/ui/button.tsx --scan-path app/icon.svg --scan-path public/manifest.json
```

Includes exact token/font contract, byte-for-byte generated-token drift and all 59 approved contrast pairs (text >=4.5:1; boundaries/focus >=3:1), plus scoped runtime-source scan. This is static evidence.

```text
brand gate: 0 errors (all)
```

### Full npm test: pass, exit 0

```text
✓ app/(store)/traceability/traceability-page.test.tsx (1 test) 3ms
 ✓ app/(store)/layout.test.ts (1 test) 188ms

 Test Files  38 passed (38)
      Tests  266 passed (266)
   Start at  08:33:36
   Duration  2.66s (transform 2.82s, setup 0ms, collect 14.00s, tests 1.67s, environment 5ms, prepare 15.43s)
```

### npm run lint: pass, exit 0, 0 reported findings

```text
> @dcentervn/portal@0.1.0 lint
> node node_modules/eslint/bin/eslint.js .
```

### Typecheck: pass, exit 0, 0 reported errors

Ran exactly `rm -rf .next/types .next/dev/types && npm run typecheck`.

```text
> @dcentervn/portal@0.1.0 typecheck
> node node_modules/typescript/bin/tsc --noEmit
```

### Architecture: pass, exit 0

`python3 ~/agent_skills/sdlc/engine/archcheck.py`: 83 violations, all baselined, 0 new, 0 stale. No baseline edit.

```text
archcheck: 83 violations, 83 baselined, 0 new, 0 stale
```

### uigen token drift: pass; full uigen integration remains blocked

Read-only `python3 -B ../platform-docs/scripts/uigen.py tokens --root ..` exited 0. After removing only its documented output header, rendered CSS equals app/tokens.generated.css byte-for-byte: `token byte drift: False` (0 token drift). Scoped B independently verifies this.

Full `python3 -B ../platform-docs/scripts/uigen.py check --root ..` exited 1 with 1 unrelated operations-contract drift; no token drift. No regeneration performed in S2.

```text
ERROR  portal/lib/contracts/operations.generated.ts  drift, run uigen.py operations --write
check: 1 error
```

## Mutation table

Scratch: `/tmp/rebrand-s2-mutations/portal`. Copied sources with `cp -r`, omitted node_modules, .git, .next, .aidlc and environment secrets; symlinked installed node_modules and sibling platform-docs. Ran the accepted full suite first in the live tree, then one mutant at a time in scratch with full `npm test` and the same ESBUILD_BINARY_PATH. Each file was restored before the next mutant; scratch restoration was verified. No live mutation.

| Mutation | Change | Detector | Full-suite files | Full-suite tests | Verdict |
|---|---|---|---|---|---|
| M4 | Re-add linear-gradient to default Button | Runtime buttonVariants solid-primary contract | 1 failed / 37 passed (38) | 1 failed / 265 passed (266) | killed, exit 1 |
| M5 | Import/call Be_Vietnam_Pro instead of Nunito | Exact next/font import/config + old-font exclusion | 1 failed / 37 passed (38) | 2 failed / 264 passed (266) | killed, exit 1 |
| M6 | manifest theme_color back to #0f4f4a | Manifest-to-approved-primary contract | 1 failed / 37 passed (38) | 1 failed / 265 passed (266) | killed, exit 1 |

**Killed/total: 3/3 (100%).**

### M4 tail + counts

```text
Received: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer active:scale-[0.98] bg-[linear-gradient(var(--primary),var(--surface))] text-[var(--primary-foreground)] shadow-[var(--elevation-shadow-card)] hover:bg-[var(--color-primary-hover)] min-h-11 px-5"

 ❯ app/rebrand.test.ts:37:23
     35|     for (const variant of [undefined, "default", "accent"] as const) {
     36|       const classes = buttonVariants({ variant });
     37|       expect(classes).toContain("bg-[var(--primary)]");
       |                       ^
     38|       expect(classes).toContain("text-[var(--primary-foreground)]");
     39|       expect(classes).toContain("hover:bg-[var(--color-primary-hover)]…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯
```

```text
Test Files  1 failed | 37 passed (38)
      Tests  1 failed | 265 passed (266)
   Start at  08:34:37
   Duration  2.38s (transform 1.68s, setup 0ms, collect 11.41s, tests 736ms, environment 6ms, prepare 15.38s)
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
```

### M5 tail + counts

```text
"

 ❯ app/rebrand.test.ts:22:20
     20|     ["Nunito", ["400", "500", "600", "700", "800"], "--font-nunito"],
     21|   ] as const)("loads %s with Vietnamese/Latin, explicit weights and sw…
     22|     expect(layout).toMatch(new RegExp(`import \\{[^}]*\\b${font}\\b[^}…
       |                    ^
     23|     const options = layout.match(new RegExp(`const (\\w+) = ${font}\\(…
     24|     expect(options).not.toBeNull();

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/2]⎯
```

```text
Test Files  1 failed | 37 passed (38)
      Tests  2 failed | 264 passed (266)
   Start at  08:34:40
   Duration  2.42s (transform 1.52s, setup 0ms, collect 11.63s, tests 827ms, environment 5ms, prepare 15.16s)
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯
```

### M6 tail + counts

```text
Received: "#0f4f4a"

 ❯ app/rebrand.test.ts:48:34
     46|   it("matches browser chrome and icon colours to the approved light/da…
     47|     const manifest = JSON.parse(readFileSync("public/manifest.json", "…
     48|     expect(manifest.theme_color).toBe(tokens.color.light.primary.$valu…
       |                                  ^
     49|     expect(manifest.background_color).toBe(tokens.color.light.bg.$valu…
     50|     const icon = readFileSync("app/icon.svg", "utf8");

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯
```

```text
Test Files  1 failed | 37 passed (38)
      Tests  1 failed | 265 passed (266)
   Start at  08:34:43
   Duration  2.25s (transform 1.89s, setup 0ms, collect 10.64s, tests 783ms, environment 6ms, prepare 14.29s)
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
```

## Font/environment failures and acceptance limits

Isolated build workspace: `/tmp/rebrand-s2-workspace/portal`; same cp -r and node_modules-symlink strategy, no env secrets. `NEXT_TELEMETRY_DISABLED=1 npm run build` exited 1 before font loading: `Error [TurbopackInternalError]: Symlink [project]/node_modules is invalid, it points out of the filesystem root`. Retried with `npm run build -- --webpack`, exit 1:

```text
▲ Next.js 16.3.0 (webpack)
✓ Running next.config.mjs took 18ms

  Creating an optimized production build ...

> Build error occurred
Error: Could not parse output from TypeScript's --showConfig.
    at ignore-listed frames {
  type: 'Error'
}
```

To isolate font acquisition from those build failures, directly invoked the **installed next/font Google loader** with the exact approved configs, production mode, and a scratch emit callback. This uses Next's own acquisition path; no package install, external/manual font download or source workaround. Both fonts failed, exit 1; exact loader tail:

```text
mise WARN  tracking config: failed to ln -sf /tmp/rebrand-s2-workspace/portal/.mise.toml /home/dawn/.local/state/mise/tracked-configs/c218e5807419cd80: Read-only file system (os error 30)
getaddrinfo EAI_AGAIN fonts.googleapis.com

Retrying 1/3...
getaddrinfo EAI_AGAIN fonts.googleapis.com

Retrying 2/3...
getaddrinfo EAI_AGAIN fonts.googleapis.com

Retrying 3/3...
Error: getaddrinfo EAI_AGAIN fonts.googleapis.com
    at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26) {
  errno: -3001,
  code: 'EAI_AGAIN',
  syscall: 'getaddrinfo',
  hostname: 'fonts.googleapis.com'
}
Quicksand: Failed to fetch `Quicksand` from Google Fonts.
getaddrinfo EAI_AGAIN fonts.googleapis.com

Retrying 1/3...
getaddrinfo EAI_AGAIN fonts.googleapis.com

Retrying 2/3...
getaddrinfo EAI_AGAIN fonts.googleapis.com

Retrying 3/3...
Error: getaddrinfo EAI_AGAIN fonts.googleapis.com
    at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26) {
  errno: -3001,
  code: 'EAI_AGAIN',
  syscall: 'getaddrinfo',
  hostname: 'fonts.googleapis.com'
}
Nunito: Failed to fetch `Nunito` from Google Fonts.
```

AC-3 loader wiring/configuration is statically proven; downloaded/loaded font faces and Vietnamese rendering are **not** proven. The node-environment tests do not claim browser font loading. No build, runtime viewport/keyboard, Lighthouse or visual acceptance claimed.

## Harness / scope limits

Read the board, approved plan Requirements/Technical/UX/Design/S2, S1 report, brand v4 and testkit env/errors/gate. `../platform-docs/standards/ui-ux.md` is still missing; frontend.md was read. No replacement standard created.

`hs-run cook next --plan /mnt/win_d/feature/ticket/portal/.aidlc/runs/PORTAL-REBRAND-001/plan.md` returned exit 2, `not_startable`, `plan status is None — cook cannot act on it`. This is the existing harness-format mismatch, not a withdrawal of the user's explicit approval. `hs-run cook prompt developer --phase S2` returned in_place (0 harness-declared files <=8; the real user boundary is 5 files). No stage advancement, receipts, approval, staging, commit or ship attestation. No .aidlc/ACTIVE or other runs edited. Concurrent modal/auth/layout-gate files were left alone.

## Files changed / key files

Paths relative to portal, one per bullet:

- app/layout.tsx
- components/ui/button.tsx
- app/icon.svg
- public/manifest.json
- app/rebrand.test.ts
- .aidlc/runs/PORTAL-REBRAND-001/s2-report.md

## Left for later slices / pick up here

- S3–S8 retain their planned sidebar, inputs, dialog, status and domain-screen ownership. Secondary/link/disabled/destructive state styling still needs the final AC-5/6/9 runtime audit; existing secondary test expects primary text, and S2 retained that surrounding behavior. No full-domain brand acceptance claimed.
- S9 must run the unscoped brand gate and browser protocol in both themes at 375/768/1024/1440px, including Vietnamese loaded-face evidence, controls/focus, states, contrast and performance. Rerun font acquisition where fonts.googleapis.com is reachable.
- Separate owner must resolve operations.generated.ts drift before full uigen integration can pass.
- Harness-format mismatch and missing UI standard remain recorded; no forbidden scaffold or state edit attempted.

Raw logs: `/tmp/rebrand-s2-evidence/`. Scratch copies remain for review; no task process left running. Continue with S3 after its ownership check. S2 static implementation gates pass; loaded-font/browser acceptance remains pending.
