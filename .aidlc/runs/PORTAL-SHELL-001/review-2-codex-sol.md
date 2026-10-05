# Independent re-review — PORTAL-SHELL-001

Verdict: **BLOCKED**

Reviewer: Codex, independent of the implementation; `in-place:true`. Reviewed the working-tree `git diff` and untracked files restricted to the twelve paths under review-fix.md “Files changed”. PORTAL-BASE-UI-001 and PORTAL-REBRAND-001 run contents were excluded. Read the previous review, worker report, plan AC/TC, project instructions, and the real auth profile DTO. Roles/memberships and shell callers were inspected only to answer the requested deferral/regression questions.

## Confirmed findings, ranked

1. **HIGH — Valid profiles with an empty display name are rejected, hiding existing screens.** `features/store/store-frame.tsx:16,24,52`; `features/console/console-frame.tsx:53–54,78`.
   Auth allows registration without a display name: `../auth/internal/application/account/register.go:36,59–65,110–114`; the HTTP handler requires an identifier and password, not a name (`../auth/internal/transport/http/register.go:37–43`). Profile serialization turns the nullable name into a string (`../auth/internal/application/account/profile.go:664`; `../auth/internal/transport/http/dto/profile_dto.go:17`). Thus a 200 profile containing `display_name: ""` is valid. Store rejects it and replaces the page with ErrorState. Console returns EMPTY_SESSION plus an error, loses the valid email, and replaces the page. A typed scratch probe with every Go profile field, including nullable avatar fields, reproduced both failures: full suite **2 failed / 239 passed**, while all 238 existing tests passed. Use a fallback account label for an empty display name; do not infer profile validity from its truthiness. Add this real DTO case to both suites.

2. **MEDIUM — AC-6 remains false; the Button gate silently misses existing overrides.** `app/layout-gate.test.ts:73–77`.
   The regex stops at the `>` in an earlier callback's `=>`, before reaching className, and also misses JSX string expressions. A TypeScript AST audit found seven existing violations: `features/memberships/memberships-view.tsx:123,287,296,306,384` and `features/roles/roles-view.tsx:430,478`. Examples include a bespoke gradient, `h-7 px-2.5 rounded-lg`, and `rounded`. The full baseline suite nevertheless passes. The worker report lists only three locations; the remaining four are also missed by the gate. This is the previously reported gate weakness, not a newly introduced roles/memberships defect.
   **Coordinator decision:** deferring the screen edits is acceptable scheduling, but is a **blocker for declaring PORTAL-SHELL-001 complete against its current plan**. FR-6/AC-6 explicitly require zero overrides, and S12b is marked complete. A follow-up task does not make that acceptance condition true. Either finish the overrides and restore robust detection, or obtain an explicit plan scope amendment and make the outstanding exceptions visible in the gate. A blanket detector blind spot is not a bounded exception.

3. **MEDIUM — Finding 6 is only partly fixed: failure categories still collapse in the returned/rendered state.** `features/console/console-frame.tsx:46–58`; `features/store/store-frame.tsx:22–24,29,36–37,52`.
   401 is correctly distinct from ordinary request failures. Console also preserves a nonempty-name profile when context loading fails. However, context 503, network rejection, and malformed JSON produce exactly the same ConsoleSession, without a failure kind, HTTP status, or retained cause. Profile failures likewise share one generic result. Store's helper throws through different paths, but StoreFrame reduces all three to `error=true` and the same ErrorState. The scratch probe logged identical console results for all three categories. Current tests assert only a generic rejection/error and cannot establish the requested four-way distinction. Retain an explicit failure kind/status through the frame state and test each outcome separately. This is separate from the valid-profile loss in finding 1.

## Previous findings 1–9: code and counterfactual evidence

