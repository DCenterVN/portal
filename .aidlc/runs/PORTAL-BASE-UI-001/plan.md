# Plan: PORTAL-BASE-UI-001

- **Task ID**: `PORTAL-BASE-UI-001`
- **Mode**: `hard`
- **Story**: US-UI-001
- **Sprint**: 01
- **Issue**: Dawn: “UI xấu quá cho codex làm đi”; local task, no remote issue supplied.
- **Phase**: PLAN ONLY, branch `portal-shell-platform-wip`. Dawn alone runs `sdlc.py approve`. No production changes in this turn.

## Scope

Why it looks bad (source review, not a claim of rendered-browser inspection):
- Token/colour: `app/tokens.generated.css:3`–`:22` use green-tinted neutrals, green primary, terracotta accent and yellow chrome detail. This competes with the decided tomato-red brand.
- Typography: `app/layout.tsx:2` loads Be Vietnam Pro; `app/tokens.generated.css:30` selects it for body text instead of Nunito.
- Colour/surface: `components/ui/button.tsx:11` uses a gradient primary; `app/(store)/me/profile-client.tsx:124` adds an info-to-primary gradient avatar. Both conflict with UX-01.
- Spacing/geometry: `components/ui/input.tsx:10` is h-9 with rounded-md; `components/ui/field.tsx:7` is min-h-11 with rounded-md; `components/layout/auth-shell.tsx:40` changes card padding from 24 to 32. Controls lack the consistent 40/44–48px and radius-12/16 rhythm of UX-02/07.
- Layout: `components/layout/console-sidebar.tsx:23` uses dark chrome, and `:61` a translucent selected row rather than a solid primary pill; `components/layout/console-header.tsx:14` has a bordered surface; `components/layout/console-shell.tsx:100` has a footer. UX-03 requires light sidebar, right-side header tools and no console footer.
- State hierarchy: `components/ui/state.tsx:57` implements skeleton as a centered spinner block; `app/(store)/me/profile-client.tsx:67` does the same. Loading should preserve the final layout shape (UX-06).

- Outcome: a calm, soft, generously spaced Bếp Tươi experience for A–E, backed by real auth/org/customer behavior and four explicit states.
- Decision: EXTEND existing primitives, shells and BFF conventions; CREATE missing A–D feature leaves; REUSE approved shell work; REMOVE redundant gradient styling within assigned files.
- Impact: source-only routing trace under the user's restricted reading scope: `(auth)/layout` → AuthShell → auth forms; `(store)/me/page:1` → shell-owned profile-client; `(console)/memberships/page:1` → shell-owned memberships-view. New invitations/customers are sibling routes. No graph lookup performed because this turn explicitly restricts reading to the named material.
- Out of scope: BE source, credential/session ownership, final authorization, shell-owned files, store catalogue/hero, global console QuickNote implementation, dependency installation, commits, pushes, merges and approval/verify/done commands.

## Requirements

All FRs require the common visual AC-V and the per-screen visual AC below.

