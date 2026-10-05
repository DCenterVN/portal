# PORTAL-AUTH-SPLIT-001 — batch A (S1–S7)

## Where it started

Workspace: `/mnt/win_d/feature/ticket/portal`; branch: `portal-auth-split`.
Source of truth: Dawn's approval of `.aidlc/runs/PORTAL-AUTH-SPLIT-001/plan.md` as written, including D1–D4. Scope: S1–S7 only.

Only the 27 files in the combined S1–S7 lists were changed, plus this report. Existing `.aidlc/ACTIVE`, rebrand state/run metadata, trace and auth-split plan/run files were already dirty/untracked at entry; no agent edit was made to them. No commit/push, package installation, `sdlc.py approve`, `done` or `verify` was run. `hs-run`/`hs-cli` help was inspected without advancing engine state. Graph project discovery ran; the coverage probe was blocked by approval policy `never`, so named source files were read directly. The new auth oracle enumerates the approved plan file list and follows local import dependencies instead of scanning the repository.

## Decisions locked + what shipped

Customer login is ACTIVE-auth-user-only, with store landing and no org lookup (D1). Staff eligibility comes from org access contexts, never client claims or profile memberships. The org endpoint contract already filters ACTIVE membership/branch rows; explicit inactive rows are also rejected. Branch rows are deduplicated; one verified branch is switched on the server before publishing a session, multiple branches/orgs return fixed staff selection paths. Failed eligibility/context/profile checks attempt upstream logout with the temporary session cookie/CSRF before returning, and publish no new cookie. Missing access-token success responses with temporary cookies are also rejected and revoked. No assertion is made that revocation can succeed during an upstream outage.

Customer forms/client/shell/pages are independent; UI uses existing role tokens and Button/Input/Label primitives. The client reuses `mutationFetcher`/session transport. Auth BFF handling needs credential redaction and Retry-After preservation, which the existing `forwardService` does not provide; these are implemented in the approved server-only auth policy module, with thin route handlers. No generic service helper was copied, and no new error code was introduced. Existing upstream `invalid_token`/`service_busy` are preserved rather than redefined.

Customer recovery/activation use the existing upstream endpoints and DTOs. Staff recovery is outside this batch (D3). Content/i18n migration remains the planned S19 work; no message catalog was changed.

## Per-slice TDD and mutation evidence

Every red/green/mutation invocation used the full command:

```sh
ESBUILD_BINARY_PATH=$HOME/.local/share/esbuild/esbuild-0.21.5 npm test
```

“Green” below means the slice's assertions are green; the intentionally failing S1 live gate keeps the full command at exit 1. New-module red runs for S2/S3/S4 initially fail to load the not-yet-created implementation; policy/render/validation behavior is subsequently checked green and independently falsified by mutations.

During early work, `app/layout-gate.test.ts` was accidentally replaced rather than extended. Its original 58 tests were restored in full before final verification. The final diff retains them, adds six auth split checks, includes the customer shell in the landmark expectation, and recognizes the planned employee route root. Restoring the suite exposed Button height overrides; removing those overrides returned that regression gate to green using the existing Button size. Early totals below describe the then-current working tree, not the final preserved regression suite. All seven mutations were rerun against the final complete suite; their results below are the authoritative mutation proof.

### S1 — Gate AST/isolation

Files changed:

- `features/auth-boundary.test.ts`
- `app/layout-gate.test.ts`

Red→green test names: `detects alias mutation`, `detects barrel mutation`, `detects index-barrel mutation`, `detects transitive-dynamic mutation`, `detects dynamic mutation`, `detects reverse mutation`, `detects both mutation`, `detects mode mutation`, `detects prop mutation`, `detects copy mutation`, `detects unresolved mutation`; positive independent/shared-primitives fixture. Live gate intentionally remains red.

Initial red log: `/tmp/portal-auth-split-proof/S1-red.log`; slice-green log: `/tmp/portal-auth-split-proof/S2-green2.log`.

```text
S1-red:
 Test Files  2 failed | 37 passed (39)
      Tests  2 failed | 314 passed (316)
S2-green2:
 Test Files  2 failed | 38 passed (40)
      Tests  2 failed | 351 passed (353)
```

Mutation: Disabled the cross-journey traversal predicate in `features/auth-boundary.test.ts`. Seven cross-import fixtures failed in addition to the expected live gate. Full command exit 1, then the working-copy edit was restored in `finally`. Final proof: `/tmp/portal-auth-split-proof/S1-final-mutation.log`.

```text
 Test Files  1 failed | 40 passed (41)
      Tests  8 failed | 487 passed (495)
```

### S2 — Server-only login policy

Files changed:

- `lib/api/auth-journey-bff.ts`
- `lib/api/auth-journey-bff.test.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/staff/login/route.ts`
- `app/api/auth/bff.test.ts`

