# PORTAL-AUTH-SPLIT-001 — batch D

## Where it started

Workspace: `/mnt/win_d/feature/ticket/portal`; branch confirmed `portal-auth-split`. Read the approved plan, batch C report, project instructions and the FE-03/FE-10/FE-14 checker implementation. Scope authorization: every path in plan.md **Files planned**, plus this report. Batches A/B/C were retained. Skills applied: hs:cook red→green discipline, safe-refactor reuse, session-handoff report structure. User's explicit restrictions override engine/receipt/commit/Brain handoff steps: no SDLC engine, receipt/state writes, baseline edits, commit or push performed by this batch.

**Implementation complete for D2, S19 and all 12 NEW architecture violations. Final acceptance is BLOCKED:** archcheck rejects seven pre-existing stale baseline entries even when NEW=0. The baseline was left unchanged. Four of five requested final commands exit 0; archcheck exits 1. D3 remains BLOCKED; recovery behavior was not enabled or changed.

Graph discovery and coverage calls returned `MCP tool call requires approval, but approval policy is never`; directed source reads were used. `../platform-docs/standards/ui-ux.md` does not exist; frontend.md and existing compliant components were read. No browser/live/mail/a11y run is claimed.

## Decisions locked + implemented work

### D2 — independent platform entry

Files changed:

- `lib/api/auth-journey-bff.ts`
- `lib/api/auth-journey-bff.test.ts`
- `app/api/auth/staff/bff.test.ts`

Staff login uses the existing auth profile, session-cookie publication and rejection revocation logic. Its server decision queries org `/platform/me` with the temporary server token and `cache: no-store`, decodes the existing `decodePlatform` / `platformMeSchema` contract, and allows only the fixed `/platform/companies` landing for successful platform identity. A 404 proceeds to verified ACTIVE EMPLOYEE contexts; invalid schema, lookup failure or transport failure closes access. Non-platform/non-employee accounts remain FORBIDDEN with no new cookie and temporary-session revocation. Existing ordinary employee test fixtures now explicitly return platform 404; no eligibility assertion was weakened.

Red→green test: `S17 platform entry survives shared resolver removal > verified platform staff land on /platform/companies with a secure session`.

- `D2-red.log`: full npm test exit 1; 1 failed / 587 passed. Exact endpoint, Authorization token and call count assertions already existed.
- `D2-green.log`: full npm test exit 0; 588 passed / 0 failed, including rejection and schema-failure cases.
- Mutation: replaced the actual `/platform/me` fetch with a synthetic 404 (skipped verification). `D2-mutation.log`: exit 1; 3 failed / 585 passed. S17 platform success is red, along with two upstream-sequence regressions. Restored the real fetch; final suite is green.

### S19 — independent runtime catalogs

Files changed:

- `messages/vi.json`, `messages/en.json`
- `components/layout/customer-auth-shell.tsx`, `components/layout/employee-auth-shell.tsx`
- `app/(auth)/layout.tsx`, `app/(employee-auth)/layout.tsx`
- `app/(auth)/{login,register,activate,forgot-password,reset-password}/page.tsx`
- `app/(employee-auth)/staff/{login,forgot-password,reset-password,invite/accept,switch-branch,switch-org}/page.tsx`
- `features/customer-auth/{login-form,register-form,activate-view,forgot-form,reset-form,form-feedback,journey.test}.tsx`
- `features/employee-auth/{login-form,invite-form,switch-context,forgot-form,reset-form,form-feedback,journey.test}.tsx`
- `features/auth-boundary.test.ts`, `app/rebrand.test.ts`

Journey consumers use only their own namespace. Catalogs cover labels, validation/fallback copy, notices, links, shells, headings and customer metadata. The app has no next-intl request config: reuse the existing platform workspace pattern, explicit client `NextIntlClientProvider` with locale/timeZone. Each shell passes **only its journey catalog** to the browser. Layouts and server pages read `NEXT_LOCALE` (`en` or default `vi`); journey-owned pure translator helpers use installed `createTranslator`, without introducing request configuration or an out-of-scope file. Forms use `useTranslations`; employee blocked recovery notices are client leaves for this provider and still render no form, send no request, and consume no token.

Red→green tests:

- `S19 customer real login and shell render English catalog`
- `S19 employee real login and shell render English catalog`
- `S19 journey UI consumes only its own namespace without hardcoded JSX copy`
- `S19 customer shell supplies an explicit journey-only next-intl provider`
- `S19 employee shell supplies an explicit journey-only next-intl provider`

`S19-red.log`: exit 1; 3 failed / 588 passed against hardcoded UI. `S19-green.log`: exit 0; 591 passed. Provider regressions were then added before provider implementation: `S19-provider-red.log` exit 1, two provider assertions red; `S19-provider-green.log` exit 0, 607 passed. Further coverage exercises all 11 English server headings, all five customer metadata results, English remaining forms, and the **real** next-intl hook inside English shell providers; final 620 tests pass. The mocked translator-only tests are not substituted for these real-hook provider tests.

Mutations, each restored:

1. Staff login hook changed from employeeAuth to customerAuth. `S19-mutation.log`: exit 1; 2 failed / 603 passed. Namespace gate and real staff English login fail.
2. Customer shell provider removed. `provider-mutation.log`: exit 1; 2 failed / 618 passed. Journey-only provider assertion and **real next-intl hook** test fail.

`S1 live gate: no legacy, cross imports, shared screens or missing ownership` remains green in the final full run.

### Architecture — real fixes for all 12 NEW violations

Files changed:

- FE-03: `app/api/auth/staff/invite/accept/route.ts`, `app/api/auth/staff/switch-org/route.ts`, `lib/api/auth-journey-bff.ts`.
- FE-10: both journey shells above.
- FE-14: five customer forms/views above and employee login/invite/switch-context, plus the journey render tests.

Read checker rules: fetch belongs in lib/api; raw numeric z-index is forbidden; API views require rendered loading/empty/error states. Read compliant `features/platform/companies-view.tsx`, `components/ui/state.tsx`, `components/layout/console-shell.tsx` and the existing journey route/helper pattern.

Moved complete invite/context policies into the already planned server-only BFF helper; route exports now delegate. Reused existing context decoder, active staff filtering/deduplication, FORBIDDEN policy and session-cookie allowlist instead of duplicating them. Invite DTO/public response/redaction, context verification, retries and secure cookie behavior remain covered by S11/S12 tests. Shell skip links use `--z-toast`, following ConsoleShell. Real shared `EmptyState` prompts render for unsubmitted login/register/forgot forms, missing reset/invite/activation tokens and loaded empty context options; `ErrorState` renders validation/service failures with existing described-by IDs and staff recovery link. No marker comments, renamed fetch, baseline growth or restored retired files.

The initial archcheck run reproduced 12 NEW violations and exited 1. Final run has 0 NEW, with the same seven stale entries as batch C. Rendered-state regressions were added after the architecture implementation and then mutation-tested; they are not claimed as a separate pre-implementation red run. Existing validation/error/journey tests were preserved throughout.

Mutation: removed the actual empty-context recovery rendering. `FE14-mutation.log`: exit 1; 1 failed / 604 passed, specifically `FE-14 loaded empty contexts render recovery without enabling submit`. Restored. Additional final rendered tests verify customer empty-state icons/status and actionable input/recovery, staff initial login/missing invitation, disabled submission with no contexts, and existing errors/loading/success paths.

## Exact final outputs

All five commands below were run after restoring every mutation and the final source/test edit. Captured combined stdout/stderr is pasted verbatim, including the existing React `asChild` warning. RTK proxy was used only to execute/capture raw commands, not filter evidence. No scoped test run or architecture suppression option was used.

Command: `ESBUILD_BINARY_PATH=$HOME/.local/share/esbuild/esbuild-0.21.5 npm test`; exit `0`.

