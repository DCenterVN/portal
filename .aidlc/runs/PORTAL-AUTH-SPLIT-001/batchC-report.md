# PORTAL-AUTH-SPLIT-001 — batch C

## Where it started

Workspace: `/mnt/win_d/feature/ticket/portal`; branch `portal-auth-split`. Approved plan and batches A/B were read; existing customer/staff modules, session transport, design primitives and server policy were reused. Source reads were directed to named files/contracts. The explicitly required deleted-import search and full test/layout/brand/architecture gates ran.

**INCOMPLETE, not shipped.** S16, legacy deletion in S17, S18 and S14 are implemented. S19 catalogs are implemented but not connected to the UI. S20 static hardening is implemented; live/browser/mail/a11y evidence is absent. D2 platform login implementation is pending scope clarification. D3 remains BLOCKED, unchanged.

User's strict file allowance conflicts with necessary implementation paths for D2, S19 and archcheck repairs. Three asynchronous scope questions were sent; no answer was received at report creation. Elapsed time was not approval. No compatibility wrapper, backend/package change, git commit/push or sdlc.py approve/done/verify was performed. No .aidlc file was intentionally edited except this report. hs-run cook prompt developer ran for S16, S17, S18, S14, S19 and S20; all returned in_place. Skills: hs:cook, safe-refactor; handoff structure is kept in this authorized report.

## Decisions locked + implemented work

- Removed all ten production shared auth files and the shared home-for test. No customer/employee cross import remains. Layout landmark expectation removes AuthShell and includes employee-auth-shell, sorted.
- Rebrand regression renders the real customer form inside CustomerAuthShell, checks actual useId label pairing, existing primary role token and input height. Independent shell regression checks one main, one journey marker and Bếp Tươi. Existing layout index already has no AuthShell export, so it was left unchanged.
- Shared lib/auth/client.ts retains profile/logout and sanitization; removes login/register/activation/recovery/context operations and the obsolete LoginResponse. Journey clients continue to own those operations.
- Deleted legacy switch BFFs. Migrated the old BFF switch test to staff/switch-org with a verified ACTIVE EMPLOYEE org/branch upstream fixture before auth mutation. Existing dedicated staff BFF coverage is retained.
- Independent customerAuth and employeeAuth catalogs now exist in vi/en; English next-intl createTranslator is exercised. **Catalog availability is not UI localization completion:** existing hardcoded journey consumers were not changed outside the strict slice lists.
- D2: old platform resolver is deleted. New actual staff-login handler test demonstrates the replacement is missing (503 instead of 200). This is a regression blocker; platform login is NOT claimed working. Existing reusable policy file lib/api/auth-journey-bff.ts needs an exception, or staff/login/route.ts needs an explicitly allowed minimal server policy. Neither is in S14/S16–S20 files lists. The tested replacement must query org's existing `/platform/me` using the temporary server token, decode its existing platform contract, land only on `/platform/companies`, and retain rejected-session revocation. No platform decision based on client fields was implemented.
- S20 AST oracle now rejects static references to retired modules even when the file no longer exists. Alias and relative negative fixtures both red→green. S1 live gate is green.

## Per-slice TDD and mutation evidence

Every recorded test run executes the FULL command `ESBUILD_BINARY_PATH=$HOME/.local/share/esbuild/esbuild-0.21.5 npm test`. Logs and exit receipts are under `/tmp/portal-auth-split-c-proof/`. The helper invokes npm test without path arguments and supplies precisely that ESBUILD_BINARY_PATH. A full-suite exit remains 1 when an unrelated/pending failure remains; slice-green means the named slice assertions pass, not full-green.

### S16

Files changed: features/auth/{activate-view,forgot-form,form-alert,register-form,reset-form}.tsx deleted; supporting features/auth-boundary.test.ts.

Test: `S16 retires legacy customer forms and feedback`. Red: S16-red.log, 3 failed/588 passed; deletion-green: S16-green.log, 2 failed/589 passed. Initial S1 was red and clearly printed the retained legacy paths as requested. At that intermediate point legacy login still imported deleted form-alert; final S17 deletion resolves this and final typecheck passes.

Mutation: restore legacy forgot-form.tsx; retirement assertion and S1 detect it. S16-mutation.log: 3 failed/588 passed versus 2/589 before mutation. Restored by deleting the probe file again.

### S17 — deletion green, platform replacement incomplete

Files changed: features/auth/{home-for.test.ts,home-for.ts,login-form.tsx,switch-branch-page.tsx} deleted; supporting features/auth-boundary.test.ts and app/api/auth/staff/bff.test.ts.

Tests: `S17 retires the shared login and context resolver`; `S17 platform entry survives shared resolver removal > verified platform staff land on /platform/companies with a secure session`; two platform-failure/no-cookie/revoke cases.

Red: S17-red.log and S17-red-final.log. Deletion-green: S17-deletion-green.log; retirement assertion passes after removal. **Platform success remains red; no platform red→green completion claimed.** Failure-case tests pass but do not prove that platform eligibility is queried correctly; the success test checks exact endpoint, token and call count.

