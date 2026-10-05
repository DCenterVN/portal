# Plan: Customer storefront and order journey

- **Task ID**: `PORTAL-CUSTOMER-001`
- **Mode**: `hard`
- **Story**: US-UI-002
- **Sprint**: 02
- **Issue**: 

## Scope
- Outcome: customer can browse available products, check out, and follow/cancel eligible orders using Sales-owned data; 100% of the seeded customer journey passes and 0 staff-only controls appear on customer routes.
- Decision: REUSE the Sales BFF and transport; EXTEND customer-specific views and API client calls; CREATE `/shop` and product-detail routes. Keep employee product administration at `/products`.
- Impact (codebase-memory, project `mnt-win_d-feature-ticket`, indexed 2026-09-05): `ProductsLoader` calls `getProducts` then renders `ProductsView`; `CartView` calls `createOrder(cartId)`; `/products` currently includes “Tạo sản phẩm mới” (`features/products/products-view.tsx:120-140`); customer login redirects into `/products` (`features/auth/home-for.ts:5-16`). Graph coverage for product/cart views is partial at lines 129 and 127, so those lines were checked directly. Existing order detail/cancel BFF routes are present under `app/api/sales/orders/`.
- In scope: portal UI and its BFF client; reuse published Sales/Auth API contracts. Excludes backend service behavior, payment-provider UI, and employee/OWNER administration.

## Requirements
- FR-1 Customer landing and catalog. AC-1: a customer without employee membership lands at `/shop`; catalog shows only API-returned sellable products and has loading, empty, error, and success states. AC-2: customer routes contain no product-create, activate, pricing-policy, or employee actions.
- FR-2 Product detail and cart. AC-3: a customer can inspect product/variant details and add, update, or remove cart lines; prices and availability are displayed from Sales responses, never computed as authoritative client state.
- FR-3 Checkout. AC-4: checkout collects recipient, phone, delivery address/area, and payment method required by `sales/.aidlc/specs/order-lifecycle.md`; invalid inputs and API 4xx/409/422/503 are shown without clearing the cart. AC-5: the client sends a stable idempotency key for one checkout attempt and blocks duplicate submission while pending.
- FR-4 Orders. AC-6: the customer can list and open only their own orders; backend 404/403 is shown safely. AC-7: cancellation is offered only for eligible order states and a backend rejection leaves the displayed order unchanged.
- FR-5 Accessibility and responsiveness. AC-8: all strings use next-intl (`vi` default, `en` catalog), keyboard focus is visible, controls are at least 44px, and the flow works at 390px and 1440px.
- Out of scope: employee in-store sales/fulfillment; org membership administration; changing Sales/Auth APIs or payment-provider integration.

## Technical definition
- Contract: `../sales/.aidlc/specs/order-lifecycle.md`; customer address/branch flow: `../platform-docs/docs/usecases/UC-mua-hang-b2c.md`; registration/session contract: `../auth/.aidlc/specs/register.md`; frontend boundaries: `../platform-docs/standards/frontend.md`.
- Reuse `lib/api/sales.ts`, `lib/fetcher.ts`, and existing `app/api/sales/*` handlers. Feature hooks own state; app pages stay server components; browser code calls only portal routes.
- Browser journey tests use Playwright/Chromium against the rendered Portal UI; Vitest/API integration checks remain supplemental.
- Security: customer order scope is enforced by Sales; UI never accepts an order/customer identity to widen scope. Keep current CSRF/cookie/refresh behavior.
- NFR: no customer view may fall back to sample or cached staff data; checkout retry is idempotent; LCP target ≤2.5s mobile and route JS ≤200 KiB.

## UX
- Flow: `/shop` → product detail → cart/checkout → order result → order history/detail. Returning from login preserves only a sanitized customer route.
- Use existing Đồng xanh tokens and primitives. Product management stays in its current employee route. Provide clear empty-cart, unavailable-area, stock/price conflict, and pending-payment states.
- Evidence: each changed screen has loading/empty/error/success screenshots at 390px and 1440px, plus keyboard and light/dark checks under `evidence/`.

