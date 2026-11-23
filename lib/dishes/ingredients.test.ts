import { describe, expect, it } from "vitest";
import { addIngredient, isSeasoningCategory } from "./ingredients";
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
  it("gia vị và cốt đi vào gói gia vị", () => {
    expect(isSeasoningCategory("gia_vi")).toBe(true);
    expect(isSeasoningCategory("COT_NUOC_DUNG")).toBe(true);
    expect(isSeasoningCategory("do_kho")).toBe(false);
  });
});