```text

> @dcentervn/portal@0.1.0 test
> sh -c 'test -f /tmp/esbuild || cp node_modules/.pnpm/@esbuild+linux-x64@0.21.5/node_modules/@esbuild/linux-x64/bin/esbuild /tmp/esbuild 2>/dev/null || cp node_modules/@esbuild/linux-x64/bin/esbuild /tmp/esbuild 2>/dev/null; chmod +x /tmp/esbuild 2>/dev/null; ESBUILD_BINARY_PATH=${ESBUILD_BINARY_PATH:-/tmp/esbuild} node node_modules/vitest/vitest.mjs run'


 RUN  v2.1.8 /mnt/win_d/feature/ticket/portal

 ✓ lib/fetcher.test.ts (22 tests) 41ms
 ✓ lib/api/platform-contract.test.ts (16 tests) 14ms
 ✓ app/api/auth/staff/bff.test.ts (37 tests) 45ms
 ✓ proxy.test.ts (22 tests) 15ms
 ✓ lib/api/company-bff.test.ts (12 tests) 15ms
 ✓ lib/api/platform-bff.test.ts (10 tests) 19ms
 ✓ app/api/auth/bff.test.ts (52 tests) 42ms
 ✓ lib/api/auth-journey-bff.test.ts (40 tests) 48ms
 ✓ app/api/sales/sales-bff.test.ts (6 tests) 26ms
 ✓ app/api/production/production-bff.test.ts (6 tests) 19ms
 ✓ app/api/operations/operations.test.ts (7 tests) 21ms
 ✓ lib/auth/client.test.ts (6 tests) 6ms
 ✓ features/auth-boundary.test.ts (21 tests) 419ms
 ✓ features/production/production.test.tsx (7 tests) 23ms
 ✓ features/console/console-frame.test.ts (16 tests) 10ms
 ✓ features/products/products.test.tsx (8 tests) 5ms
 ✓ features/platform/company-modules.test.ts (6 tests) 4ms
 ✓ lib/api/platform-client.test.ts (3 tests) 7ms
 ✓ features/platform/support.test.ts (5 tests) 5ms
 ✓ features/platform/company-support.test.ts (2 tests) 8ms
 ✓ features/customer-auth/journey.test.tsx (47 tests) 299ms
 ✓ components/ui/overlay.test.tsx (5 tests) 3ms
 ✓ components/ui/keyboard.test.ts (6 tests) 2ms
 ✓ features/employee-auth/journey.test.tsx (43 tests) 279ms
 ✓ app/readyz/readyz.test.ts (3 tests) 6ms
stderr | app/rebrand.test.ts > S7 rendered target, cart, orders and product creation roles > keeps target permissions, labelled statuses and sole create/submit emphasis (form=false)
React does not recognize the `asChild` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `aschild` instead. If you accidentally passed it from a parent component, remove it from the DOM element.

 ✓ app/rebrand.test.ts (92 tests) 154ms
 ✓ features/platform/companies.test.ts (5 tests) 3ms
 ✓ app/layout-gate.test.ts (64 tests) 1158ms
 ✓ components/layout/console-shell.test.tsx (4 tests) 18ms
 ✓ components/ui/button.test.tsx (9 tests) 20ms
 ✓ components/ui/page.test.tsx (2 tests) 6ms
 ✓ features/platform/access.test.ts (9 tests) 8ms
 ✓ features/platform/audit.test.ts (3 tests) 3ms
 ✓ features/store/store-frame.test.ts (6 tests) 6ms
 ✓ lib/auth/operator.test.ts (3 tests) 4ms
 ✓ features/platform/staff.test.ts (2 tests) 2ms
 ✓ components/layout/store-shell.test.tsx (2 tests) 20ms
 ✓ features/platform/my-company.test.ts (3 tests) 5ms
 ✓ features/platform/role-matrix.test.ts (3 tests) 3ms
 ✓ components/patterns/password-input.test.tsx (3 tests) 4ms
 ✓ app/(store)/traceability/traceability-page.test.tsx (1 test) 3ms
 ✓ app/(store)/layout.test.ts (1 test) 201ms

 Test Files  42 passed (42)
      Tests  620 passed (620)
   Start at  20:43:58
   Duration  2.90s (transform 4.55s, setup 0ms, collect 19.21s, tests 3.00s, environment 6ms, prepare 14.19s)

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
FIXED FE-03 app/api/auth/activate/route.ts  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-03 app/api/auth/forgot/route.ts  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-03 app/api/auth/login/route.ts  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-03 app/api/auth/register/route.ts  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-03 app/api/auth/reset/route.ts  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-03 app/api/auth/switch-org/route.ts  (delete this line from .aidlc/arch-baseline.txt)
FIXED FE-10 components/auth/login-form.tsx  (delete this line from .aidlc/arch-baseline.txt)
archcheck: 56 violations, 56 baselined, 0 new, 7 stale
```

## Key files for next session

- `/mnt/win_d/feature/ticket/portal/.aidlc/runs/PORTAL-AUTH-SPLIT-001/batchD-report.md`
- `/mnt/win_d/feature/ticket/portal/lib/api/auth-journey-bff.ts`
- `/mnt/win_d/feature/ticket/portal/features/auth-boundary.test.ts`
- `/mnt/win_d/feature/ticket/portal/features/customer-auth/journey.test.tsx`
- `/mnt/win_d/feature/ticket/portal/features/employee-auth/journey.test.tsx`
- `/tmp/portal-auth-split-d-proof/` contains full red/green/mutation/final logs and restored-file backups; temporary evidence may be cleaned.

## Running state

No background commands remain. Every intentional mutation is restored. Final five commands ran against restored production/test source; this report was written afterward. `git diff --check` exit 0. All 38 batch-operated source/test/catalog paths were compared against Files planned and matched. Existing working-tree changes from prior batches are preserved; no cleanup of their .aidlc state files was attempted.

## Verification

- Unit: 42/42 files; 620/620 tests; 0 failed. S1 green.
- Mutation detection: D2 skip-verification, S19 wrong namespace, missing provider, missing empty-context rendering: 4/4 detected and restored.
- Required final commands: 4/5 exit 0. Test/lint/typecheck/brand pass; brand 0 errors.
- Architecture: 12/12 NEW violations fixed; 0 NEW; 56 existing baselined violations; 7 stale; exit 1.
- D3: BLOCKED; existing no-request/no-token recovery tests pass.
- Browser/live/mail/a11y: not run; no end-to-end or ship claim.

## Deferred + open questions

Archcheck `main` computes `new, stale`, then unconditionally executes `sys.exit(1 if new or stale else 0)`. Exit 0 is therefore impossible under the current baseline restriction without either deleting the seven stale baseline entries, changing the external checker, or recreating violations/retired files. The latter options violate scope and/or the no-evasion rule and were not used. An asynchronous scope question requested permission to remove exactly the seven FIXED entries or leave the gate blocked. No answer was received by report creation; no approval inferred.

D3 remains BLOCKED on trusted staff recovery delivery/provenance, unchanged. No git commit/push or engine/receipt operation performed.

## Pick up here

Coordinator must remove or explicitly authorize removal of the seven FIXED baseline entries printed verbatim above, then rerun the exact archcheck command. Until that happens, batch D cannot be claimed fully accepted because the requested exit-0 architecture gate is unmet. This is a baseline bookkeeping blocker, not a remaining NEW architecture violation.