| FR | Acceptance criteria |
|---|---|
| FR-A: accept either invite type on `/invite/accept?token=` | AC-A1: valid mail token + matching passwords (minimum 12 Unicode characters, existing register rule) sends exactly `{token,password}`, once; 200 leads to `/login`. Both OWNER and employee links work. Toggle has an accessible name. AC-A2: missing token disables submit; invalid/used/expired token explains requesting a new invite. `rate_limit_exceeded` shows a wait message, never auto-retries. AC-A3: loading/pending, empty/missing-token, error and data/form-success are visibly distinct. |
| FR-B: invitations list and actions | AC-B1: six statuses PENDING_APPROVAL/APPROVED/PROVISIONED/REJECTED/EXPIRED/FAILED render with text badges; status + branch filters and pagination match server pagination. AC-B2: creation requires `org:employee:invite`; approve/reject requires `org:employee:approve` AND PENDING_APPROVAL. Reject requires a reason. No role-name comparison. Saving revalidates the list. AC-B3: OWNER create returns PROVISIONED, mail arrives; non-owner pending flow is tested with fixture permissions. Four states live inside the table frame. |
| FR-C: own customer profile/address book | AC-C1: email read-only, name/phone editable; PATCH includes only changed fields; phone is submitted verbatim and rendered from BE E.164 response. AC-C2: CUSTOMER_NOT_FOUND polls at 1s intervals only within a 10s activation window, at most ten retries; after deadline shows actionable error. No polling of other errors or 429. AC-C3: province → commune selection clears stale commune; add/edit/delete/default address; maximum 20, exactly one default when BE says so; ADDRESS_LIMIT disables add; CUSTOMER_LOCKED banner makes all writes read-only. AC-C4: UI adds an actual Hà Nội Xã address, GET /customer/me and DB readback contain matching province/commune/line; this is mandatory, D-136 is resolved. Four profile/address states. |
| FR-D: staff customer management | AC-D1: org context + `customer:customer:read` + ACTIVE CUSTOMER module required; search name/phone-prefix/exact-email, status, pagination limit ≤50; detail shows BE phone/email untouched with “đã che” when pii_masked. AC-D2: only `customer:customer:update` shows lock/unlock; lock reason 3..200; after write list/detail refresh. CUSTOMER_LOCKED is mapped centrally; retryable UNAVAILABLE exposes manual retry. AC-D3: customer-only context has no staff customer navigation. Four states on list and detail. |
| FR-E: existing auth + context contract review | AC-E1: login/refresh/context decode `body.data ?? body`, supporting direct and wrapped bodies without leaking access tokens. register 202 is accepted; activate, forgot/reset and switch-org use the contract bodies. AC-E2: both VALIDATION_ERROR and VALIDATION_FAILED render field errors and focus first error; 429 wait/no retry; context body is `{org_id,branch_id}`. AC-E3: each login/register/activate/forgot/reset/context route has pending/loading, empty/initial or absent-token, error, and data/success captures. Initial empty form is not an artificial “no records” screen. |

AC-V (every changed screen, every state): Quicksand 700 headings + **Nunito** body (Dawn's brand overrides UI rule's “Nunito Sans”); one tomato-red primary, red-tinted neutrals; status colours only for status. All colour values live in generated token definitions, zero raw hex elsewhere in changed code. No gradients, glass, library icons or coloured left card borders. AA contrast ≥4.5:1 normal text, ≥3:1 large text/control boundaries; focus visible and keyboard usable. At 375/768/1024/1440px, light/dark: document scrollWidth ≤ viewport width; tables adapt to cards at 375, never cause page overflow. Lighthouse accessibility ≥90, mobile LCP ≤2.5s, route First Load JS ≤200kB. FE-19 happy run has zero browser console errors/5xx. Separate injected error runs are not included in happy-run totals.

| Screen visual AC | Measured composition |
|---|---|
| AC-VA | One centered solid card, radius-card 16, spacing 24, input radius 12, touch height 44–48; primary button radius 14; 375px no horizontal scroll; uses primary/surface/line/ink/muted/focus tokens; AA. |
| AC-VB | Page title Quicksand 28 + one contextual subtitle; one primary invite action in toolbar; 6-column table, radius 12, header tint, row 44; invite ≥3 fields in 440px right sheet, mobile bottom sheet; reject reason in ≤480px dialog; token colours/AA/no hex/375px fit. |
| AC-VC | Profile and address sections use solid radius-16 cards, gap 24, single-column mobile; address form in sheet 440px, searchable province/commune combobox (>7 options); label/hint/error below field; tokens/AA/no hex/375px fit. |
| AC-VD | Search/filter toolbar + table; row opens detail sheet 440px, direct detail URL renders same feature view; lock reason in compact dialog; PII label muted with AA contrast; tokens/no hex/375px fit. |
| AC-VE | Shared AuthShell visual language across every auth route; context options solid cards/pills, skeleton retains their shapes; 44px touch controls, 16/24 spacing; tokens/AA/no hex/375px fit. |

## Technical definition