## Design
- Customer pages: `features/customer/*`; route files only compose views. Reuse Sales BFF routes for products, carts, orders, detail, and cancellation. Extend `lib/api/sales.ts` only for missing request/response methods that exist in the published OpenAPI/spec; do not invent an endpoint.
- API contract: `GET /sales/products`; `GET /sales/products/{product_id}`; cart line add/update/delete; `POST /sales/orders`; `GET /sales/orders`; `GET /sales/orders/{order_id}`; `POST /sales/orders/{order_id}/cancel`. Responses/errors follow the linked Sales spec. No DB or event changes.
- State rules: only server-confirmed order/cart responses become success; 401 follows existing refresh/login flow; 409/422 preserve form values; network/5xx never become empty-success.

## Files planned
- features/auth/home-for.ts
- features/auth/home-for.test.ts
- app/shop/page.tsx
- features/customer/storefront-view.tsx
- features/customer/storefront.test.ts
- app/shop/products/[id]/page.tsx
- features/customer/product-detail-view.tsx
- features/customer/use-catalog.ts
- features/customer/product-detail.test.ts
- app/cart/page.tsx
- features/customer/checkout-view.tsx
- features/customer/use-cart.ts
- features/customer/checkout.test.ts
- lib/api/sales.ts
- app/orders/page.tsx
- app/orders/[id]/page.tsx
- features/customer/orders-view.tsx
- features/customer/order-detail-view.tsx
- features/customer/use-orders.ts
- features/customer/orders.test.ts
- features/customer/order-detail.test.ts
- messages/vi.json
- messages/en.json
- .aidlc/runs/PORTAL-CUSTOMER-001/ui-cases.md
- .aidlc/runs/PORTAL-CUSTOMER-001/anti_check.py
- .aidlc/runs/PORTAL-CUSTOMER-001/evidence/
- .aidlc/runs/PORTAL-CUSTOMER-001/testkit/env.md
- .aidlc/runs/PORTAL-CUSTOMER-001/testkit/happy.http
- .aidlc/runs/PORTAL-CUSTOMER-001/testkit/errors.md
- pnpm-lock.yaml
- playwright.config.ts
- tests/e2e/customer-flow.spec.ts
- tests/e2e/customer-errors.spec.ts
- .aidlc/runs/PORTAL-CUSTOMER-001/testkit/happy.md

## Tests planned
- TC-1 / AC-1,2 / unit+UI / `npm test -- features/customer/storefront`
- TC-2 / AC-3 / unit / `npm test -- features/customer/product-detail`
- TC-3 / AC-4,5 / unit+integration / `npm test -- features/customer/checkout tests/integration`
- TC-4 / AC-6 / unit+integration / `npm test -- features/customer/orders tests/integration`
- TC-5 / AC-7 / unit+integration / `npm test -- features/customer/order-detail tests/integration`
- TC-6 / AC-8 / UI evidence / `python3 .aidlc/runs/PORTAL-CUSTOMER-001/anti_check.py`
- TC-7 / all / build+type+lint / `npm run build && npm run typecheck && npm run lint`
- TC-8 / contract / spec / `cd ../sales && python3 ~/agent_skills/sdlc/engine/speccheck.py .aidlc/specs/order-lifecycle.md`
- TC-9 / customer UI E2E / `PORTAL_E2E_BASE=http://127.0.0.1:3000 npm run test:e2e -- tests/e2e/customer-flow.spec.ts`; use a real browser to register/sign in, browse the storefront, complete the visible cart/checkout flow, and inspect order history against the running system.

