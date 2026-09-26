# PORTAL-BRAND-001 — independent code review

Scope reviewed: app/tokens.generated.css, app/globals.css, app/layout.tsx, components/ui/button.tsx,
components/patterns/password-input.tsx(+test), features/auth/{login,register,reset}-form.tsx, app/icon.svg,
proxy.ts/proxy.test.ts (icon.svg prefix only). auth-shell.tsx read for context only (out of scope, item 6).

## Commands run
- `npm test` (full suite): 16 files / 90 tests passed, including proxy.test.ts and password-input.test.tsx.
- `npm run lint`: clean, no errors.
- `(cd .. && python3 platform-docs/scripts/uigen.py check --root .)`: after a transient first run flagged
  tokens.generated.css drift (concurrent write in platform-docs, per session memory that Codex runs in
  parallel there), 3 repeat runs are stable and byte-identical to the regenerated CSS; the only remaining
  error is `portal/lib/contracts/operations.generated.ts` drift, which is unrelated to this task's file list
  and pre-existing. TC-1 (AC-1b) passes for tokens.
- `grep -nE '#[0-9A-Fa-f]{6}|emerald-|teal-|backdrop-blur' components/ui/button.tsx`: no matches. TC-2 passes.

## AC-by-AC

- AC-1 (globals.css imports tokens.generated.css, shadcn vars map to var(--color-*), no hex in :root/.dark
  role blocks): met for the shadcn semantic vars added/changed by this diff (`--background` … `--ring`). Not
  literally true for the whole `:root`/`.dark` blocks — `--destructive-foreground: #FFFFFF` and the
  pre-existing `--badge-*`/`--tag-*` hex are still hardcoded — but those lines are untouched by this diff
  (confirmed via `git diff`) and are outside the Design section's mapping list. See LOW finding below.
- AC-1b: met (see uigen check above).
- AC-1c: not independently re-verified (would require editing tokens.json and rebuilding), but the mapping
  is fully indirect through `var(--color-*)`, so it holds by construction.
- AC-2 / AC-2b: met. `default` uses `var(--primary)` + the allowed color-mix white gradient, `accent` uses
  `var(--accent)`, `outline`/`secondary`/`ghost`/`link` all use CSS vars. No hex, no emerald/teal classes, no
  backdrop-blur.
- AC-3: met. `Noto_Serif` removed from `app/layout.tsx`, `Quicksand` added as `--font-display`; `globals.css`
  maps `h1,h2,h3,.font-serif` to `var(--font-display)` and body to `var(--font-sans)`.
- AC-4: met. Login, register and reset (both password + confirm) all render the shared `PasswordInput`.
- AC-4b: met. `type="button"`, `aria-pressed={shown}`, `aria-label` toggles "Hiện mật khẩu"/"Ẩn mật khẩu".
- AC-4c: met. `name`/`autoComplete` pass through unchanged (`current-password` on login,
  `new-password` on register/reset), `aria-describedby` passes through too (register/reset hint).
- FR-5 (contrast/Lighthouse): not verifiable from this static review; deferred to Anti (TC-4), as the plan
  specifies.

## Detail checks (per review instructions)

**2. PasswordInput accessibility** — `components/patterns/password-input.tsx`: `type="button"` ✓,
`aria-pressed={shown}` ✓, `aria-label` ✓ (Vietnamese, both states), `disabled` propagates to both the
`<Input>` and the toggle `<Button>` ✓ (test asserts 2 `disabled=""` occurrences), state is `React.useState`
local to each component instance, so login/register/reset(x2) each get independent state ✓.

**3. button.tsx hex/palette audit** — clean except the plan-allowed
`color-mix(in_srgb,var(--primary)_94%,#fff)` gradient stop. No emerald/teal classes, no backdrop-blur.

**4. proxy.ts widening** — `matchesPathPrefix` is exact-or-`/prefix/` only (`pathname === prefix ||
pathname.startsWith(prefix + "/")`), so `/icon.svg` matches exactly and cannot be abused as a string-prefix
bypass (e.g. `/icon.svg-evil` does not match). `proxy.test.ts` covers this directly with a lookalike test
for `/login-evil`, `/api/authentic`, `/traceability-evil` (existing) — no equivalent negative test added for
an `/icon.svg`-lookalike path, but the shared `matchesPathPrefix` helper is already covered by those cases,
so the missing lookalike test is a nitpick, not a gap in the actual guard logic.