Authority: the three inbox documents supplied by Dawn; `platform-docs/standards/frontend.md` FE-01..20; `git show ui-ux-rules:standards/ui-ux.md` UX-01..08. No new UI library or ADR needed for brand already decided. Draft has blocking dependencies below; approval must not be mistaken for permission to edit their files.

Transport/contracts in lib/api; hooks/readers in features; JSX leaves consume state; app routes remain server components. No cross-feature import. Shared errors/permission helpers once in lib/api, not copied. Fail closed while permissions load. Browser uses /api BFF only; httpOnly cookie tokens stay server-side; BFF method/path/query allowlists reject unknown paths. No raw fetch outside lib/api/lib/fetcher. Files ≤300 lines, functions about 40 lines, shallow branching. Strings use next-intl via the owning message dependency.

TDD after approval: observable requirement test red → smallest implementation → full suite green. Anti-tautology: assert outgoing bodies, rendered buttons absent, bounded request count, BE readbacks; never merely assert helpers call themselves. No production edits or test-suite changes during PLAN.

## UX

Text flows: A mail → set password → login; B list → invite sheet → refreshed row → recipient A; C login → profile → address sheet → saved address; D context → list → detail → lock dialog → refreshed status; E register → mail → activate → login → context, plus forgot → mail → reset → login.

Wireframes (reviewable text, no extra artifacts):
- A/E: `brand / heading / context sentence / labelled fields / inline errors / one full-width CTA / secondary link` inside centered card.
- B/D: `page heading + subtitle / search + filters + CTA / table [loading|empty|error|rows] / pagination`; mobile stacked records; right sheet for detail/forms.
- C: `heading + subtitle / persistent locked banner / profile card / addresses heading + Add / address cards + default pill`.

Geometry tokens: radius-input 12, radius-button 14, radius-card 16, radius-dialog/toast 18, radius-pill 999; card/float/overlay shadows only; spacing 4/8/12/16/24/32/48; page padding 24, card 20–22 via semantic padding token. Reduced-motion fade; enter 150–220ms, exit 120ms, sheet 220ms. Raw icons from one icons.tsx, stroke 1.6. OverlayRoot/focus trap/Esc/return-focus/dirty close prompt reused from prerequisite primitives; no nested dialogs. Loading skeletons match final geometry. Buttons busy >300ms keep width and block duplicates. Persistent errors inline, validation under field, success through useToast (4s); error toast persists. New B–D tours ≤5 steps depend on shell Help/tour capability.

## Design

No DB schema/migrations. External integrations are existing Kong, Mailpit and seeded locations. D-135 invite bucket = `invite` 20/15m/IP, separate from forgot; wait copy never claims the gateway's separate 20/min limit is the invite limit. Honor Retry-After when present, otherwise invite wait explains up to 15 minutes without auto-submit.

| Boundary | Method/path + body/result |
|---|---|
| A | POST /auth/invite/accept `{token,password}` → 200; shared OWNER/employee page. |
| B | GET/POST /orgs/{org_id}/employee-invitations; query status,branch_id,page,limit; POST email,display_name,branch_id,role_codes[] → 201. POST /{id}/approve; POST /{id}/reject `{reason}`. Read items + pagination. |
| C | GET/PATCH /customer/me; PATCH display_name?/phone?; address POST recipient_name,phone,province_code,commune_code,line,is_default; PATCH only changed fields; DELETE →204 without JSON decoding. GET /locations/vn/provinces; GET /locations/vn/provinces/{code}/communes. |
| D | GET /customer/admin/customers?q&status&page&limit≤50; GET /{id}; POST /{id}/lock `{reason}`; POST /{id}/unlock. Preserve pii_masked + returned values. |
| E | POST /auth/web/login `{email,password}`; /auth/register `{email,password,display_name,phone?}` →202; /auth/activate `{token}`; /auth/org-context `{org_id,branch_id}`; reset body `{token,new_password}` per existing lib/auth/client.ts:114. |