Red→green test names: `S2 login policy`: `customer ACTIVE lands only in store without consulting org, including employee identity`; `staff requires EMPLOYEE ACTIVE, revokes temporary session with its cookie/CSRF and emits no new cookie`; `dedupes role rows and switches the sole verified org/branch before publishing session`; `switch failure never publishes cookie or console landing`; forged DTO, inactive profile, malformed JSON/org schema, org unavailable/Retry-After, safe landing cases. Added red→green hardening tests `upstream login errors preserve code/status/retry without exposing credentials or cookies` and `malformed success with temporary refresh cookie is rejected and revoked even without a valid access token`.

Initial red log: `/tmp/portal-auth-split-proof/S2-red.log`; slice-green log: `/tmp/portal-auth-split-proof/S2-green2.log`.

```text
S2-red:
 Test Files  3 failed | 37 passed (40)
      Tests  2 failed | 314 passed (316)
S2-green2:
 Test Files  2 failed | 38 passed (40)
      Tests  2 failed | 351 passed (353)
```

Mutation: Replaced `rows.filter(row => row.member_type === "EMPLOYEE" && (row.status === undefined || row.status === "ACTIVE"))` with `rows`. CUSTOMER, PLATFORM and suspended EMPLOYEE rejection cases failed. Full command exit 1, then the working-copy edit was restored in `finally`. Final proof: `/tmp/portal-auth-split-proof/S2-final-mutation.log`.

```text
 Test Files  2 failed | 39 passed (41)
      Tests  4 failed | 491 passed (495)
```

### S3 — Customer client/shell/login

Files changed:

- `lib/api/customer-auth.ts`
- `components/layout/customer-auth-shell.tsx`
- `features/customer-auth/form-feedback.tsx`
- `features/customer-auth/login-form.tsx`
- `features/customer-auth/journey.test.tsx`

Red→green test names: `S3 customer login`: `shell has one customer marker, one main, skip link and Bếp Tươi brand`; `real labels pair with unique IDs and current-password autocomplete`; `submits identifier once while pending and uses server next_path without client redirect`; `empty input never sends request and error is accessible`; `failed request clears busy and surfaces error`; `client reuses transport and sends only identifier/password to customer BFF`.

Initial red log: `/tmp/portal-auth-split-proof/S3-red.log`; slice-green log: `/tmp/portal-auth-split-proof/S3-green.log`.

```text
S3-red:
 Test Files  3 failed | 38 passed (41)
      Tests  2 failed | 351 passed (353)
S3-green:
 Test Files  2 failed | 39 passed (41)
      Tests  2 failed | 357 passed (359)
```

Mutation: Changed `router.push(result.next_path as Route)` to `/console`. The server-next-path/pending-submit behavior test failed. Full command exit 1, then the working-copy edit was restored in `finally`. Final proof: `/tmp/portal-auth-split-proof/S3-final-mutation.log`.

```text
 Test Files  2 failed | 39 passed (41)
      Tests  2 failed | 493 passed (495)
```

### S4 — Customer onboarding/recovery forms

Files changed:

- `features/customer-auth/register-form.tsx`
- `features/customer-auth/activate-view.tsx`
- `features/customer-auth/forgot-form.tsx`
- `features/customer-auth/reset-form.tsx`

Red→green test names: `S4 customer onboarding and recovery`: password 11/12 characters and 256/257 UTF-8-byte boundaries, phone-only register, optional name, missing identity/long name, activation token/effect replay, missing/expired/replayed-token error handling, neutral forgot success/network error, reset missing token/mismatch/success/error, labels. Added red→green `S4 register focuses the field that failed validation` (password/email/display_name).

Initial red log: `/tmp/portal-auth-split-proof/S4-red.log`; slice-green log: `/tmp/portal-auth-split-proof/S4-green.log`.

```text
S4-red:
 Test Files  3 failed | 38 passed (41)
      Tests  2 failed | 351 passed (353)
S4-green:
 Test Files  2 failed | 39 passed (41)
      Tests  2 failed | 378 passed (380)
```

Mutation: Disabled the 256-byte check in `passwordError`. Two register and two reset boundary cases failed. Full command exit 1, then the working-copy edit was restored in `finally`. Final proof: `/tmp/portal-auth-split-proof/S4-final-mutation.log`.

```text
 Test Files  2 failed | 39 passed (41)
      Tests  5 failed | 490 passed (495)
```

### S5 — Customer layout/pages

Files changed:

- `app/(auth)/layout.tsx`
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `app/(auth)/activate/page.tsx`

Red→green test names: `S1 layout gate: customer layout owns one customer shell`; `S5 login page belongs to customer journey`, `S5 register page belongs to customer journey`, `S5 activate page belongs to customer journey`.

