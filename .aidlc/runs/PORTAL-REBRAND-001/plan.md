---
task: PORTAL-REBRAND-001
mode: hard
tdd: true
in_place: true
---

# Plan: Fresh Meal Kit brand through the existing portal token pipeline

- Task ID: `PORTAL-REBRAND-001`.
- Stage: plan only; not approved. No cook, test-stage attestation, ship, receipts, staging or commits in this session.
- Complexity: standard · 9 slices · risk: shared shell ownership, theme contrast and generated-token drift.
- Current write boundary: this `plan.md` and this run's `testkit/**` only. All implementation paths below are future work.

## Scope (outcome metric)

Outcome: Fresh Meal Kit positioning, one tomato-red primary, warm neutrals, Quicksand headings and Nunito body, solid surfaces, a light sidebar in light mode and 44–48px form inputs. Completion means **zero brand-gate findings**, byte-identical generated CSS versus the existing uigen renderer, all approved text/background combinations ≥4.5:1, control boundaries/focus ≥3:1, and the UI cases below passing at 375/768/1024/1440px in both themes.

Boundaries: colour/font/effect/input-size changes only; keep routing, auth/session handling, authorization, data hooks, dialog behavior and shell structure. No new logo or production rename to “Bếp Tươi”: it remains a working name at v4:4,105. No farm/organic claims introduced. Any metadata already describing organic positioning is narrowed to factual meal-kit/food preparation language without changing the current product name or URL (`app/layout.tsx:26–40`). No new stock/AI food imagery.

Concurrency prerequisite: `PORTAL-SHELL-001` owns many of these surfaces (`.aidlc/runs/PORTAL-SHELL-001/plan.md:267–291`). **Do not cook overlapping files while that owner is fixing them.** Obtain its completed handoff, re-read the resulting files, and remove already-fixed paths from each slice before implementation. Never restore earlier shell snapshots or copy its preview fixtures into production. No files of that task are changed by this plan.

Observed baseline: `app/layout.tsx:2,14,103` still loads Be Vietnam Pro; `components/ui/button.tsx:11` uses `linear-gradient`; `components/ui/dialog.tsx:116,122,128` uses backdrop blur; `components/ui/input.tsx:10` is `h-9`; `app/globals.css:87–88` defines independent green landing ramps; `app/icon.svg:1` is green; `public/manifest.json:7` has a teal theme. The runnable gate captures remaining exact paths/lines in `testkit/baseline-brand-gate.txt`. This is a concurrent-tree snapshot, not a claim that the shell owner's changes failed.

## Requirements

- FR-1 — Single source of theme truth.
  - AC-1: Given the existing light/dark token source and renderer, When brand role values are updated, Then light/dark role values match the token table below; key shape is preserved and uigen is used without hand edits; generated output equals the renderer byte-for-byte, including order/newlines.
  - AC-2: Given the generated role tokens, When global aliases and shared shadows are resolved, Then `globals.css` continues importing generated CSS; shadcn, status, tag and landing aliases reference role tokens. Remove the independent green ramps and any green-tinted neutral aliases. Shared shadows come from elevation tokens.
- FR-2 — Typography and positioning.
  - AC-3: Given the root font loader and Vietnamese/Latin text, When the typography override is applied, Then root `next/font` uses Quicksand 600/700 for headings and Nunito 400/500/600/700/800 for body with Vietnamese/Latin subsets and swap. No Be Vietnam Pro import, instance, fallback or token remains in runtime sources. Verify the loaded faces with Vietnamese text rather than testing only class strings.
  - AC-4: Given the existing root SEO and product identity, When meal-kit positioning is applied, Then no new farm/organic positioning; adjust existing root SEO descriptions/keywords to factual Fresh Meal Kit language. Preserve brand name, site URL, auth flows and real product content pending a naming decision.
- FR-3 — One primary colour and accessible semantics.
  - AC-5: Given normal CTA, secondary/quiet actions and semantic states in every domain, When their colour roles are applied, Then normal CTA defaults to tomato primary in all domains; secondary/quiet actions stay neutral. Keep turmeric accent/sun keys for semantic warmth, not a competing decorative or purchase CTA. Success leaf is only a state indicator alongside a label/icon and `ink` text; never a navigation, logo, heading or decorative green ramp.
  - AC-6: Given every used text/background pair in both themes, When unrounded contrast and active/destructive states are checked, Then every used text pair meets 4.5:1 before rounding. No opacity-dimmed labels bypass contrast. Light links use primary-hover, not primary on cream/tint. Light info on tint uses `ink` text plus an info indicator. Destructive buttons use white text in light and warm dark text in dark; do not keep unconditional white destructive text. Active sidebar text uses ink on tint, with tomato indicator and aria-current.