**5. Dark mode** — `.dark` class selector present in `tokens.generated.css`
(`[data-theme="dark"], .dark`), matching `globals.css`'s `@custom-variant dark (&:where(.dark, .dark *))`.
Consistent.

**6. Anti's two-logo-tab-stop finding, `components/layout/auth-shell.tsx` (out of scope, report only)** —
The aside logo is `hidden lg:flex` (shown only ≥1024px) and the inline logo is `lg:hidden flex` (shown only
<1024px). Both use plain Tailwind `display:none` toggling, not a "visually hidden but focusable" technique
(no `sr-only`/`opacity-0`/`clip` pattern here) — so at a true desktop viewport (≥1024px) the mobile `Link`
gets `display:none` and CSS spec says a `display:none` element is removed from the accessibility tree and
tab order. Based on static reading, this file should NOT produce two logo tab stops at a genuine ≥1024px
viewport. This contradicts the Anti report referenced in the task. Flagging as **[MEDIUM] discrepancy to
re-verify, not a code bug found in this file** — recommend PORTAL-AUTH-UI-001 re-check the exact viewport
width used for the "desktop" /login capture (a viewport under 1024px would explain two visible logos only
if the breakpoint utilities failed to compile/purge, which was not reproduced here). No source change is
recommended in auth-shell.tsx from this review since it is out of PORTAL-BRAND-001's scope.

## Findings

[LOW] Hardcoded hex remains in globals.css `:root`/`.dark` role blocks outside the Design section's mapping list
File: app/globals.css:106, 112-146
Issue: `--destructive-foreground: #FFFFFF` and the `--badge-*`/`--tag-*` vars are still literal hex inside the same `:root`/`.dark` blocks AC-1 names.
Why: AC-1's literal wording ("no hex in the :root/.dark role blocks") isn't fully true, though these lines are pre-existing and untouched by this diff, and outside the plan's explicit var-mapping list.
Fix: none required for this task; if AC-1 is meant literally, route `--destructive-foreground`, badges and tags through tokens.json in a follow-up (PORTAL-BRAND-SWEEP-001 scope).

[LOW] Eye-button touch target is 36×36px, not the 40×40px the UX section specifies
File: components/patterns/password-input.tsx:448
Issue: `className="absolute right-0.5 top-0.5 size-9"` → `size-9` = 36px, plan's UX section says "40×40 px".
Why: Cosmetic drift from spec; still clears WCAG 2.5.5 AA minimum (24px), so not an accessibility failure.
Fix: use `size-10` (40px) to match the plan verbatim, or update the plan if 36px is the accepted final value.

[MEDIUM] Anti's two-logo-tab-stop report is not reproduced by static reading of auth-shell.tsx
File: components/layout/auth-shell.tsx:13,27 (out of PORTAL-BRAND-001 scope; report only)
Issue: see item 6 above — the file's `hidden lg:flex` / `lg:hidden flex` pair should correctly remove the
non-visible logo link from the tab order at a real desktop viewport.
Why: if the discrepancy is real (not a viewport mislabel), keyboard/screen-reader users hit two duplicate
"Logo Việt Sạch" tab stops before reaching Email — a genuine a11y regression, just not caused by anything
in this task's files.
Fix: PORTAL-AUTH-UI-001 owners re-run Anti's capture confirming ≥1024px viewport width; if it reproduces,
investigate build/purge of the `hidden`/`lg:hidden` utilities rather than assume a markup bug.

## Verdict

No CRITICAL or HIGH issues found in the reviewed files. All in-scope ACs (AC-1/1b/2/2b/3/4/4b/4c) are met,
tests and lint pass, and the proxy change does not widen public access. One MEDIUM item is open, but it is
explicitly a report-only item about a file outside this task's scope (auth-shell.tsx), not a defect
introduced by PORTAL-BRAND-001's changes.

Verdict: PASS_WITH_RISK