Initial red log: `/tmp/portal-auth-split-proof/S5-red.log`; slice-green log: `/tmp/portal-auth-split-proof/S5-green.log`.

```text
S5-red:
 Test Files  2 failed | 39 passed (41)
      Tests  5 failed | 378 passed (383)
S5-green:
 Test Files  1 failed | 40 passed (41)
      Tests  1 failed | 382 passed (383)
```

Mutation: Changed customer login page import back to `@/features/auth/login-form`. `S5 login page belongs to customer journey` failed. Full command exit 1, then the working-copy edit was restored in `finally`. Final proof: `/tmp/portal-auth-split-proof/S5-final-mutation.log`.

```text
 Test Files  2 failed | 39 passed (41)
      Tests  2 failed | 493 passed (495)
```

### S6 — Customer recovery pages/BFF

Files changed:

- `app/(auth)/forgot-password/page.tsx`
- `app/(auth)/reset-password/page.tsx`
- `app/api/auth/forgot/route.ts`
- `app/api/auth/reset/route.ts`

Red→green test names: `S6 forgot-password page stays in customer journey`, `S6 reset-password page stays in customer journey`; `S6 customer recovery BFF contract`: `forwards exact DTO and endpoint, no-store, no session/token leakage`; `invalid/forged recovery DTO never hits auth`; `bad JSON and upstream failure are canonical and no-store`; `reset preserves upstream error %s/%s, Retry-After; expired/replayed tokens do not succeed`. Updated the existing recovery mocks to real header behavior and a password meeting the approved minimum.

Initial red log: `/tmp/portal-auth-split-proof/S6-red.log`; slice-green log: `/tmp/portal-auth-split-proof/S6-green2.log`.

```text
S6-red:
 Test Files  3 failed | 38 passed (41)
      Tests  20 failed | 382 passed (402)
S6-green2:
 Test Files  1 failed | 40 passed (41)
      Tests  1 failed | 401 passed (402)
```

Mutation: Changed reset upstream path `/auth/password/reset` to `/auth/password/forgot`. The exact reset DTO/endpoint test failed. Full command exit 1, then the working-copy edit was restored in `finally`. Final proof: `/tmp/portal-auth-split-proof/S6-final-mutation.log`.

```text
 Test Files  2 failed | 39 passed (41)
      Tests  2 failed | 493 passed (495)
```

### S7 — Customer onboarding BFF

Files changed:

- `app/api/auth/register/route.ts`
- `app/api/auth/activate/route.ts`
- `app/api/auth/activate/resend/route.ts`

Red→green test names: `S7 customer onboarding BFF contract`: `forwards only customer DTO/endpoint, preserves accepted status, no credential/cookie leaks`; `rejects missing/invalid/forged onboarding fields before auth`; `onboarding malformed JSON yields canonical BAD_REQUEST`; `activation upstream denial/retry metadata survive %s/%s`; `onboarding transport failures have canonical code and no internal detail`. Existing register fixture now uses the approved 202 contract.

Initial red log: `/tmp/portal-auth-split-proof/S7-red.log`; slice-green log: `/tmp/portal-auth-split-proof/S7-green.log`.

```text
S7-red:
 Test Files  2 failed | 39 passed (41)
      Tests  26 failed | 401 passed (427)
S7-green:
 Test Files  1 failed | 40 passed (41)
      Tests  1 failed | 426 passed (427)
```

Mutation: Changed register upstream path `/auth/register` to `/auth/invite/accept`. Both email and phone-only customer registration endpoint tests failed. Full command exit 1, then the working-copy edit was restored in `finally`. Final proof: `/tmp/portal-auth-split-proof/S7-final-mutation.log`.

```text
 Test Files  2 failed | 39 passed (41)
      Tests  3 failed | 492 passed (495)
```

Shared supporting edits remain inside the batch allowlist: S4 extends S3's feedback/password validation and journey test; S5/S6 extend S1's layout gate; S6/S7 extend S2's BFF module and BFF test. Additional red-first logs: `S2-hardening-red.log` (credential redaction and malformed-session revoke), `S4-focus-red.log` (correct invalid-field focus); their green proof is `pre-final-green.log` and the final run. The final S1 detector fixtures include alias, relative barrel, index barrel, transitive dynamic import, both directions, two-form page, runtime mode, generic prop, shared copy and unresolved dynamic import; all 12 detector/positive tests pass.

## Exact final command outputs

Command: `ESBUILD_BINARY_PATH=$HOME/.local/share/esbuild/esbuild-0.21.5 npm test`; exit `1`.

```text
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed | 40 passed (41)
      Tests  1 failed | 494 passed (495)
   Start at  19:51:27
   Duration  3.55s (transform 4.64s, setup 0ms, collect 21.46s, tests 2.76s, environment 6ms, prepare 18.86s)
```