- FR-4 — Solid, warm surfaces.
  - AC-7: Given runtime styles, JSX, SVG assets, hero and overlays, When solid-surface styling is applied, Then no glass/backdrop-filter/backdrop-blur/gradient in runtime styles, JSX or SVG assets, including hero, overlays and arbitrary `linear-gradient(...)` utilities. v4:86–87 grants **no hero exception**. Preserve modal dismissal/focus-trap behavior; use a solid-colour scrim with opacity.
  - AC-8: Given the existing sidebar and footer in both themes, When their brand roles are applied, Then light-mode sidebar uses surface/ink/muted, active tint and tomato focus/indicator; dark-mode sidebar uses the corresponding warm dark roles. Replace white alpha overlays and decorative sun icons with neutral/primary roles without changing collapse widths, navigation matching or role access. Footer can remain a warm dark surface.
- FR-5 — Forms and accessibility.
  - AC-9: Given editable text/password/select inputs and small non-form buttons, When form sizing and keyboard interaction are checked, Then default editable text/password/select inputs are 44–48px high with 1.5px input-border, 12px radius, visible labels, visible keyboard focus and semantic error/status text. Small non-form buttons may retain the kit's 36px variant; full touch target must be ≥44px. Keep names, autocomplete, password visibility state and disabled behavior.
  - AC-10: Given changed UI cases and data screens in light/dark at 375/768/1024/1440px, When keyboard navigation and runtime audits are exercised, Then UI cases pass in light/dark, four viewport widths and keyboard navigation. For changed data screens, distinct loading/empty/error/success states remain visible. No horizontal viewport overflow, hidden focus, console error or HTTP ≥500; Lighthouse accessibility ≥90, LCP ≤2.5s and First Load JS ≤200kB per frontend standard (`../platform-docs/standards/frontend.md:50–54`). Static scans cannot establish this AC.

## Technical definition

Reuse `../platform-docs/ui/tokens.json → ../platform-docs/scripts/uigen.py → app/tokens.generated.css → app/globals.css`; never introduce another token generator. Existing pipeline: `.aidlc/runs/PORTAL-BRAND-001/plan.md:17` and `app/globals.css:2`. Preserve JSON groups, token names and `$type`/`$value`; v4 source: `../platform-docs/ui/2026-09-29-brand-dna-v4-bep-tuoi.md:94–101`.

- Ensure next/font variable names do not collide with generated token names: use `--font-quicksand`/`--font-nunito`, and CSS aliases that reference those variables with token fallbacks. Verify loaded font faces with Vietnamese text as required by AC-3.
- Layer rules: `ui → layout → features → app` per `../platform-docs/standards/frontend.md:29–33`; layout receives props and app composes routes. FE-01: UI primitives cannot import features, app, lib/api, patterns or layout. FE-02: components cannot import features or app. FE-03: fetch calls belong only in `lib/api/` or `lib/fetcher.ts`, including BFF handlers. FE-04: features cannot import other features; share through patterns or lib. FE-05: sample/mock/fake/dummy constants belong in tests/MSW, not production code.
- Vitest stays in the existing `node` environment; use static render and pure-function assertions for component checks, with the browser protocol for loaded fonts, dimensions, focus and interactive states. Do not add jsdom.
- `archcheck` must report no new violations. The existing baseline can only shrink; never inflate it to accept this rebrand.