Mutation: restore home-for.ts; S17 retirement plus S1 fail. S17-retirement-mutation.log: 3 failed/585 passed versus 1/587 without mutation. Restored. Required mutation breaking a working platform landing is **not done**, because the replacement is not implemented; no such proof claimed.

### S18

Files changed: components/auth/login-form.tsx and components/layout/auth-shell.tsx deleted; app/rebrand.test.ts migrated; app/layout-gate.test.ts sorted shell list corrected. components/layout/index.ts inspected and already compliant, unchanged.

Tests: `S18 retires shared screens and exposes independent shells`, `keeps customer login fields and solid role branding`, layout main-landmark gate and `S1 live gate: no legacy, cross imports, shared screens or missing ownership`.

S18-red.log: 5 failed/584 passed. S18-green-final.log: 1 failed/588 passed (only pending platform regression). The initial migrated brand assertion expected the old component's --color-primary spelling; updated it to the existing Button's --primary role, preserving real rendering/token/label/height assertions.

Three real working-copy gate mutations, independently restored:

1. Customer login imports employee login: S18-customer-cross-import.log; S1 fails with dependency paths (2 failed total).
2. Employee reset imports customer reset: S18-employee-cross-import.log; S1 fails (2 failed total).
3. Customer login page imports AND renders both login forms: S18-both-render-mutation.log; S1 and page-ownership gate fail (3 failed total). Earlier import-only page probe is in S18-both-forms.log, not substituted for the actual render proof.

### S14

Files changed: lib/auth/client.ts, lib/auth/client.test.ts; app/api/auth/switch-{branch,org}/route.ts deleted; app/api/auth/bff.test.ts migrated to staff switch handler.

Test: `S14 shared transport exports no journey operations and retires legacy switch BFFs`; retained profile/logout/sanitization tests; migrated existing switch BFF contract with verified pair.

S14-red.log: 2 failed/581 passed. S14-green.log: 1 failed/582 passed (pending platform only). Removed obsolete shared-journey tests rather than keeping tests of deleted interfaces; dedicated customer/staff journey/client/BFF tests continue to cover those operations.

Mutation: reintroduce exported login in shared client. S14-mutation.log: 2 failed/581 passed; export boundary fails. Restored.

### S19 — catalogs green, UI wiring incomplete

Files changed: messages/vi.json, messages/en.json; supporting features/auth-boundary.test.ts.

Tests: `S19 independent auth translation catalogs > vi/en supplies both journeys with distinct login and recovery copy`; `English auth catalog renders translated login without fallback` (actual next-intl createTranslator).

S19-red.log: 4 failed/582 passed. S19-catalog-green.log: 1 failed/585 passed (platform only). No UI-localization red→green claim: consumer migration requires paths outside the S19 files list, question pending.

Mutation: delete employeeAuth.login in en catalog; catalog and translator assertions fail. S19-mutation.log: 3 failed/583 passed. Restored.

### S20 — static green, final gate incomplete

Files changed: features/auth-boundary.test.ts; supporting earlier assertions in app/api/auth/staff/bff.test.ts. Existing customer/employee behavior coverage retained.

Tests: `detects deleted-import mutation`, `detects deleted-relative mutation`, S1 live gate.

S20-red.log: 3 failed/585 passed. S20-static-green.log: 1 failed/587 passed (platform only).

Mutation: disable retired-import detector on working copy. Both new fixtures fail: S20-mutation.log, 3 failed/585 passed. Restored.

Directed deleted-production-reference search:

```
rg -n 'features/auth/|components/auth/login-form|components/layout/auth-shell|\.\./auth/(activate-view|forgot-form|form-alert|home-for|login-form|register-form|reset-form|switch-branch-page)|["\x27]\./switch-(org|branch)/route' app features components lib --glob '*.ts' --glob '*.tsx' --glob '!*.test.*'
```

Exit 1, zero matches. Deliberate negative-fixture path strings remain in tests and plan/report text; no production import remains. Full suite includes actual staff BFF imports after old switch route deletion and real rebrand imports after shared component deletion; final typecheck also passes.

Live probe: urllib requests to localhost:3000/login, localhost:8080/health, localhost:8081/health and localhost:8025/api/v1/messages all returned `URLError <urlopen error [Errno 1] Operation not permitted>`. This proves sandbox network denial, not service availability. Browser tool audit, 22 viewport/keyboard/axe cases, six redirect viewport cases, real mail, live challenge expiry/replay and two live journeys were **not run**. D3 remains BLOCKED; no reset token or mail workaround.

## Exact final command outputs

Command: `ESBUILD_BINARY_PATH=$HOME/.local/share/esbuild/esbuild-0.21.5 npm test`; exit `1`.

