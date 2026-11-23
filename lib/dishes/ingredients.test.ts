import { describe, expect, it } from "vitest";
import { addIngredient, groupNodes, sortCategories } from "./ingredients";
import { content } from "./complete-dish.fixtures";
import type { DishContent } from "./types";

const empty = { ...content(), ingredients: [] } as unknown as DishContent;

describe("thêm nguyên liệu vào món", () => {
  it("đổi đơn vị kho sang g/ml", () => {
    const next = addIngredient(empty, { id: "a", unit: "KG" });
    expect(next.ingredients).toMatchObject([{ sku_ref: "a", uom: "G", quantity: "", yield_pct: "100" }]);
    expect(addIngredient(empty, { id: "b", unit: "L" }).ingredients[0].uom).toBe("ML");
    expect(addIngredient(empty, { id: "c", unit: "EA" }).ingredients[0].uom).toBe("EA");
  });
  it("chặn thêm trùng", () => {
    const once = addIngredient(empty, { id: "a", unit: "KG" });
    expect(addIngredient(once, { id: "a", unit: "KG" })).toBe(once);
  });
  it("tab loại xếp Thịt trước, Gia vị và Cốt nước dùng cuối", () => {
    const tree = ["COT_NUOC_DUNG", "GIA_VI", "CA_LOAI", "THIT"].map(code => ({ code: code.toLowerCase(), label: code, active: true, groups: [] }));
    expect(sortCategories(tree).map(item => item.label)).toEqual(["THIT", "CA_LOAI", "GIA_VI", "COT_NUOC_DUNG"]);
  });
  it("cây nhóm viết hoa để tính ngăn", () => {
    expect(groupNodes([{ code: "gia_vi", label: "Gia vị", active: true, groups: [{ code: "hanh_toi", label: "Hành tỏi", active: true }] }])).toEqual([{ code: "GIA_VI", parent_code: null }, { code: "HANH_TOI", parent_code: "GIA_VI" }]);
  });
});
