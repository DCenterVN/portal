## Done
- Added the store route-group layout and client frame with raw `/api/auth/me` fetch behavior.
- Added mock Vietnamese store navigation/footer content and cart-count placeholder.
- Added tests for guest 401 behavior, API-provided user name, and fetch failure.
- Mutation check: switching to `apiFetch` made the suite fail; raw `fetch` was restored.

## Files changed
- `app/(store)/layout.tsx`
- `features/store/store-frame.tsx`
- `features/store/store-frame.test.ts`
- `mocks/store.ts`
- `.aidlc/runs/PORTAL-SHELL-001/handback.md`

## Decisions
- Used `resolveStoreUser(status, payload)` as the pure response resolver and `fetchStoreUser` as the fetch/error boundary.
- Kept cart count as a placeholder in mocks because the existing `StoreShell` has no count prop and cart integration is out of scope.

## Left over
- SDLC claim, verify, and handback commands were not run, per the explicit instruction. No SDLC receipts were generated.
