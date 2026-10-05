**11 Fixed; 5 Not fixed.** No files modified. Browser delegation is reasonable without jsdom, but the current instructions miss the pending-confirmation failure sequence and stacked-dialog cases.

| Review-2 finding | Status | File:line evidence |
|---|---|---|
| Cached company options / pending break-glass bypass | **Fixed** | [`support-request-form.tsx:22`](features/platform/support-request-form.tsx#L22) guards `send()` before mutation; line 119 disables confirmation on lookup error. |
| Empty final page loses Previous | **Fixed** | Previous remains in empty states: [`companies-view.tsx:37`](features/platform/companies-view.tsx#L37), [`support-view.tsx:73`](features/platform/support-view.tsx#L73), [`staff-view.tsx:87`](features/platform/staff-view.tsx#L87), [`company-support-view.tsx:49`](features/platform/company-support-view.tsx#L49), [`audit-view.tsx:75`](features/platform/audit-view.tsx#L75). |
| Picker limited to 100 companies | **Not fixed** | [`use-support.ts:18`](features/platform/use-support.ts#L18) still fetches only page 1. [`plan.md:218`](.aidlc/runs/PORTAL-PLATFORM-001/plan.md#L218) records deferral; [`support-request-form.tsx:78`](features/platform/support-request-form.tsx#L78) adds disclosure. Neither supplies the deployment bound or operational alternative requested by review-2. |
| Combined BFF query allow-list | **Fixed** | Endpoint-specific keys at [`company-bff.ts:8`](lib/api/company-bff.ts#L8); sibling-key rejection tests at [`company-bff.test.ts:32`](lib/api/company-bff.test.ts#L32). |
| Cross-company test accepts server failures | **Not fixed** | [`company-support.it.test.ts:67`](tests/integration/company-support.it.test.ts#L67) now asserts `404` and `NOT_FOUND`, but immediately approves as A. Unchanged-grant readback **before** that approval remains absent. |
| Dialog naming, containment/restoration, close size | **Not fixed** | Semantics and 44px close target are fixed at [`dialog.tsx:262`](components/ui/dialog.tsx#L262) and line 279. Stacking/restoration still have gaps below. |
| Inaccessible tabs | **Fixed** | [`tabs.tsx:33`](components/ui/tabs.tsx#L33) handles navigation; lines 53–70 provide roving focus and panel association. |
| Staff/support field-error associations | **Fixed** | [`field.tsx:20`](components/ui/field.tsx#L20), [`staff-view.tsx:133`](features/platform/staff-view.tsx#L133), [`support-request-form.tsx:65`](features/platform/support-request-form.tsx#L65). |
| Missing module `starts_at` | **Fixed** | Input at [`company-modules.tsx:122`](features/platform/company-modules.tsx#L122); conversion/order validation at [`use-company.ts:47`](features/platform/use-company.ts#L47). |
| Duplicate input primitive | **Fixed** | [`field.tsx:45`](components/ui/field.tsx#L45) composes `Input`. |
| Typing steals textarea focus | **Fixed** | Focus effect depends only on `[open, mounted]` at [`dialog.tsx:220`](components/ui/dialog.tsx#L220); dismissal callback updates separately. |
| Opener captured after child autofocus | **Fixed** | [`dialog.tsx:182`](components/ui/dialog.tsx#L182) captures the opener before portal children commit; normal close restores it at line 223. |
| Multiple stacked traps compete | **Not fixed** | [`dialog.tsx:191`](components/ui/dialog.tsx#L191) suppresses competing handlers, but registration order does not necessarily match visual layer order. See below. |
| Scheduled activation cannot be cancelled / misleading confirmation | **Fixed** | [`use-company.ts:28`](features/platform/use-company.ts#L28) maps scheduled → INACTIVE; [`company-modules.tsx:88`](features/platform/company-modules.tsx#L88) offers cancellation; line 104 explains scheduled effectiveness. |
| Field overwrites caller ARIA | **Fixed** | [`field.tsx:23`](components/ui/field.tsx#L23) merges description IDs and preserves caller invalid state without a field error. |
| Missing behavioral regression coverage | **Not fixed** | [`anti-test.md:68`](.aidlc/runs/PORTAL-PLATFORM-001/anti-test.md#L68) adequately specifies continuous typing; line 71 covers ordinary keyboard interactions. Step 17 never executes cancellation. Step 18 neither opens pending confirmation nor verifies zero mutation calls; [`use-support.ts:18`](features/platform/use-support.ts#L18) disables focus revalidation, and reload destroys pending state. Stacked dialogs are unspecified. |

| Severity | File:line | New finding in fixes | Fix |
|---|---|---|---|
| **Nên** | [`dialog.tsx:112`](components/ui/dialog.tsx#L112), [`dialog.tsx:191`](components/ui/dialog.tsx#L191) | Keyboard ownership follows opening order, while visual priority follows standard/critical/session z-index. A lower-layer dialog opened later takes keyboard ownership and initial focus behind the visible higher layer. | Order ownership by layer priority, then opening order; restrict initial focus to the actual top layer. Test both opening orders. |
| **Nên** | [`dialog.tsx:215`](components/ui/dialog.tsx#L215), [`dialog.tsx:223`](components/ui/dialog.tsx#L223) | Restoration now runs only when a mounted component observes `open=false`. Unmounting an open dialog never restores a surviving opener. Closing a lower dialog also unconditionally focuses its opener outside a still-open top dialog. | Make restoration handle unmount and respect remaining modal ownership; test top close, lower close, and conditional unmount. |

Manual coverage becomes adequate when it preserves an already-open break-glass confirmation, forces **only the company lookup** to fail, verifies confirmation disabled and zero POSTs, exercises actual scheduled cancellation, and checks stacked-modal focus/restoration. Stopping all of org can instead unmount the workspace through its permission gate, masking the form behavior.

Tier 1: **0 tests rerun** in this static review. Existing [verification receipt](.aidlc/runs/PORTAL-PLATFORM-001/artifacts/verification.json) reports **174/174 unit**, **22/22 integration**, build/types/lint/spec PASS; it does not establish post-fix browser behavior.  
Tier 2: **16 findings assessed: 11 Fixed, 5 Not fixed, 0 Deferred-acceptable**; no confidence receipt written.  
Tier 3: required behavioral coverage remains incomplete; release bar not established.

VERDICT: BLOCKED