Decode uses `body.data ?? body`, then zod schemas. Errors normalize errors.error_code, fields, retryable; validation stays field-local, rate_limit_exceeded suppresses all automated retries, CUSTOMER_LOCKED disables writes, ADDRESS_LIMIT disables add, bounded CUSTOMER_NOT_FOUND provisioning polling, UNAVAILABLE retry button. HTTP 403 lacking code shows no-permission state; no invented rejection code. `invalid_token` is documented in handoff (not the BE contract whitelist), so handle the known invite message but do not silently allow it in the happy run.

Dependency order: approved brand token generation + primitives + transports → S0 → S5 shared contract/error mapping → S1 → S2 → S3 → S4. Each screen's unit test belongs to that slice; no extra helper file may be added without plan amendment. Profile address list renders in profile-view; D detail/lock render in customers-view with a mode prop. If 300-line limit would be exceeded, stop and amend slice structure rather than growing the file.

## Files planned
- app/globals.css
- app/layout.tsx
- components/ui/button.tsx
- components/ui/field.tsx
- components/ui/brand-controls.test.tsx
- app/(auth)/invite/accept/page.tsx
- features/auth/invite-accept-form.tsx
- features/auth/invite-accept.ts
- lib/fetcher.ts
- features/auth/invite-accept.test.tsx
- features/memberships/use-invitations.ts
- features/memberships/invitations-view.tsx
- features/memberships/invite-form.tsx
- app/(console)/memberships/invitations/page.tsx
- features/memberships/invitations.test.tsx
- features/customer-profile/use-customer-me.ts
- features/customer-profile/profile-view.tsx
- features/customer-profile/address-form.tsx
- app/(store)/me/page.tsx
- features/customer-profile/profile.test.tsx
- features/customers/use-customers.ts
- features/customers/customers-view.tsx
- app/(console)/customers/page.tsx
- app/(console)/customers/[id]/page.tsx
- features/customers/customers.test.tsx
- lib/api/errors.ts
- lib/api/auth-contract.ts
- lib/auth/client.ts
- features/auth/switch-branch-page.tsx
- features/auth/auth-contract.test.tsx

## Tests planned

| TC | AC | layer | command |
|---|---|---|---|
| TC-0 | AC-V/VA..VE | token/control behavior and contrast | npm test |
| TC-A | AC-A1..3 | form + mocked transport, missing/expired token and no-retry request count | npm test |
| TC-B | AC-B1..3 | hook/view: all statuses, permission combinations, reject reason, list revalidation | npm test |
| TC-C | AC-C1..4 | MSW contract/hook/view: raw phone, sparse PATCH, deadline, 20 addresses, default, commune reset, locked writes | npm test |
| TC-D | AC-D1..3 | MSW list/detail: masking unchanged, search/page, lock 3/200 bounds, forbidden controls, retry | npm test |
| TC-E | AC-E1..3 | direct/enveloped contract, BFF cookie behavior dependency, 202, 400/422 field errors, context | npm test |
| TC-G | every slice | static gates | npm test && npm run lint && python3 ~/agent_skills/sdlc/engine/archcheck.py |
| TC-LIVE | A1/B3/C4/D2/E1 | real UI + GET /customer/me + SQL readback | npm exec --no -- playwright test .aidlc/runs/PORTAL-BASE-UI-001/testkit/happy.spec.ts --workers=1 |
| TC-VIS | AC-V/VA..VE | visual/a11y/build evidence after approval | npm run build; npm exec --no -- lighthouse http://localhost:3000/me --only-categories=accessibility,performance --output=json |

Every slice gate uses the **whole** `npm test`, never `npm test -- path`. Record per-slice test file names and executed assertion/test counts (>0 for each changed production module, including rendered route integration). Aggregate suite success with zero slice tests is BLOCKED. Unit fixtures derive from the supplied real scripts; errors use errors.md; BFF prerequisites need unknown method/path/query→404 tests. Lighthouse above is the representative command; repeat all changed routes under authenticated browser state using the installed harness, mobile local production build. Tool installation is an open prerequisite, not authorized here.

Required mutation proofs (after green, temporary mutation, whole npm test red, restore, whole suite green): M1 remove `body.data ?? body` → TC-E direct AND envelope fixture test fails; M2 remove permission-based button hiding → TC-B/TC-D asserts action is absent and fails; M3 remove CUSTOMER_LOCKED mapping → TC-C banner/disabled-write test fails. Record test names, nonzero exit, restoration; no tautological source-string test as substitute.

