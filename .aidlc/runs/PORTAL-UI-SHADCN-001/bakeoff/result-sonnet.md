# Kết quả kiểm tra — AGENT=sonnet

| Lệnh | Exit | Số liệu chính | Thời gian |
|---|---|---|---|
| pnpm vitest run components app features lib --exclude lib/api/supplier-contract-bff.test.ts | 0 | 82 file pass, 1458 test pass, 0 fail | 4s |
| pnpm lint | 0 | không cảnh báo/lỗi | 3s |
| pnpm tsc --noEmit | 0 | không lỗi | 1s |
| node scripts/check-structure.mjs --strict | 0 | 14 vi phạm, 14 baselined, 0 new | 0s |
| pnpm next build --webpack (rồi git restore next-env.d.ts) | 0 | build thành công | 20s |
| python3 ~/agent_skills/sdlc/engine/archcheck.py | 1 | 81 violations, 26 baselined, 55 NEW, 32 stale (FIXED) | 0s |

Ghi chú: thời gian đo bằng giây nguyên (có thể cache). Không sửa baseline/nguồn.

## archcheck NEW (55), rule id + file
- FE-03 e2e/setup/api.ts
- FE-04 features/customer-auth/login-form.tsx features/auth-shared/use-login-form
- FE-04 features/employee-auth/staff-login.tsx features/auth-shared/use-login-form
- FE-09 components/ui/alert-dialog.tsx
- FE-09 components/ui/badge.tsx
- FE-09 components/ui/button.tsx
- FE-09 components/ui/dialog.tsx
- FE-09 components/ui/sheet.tsx
- FE-10 components/layout/console-header.tsx
- FE-10 components/ui/alert-dialog.tsx
- FE-10 components/ui/avatar.tsx
- FE-10 components/ui/badge.tsx
- FE-10 components/ui/button.tsx
- FE-10 components/ui/checkbox.tsx
- FE-10 components/ui/command.tsx
- FE-10 components/ui/dialog.tsx
- FE-10 components/ui/dropdown-menu.tsx
- FE-10 components/ui/input-group.tsx
- FE-10 components/ui/input.tsx
- FE-10 components/ui/native-select.tsx
- FE-10 components/ui/popover.tsx
- FE-10 components/ui/radio-group.tsx
- FE-10 components/ui/select.tsx
- FE-10 components/ui/sheet.tsx
- FE-10 components/ui/sidebar.tsx
- FE-10 components/ui/switch.tsx
- FE-10 components/ui/table.tsx
- FE-10 components/ui/tabs.tsx
- FE-10 components/ui/textarea.tsx
- FE-10 components/ui/tooltip.tsx
- FE-10 features/inventory/shelves-view.tsx
- FE-10 features/traceability/trace-view.tsx
- FE-13 components/ui/sidebar.tsx
- FE-14 features/customer-auth/login-form.tsx missing empty,error
- FE-14 features/employee-auth/staff-login.tsx missing empty,error
- FE-14 features/inventory/agreement-document.tsx missing error
- FE-14 features/inventory/receipt-evidence-field.tsx missing empty,error
- FE-14 features/inventory/supplier-receipts-container.tsx missing loading
- FE-14 features/inventory/supplier-receipts-view.tsx missing loading
- FE-14 features/platform/workspace.tsx missing loading
- FE-14 features/production/dishes/dishes-container.tsx missing loading,error
- FE-14 features/production/food-plans-view.tsx missing loading,empty,error
- FE-14 features/production/food-set-form.tsx missing loading,empty,error
- FE-14 features/production/material-picker.tsx missing error
- FE-14 features/production/targets-view.tsx missing error
- FE-14 features/products/catalog-view.tsx missing loading
- FE-14 features/products/order-detail-view.tsx missing loading,empty,error
- FE-14 features/products/orders-view.tsx missing loading,empty,error
- FE-14 features/products/product-create-dialog.tsx missing empty,error
- FE-14 features/products/product-detail-loader.tsx missing loading,empty,error
- FE-14 features/products/products-loader.tsx missing loading
- FE-14 features/products/products-view.tsx missing loading,empty,error
- FE-14 features/staff-profile/staff-profile-view.tsx missing loading,empty
- SIZE-01 components/ui/sidebar.tsx 727 lines
- SIZE-01 lib/api/production.ts 446 lines