Existing shell `--color-chrome` drift: generated CSS mentions chrome while the observed source JSON does not. Do not add a new JSON group to solve it. If the shell owner adds a chrome key before handoff, preserve that key and make its value warm dark (light #2A1D17, dark #1D1714) for footer use; otherwise derive the footer alias from existing ink/bg tokens in globals. Sidebar uses surface regardless. This conditional path must be resolved against the completed shell before cook.

## UX

Follow brand v4 for exact colours, solid effects and factual meal-kit positioning, with Dawn's explicit Quicksand/Nunito and light-sidebar overrides. Preserve the existing shell structure and navigation flows. The skill evidence below records the precedence and conflicting recommendations.

- Light sidebar: `surface`/`ink`/`muted`, active `tint`, tomato focus/indicator and `aria-current`; dark mode uses corresponding warm dark roles. Preserve collapse widths, navigation matching and role access; the footer may remain warm dark.
- Editable text/password/select inputs: 44–48px height, 1.5px `input-border`, 12px radius, visible associated labels and semantic error/status text. Small non-form buttons may keep 36px sizing with a full touch target ≥44px; preserve names, autocomplete, password visibility and disabled behavior.
- Visible keyboard focus ring on every interactive control, including modal controls, with control/focus contrast ≥3:1. Use the 2px perimeter usability target recorded in the skill evidence; preserve dismissal/focus-trap behavior and avoid hidden focus.
- Solid-colour scrim with opacity; no glass, backdrop filter/blur or gradients, including hero and overlays.
- Hover/state transitions 150/200ms ease-out; honor reduced motion (v4:90).
- Validate light/dark at all four widths: 375/768/1024/1440px. Keep loading/empty/error/success states distinct and visible, with no horizontal viewport overflow, console errors or HTTP ≥500; runtime/performance thresholds remain in AC-10 and Tests planned.

### Design evidence (skill output)

Mandatory skill read: `/home/dawn/.claude/plugins/marketplaces/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max/SKILL.md`. Commands ran without `--persist`; full literal stdout, arguments and exit codes are in `testkit/design-searches.txt`.

With `D=/home/dawn/.claude/plugins/marketplaces/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max`, executed:

1. `python3 "$D/scripts/search.py" "fresh meal kit food ecommerce operator console" --design-system -p "Bep Tuoi"`
2. `python3 "$D/scripts/search.py" "tomato red food" --domain color`
3. `python3 "$D/scripts/search.py" "Quicksand Nunito" --domain typography`
4. `python3 "$D/scripts/search.py" "form input sidebar accessibility" --domain ux`
5. `python3 "$D/scripts/search.py" "nextjs tailwind" --stack nextjs`

Relevant returned evidence:

- System: “Primary: #059669”, “Secondary: #10B981”, “Accent/CTA: #EA580C”, “Background: #ECFDF5”, “Foreground: #064E3B”, “Rubik / Nunito Sans”. These green/grocery and font recommendations **lose to the brand requirements**. The showcase/hero/scroll-snap recommendation is a consumer marketing pattern; it does not replace the existing operator-console shell. Applicable checklist: “Light mode: text contrast 4.5:1 minimum”, “Focus states visible for keyboard nav”, “prefers-reduced-motion respected”, “Responsive: 375px, 768px, 1024px, 1440px”.
- Color result 1, Restaurant/Food Service: “Primary: #DC2626”, “On Primary: #FFFFFF”, “Secondary: #F87171”, “Accent: #A16207”, “Background: #FEF2F2”, “Foreground: #450A0A”; “Appetizing red + warm gold [Accent adjusted from #CA8A04]”. Food-service red direction fits; the exact palette loses to v4's #D2402A/#FBF6EE/#2A1D17. System “on primary #000000” is not copied into the light tomato CTA; compute the actual brand pair (4.66:1 white/tomato).
- Typography query did **not** return Quicksand/Nunito as a verified pair. It returned “Handwritten Charm” (Caveat/Quicksand), “Claymorphism Mobile (Nunito + DM Sans)” and “Playful Creative” (Fredoka/Nunito). One narrower retry, `"rounded friendly" --domain typography`, returned “Soft Rounded”, Varela Round/Nunito Sans. None is adopted. The requested Quicksand/Nunito pairing is an explicit prompt override, not a claimed database result; no Caveat, claymorphism or children's styling.
- UX: “Inputs must have associated labels”, “Use label with for attribute or wrap input”, “Don't: Placeholder-only inputs”; “Use email tel number url etc”; “Every input needs a visible label”. Skill priority table also specifies “Min size 44×44px”, “8px+ spacing”, base 16px/line-height 1.5 and semantic colour tokens.
- Initial Next.js query found **0 results**. One retry, `"font optimization" --stack nextjs`, returned “Use next/font for fonts”, “next/font/google or next/font/local”, “Don't: External font links”, “Apply font to layout”. Confirmed local stack: `package.json:19,21,28`, Next 16.3/React 19/Tailwind 4. Guidance's advertised Next 16.2 compatibility is advisory; reuse the current loader and test local behavior.
- Additional focused query `"keyboard focus contrast" --domain ux`: “Use a visible focus ring on every interactive control, including modal controls”. Its 2px perimeter and enhanced wholly unobscured focus guidance is explicitly AAA, not mislabeled AA. Adopt as a usability target; the gate computes 3:1 control/focus contrast.

Precedence: explicit current user choices → v4 exact colour/effect/positioning rules → frontend architecture → skill suggestions. v4:72–74,100 specifies Noto Serif/Be Vietnam Pro and discourages Quicksand; v4:88 specifies a dark sidebar. The current prompt explicitly overrides both with Quicksand/Nunito and a light sidebar. v4:46 and its later contrast example also disagree on dark info hex: use the actual token table #8DB8E8, not the example #B9D0F2; the computed ratio is 8.57:1 on dark bg.

## Design

Map existing components to the role tokens below; preserve behavior and shell ownership. Exact light/dark values and permitted contrast pairs are specified in the token table.

| Component | Role tokens |
|---|---|
| Page, cards and tables | `bg`, `surface`, `ink`, `muted`, decorative `line` |
| Default CTA / destructive action | `primary`, `primary-hover`, `primary-ink` / `danger`, theme-dependent `primary-ink` |
| Sidebar / selected navigation | `surface`, `ink`, `muted`, `tint`, `primary`, `focus` |
| Input / keyboard focus | `surface`, `ink`, `input-border`, `focus`, `danger` |
| Badge / toast / status text | `ink`, `leaf`, `info`, `warn-ink`, `danger`, semantic `accent`/`sun`; label/icon alongside indicators |
| Dialog / scrim | `surface`, `ink`, solid-colour scrim with opacity; elevation tokens |
| Footer | Existing `chrome` key if supplied by shell handoff; otherwise alias from `ink`/`bg`, as defined in Technical definition |

### Token table

Exact colours from v4:33–51; no secondary brand colour is added. Warm cream/brown neutrals follow that table. Typography override: `font.display = "Quicksand", system-ui, sans-serif`; `font.sans = "Nunito", system-ui, -apple-system, "Segoe UI", sans-serif`. Elevation: card `0 2px 8px rgb(42 29 23 / .08)`; pop `0 12px 28px rgb(42 29 23 / .18)` (v4:87). Radii 8/12/16/9999px (v4:89).

| Role | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#FBF6EE` | `#1D1714` | Page |
| `surface` | `#FFFFFF` | `#2A211C` | Cards, tables, sidebar |
| `tint` | `#F5E9DA` | `#352821` | Neutral secondary/selected surface |
| `ink` | `#2A1D17` | `#F8EFE5` | Body/status label |
| `muted` | `#6F5C50` | `#C2B2A4` | Secondary text |
| `primary` | `#D2402A` | `#F07A5F` | Only default CTA brand colour |
| `primary-ink` | `#FFFFFF` | `#1D1714` | CTA/destructive foreground |
| `primary-hover` | `#B93623` | `#E56449` | CTA hover; light text links |
| `leaf` | `#3E8E4A` | `#70B878` | Success indicator only |
| `accent` | `#F2A33A` | `#F2A33A` | Semantic warm emphasis; not competing CTA |
| `accent-ink` | `#2A1D17` | `#2A1D17` | Text on turmeric |
| `accent-hover` | `#DB8A26` | `#DB8A26` | Turmeric hover |
| `sun` | `#F2A33A` | `#F2A33A` | Semantic warm indicator |
| `info` | `#2E6FAD` | `#8DB8E8` | Information, restricted background pairs |
| `danger` | `#9B2C55` | `#E46A83` | Error text/destructive background |
| `warn-ink` | `#805000` | `#F2C56F` | Warning text |
| `line` | `#EADFD0` | `#49372C` | Decorative divider only |
| `input-border` | `#8A7464` | `#8D7667` | Interactive boundary |
| `focus` | `#B93623` | `#F07A5F` | Keyboard indicator |

Computed sRGB ratios: normalize channel to 0–1; linearize with `c/12.92` when `c≤0.04045`, otherwise `((c+0.055)/1.055)^2.4`; luminance `0.2126R+0.7152G+0.0722B`; contrast `(Lmax+0.05)/(Lmin+0.05)`. Decisions compare the unrounded ratio; display rounds to 2 decimals. Reproduce with `python3 -B .aidlc/runs/PORTAL-REBRAND-001/testkit/check-brand.py --contrast-table`; full hex-by-pair output in `testkit/contrast-table.md`.

Text ratios below are shown in order **bg / surface / tint**. Every allowed normal-text combination is ≥4.5:1. N/A means forbidden, not a pass.

| Text role | Light ratios: bg / surface / tint | Dark ratios: bg / surface / tint |
|---|---|---|
| ink | 15.17 / 16.32 / 13.64 | 15.59 / 13.86 / 12.51 |
| muted | 5.87 / 6.32 / 5.28 | 8.61 / 7.65 / 6.91 |
| danger | 6.77 / 7.28 / 6.08 | 5.64 / 5.02 / 4.53 |
| info | 4.89 / 5.26 / N/A (4.39) | 8.57 / 7.62 / 6.88 |
| warn-ink | 6.37 / 6.85 / 5.73 | 10.96 / 9.75 / 8.80 |
| link (primary-hover light; primary dark) | 5.40 / 5.81 / 4.86 | 6.46 / 5.74 / 5.18 |

| Text / background | Light ratio | Dark ratio |
|---|---:|---:|
| primary-ink / primary | 4.66:1 | 6.46:1 |
| primary-ink / primary-hover | 5.81:1 | 5.28:1 |
| accent-ink / accent | 7.83:1 | 7.83:1 |
| accent-ink / accent-hover | 5.97:1 | 5.97:1 |
| accent-ink / sun | 7.83:1 | 7.83:1 |
| primary-ink / danger | 7.28:1 | 5.64:1 |

Control/indicator contrasts (3:1 target), also bg / surface / tint:

| Indicator | Light: bg / surface / tint | Dark: bg / surface / tint |
|---|---|---|
| input-border | 4.10 / 4.41 / 3.68 | 4.15 / 3.69 / 3.33 |
| focus | 5.40 / 5.81 / 4.86 | 6.46 / 5.74 / 5.18 |

Prohibited examples, computed separately: light primary on bg 4.33:1 and on tint 3.89:1; light info on tint **4.39:1**. Use primary-hover links or ink text instead. Leaf is not approved for status text: success uses ink plus a non-colour cue. `line` is decorative only; it cannot replace input-border or focus on an interactive boundary. No text pairs are assigned to surface, tint, line or leaf roles themselves.

## Files planned

All paths are exact, relative to portal unless beginning `../`. This inventory is future implementation; shell-owned paths are blocked until its handoff. Existing test files may be extended only if the handoff reveals a necessary assertion change; update this plan before adding any path absent below.

- `../platform-docs/ui/tokens.json`
- `app/tokens.generated.css`
- `app/globals.css`
- `app/rebrand.test.ts`
- `app/layout.tsx`
- `components/ui/button.tsx`
- `app/icon.svg`
- `public/manifest.json`
- `components/layout/console-sidebar.tsx`
- `components/ui/input.tsx`
- `components/ui/dialog.tsx`
- `components/ui/badge.tsx`
- `components/ui/toast.tsx`
- `components/modals/confirm-qc-decision-modal.tsx`
- `components/modals/session-timeout-modal.tsx`
- `components/auth/login-form.tsx`
- `app/(store)/me/profile-client.tsx`
- `features/branches/branches-view.tsx`
- `features/memberships/memberships-view.tsx`
- `features/inventory/shelves-view.tsx`
- `features/roles/roles-view.tsx`
- `features/production/orders-view.tsx`
- `features/production/qc-view.tsx`
- `features/production/targets-view.tsx`
- `features/products/cart-view.tsx`
- `features/products/orders-view.tsx`
- `features/products/product-create-dialog.tsx`
- `features/products/product-detail-view.tsx`
- `features/products/products-view.tsx`
- `features/traceability/trace-view.tsx`
- `.aidlc/runs/PORTAL-REBRAND-001/testkit/ui-cases.md`
- `.aidlc/runs/PORTAL-REBRAND-001/testkit/errors.md`

The following additional paths are the plan/testkit delivery itself, not implementation code or receipts:

- `.aidlc/runs/PORTAL-REBRAND-001/plan.md`
- `.aidlc/runs/PORTAL-REBRAND-001/testkit/check-brand.py`
- `.aidlc/runs/PORTAL-REBRAND-001/testkit/env.md`
- `.aidlc/runs/PORTAL-REBRAND-001/testkit/design-searches.txt`
- `.aidlc/runs/PORTAL-REBRAND-001/testkit/env-probes.txt`
- `.aidlc/runs/PORTAL-REBRAND-001/testkit/startup-probe.txt`
- `.aidlc/runs/PORTAL-REBRAND-001/testkit/baseline-brand-gate.txt`
- `.aidlc/runs/PORTAL-REBRAND-001/testkit/mutation-results.txt`
- `.aidlc/runs/PORTAL-REBRAND-001/testkit/contrast-table.md`
- `.aidlc/runs/PORTAL-REBRAND-001/testkit/harness-projection.txt`

## Tests planned (TC ↔ AC ↔ command)

Define the shell function `B() { python3 -B .aidlc/runs/PORTAL-REBRAND-001/testkit/check-brand.py "$@"; }` in portal before using the slice commands. For each slice below, run its exact B command before edits and observe the relevant failure, then rerun after edits. Full-tree B is the final red→green oracle; no final scoped scan or baseline waiver.

| TC | AC | Command / observable oracle |
|---|---|---|
| TC-1 token source, fonts, drift | AC-1,3,6 | `python3 -B .aidlc/runs/PORTAL-REBRAND-001/testkit/check-brand.py --section tokens`; byte comparison invokes existing uigen, no reimplementation |
| TC-2 forbidden leftovers | AC-2,3,5,7 | `python3 -B .aidlc/runs/PORTAL-REBRAND-001/testkit/check-brand.py --section scan`; grep/regex covers #1B5E20, old green ramp/aliases, green/emerald/teal classes, Be Vietnam Pro, backdrop blur/filter, gradients including arbitrary CSS |
| TC-3 contrast | AC-6,8,9 | `python3 -B .aidlc/runs/PORTAL-REBRAND-001/testkit/check-brand.py --section contrast`; normal text ≥4.5 and control/focus ≥3; forbidden light info/tint is intentionally never used |
| TC-4 gate mutation contract | AC-1,3,6,7 | `python3 -B .aidlc/runs/PORTAL-REBRAND-001/testkit/check-brand.py --self-test`; positive fixture passes, all M1–M9 must fail their relevant validator |
| TC-5 component behavior | AC-3,5,7,8,9 | `npm test` (full suite); extend `app/rebrand.test.ts` first with independently specified expected roles: default CTA, theme-dependent destructive foreground, surface/ink sidebar, label/input associations, solid modal scrim and no function/navigation/auth regressions. Preserve existing behavior tests. Assertions must observe rendered elements/accessible names or actual stylesheet values rather than simply reproduce the implementation's class construction |
| TC-6 runtime appearance, fonts, dimensions, states | AC-3–10 | `npm run dev -- --hostname 127.0.0.1 --port 3000`, followed by the browser protocol in `testkit/ui-cases.md`; inspect computed font family and loaded faces, text/background pixels, bounding boxes and focus. This is a manual/browser check with explicit oracles, **not automated by starting the server** |
| TC-7 lint/type/architecture | all | `npm run lint`; `npm run typecheck`; `python3 ~/agent_skills/sdlc/engine/archcheck.py`; no new architecture violations and no baseline inflation |
| TC-8 generator integration | AC-1 | `python3 ../platform-docs/scripts/uigen.py check --root ..`; report token and operations drift separately; never regenerate unrelated operations to make this task green |
| TC-9 performance/accessibility | AC-10 | `npm run build`; on the local production server run the available Lighthouse browser audit for the routes in `testkit/ui-cases.md`; capture a11y/LCP and build's route bundle sizes. Runner availability is an open prerequisite, not evidence already obtained |

Mutation acceptance (run only on throwaway fixtures under testkit, never on concurrent live files):

| Mutant | Test that must turn red |
|---|---|
| M1 restore `#1B5E20` in runtime component | TC-2 LEFTOVER |
| M2 restore `Be Vietnam Pro` | TC-2 LEFTOVER; token/font restoration also TC-1 FONT |
| M3 restore modal `backdrop-blur-md` | TC-2 LEFTOVER |
| M4 restore `bg-gradient-to-tr` | TC-2 LEFTOVER |
| M5 restore arbitrary `linear-gradient(...)` | TC-2 LEFTOVER |
| M6 restore `bg-emerald-600` | TC-2 LEFTOVER |
| M7 edit generated CSS without changing JSON | TC-1 DRIFT |
| M8 restore green source primary and regenerate | TC-1 TOKEN, even though generated CSS now matches |
| M9 make muted text `#CCCCCC` and regenerate | TC-3 CONTRAST |

The checker's fixture self-test passed during planning; this does not mean the portal passes. It also preserves business `break-glass` terminology/variables: those are authorization concepts, not a visual glass utility. Scanning scope excludes test/spec files and historical AIDLC plans, so documented mutant strings do not themselves fail the gate.

## Slices

Every slice has the same mandatory gates: **`npm test` (entire suite), `npm run lint`, `npm run typecheck`, `python3 ~/agent_skills/sdlc/engine/archcheck.py`**, plus its B red gate below. These are run after each implemented slice; no `npm test -- path`. No gate is claimed to have passed during this plan-only session. S1–S8 scoped gates always also validate JSON roles, fonts, contrast and generated drift; outstanding untouched-file findings remain visible in full B and must be zero at S9.

- [x] S1: token pipeline and all CSS aliases become warm tomato roles (files: ../platform-docs/ui/tokens.json, app/tokens.generated.css, app/globals.css, app/rebrand.test.ts; test: `B --scan-path app/globals.css`, `npm test`, `npm run lint`, `npm run typecheck`, `python3 ~/agent_skills/sdlc/engine/archcheck.py`). First add contract tests; update JSON including fonts/shadows; regenerate with existing uigen. Remove local green/status/landing hex ramps and use contrast-safe aliases. S1 also contains the tokens' font definitions; the actual font loader follows in S2.
- [x] S2: root fonts, solid tomato CTA and browser brand colours agree (files: app/layout.tsx, components/ui/button.tsx, app/icon.svg, public/manifest.json, app/rebrand.test.ts; test: `B --scan-path app/layout.tsx --scan-path components/ui/button.tsx --scan-path app/icon.svg --scan-path public/manifest.json`, `npm test`, `npm run lint`, `npm run typecheck`, `python3 ~/agent_skills/sdlc/engine/archcheck.py`). Remove button gradient; preserve variants/size API; neutralize accent purchase overrides. Keep current logo geometry until a real logo decision.
- [x] S3: sidebar, form size and modal surfaces meet the new kit (files: components/layout/console-sidebar.tsx, components/ui/input.tsx, components/ui/dialog.tsx, app/rebrand.test.ts; test: `B --scan-path components/layout/console-sidebar.tsx --scan-path components/ui/input.tsx --scan-path components/ui/dialog.tsx`, `npm test`, `npm run lint`, `npm run typecheck`, `python3 ~/agent_skills/sdlc/engine/archcheck.py`). Start with rendered sidebar/control assertions that fail on the old implementation. Input defaults to 44px; verify selects/raw input overrides during later slices and UI cases.
- [x] S4: shared status and modal content lose raw green/blur decoration (files: components/ui/badge.tsx, components/ui/toast.tsx, components/modals/confirm-qc-decision-modal.tsx, components/modals/session-timeout-modal.tsx, app/rebrand.test.ts; test: `B --scan-path components/ui/badge.tsx --scan-path components/ui/toast.tsx --scan-path components/modals/confirm-qc-decision-modal.tsx --scan-path components/modals/session-timeout-modal.tsx`, `npm test`, `npm run lint`, `npm run typecheck`, `python3 ~/agent_skills/sdlc/engine/archcheck.py`). State colour remains semantic and includes text/icon; no green text on cream.
- [x] S5: auth/profile/branch/membership surfaces use roles (files: components/auth/login-form.tsx, app/(store)/me/profile-client.tsx, features/branches/branches-view.tsx, features/memberships/memberships-view.tsx, app/rebrand.test.ts; test: `B --scan-path components/auth/login-form.tsx --scan-path 'app/(store)/me/profile-client.tsx' --scan-path features/branches/branches-view.tsx --scan-path features/memberships/memberships-view.tsx`, `npm test`, `npm run lint`, `npm run typecheck`, `python3 ~/agent_skills/sdlc/engine/archcheck.py`). Do not migrate or delete legacy auth ownership; just remove runtime visual leftovers if it still exists at handoff.
- [x] S6: inventory/roles/production state controls use accessible semantics (files: features/inventory/shelves-view.tsx, features/roles/roles-view.tsx, features/production/orders-view.tsx, features/production/qc-view.tsx, app/rebrand.test.ts; test: `B --scan-path features/inventory/shelves-view.tsx --scan-path features/roles/roles-view.tsx --scan-path features/production/orders-view.tsx --scan-path features/production/qc-view.tsx`, `npm test`, `npm run lint`, `npm run typecheck`, `python3 ~/agent_skills/sdlc/engine/archcheck.py`). Preserve authorization and existing state transitions.
- [x] S7: production targets and order/cart/create controls use one primary (files: features/production/targets-view.tsx, features/products/cart-view.tsx, features/products/orders-view.tsx, features/products/product-create-dialog.tsx, app/rebrand.test.ts; test: `B --scan-path features/production/targets-view.tsx --scan-path features/products/cart-view.tsx --scan-path features/products/orders-view.tsx --scan-path features/products/product-create-dialog.tsx`, `npm test`, `npm run lint`, `npm run typecheck`, `python3 ~/agent_skills/sdlc/engine/archcheck.py`). Preserve totals, submissions, errors and product data.
- [x] S8: product and traceability presentation completes the colour sweep (files: features/products/product-detail-view.tsx, features/products/products-view.tsx, features/traceability/trace-view.tsx, app/rebrand.test.ts; test: `B --scan-path features/products/product-detail-view.tsx --scan-path features/products/products-view.tsx --scan-path features/traceability/trace-view.tsx`, `npm test`, `npm run lint`, `npm run typecheck`, `python3 ~/agent_skills/sdlc/engine/archcheck.py`). No fake imagery/content or API changes; remove gradient banners and competing green CTA/status-text styling.
- [x] S9: complete brand and browser acceptance without exemptions (files: .aidlc/runs/PORTAL-REBRAND-001/testkit/ui-cases.md, .aidlc/runs/PORTAL-REBRAND-001/testkit/errors.md; test: full `B` without `--scan-path`, `B --self-test`, `npm test`, `npm run lint`, `npm run typecheck`, `python3 ~/agent_skills/sdlc/engine/archcheck.py`, TC-6/8/9). Update only the UI-case/error documentation with observed results; future evidence destinations are outside this plan-only write authorization and need a separately authorized delivery phase.

Dependency order: S1 → S2 → S3 → S4 → S5 → S6 → S7 → S8 → S9. No parallel workers on the shared test file or shell files. Before each slice, re-probe its current file list; changed/missing ownership or a newly found violating file requires an amended plan, never a silent extra edit. All slices are ≤5 files, including the test file and cross-repository token source.

## Risks/rollback

- Missing `../platform-docs/standards/ui-ux.md` is observed; no substitute is falsely attributed to it and no standard is authored outside the allowed file set. Use the supplied v4 rules and existing frontend standard for planning; recover/read the missing standard before cook if the owner supplies it.
- Live uigen check currently reports both CSS drift and operations drift (`testkit/env-probes.txt`). Token drift belongs here. Operations drift belongs to its owner; a full generator integration gate cannot be called green until resolved, but this task must not edit its contract.
- Local startup in an isolated portal copy failed `listen EPERM ... 127.0.0.1:3199`. Browser/visual checks are pending; no screenshots, Lighthouse or runtime pass is invented. No Playwright package is installed locally; use the enabled browser tooling/manual protocol or provide an existing runner in a later authorized phase.
- Token/font namespace collision can cause fallback fonts: test loaded font faces, not only imported names. Restricted network can block font download during build; record the actual failure before considering already-owned local fonts. No package install or font download in this plan session.
- Shared JSON/generated CSS must land together in future delivery. Cross-repo token source is outside the current writable project; implementation needs an authorized writable checkout of platform-docs. Do not hand-edit CSS to bypass this.
- Changing input height can affect dense tables and dialogs; check both keyboard and narrow layouts. Semantic success/info roles remain distinct from CTA red; badges require non-colour labels.
- Rollback only the future task-owned hunks and their token-generation output as a matched pair. Restore prior token values through the same generator. Never revert shell-owner changes wholesale, inflate arch baseline, delete .next/types or regenerate unrelated operations to hide a failure. No rollback command is executed during planning.

## Open decisions

- [ASSUMED — explicit prompt override, no file:line] Quicksand/Nunito and a light sidebar supersede v4's conflicting typography/dark-sidebar clauses. This plan adopts the prompt; it does not edit the brand source document to conceal the disagreement.
- [ASSUMED — explicit prompt, no file:line] “tutitor.com feel” means restrained rounded headings, warm solid surfaces, readable dense content and simple navigation; no remote-site inspection or pixel-copy claim. Exact measurable rules are the ACs, not an unverified visual comparison.
- [ASSUMED] “Light sidebar” applies to light mode; dark mode remains warm dark with the same hierarchy. A permanently light sidebar in dark mode would need an amended theme contract.
- [ASSUMED] Existing UI name/URL remain until a naming decision; v4:4,105 explicitly leaves the working name unfinalized. No new logo is accepted; recolour existing geometry only.
- [ASSUMED] Chrome-key handling will be resolved after shell handoff; observed source/generated mismatch prevents treating its final shape as established today.
- [ASSUMED] A usable local server/browser audit environment and seeded real accounts for each operator role will be supplied for TC-6/9; this sandbox cannot listen. No local Playwright dependency was found.
- [ASSUMED] The shell handoff and writable platform-docs checkout will be available before cook. This plan records the prerequisites; it neither requests approval nor creates approval/verification receipts.

## Validation log

- Five facts: output is exactly the specified plan/testkit; acceptance is AC-1–10; scope excludes behavioral/auth/domain changes; non-negotiables are the existing token pipeline and no concurrent edits; touchpoints are the exact inventory/slices.
- Reuse/minimum scope: modify the existing tokens/loader/controls and sweep observed runtime leftovers. More than eight files are necessary because global tokens cannot recolour raw palette classes. Shared shell ownership requires sequencing at handoff, not a new abstraction.
- Read-only harness projection: `hs-run plan next --plan /mnt/win_d/feature/ticket/portal/.aidlc/runs/PORTAL-REBRAND-001`; stdout/exit in `testkit/harness-projection.txt`. Observed exit 0 with state `unresolved`: this requested single-plan shape lacks `phases/phase-*.md`; no scaffold was created. User's exact output boundary overrides scaffold/phase/receipt emission; no record, approve, cook or ship command is invoked. The harness projection must not be represented as completed approval or delivery.
- Gate self-review: reject arbitrary CSS gradients as well as Tailwind gradients; do not ban semantic leaf token or business break-glass; prove synchronized green JSON+CSS fails even without drift; compute contrast from hexes rather than trusting copied document ratios. Full gate remains red on the old portal; mutation fixtures demonstrate sensitivity independently of portal implementation.