FE-15: capture four distinct PNGs per changed route (A, B, C, D list/detail, E login/register/activate/forgot/reset/context), matching states specified above, in both light/dark at 375 and 1440; also layout checks at 768/1024. Record AA computed contrast and no page horizontal scroll, keyboard Tab/Esc and reduced-motion. Browser errors/5xx must be zero in happy path; deliberate failures isolated. Real address readback cannot be replaced by MSW. DB verification covers customer status/name/phone/address and invitation recipient/status; owner activation and published lock outbox as in supplied testkits.

## Slices
- [ ] S0: Token-backed brand and controls (files: app/globals.css, app/layout.tsx, components/ui/button.tsx, components/ui/field.tsx, components/ui/brand-controls.test.tsx; test: npm test && npm run lint && python3 ~/agent_skills/sdlc/engine/archcheck.py; slice test count > 0)
- [ ] S1: A: accept OWNER and employee invites (files: app/(auth)/invite/accept/page.tsx, features/auth/invite-accept-form.tsx, features/auth/invite-accept.ts, lib/fetcher.ts, features/auth/invite-accept.test.tsx; test: npm test && npm run lint && python3 ~/agent_skills/sdlc/engine/archcheck.py; slice test count > 0)
- [ ] S2: B: permission-aware invitation workflow (files: features/memberships/use-invitations.ts, features/memberships/invitations-view.tsx, features/memberships/invite-form.tsx, app/(console)/memberships/invitations/page.tsx, features/memberships/invitations.test.tsx; test: npm test && npm run lint && python3 ~/agent_skills/sdlc/engine/archcheck.py; slice test count > 0)
- [ ] S3: C: customer profile and real Hanoi address (files: features/customer-profile/use-customer-me.ts, features/customer-profile/profile-view.tsx, features/customer-profile/address-form.tsx, app/(store)/me/page.tsx, features/customer-profile/profile.test.tsx; test: npm test && npm run lint && python3 ~/agent_skills/sdlc/engine/archcheck.py; slice test count > 0)
- [ ] S4: D: customer list, detail and lock controls (files: features/customers/use-customers.ts, features/customers/customers-view.tsx, app/(console)/customers/page.tsx, app/(console)/customers/[id]/page.tsx, features/customers/customers.test.tsx; test: npm test && npm run lint && python3 ~/agent_skills/sdlc/engine/archcheck.py; slice test count > 0)
- [ ] S5: E: auth contracts and context selector (files: lib/api/errors.ts, lib/api/auth-contract.ts, lib/auth/client.ts, features/auth/switch-branch-page.tsx, features/auth/auth-contract.test.tsx; test: npm test && npm run lint && python3 ~/agent_skills/sdlc/engine/archcheck.py; slice test count > 0)

## Risks / rollback

- Shell worktree currently owns auth forms, profile-client, memberships-view, page/toast, console-frame and route moves (observed git status). Never overwrite or cherry-pick blindly; this draft edits only sibling leaves plus /me/page routing. Use existing dirty working tree as baseline; do not reset it.
- Six ≤5-file screen cards cannot also contain all absent transports, token-source generation, i18n catalogues and new overlay primitives. They are explicit external dependencies below; task cannot ship until they land. Do not hide this as completed restyling or expand directory approval.
- Env readiness is BLOCKED in this sandbox, not demonstrated. Script is a future executable AC, not a passing E2E claim. Existing .env.local uses 127.0.0.1, customer URL missing; user requires localhost. No .env.local edit allowed in this phase.
- Shared token/button/font changes affect other portal screens. After approval inspect those shared consumers for overflow/contrast; keep old token aliases until callers migrate.
- API assumptions or BE defects are recorded below; do not change auth/org/customer services. Stop on unexpected rejection, rate limit or missing geographical data.
- Rollback after approval: reverse only this task's patch per slice, preserve shell/unrelated edits and retain tests/evidence; no destructive reset. Fixtures use unique e2e emails; do not wipe shared databases. PLAN artifacts are independently reversible.