| Previous finding | Disposition and code evidence | Would the check fail without the fix? |
|---|---|---|
| 1: wrong auth name field | Field mismatch fixed: store-frame.tsx:11,15 reads `display_name`. Empty-name handling remains defective as above. | **Yes.** Independently rerun M-a fails the session-name test at store-frame.test.ts:32. Fixture at :8 uses typed UserProfile and the real field name. |
| 2: unused Building2 / lint red | Fixed: app/(store)/page.tsx:3. Fresh lint passes. | **Yes.** Restoring Building2 on scratch produces the original unused-import lint error, exit 1. This is a lint check, not a unit test. |
| 3: missing AC-1 gates | AC-1(a/b/c) added: app/layout-gate.test.ts:27–33,83–95; negative fixtures :116–123. Relative mock imports checked at :19–20,141–142. Button strengthening remains unresolved above. | **Yes for AC-1.** Disabling the shared detector causes five negative fixtures to fail. They exercise the same detector used by the filesystem gates. |
| 4: missing TC-5 / unreachable admin navigation | Fixed: mocks/console.ts:11–15; console-frame.test.ts:73–80 checks actual page files and admin hrefs. | **Yes.** Changing `/branches` to a nonexistent href causes two assertions to fail. |
| 5: missing main on workspace gate screens | Fixed: workspace.tsx:55,84,128 supplies `main#main` outside the ready ConsoleShell branch. | **Yes.** Replacing those main tags with div causes two gate tests to fail. The source paths are mutually exclusive; the ready branch uses the shell's main. |
| 6: failures become guest/empty session | Partially fixed: store-frame.tsx:21–24; console-frame.tsx:45–58. 401 separation and context-failure profile retention work for nonempty names; remaining defects are findings 1 and 3. | **Yes for the implemented fix.** M-b fails three existing tests. Tests at console-frame.test.ts:55–63 cover profile retention for context 5xx/network/bad JSON; store-frame.test.ts:36–41 covers rejection rather than guest. |
| 7: fake live status | Fixed in code: mocks/console.ts has no status export; console-frame.tsx:77 passes no statusText, so the optional shell status footer is absent. | **No.** Restoring the hard-coded status export and passing it to ConsoleShell survives the full 238-test suite. There is no regression protection for this fix. |
| 8: unsafe JSON-LD embedding | Fixed: app/(store)/layout.tsx:59,63 escapes `<` in both scripts. Test layout.test.ts:6–19 feeds a closing-script payload through the actual layout and checks JSON round-trip. | **Yes.** Removing both escapes causes that test to fail. |
| 9: unlabeled sidebar navigation | Fixed: console-sidebar.tsx:43 labels the nav. | **Yes.** Removing aria-label fails app/layout-gate.test.ts:111–112. |

The console fixtures use reduced payloads rather than complete typed profiles, but their `display_name`/context keys agree with the real endpoints. They are not the original incorrect `{name}` fixture. Their missing empty-name case matters, as the independent probe demonstrates. Source assertions for landmarks/aria labels are limited structural tests; actual removals fail them. No claim of browser interaction coverage is made.

## Independent verification and mutations

Scratch: `/tmp/portal-review-2-sol-mi96nnwl`. Copied top-level entries with `cp -r`, excluding node_modules, .git, and .next; symlinked repository node_modules. Every test run used **full `npm test`** with `ESBUILD_BINARY_PATH=/home/dawn/.local/share/esbuild/esbuild-0.21.5`. Mutated files were restored between runs. No repository test/cache/typecheck writes were needed.

Baseline and final restored baseline: **37 files / 238 tests PASS**, exit 0. Fresh `npm run lint` and `npm run typecheck`: **PASS**, exit 0. Read-only `hs-cli gates` completed on scratch; no delivery receipt or approval was written.

| Mutation | Result | Full-suite outcome |
|---|---|---|
| M-a: replace store `display_name` guard/access with `name` | KILLED, exit 1 | 1 failed / 237 passed |
| M-b: non-OK store → guest; non-OK console → signed-out status | KILLED, exit 1 | 3 failed / 235 passed |
| AC-1 detector → always false | KILLED, exit 1 | 5 failed / 233 passed |
| Nav `/branches` → `/missing-review-route` | KILLED, exit 1 | 2 failed / 236 passed |
| Workspace main → div | KILLED, exit 1 | 2 failed / 236 passed |
| Sidebar aria-label removed | KILLED, exit 1 | 1 failed / 237 passed |
| Both JSON-LD escapes removed | KILLED, exit 1 | 1 failed / 237 passed |
| Fake status export and shell prop restored | **SURVIVED**, exit 0 | 238 passed |

Counterfactual suite checks: **7/8 killed**; separate unused-import lint mutation: **1/1 killed**. M-a and M-b reproduce the worker's counts and fail on assertions, not infrastructure. Logs are `/tmp/portal-review-2-sol-{baseline,lint,typecheck,M-a,M-b,AC1,TC5,main,nav-label,jsonld,status,unused-import,valid-profile,final-baseline}.log`; Button audit: `/tmp/portal-review-2-sol-button-audit.log`. These are independent evidence, not reused worker logs.

## Regression and scope limits

No additional main-landmark defect, unsafe redirect, JSON-LD injection, or new `any` was found in the scoped changes. Workspace's existing organization redirect remains local and percent-encodes the selected value. Gate/CompanyPicker/Suspense each supply one main, and ready workspace/store/console pages get their main from the shell. Existing unit regression suites pass; no live-browser or backend integration run was performed. The valid empty-name profile is the confirmed existing-screen regression.

Graph discovery/coverage calls were attempted after listing projects, but were denied by the tool approval policy; direct source inspection was used. This report is the only repository write. No code, plan, approval, gate receipt, or other run was changed.

To clear this review: retain valid empty-name profiles, carry the requested failure distinctions into frame state with meaningful tests, and resolve AC-6 through implementation or an explicit acceptance-scope amendment. Add protection against reintroducing fake live status.