## Slices
- [ ] S1: Separate customer landing/catalog from employee product management (files: features/auth/home-for.ts, features/auth/home-for.test.ts, app/shop/page.tsx, features/customer/storefront-view.tsx, features/customer/storefront.test.ts; test: npm test -- features/customer/storefront features/auth/home-for)
- [ ] S2: Customer product detail (files: app/shop/products/[id]/page.tsx, features/customer/product-detail-view.tsx, features/customer/use-catalog.ts, features/customer/product-detail.test.ts; test: npm test -- features/customer/product-detail)
- [ ] S3: Cart and checkout against Sales DTOs (files: app/cart/page.tsx, features/customer/checkout-view.tsx, features/customer/use-cart.ts, features/customer/checkout.test.ts, lib/api/sales.ts; test: npm test -- features/customer/checkout)
- [ ] S4: Customer order history (files: app/orders/page.tsx, features/customer/orders-view.tsx, features/customer/use-orders.ts, features/customer/orders.test.ts; test: npm test -- features/customer/orders)
- [ ] S5: Customer order detail and cancellation rules (files: app/orders/[id]/page.tsx, features/customer/order-detail-view.tsx, features/customer/order-detail.test.ts; test: npm test -- features/customer/order-detail)
- [ ] S6: Locale, UI evidence, and full regression (files: messages/vi.json, messages/en.json, .aidlc/runs/PORTAL-CUSTOMER-001/ui-cases.md, .aidlc/runs/PORTAL-CUSTOMER-001/anti_check.py, .aidlc/runs/PORTAL-CUSTOMER-001/evidence/; test: python3 .aidlc/runs/PORTAL-CUSTOMER-001/anti_check.py)
- [ ] S7: Installable browser E2E harness (files: package.json, pnpm-lock.yaml, playwright.config.ts; test: npm run test:e2e -- --list)
- [ ] S8: Customer happy-path browser E2E (files: tests/e2e/customer-flow.spec.ts, .aidlc/runs/PORTAL-CUSTOMER-001/testkit/env.md, .aidlc/runs/PORTAL-CUSTOMER-001/testkit/happy.md; test: PORTAL_E2E_BASE=http://127.0.0.1:3000 npm run test:e2e -- tests/e2e/customer-flow.spec.ts)
- [ ] S9: Customer UI failure states and browser evidence (files: tests/e2e/customer-errors.spec.ts, .aidlc/runs/PORTAL-CUSTOMER-001/testkit/errors.md, .aidlc/runs/PORTAL-CUSTOMER-001/e2e-results.md; test: PORTAL_E2E_BASE=http://127.0.0.1:3000 npm run test:e2e -- tests/e2e/customer-errors.spec.ts)

## Risks / rollback
- Keep `/products` for employee catalog management; rerouting it would expose staff controls to customers. Rollback removes `/shop` routes and restores customer redirect while leaving employee pages/data untouched.
- Existing Sales DTOs may not expose every B2C service-area/checkout field. Stop at the contract boundary and record a separate Sales API task; do not fabricate response fields or silently drop delivery requirements.
- Live customer seed/credentials are not yet confirmed; testkit must document a re-runnable isolated fixture before live integration is called PASS.

## Scope constraints
- Backend changes are excluded. If a Sales/Auth endpoint required by checkout is absent, this plan cannot claim that journey is complete or emulate the missing backend behavior.
- E2E scope is the real local system path Portal → BFF → Auth/Sales APIs. The local stack is healthy. Tests require isolated data and must never substitute mocks for a claimed system E2E pass.
- Browser E2E means Playwright drives the rendered UI in Chromium and verifies visible navigation, forms, states, and outcomes. Current `tests/integration/*.it.test.ts` are HTTP/BFF integration tests and do not count as UI E2E.
- Portal `package.json` has no Playwright test dependency or browser test script yet; S7 adds `@playwright/test`, its lockfile entry, and browser script after plan approval. Chromium installation and execution are documented in `testkit/env.md`.
- The existing `npm test` shell script drops CLI arguments. S7 should fix argument forwarding for Vitest integration runs, while browser E2E uses its separate Playwright script.
