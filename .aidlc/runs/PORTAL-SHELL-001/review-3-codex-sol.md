# Independent re-review #3 — PORTAL-SHELL-001

Verdict: **BLOCKED**

Reviewer: Codex; independent of implementation, `in-place:true`. Read review-2, review-fix §S14, and plan AC-6/S14. Ran `git diff` restricted to the eight S14 “Files changed” paths; inspected scoped untracked files directly. Finding #3 remains declined: only 401 versus other failures was assessed.

## Confirmed finding

1. **MEDIUM — Finding #2 is incomplete: the Button gate excludes components/, hiding 15 forbidden overrides.** `app/layout-gate.test.ts:97` restricts the filesystem check to app/ and features/, although sourceFiles includes components/. Independent AST inspection of 121 Button elements, plus multiline `rg`, found zero forbidden overrides in app/ and features/, but 15 in eight components files:

   - `components/auth/login-form.tsx:35,118`
   - `components/modals/allergen-warning-modal.tsx:73,82`
   - `components/modals/cold-chain-violation-modal.tsx:112,121`
   - `components/modals/confirm-qc-decision-modal.tsx:103,112`
   - `components/modals/invite-member-modal.tsx:136,143`
   - `components/modals/quantity-variance-modal.tsx:137,145`
   - `components/modals/session-timeout-modal.tsx:116`
   - `components/modals/supplier-suspension-modal.tsx:108,116`

   These include rounded-xl, h-10, bespoke gradients and status-colored backgrounds. This fails the requested zero-overrides check across features/, components/, app/ and FR-6/AC-6's shared Button requirement. In scratch, changing only the gate's directory predicate to include components/ makes the actual AST gate report all eight files: full suite **1 failed / 252 passed**, exit 1. The current green gate therefore cannot establish the required condition. Include components/ in the gate and replace these overrides with appropriate shared variants/sizes. Evidence: `/tmp/portal-review-3-button-audit.log`, `/tmp/portal-review-3-components-gate.log`.

## Verified fixes and regression assessment

- **#1 fixed.** Both frames accept a 200 profile with display_name empty, consistent with `../auth/internal/transport/http/dto/profile_dto.go:17`. Store uses email as its account label; console retains email as label/detail, including context failures. Typed fixtures contain all real DTO fields, including nullable avatars. Named profiles and 401-versus-other-failure behavior still pass. Assertions call the actual fetch/resolution functions with Response objects; M-g demonstrates they are not tautological.
- **#2 detector and seven screen replacements fixed.** AST traversal handles className after callbacks, JSX string expressions and template literals; positive fixtures reject false positives from other components/source strings. Membership actions preserve meaning: invite uses primary/sm, suspend/activate/cancel outline/sm, revoke destructive/sm. Roles group toggle remains ghost/sm; permission toggle remains ghost/icon and retains its descriptive title. No additional S14 regression found.

## Independent verification

Scratch: `/tmp/portal-review-3-sol-yopf59t7`; copied with cp -r, excluding node_modules, .git and .next, then symlinked repository node_modules. Every test invocation used full `npm test` with `ESBUILD_BINARY_PATH=/home/dawn/.local/share/esbuild/esbuild-0.21.5`.

| Check | Result |
|---|---|
| Baseline and final restored baseline, including layout gate | PASS, exit 0; 37 files / 253 tests |
| M-g: reject empty display_name again in both frames | KILLED, exit 1; 5 failed / 248 passed |
| M-h: skip className after an earlier => callback | KILLED, exit 1; 2 failed / 251 passed |
| npm run lint; npm run typecheck | PASS, exit 0 |

Requested mutations killed: **2/2**, through assertion failures. Logs: `/tmp/portal-review-3-{baseline,M-g,M-h,restored,final-baseline,lint,typecheck}.log`. Read-only `hs-cli gates` completed on scratch. Graph search/coverage calls were denied by tool policy; direct source inspection used. No browser/backend integration run.

All scratch mutations restored. Hash checks confirm all eight scoped repository files unchanged. This report is the only repository write; no approval, receipt, plan or code was changed.
