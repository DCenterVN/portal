# Plan: Chặn hoàn tất món khi nguyên liệu không có nhóm hợp lệ

- **Task ID**: `DISH-GROUP-GUARD-001`
- **Mode**: `fast`
- **Story**: US-DISH-GUARD-001
- **Sprint**: 01
- **Issue**: 
- **Người lập**: Claude Opus 31/10 (handoff 31/10 §3.3, Dawn duyệt hướng "cho triển khai fix")

## Scope
- Outcome: nguyên liệu có nhóm rỗng hoặc nhóm không có trong cây → màn Món báo lỗi tại dòng, BFF `complete` trả lỗi, **0 gói** bị tạo sai ngăn (trước: rơi im lặng vào ngăn RAU, `lib/dishes/types.ts:23`).
- Decision: EXTEND — thêm 1 luật vào `validateDish`; hàm này đã được gọi ở cả client (`features/production/dishes/dishes-container.tsx:41`) và BFF (`app/api/dishes/drafts/[id]/complete/route.ts:19`), nên không sửa `slotOf`/`complete-dish.ts`.
- Impact: `slotOf` có 3 nơi gọi (`complete-dish.ts:85`, `validate-dish.ts:17`, `dish-ingredients-view.tsx:40`); không đổi chữ ký.
- Ngoài phạm vi: gán nhóm cho nguyên liệu cũ trên DEV (đã seed cây nhóm 31/10: 31 nhóm).

## Requirements
- FR-1: nguyên liệu phải thuộc nhóm có trong cây nhóm.
- AC-1: Given dòng có `sku_ref` mà `skuGroups[sku_ref]` rỗng hoặc không có `code` trong `tree` When `validateDish` Then có lỗi `{ field: "sku_ref", row, message: "Nguyên liệu chưa thuộc nhóm hợp lệ — gán nhóm ở kho trước khi hoàn tất" }`.
- AC-2: nguyên liệu nhóm hợp lệ (ví dụ `BO` cha `THIT`) → không có lỗi mới; mọi test cũ của `validate-dish.test.ts` vẫn xanh.

## Technical definition
- Không đổi API, không đổi `slotOf`. Luật nằm trong vòng lặp ingredients của `validateDish` (`lib/dishes/validate-dish.ts:15-21`).

## UX
- Không thêm màn, không đổi bố cục. Lỗi hiện ngay dưới ô chọn nguyên liệu của dòng đó, dùng cơ chế lỗi theo `row` có sẵn (`DishError`, `features/production/dishes/dish-ingredients-view.tsx`), giống lỗi "Nguyên liệu đã có ở dòng trước".
- Cột "Ngăn" của dòng lỗi hiện "Chưa có nhóm" thay vì "Rau" (sửa nhãn ở `dish-ingredients-view.tsx:40`). Nút Hoàn tất bị tắt như mọi lỗi kiểm khác.

## Design
- Trong vòng lặp: `if (line.sku_ref && !ctx.tree.some(node => node.code === ctx.skuGroups[line.sku_ref!])) add("sku_ref", "...", line.row);`
- Không thêm ngăn RAU cho dòng lỗi: chỉ gọi `slots.add(slotOf(...))` khi nhóm hợp lệ.

## Files planned
- lib/dishes/validate-dish.ts
- lib/dishes/validate-dish.test.ts
- features/production/dishes/dish-ingredients-view.tsx

## Tests planned
- TC-1 | AC-1 | unit | `npx vitest run lib/dishes/validate-dish.test.ts`
- TC-2 | AC-2 | unit | `npx vitest run lib/dishes`

## Slices
- [ ] S1: luật nhóm hợp lệ + 2 ca test (rỗng, mã lạ) + nhãn "Chưa có nhóm" (files: lib/dishes/validate-dish.ts, lib/dishes/validate-dish.test.ts, features/production/dishes/dish-ingredients-view.tsx; test: npx vitest run lib/dishes)

## Risks / rollback
- Nháp DEV có nguyên liệu chưa gán nhóm sẽ không hoàn tất được nữa — đúng ý đồ. Rollback: revert 1 commit.

## Open decisions
- Không có.
