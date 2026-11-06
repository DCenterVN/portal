# Verification result — codex

| Command | Exit | Main figures | Time |
|---|---:|---|---:|
| `pnpm vitest run components app features lib --exclude lib/api/supplier-contract-bff.test.ts` | 0 | 82 files passed; 1,458 tests passed, 0 failed | 3.97s |
| `pnpm lint` | 0 | ESLint completed | 3.15s |
| `pnpm tsc --noEmit` | 0 | TypeScript completed | 1.66s |
| `node scripts/check-structure.mjs --strict` | 0 | 14 violations; 14 baselined; 0 new | 0.03s |
| `pnpm next build --webpack` | 0 | Build completed; `git restore next-env.d.ts` exit 0 | 19.04s |
| `python3 ~/agent_skills/sdlc/engine/archcheck.py` | 1 | 81 violations; 26 baselined; 55 NEW; 32 stale | 0.48s |

Archcheck output head (first 10 lines; command exited 1):
```text
NEW   FE-03 e2e/setup/api.ts
NEW   FE-04 features/customer-auth/login-form.tsx features/auth-shared/use-login-form
NEW   FE-04 features/employee-auth/staff-login.tsx features/auth-shared/use-login-form
NEW   FE-09 components/ui/alert-dialog.tsx
NEW   FE-09 components/ui/badge.tsx
NEW   FE-09 components/ui/button.tsx
NEW   FE-09 components/ui/dialog.tsx
NEW   FE-09 components/ui/sheet.tsx
NEW   FE-10 components/layout/console-header.tsx
NEW   FE-10 components/ui/alert-dialog.tsx
```

Archcheck NEW by rule id (all 55 entries):
- FE-03: `e2e/setup/api.ts`
- FE-04: `features/customer-auth/login-form.tsx` (features/auth-shared/use-login-form); `features/employee-auth/staff-login.tsx` (features/auth-shared/use-login-form)
- FE-09: `components/ui/alert-dialog.tsx`, `components/ui/badge.tsx`, `components/ui/button.tsx`, `components/ui/dialog.tsx`, `components/ui/sheet.tsx`
- FE-10: `components/layout/console-header.tsx`; `components/ui/alert-dialog.tsx`, `avatar.tsx`, `badge.tsx`, `button.tsx`, `checkbox.tsx`, `command.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `input-group.tsx`, `input.tsx`, `native-select.tsx`, `popover.tsx`, `radio-group.tsx`, `select.tsx`, `sheet.tsx`, `sidebar.tsx`, `switch.tsx`, `table.tsx`, `tabs.tsx`, `textarea.tsx`, `tooltip.tsx`; `features/inventory/shelves-view.tsx`; `features/traceability/trace-view.tsx`
- FE-13: `components/ui/sidebar.tsx`
- FE-14: `features/customer-auth/login-form.tsx` (missing empty,error); `features/employee-auth/staff-login.tsx` (missing empty,error); `features/inventory/agreement-document.tsx` (missing error); `features/inventory/receipt-evidence-field.tsx` (missing empty,error); `features/inventory/supplier-receipts-container.tsx` (missing loading); `features/inventory/supplier-receipts-view.tsx` (missing loading); `features/platform/workspace.tsx` (missing loading); `features/production/dishes/dishes-container.tsx` (missing loading,error); `features/production/food-plans-view.tsx` (missing loading,empty,error); `features/production/food-set-form.tsx` (missing loading,empty,error); `features/production/material-picker.tsx` (missing error); `features/production/targets-view.tsx` (missing error); `features/products/catalog-view.tsx` (missing loading); `features/products/order-detail-view.tsx` (missing loading,empty,error); `features/products/orders-view.tsx` (missing loading,empty,error); `features/products/product-create-dialog.tsx` (missing empty,error); `features/products/product-detail-loader.tsx` (missing loading,empty,error); `features/products/products-loader.tsx` (missing loading); `features/products/products-view.tsx` (missing loading,empty,error); `features/staff-profile/staff-profile-view.tsx` (missing loading,empty)
- SIZE-01: `components/ui/sidebar.tsx` (727 lines); `lib/api/production.ts` (446 lines)
