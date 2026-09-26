# React review — PORTAL-AUTH-UI-001

Scope: app/{login,register,activate,forgot-password,reset-password}/page.tsx, lib/auth/client.ts,
eslint.config.mjs, features/auth/*, components/layout/auth-shell.tsx, app/api/auth/activate/resend/route.ts.

## MEDIUM

[MEDIUM] activate-view effect has no abort/cancel guard
File: features/auth/activate-view.tsx:46-54
Issue: `useEffect(() => { activateAccount(token).then(...).catch(...) }, [token])` sets state after an
unmounted/token-changed case with no `AbortController` or `cancelled` flag.
Why: Harmless in practice (token is stable from the URL, component won't remount), but it's the one
non-trivial async effect in the diff without a cleanup guard.
Fix: optional — add an `ignore` flag if this route ever becomes revisitable with a changing token.

[MEDIUM] redirect target for authenticated staff is not restricted to console routes
File: features/auth/home-for.ts:10-14 (`homeFor`)
Issue: For `contextCount >= 1`, any same-site path that passes `sanitizeRedirectUrl` is honored, including
customer-only paths like `/cart`. Only the customer branch (`contextCount === 0`) is restricted to
`CUSTOMER_PREFIXES`.
Why: Not an open-redirect (still same-site), but it means a crafted `?redirect=/cart` could land staff on a
customer page post-login instead of `/console`/`/switch-branch`. Low impact, correctness-only.
Fix: If staff should always land in console-space, gate the staff branch symmetrically (e.g. only honor
`redirect` if it doesn't collide with customer prefixes), or confirm this is intentional per spec.

[MEDIUM] `/api/auth/activate/resend` route has no request-shape validation before forwarding
File: app/api/auth/activate/resend/route.ts:6-14
Issue: `forwardService` passes the raw JSON body straight to auth with `requireAuth: false`; no shape check
at the BFF layer (consistent with sibling routes like forgot/reset, so likely intentional pass-through to
auth's own validation — flagging for confirmation, not a regression).
Why: Acceptable if auth service validates and rate-limits; unconfirmed in this diff's scope.
Fix: Confirm auth's `/auth/activate/resend` rate-limits by email/IP (resend endpoints are a common enum/abuse
vector). No portal-side change required if so.

## LOW

[LOW] two email-existence-safe wordings for the same concern, verify consistency
File: features/auth/forgot-form.tsx:34-40 vs features/auth/activate-view.tsx:65
Issue: forgot-password always shows a neutral "if this email exists…" message (correctly avoiding
user-enumeration); the activation resend flow's "resent" state uses similarly neutral copy — good, just
noting both were checked and are consistent, no enumeration leak via UI text.

[LOW] `lib/auth/client.ts` still exports `sanitizeNextUrl` (unused by this diff)
File: lib/auth/client.ts:157-159
Not dead within this diff's touched files (used by proxy.ts per existing test suite) — no action.

## Checks performed, no issues found
- Open redirect: `sanitizeRedirectUrl` (lib/auth/client.ts:142-155) blocks `//`, `/\`, `://`, `:\` — protocol-relative
  and absolute URLs correctly fall back. `homeFor` unit tests (features/auth/home-for.test.ts) cover the
  `//evil.com` and `https://evil.com` cases and pass.
- Audience routing: `resolveHome` → `/api/auth/context` (server) counts distinct EMPLOYEE `branch_id`s via
  `staffBranchCount`; 0 → customer "/", 1 → "/console", ≥2 → "/switch-branch". Matches spec. Register form is
  customer-only by copy/design; no employee self-register path exists in this diff.
- Token/session handling: no token stored in localStorage/sessionStorage; access token lives in httpOnly
  cookie read server-side (`app/api/auth/context/route.ts`, `service-bff.ts`). Client only calls same-origin
  `/api/...` BFF routes.
- Error leakage: client-facing errors use fixed Vietnamese copy or `data.message`/`data.error` from the BFF,
  which itself proxies auth's JSON body — no stack traces or raw upstream errors surfaced.
- Server/client boundary: all five `app/*/page.tsx` are now server components (no `"use client"`, have
  `export const metadata`), delegating interactivity to `"use client"` components in `features/auth/*`,
  wrapped in `<Suspense>` — correct for `useSearchParams()` usage in login/reset/activate.
- Accessibility: all inputs have associated `<Label htmlFor>`; password hints wired via
  `aria-describedby="password-hint"`; errors rendered with `role="alert"` (`FormAlert`), success/notice panels
  with `role="status"` (`FormNotice`); busy state exposed via `aria-busy`; show/hide password button has
  `aria-label`/`aria-pressed`; decorative icons carry `aria-hidden="true"`.
- Password length: `[...password].length < 12` (code-point count) enforced client-side in register-form.tsx:15
  and reset-form.tsx:23, matching the 12-code-point minimum.
- Dead code: old inline page implementations were fully removed, not left commented out; no leftover unused
  imports spotted in the new files.
- No `dangerouslySetInnerHTML`, no unsafe URL schemes in any new/changed file.
- Function size / nesting: all new components are well under ~40 lines with early returns; matches project
  code-shape rule.

Verdict: APPROVE

## Author response (2026-09-26, Claude Code)
- MEDIUM activate-view abort guard: no flag added, on purpose. The activation token is single-use and
  `activateAccount` has no dedup. StrictMode runs the effect twice in dev, so an `ignore` flag would discard the
  result of the first call, the one that consumed the token, and show "failed" for an activated account. React 18+
  ignores setState after unmount. Documented with a `ponytail:` comment at features/auth/activate-view.tsx:47.
- MEDIUM staff redirect not limited to console: intended. Staff are also customers and may follow a same-site
  `?redirect=` (e.g. /cart). Open-redirect is blocked by `sanitizeRedirectUrl`, and customers stay restricted to
  CUSTOMER_PREFIXES (home-for.test.ts).
- MEDIUM resend has no BFF shape check: confirmed safe. auth/internal/bootstrap/http.go:231
  `r.With(forgotLimiter).Post("/auth/activate/resend", ...)` rate-limits it, and the auth handler validates the
  body and is anti-enumeration (http_handlers_test.go `resend_unknown_email_anti_enumeration`). Same pass-through
  pattern as forgot/reset.