Command: `npm run lint`; exit `0`.

```text

> @dcentervn/portal@0.1.0 lint
> node node_modules/eslint/bin/eslint.js .
```

Command: `npm run typecheck`; exit `0`.

```text

> @dcentervn/portal@0.1.0 typecheck
> node node_modules/typescript/bin/tsc --noEmit
```

Command: `python3 .aidlc/runs/PORTAL-REBRAND-001/testkit/check-brand.py`; exit `0`.

```text
brand gate: 0 errors (all)
```

Final relevant suites:

```text
 ✓ lib/api/auth-journey-bff.test.ts (40 tests) 30ms
 ✓ app/api/auth/bff.test.ts (52 tests) 42ms
 ✓ features/customer-auth/journey.test.tsx (30 tests) 43ms
 ✓ app/layout-gate.test.ts (64 tests) 1571ms
```

## Still red and why

Exactly one test remains red:

```text
features/auth-boundary.test.ts > auth isolation AST oracle > S1 live gate: no legacy, cross imports, shared screens or missing ownership
```

It reports the following offending/missing files from the final run:

- `features/auth/switch-branch-page.tsx: legacy shared auth`
- `features/auth/activate-view.tsx: legacy shared auth`
- `features/auth/form-alert.tsx: legacy shared auth`
- `features/auth/forgot-form.tsx: legacy shared auth`
- `features/auth/home-for.ts: legacy shared auth`
- `features/auth/login-form.tsx: legacy shared auth`
- `features/auth/register-form.tsx: legacy shared auth`
- `features/auth/reset-form.tsx: legacy shared auth`
- `components/auth/login-form.tsx: legacy shared auth`
- `components/layout/auth-shell.tsx: legacy shared auth`
- `features/employee-auth/login-form.tsx: missing journey owner`
- `components/layout/employee-auth-shell.tsx: missing journey owner`
- `lib/api/employee-auth.ts: missing journey owner`
- `app/(employee-auth)/staff/login/page.tsx: missing journey route`
- `app/(employee-auth)/staff/forgot-password/page.tsx: missing journey route`
- `app/(employee-auth)/staff/reset-password/page.tsx: missing journey route`
- `app/(employee-auth)/staff/invite/accept/page.tsx: missing journey route`
- `app/(employee-auth)/staff/switch-branch/page.tsx: missing journey route`
- `app/(employee-auth)/staff/switch-org/page.tsx: missing journey route`

Legacy `features/auth/*`, `components/auth/login-form.tsx` and `components/layout/auth-shell.tsx` are intentionally retained until S16–S18. Employee module/client/shell and six staff pages belong to later slices S8–S12. Customer pages and layout tests pass. No other test remains red; no test was skipped or weakened to hide the gate.

## Key files for next session

- `/mnt/win_d/feature/ticket/portal/.aidlc/runs/PORTAL-AUTH-SPLIT-001/plan.md`
- `/mnt/win_d/feature/ticket/portal/features/auth-boundary.test.ts`
- `/mnt/win_d/feature/ticket/portal/lib/api/auth-journey-bff.ts`
- `/mnt/win_d/feature/ticket/portal/lib/api/auth-journey-bff.test.ts`
- `/mnt/win_d/feature/ticket/portal/features/customer-auth/journey.test.tsx`
- `/mnt/win_d/feature/ticket/portal/app/api/auth/bff.test.ts`
- `/tmp/portal-auth-split-proof/` — actual full run logs, red/green and final mutation logs, final command exit files. These temporary logs may not survive cleanup.

## Running state

No background task remains. All mutations were restored before the final suite, lint, typecheck and brand checks. Only the requested report was written after final code verification.

## Verification

- Unit/regression: **494/495** pass; **1/495** is the specified S1 live gate (not full-green).
- S1 detector fixtures: **12/12** pass.
- Mutation detection: **7/7** slices produce additional target failures beyond the existing S1 red test; **7/7** edits restored.
- Lint/typecheck/brand commands: **3/3** exit 0; brand **0 errors**.
- Allowed code/test paths: **27/27** changed paths are in S1–S7.
- Browser/live backend/mail/a11y audit: **not run**. SSR assertions and mocked submit/upstream behavior are not browser or live-token evidence. Backend replay/expiry is represented by mocked upstream denial propagation, not live challenge redemption.
- Archcheck/build/release gates: **not run**; no ship or release claim.

## Deferred + open questions

S8–S20 remain outside batch A. Staff recovery dependency D3, platform entry D2, i18n S19, legacy deletion S16–S18, and live/browser/axe/mail verification S20 retain their approved scope. No new decision is requested.

## Pick up here

Continue the approved plan at S8. Keep the S1 live gate red until both journeys exist and legacy shared screens are removed; use its reported file paths as the isolation checklist. Do not mark the overall task shipped based on this batch.