## Open decisions

1. BLOCKING shell dependency: shell owner must land/release `features/auth/{login-form,register-form,activate-view,forgot-form,reset-form}.tsx`, `app/(store)/me/profile-client.tsx`, `features/memberships/memberships-view.tsx`, `features/console/console-frame.tsx`, `components/ui/{page,toast}.tsx`, `vitest.config.ts` and `(console)/layout.tsx`. E needs those forms' field errors/pending/success and brand compatibility; C replaces the old client only by routing after integration. No edits to these files in this task.
2. BLOCKING brand/layout prerequisite: `/mnt/win_d/feature/ticket/platform-docs/ui/tokens.json` → generated `app/tokens.generated.css` (generated warning at :1); actual generator command/version is [ASSUMED]. Required token aliases/radii/shadows/z/motion must exist before S0. `components/layout/{auth-shell,store-header,console-shell,console-sidebar,console-header}.tsx` need Bếp Tươi logo/text, UX-03 geometry, header/help/account/menu and nav permission hiding through their owner, not this task.
3. BLOCKING primitives prerequisite: `components/ui/{icons,sheet,combobox,tooltip}.tsx`, corrected `components/ui/{input,state,dialog}.tsx`, OverlayRoot and `components/patterns/tour.tsx` must be supplied under separately approved primitive slices. These files are absent or conflict with source geometry. Primitive exact API and delivery owner are [ASSUMED]; require keyboard/focus/dirty-close tests before screen work.
4. BLOCKING transport prerequisite: new `lib/api/{auth-client,auth-bff,employee-contract,employee-client,employee-bff,customer-contract,customer-client,customer-bff,locations-client,locations-bff}.ts`; `app/api/auth/invite-accept/route.ts`, `app/api/employee-invitations/[...path]/route.ts`, `app/api/customer/[...path]/route.ts`, `app/api/locations/[...path]/route.ts`, and their allowlist/contract tests. Exact employee browser prefix is [ASSUMED] (`/api/employee-invitations` in testkit). Final paths require approved companion plan, no broad directory approval here. Existing company-bff.ts:8 allowlist lacks invitations and prefixes /org, while BE invitation route is /orgs. Preserve those distinct paths.
5. BLOCKING i18n prerequisite: owning task supplies `messages/vi.json` and `messages/en.json` keys for new screens; exact key namespace is [ASSUMED] `baseUi`. No hardcoded user strings in production implementation.
6. Environment: Docker socket and curl socket denied (env.md real output). Dawn must run the documented commands in a permitted local terminal, correct .env.local to localhost:8000 and include CUSTOMER_INTERNAL_URL; exact customer env key consumption is [ASSUMED] until customer-bff is implemented. No escalation available here.
7. Test runner: installed Playwright/Lighthouse availability is [ASSUMED]; no Playwright config was found by rg. Testkit uses explicit file, chromium and localhost defaults; package scripts/tool installation require an approved test-harness dependency if unavailable. Exact new field accessible labels/select implementation is [ASSUMED] as specified in happy.spec.ts; adopt these labels or update spec in approved implementation.
8. [ASSUMED] backend default-address selection behavior: contract caps count and mentions one default but does not define first-address/delete-default semantics. Verify actual response; do not invent client defaults. Preserve BE default truth.
9. Live spec DB address table `customer_addresses` and customer state values LOCKED/ACTIVE are [ASSUMED], because the permitted contract/scripts omit the address table name and explicit state enum. Verify before E2E; no BE schema edit.
10. Invalid/used invite token code `invalid_token` comes from handoff, absent from the BE contract's listed codes; keep happy run strict and obtain contract clarification for dedicated error fixture. Module-denied/403, wrong province/commune and integration 503 have no named codes in that contract: never invent them in errors.md.
11. Draft readiness: dependency ownership/delivery must be settled before this six-card plan is executable. Dawn's approval alone does not complete those prerequisites. No BE fix, approval, verify/done, commit or push has been run.
