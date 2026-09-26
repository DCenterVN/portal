# Independent re-review — PORTAL-AUTH-UI-001 (author-response verification)

## Verified: author response is correct

[INFO] activate-view abort guard — response holds
File: features/auth/activate-view.tsx:46-56
Issue: reviewed claim that an `ignore` flag would be wrong here.
Verified: `activateAccount` (lib/auth/client.ts:59-70) is a plain one-shot POST with no dedup/idempotency
key. `next.config.mjs` does not set `reactStrictMode: false`, so Next.js App Router dev mode double-invokes
the effect. With an `ignore` flag, the cleanup from the first invocation marks that closure's promise result
as ignored before the second (now-invalid-token) call resolves — so a successful activation would render
"failed". Without the flag, both calls still race, but the flag makes the *bad* outcome (masking a real
success) deterministic on every dev double-invoke instead of only on adverse timing. Reasoning holds;
`ponytail:` comment at line 47-49 correctly documents the tradeoff. No change needed.

[INFO] resend rate limiting — response holds
File: auth/internal/bootstrap/http.go:231, auth/internal/transport/http/activate.go:49-73
Verified: `r.With(forgotLimiter).Post("/auth/activate/resend", a.activate.Resend)` at http.go:231 applies the
same limiter used for forgot-password. `Resend` (activate.go:49-73) validates `email` is non-empty, always
returns 202 with a neutral message regardless of whether the account exists, and logs+suppresses the
downstream error (anti-enumeration), covered by
`http_handlers_test.go:1087 resend_unknown_email_anti_enumeration`. Confirmed safe; no portal-side change
needed.

## Still open

[MEDIUM] staff same-site redirect bypassing console-only routing is asserted "intended" without spec backing
File: features/auth/home-for.ts:10-14, .aidlc/runs/PORTAL-AUTH-UI-001/plan.md:19-22
Issue: the task's own spec (plan.md AC-2: "With 1 context (employee), go to `/console`. With more than 1, go
to `/switch-branch`") does not mention any redirect exception for staff — only AC-1/AC-3 tie redirect-honoring
to the customer (0-context) case. The anti-test acceptance script (anti-test.md G4: "URL sau đăng nhập là `/`
với khách... và `/console` với nhân viên") also only exercises staff login *without* a `redirect` param
(U10), so it does not confirm or contradict this path either.
Why: The author's response ("staff are also customers and may follow a same-site `?redirect=`") is a
plausible product rationale, but it is not written into AC-2, and it is a behavior change from the acceptance
criteria as literally stated. Per this workspace's own workflow rule ("changing behavior = change the spec
first"), an unconfirmed reinterpretation of an AC by the same agent that authored both the spec and the code
is not a substitute for Dawn's confirmation. Not a security bug (still same-site via `sanitizeRedirectUrl`,
still covered by `home-for.test.ts`), so this is a process/spec-consistency gap, not an exploit.
Fix: either update plan.md AC-2 to explicitly state "unless a same-site `redirect` is present" (and add an
anti-test case, e.g. `/login?redirect=/cart` while logged in as staff), or restrict the staff branch to
console-space routes only, matching AC-2's literal text. Needs Dawn's call, not a unilateral "intended".

## Rest of AUTH-UI-001 scope
Re-scanned app/{login,register,activate,forgot-password,reset-password}/page.tsx, features/auth/*,
components/layout/auth-shell.tsx, app/api/auth/activate/resend/route.ts, lib/auth/client.ts diffs against the
first review's findings (hooks, a11y, server/client boundary, redirect sanitization, error leakage). No new
issue found beyond the one above; app/layout.tsx's font/brand diff is out of scope (PORTAL-BRAND-001) and
unrelated to auth.

Verdict: PASS_WITH_RISK

## Resolution (2026-09-26)
- MEDIUM staff redirect: Dawn confirmed "Theo redirect" (staff follow a valid same-site `?redirect=`). AC-2 updated in plan.md,
  locked by `expect(homeFor(1, "/cart")).toBe("/cart")` in features/auth/home-for.test.ts. Closed.

## Final verdict (2026-09-26, re-check)
- plan.md AC-2 now reads: "With 1 context (employee), go to `/console`... Exception: a valid same-site
  `?redirect=` wins, including customer pages such as `/cart`, because staff can also shop (Dawn,
  2026-09-26)." This matches `homeFor` (features/auth/home-for.ts:12-14: `if (target) return target;` before
  the console/switch-branch fallback) exactly, and matches the added test
  `expect(homeFor(1, "/cart")).toBe("/cart")` in home-for.test.ts:20. Spec, code, and test now agree — the
  only open item from review-2.md is resolved by Dawn's explicit decision, not a unilateral author call.
- Independently re-ran `python3 anti_check.py anti` (RUN=1790400781): `VERDICT: PASS (known debt: U10
  header)`. G4 shows staff without `?redirect=` still lands on `/console` in this run, consistent with the
  exception only firing when a redirect is present; G2 unit+archcheck, G3 DB state, G5 screenshot integrity,
  G6 a11y ≥ 0.9, G7 no 5xx/console errors all pass. The one DEBT item (U10 hardcoded staff name) is tracked
  under PORTAL-CONSOLE-SHELL-001, out of this task's scope.
- No CRITICAL/HIGH/MEDIUM item remains open for PORTAL-AUTH-UI-001.

Verdict: PASS