```text
Test Files  1 failed | 41 passed (42)
      Tests  1 failed | 587 passed (588)
   Start at  20:27:47
   Duration  3.17s (transform 4.80s, setup 0ms, collect 19.48s, tests 2.74s, environment 6ms, prepare 15.93s)
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

Command: `python3 /home/dawn/agent_skills/sdlc/engine/archcheck.py`; exit `1`.

```text
NEW   FE-03 app/api/auth/staff/invite/accept/route.ts
NEW   FE-03 app/api/auth/staff/switch-org/route.ts
NEW   FE-10 components/layout/customer-auth-shell.tsx
NEW   FE-10 components/layout/employee-auth-shell.tsx
NEW   FE-14 features/customer-auth/activate-view.tsx missing empty,error
NEW   FE-14 features/customer-auth/forgot-form.tsx missing empty,error
NEW   FE-14 features/customer-auth/login-form.tsx missing empty,error
NEW   FE-14 features/customer-auth/register-form.tsx missing empty,error
NEW   FE-14 features/customer-auth/reset-form.tsx missing empty,error
NEW   FE-14 features/employee-auth/invite-form.tsx missing empty,error
NEW   FE-14 features/employee-auth/login-form.tsx missing empty,error
NEW   FE-14 features/employee-auth/switch-context.tsx missing empty,error
FIXED FE-03 app/api/auth/activate/route.ts  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-03 app/api/auth/forgot/route.ts  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-03 app/api/auth/login/route.ts  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-03 app/api/auth/register/route.ts  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-03 app/api/auth/reset/route.ts  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-03 app/api/auth/switch-org/route.ts  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-10 components/auth/login-form.tsx  (delete this line from .aidlc/arch-baseline.txt)
archcheck: 68 violations, 56 baselined, 12 new, 7 stale
```

## Still red and why

Exactly one unit test is red: `app/api/auth/staff/bff.test.ts > S17 platform entry survives shared resolver removal > verified platform staff land on /platform/companies with a secure session` (expected 200, received 503). S1 and all other unit tests are green. Target ZERO red tests is NOT met.

Archcheck also fails with 12 new violations in the A/B implementations, listed verbatim above. These production paths are outside the strict batch C slice allowance; no baseline/engine edits or marker-only evasion was made. It also reports seven stale baseline lines; user forbids changing .aidlc except this report, so baseline was not changed.

## Key files for next session

- /mnt/win_d/feature/ticket/portal/.aidlc/runs/PORTAL-AUTH-SPLIT-001/plan.md
- /mnt/win_d/feature/ticket/portal/.aidlc/runs/PORTAL-AUTH-SPLIT-001/batchC-report.md
- /mnt/win_d/feature/ticket/portal/app/api/auth/staff/bff.test.ts — red platform success regression
- /mnt/win_d/feature/ticket/portal/lib/api/auth-journey-bff.ts — existing reusable policy, unchanged in C
- /mnt/win_d/feature/ticket/portal/features/auth-boundary.test.ts — green isolation/retirement and catalog coverage
- /mnt/win_d/feature/ticket/portal/messages/{vi,en}.json — new catalogs, UI wiring pending
- /tmp/portal-auth-split-c-proof/ — actual full-run/probe/mutation logs; temporary storage may be cleaned

## Running state

No background command remains. Every mutation is restored. Final suite/lint/typecheck/brand/archcheck ran after the last implementation edit. Only this report was written afterward. No release, engine completion or git publish.

## Verification

- Unit: 587/588 pass; 1/588 red (D2 success regression).
- S1: green; three required cross-import/render mutations detected and restored.
- Slice mutation detection: 6/6 slices have a detected structural/catalog/oracle mutation; S17 working platform-landing mutation is missing and S17 implementation incomplete.
- Lint/typecheck/brand: 3/3 exit 0, brand 0 errors.
- Architecture: exit 1, 12 new violations, 7 stale baseline entries.
- UI i18n wiring: incomplete; catalog tests are not evidence of translated UI.
- Browser/live/mail/axe/contrast/viewport evidence: absent; no ship claim.

## Deferred + open questions

Pending user scope answers:

1. D2 exception: allow lib/api/auth-journey-bff.ts or app/api/auth/staff/login/route.ts (both already Files planned) to implement minimal independent platform policy. Existing shared helper keeps cookie/revoke/profile logic centralized; prefer helper exception to copying those mechanisms.
2. S19 exception: allow existing journey forms/shells/pages/API-client fallback paths from Files planned to consume next-intl catalogs. S19 lists only two JSON files.
3. S20 exception: allow actual repairs to the 12 flagged Files planned production paths. Current allowance includes only tests, not those implementations.

D3 staff recovery remains BLOCKED on auth trusted delivery/provenance. Sandbox network blocks shell live probes; no frontend/browser-service availability inferred.

## Pick up here

Resolve the three pending file-scope exceptions, implement D2 with new existing regression test first green and then a real platform landing mutation, wire S19 consumers, repair actual architectural violations, rerun final gates. Obtain browser/live evidence through an available authorized surface without claiming D3 recovery complete. Do not mark this batch/task shipped from this report.
