# PORTAL-BRAND-001 — re-review after eye-button fix

Re-review of the same scope as review.md (this file is new, review.md left untouched).

## What changed since review.md
1. `components/patterns/password-input.tsx`: toggle button className changed from
   `absolute right-0.5 top-0.5 size-9` to `absolute right-0 top-0 size-10`. Confirmed by reading the current
   file. Verified with a direct `twMerge` call that `cn(buttonVariants({variant:"ghost", size:"icon"}), "...size-10")`
   resolves to `size-10` winning over the Button component's own `icon` size (`h-9 w-9`) — actual rendered
   button is 40×40px, flush to the input's top-right corner, matching the plan's UX line "the eye button
   sits inside the input on the right, is 40×40 px" verbatim. The input itself stays `h-10 pr-11` (unchanged,
   already 40px tall, matching every other auth input).
2. `components/patterns/password-input.test.tsx`: new assertion
   `expect(html).toMatch(/<button[^>]*class="[^"]*\bsize-10\b/)`.
3. Reran `npm test` (full suite): 16 files / 90 tests pass. `npm run lint`: clean.
4. Mutation check on the new assertion, done independently in this re-review (not just trusting the
   author's claim): reverted `size-10` → `size-9` in the component only → 1 test fails, 89/90 pass, exactly
   as reported. Reverted back to `size-10` → 90/90 again. The new assertion is a real, load-bearing check,
   not a tautology.
5. `.aidlc/runs/PORTAL-BRAND-001/artifacts/verification.json`: all 8 gates (unit, lint, build/tsc, arch,
   tokens, button, icon, integration, e2e — arch shows `105 baselined, 0 new`) report PASS, overall
   `"verdict": "PASS"`.

**Verdict on the fix: FIXED.** The prior [LOW] eye-button-size finding is resolved; no regression introduced
(twMerge output checked directly, not assumed).

## Rulings requested by the coordinator

### 1. LOW "hex in globals.css :root/.dark" (badge/tag/landing vars) — ruled OUT OF SCOPE, not a finding against this task

Re-reading `plan.md` AC-1 exactly: "`globals.css` imports `tokens.generated.css`, and the shadcn vars map
to `var(--color-*)`. There is no hex in the `:root`/`.dark` role blocks." The very next clause names *which*
vars this refers to — "the shadcn vars" — and the Design section spells out the exhaustive mapping list:
`--background`, `--foreground`/`--card-foreground`/`--popover-foreground`, `--card`/`--popover`,
`--primary`/`--primary-foreground`, `--secondary`/`--muted`/`--accent-soft`, `--muted-foreground`,
`--accent`/`--accent-foreground`, `--destructive`, `--border`/`--input`, `--ring`. Every one of those is
`var(--color-*)` in the current `globals.css`, with zero hex. `--destructive-foreground` and the
`--badge-*`/`--tag-*` vars are not in that list — they are a different concern (component-level status
colors, not brand/theme roles), they are untouched by this diff (confirmed via `git diff -- app/globals.css`
in review.md), and the plan's own Out-of-scope line says exactly this class of leftover hex belongs to
"the FE-09 sweep of the other ~35 files → PORTAL-BRAND-SWEEP-001." The `.landing-page` block is further
marked in-file as a deliberately separate "editorial" palette, also pre-existing and untouched.

**Ruling: not a finding against PORTAL-BRAND-001.** AC-1 is met as written (the shadcn var list is fully
mapped, no hex introduced or left in that list). The badge/tag/landing hex is tracked debt that belongs to
PORTAL-BRAND-SWEEP-001, per the plan's own scope line — reclassified from a task finding to "pre-existing,
tracked elsewhere," and dropped from this review's findings.

### 2. MEDIUM auth-shell.tsx tab-order discrepancy — ruled NON-BLOCKING for this task

`components/layout/auth-shell.tsx` is not in `plan.md`'s "Files planned" list, and the original review
instructions explicitly said "auth-shell.tsx itself is outside this task, so only report it." A file outside
a task's planned-files list cannot be the basis for blocking that task's verdict — the plan draws the
boundary, and the boundary places this file in PORTAL-AUTH-UI-001 (or wherever it is actually owned), not
PORTAL-BRAND-001. Also worth restating: my own static read of the file (both logo links toggle plain
`display:none` via `hidden`/`lg:hidden`, not a `sr-only`-style visually-hidden-but-focusable pattern) found
no code-level reason the file should produce two tab stops at a genuine ≥1024px viewport — so even on its
own merits this looks more like an Anti-capture/viewport question than a confirmed markup bug.

**Ruling: does not block PORTAL-BRAND-001.** Kept as an advisory note for whichever task owns
`auth-shell.tsx` to re-verify Anti's capture viewport; not counted against this task's verdict.

### 3. Disclosure — Anti evidence (RUN=1790400781) predates the 36→40px change

The `integration`/`e2e` gates in `verification.json` both call the same `anti_check.py` over the same
`PORTAL-AUTH-UI-001/anti` report/screenshots, which were captured before the eye-button was resized. That
means TC-4's "look" evidence for this specific 4px change is stale — the grader re-run re-scored the same
old images, it did not re-capture the new 40×40 button. Weighing it: the checks that evidence actually
carries (G7 console-clean, G8 report-present, and by extension the FR-5 contrast tables, which are about
color roles, not icon-button pixel size) are unaffected by a 4px resize of a ghost/transparent-background
button — there's no plausible mechanism by which this specific change moves a Lighthouse a11y score or
introduces a console error. This is a legitimate evidence-freshness gap worth naming, but not one that casts
doubt on the specific fix under review.

**Ruling:** noted as a disclosure, not treated as blocking. Recommend a fresh Anti capture (new RUN) is
taken before PORTAL-BRAND-001 is considered fully shippable end-to-end, so the visual evidence on file
actually reflects the 40×40 button — but that is process hygiene for the next Anti pass, not a defect in
this diff.

## Verdict

Both previously-open items are ruled out of this task's scope (badge/tag hex → tracked debt of
PORTAL-BRAND-SWEEP-001; auth-shell.tsx tab order → outside Files planned, non-blocking, advisory only). The
one real defect from review.md (eye-button 36px vs 40px) is fixed and independently verified: code read,
full test suite green, targeted mutation confirms the new assertion is load-bearing, and twMerge output
checked directly to confirm no `h-9`/`w-9` residual conflict. No CRITICAL, HIGH, or in-scope MEDIUM item is
open.

Verdict: PASS
