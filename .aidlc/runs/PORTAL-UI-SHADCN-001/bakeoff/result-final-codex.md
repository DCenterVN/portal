# Kết quả kiểm tra portal-ui-shadcn

| Lệnh | Exit | Số liệu chính | Thời gian |
|---|---:|---|---:|
| `pnpm vitest run components app features lib --exclude lib/api/supplier-contract-bff.test.ts` | 0 | 82 files, 1458 pass, 0 fail | 4s |
| `pnpm lint` | 0 | pass | 4s |
| `pnpm tsc --noEmit` | 0 | pass | 2s |
| `node scripts/check-structure.mjs --strict` | 0 | 14 violations, 14 baselined, 0 new | 0s |
| `pnpm next build --webpack` | 0 | build pass; restored `next-env.d.ts` (restore exit 0) | 24s |
| `python3 ~/agent_skills/sdlc/engine/archcheck.py` | 1 | 78 violations, 25 baselined, 53 new, 33 stale | 0s |

## Archcheck NEW (53)

- FE-03: `e2e/setup/api.ts`
- FE-09: `components/ui/alert-dialog.tsx`, `components/ui/badge.tsx`, `components/ui/button.tsx`, `components/ui/dialog.tsx`, `components/ui/sheet.tsx`
- FE-10: `components/layout/console-header.tsx`, `components/ui/alert-dialog.tsx`, `components/ui/avatar.tsx`, `components/ui/badge.tsx`, `components/ui/button.tsx`, `components/ui/checkbox.tsx`, `components/ui/command.tsx`, `components/ui/dialog.tsx`, `components/ui/dropdown-menu.tsx`, `components/ui/input-group.tsx`, `components/ui/input.tsx`, `components/ui/native-select.tsx`, `components/ui/popover.tsx`, `components/ui/radio-group.tsx`, `components/ui/select.tsx`, `components/ui/sheet.tsx`, `components/ui/sidebar.tsx`, `components/ui/switch.tsx`, `components/ui/table.tsx`, `components/ui/tabs.tsx`, `components/ui/textarea.tsx`, `components/ui/tooltip.tsx`, `features/inventory/shelves-view.tsx`, `features/traceability/trace-view.tsx`
- FE-13: `components/ui/sidebar.tsx`
- FE-14: `features/customer-auth/login-form.tsx` (missing empty,error), `features/employee-auth/staff-login.tsx` (missing empty,error), `features/inventory/agreement-document.tsx` (missing error), `features/inventory/receipt-evidence-field.tsx` (missing empty,error), `features/inventory/supplier-receipts-container.tsx` (missing loading), `features/inventory/supplier-receipts-view.tsx` (missing loading), `features/platform/workspace.tsx` (missing loading), `features/production/dishes/dishes-container.tsx` (missing loading,error), `features/production/food-plans-view.tsx` (missing loading,empty,error), `features/production/food-set-form.tsx` (missing loading,empty,error), `features/production/material-picker.tsx` (missing error), `features/production/targets-view.tsx` (missing error), `features/products/catalog-view.tsx` (missing loading), `features/products/order-detail-view.tsx` (missing loading,empty,error), `features/products/orders-view.tsx` (missing loading,empty,error), `features/products/product-create-dialog.tsx` (missing empty,error), `features/products/product-detail-loader.tsx` (missing loading,empty,error), `features/products/products-loader.tsx` (missing loading), `features/products/products-view.tsx` (missing loading,empty,error), `features/staff-profile/staff-profile-view.tsx` (missing loading,empty)
- SIZE-01: `components/ui/sidebar.tsx` (727 lines), `lib/api/production.ts` (446 lines)
