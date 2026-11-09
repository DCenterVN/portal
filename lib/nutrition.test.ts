import { describe, expect, it } from "vitest";
import { materialNutritionFormSchema, nutritionDefaults, nutrientFields } from "./nutrition";

describe("material nutrition form", () => {
  it("converts every empty nutrient and conversion into null", () => {
    const result = materialNutritionFormSchema.parse(nutritionDefaults());
    for (const [key] of nutrientFields) expect(result.nutrients[key]).toEqual({ value: null, source: null });
    expect(result.grams_per_ml).toBeNull(); expect(result.edible_grams_per_ea).toBeNull();
  });
  it.each(nutrientFields)("rejects negative %s", key => {
    const input = nutritionDefaults(); input.nutrients[key] = { value: "-1", source: { dataset: "LABEL" } };
    expect(materialNutritionFormSchema.safeParse(input).success).toBe(false);
  });
  it("keeps an explicit zero and decimal comma, requires provenance", () => {
    const input = nutritionDefaults(); input.nutrients.kcal.value = "0";
    expect(materialNutritionFormSchema.safeParse(input).success).toBe(false);
    input.nutrients.kcal.source = { dataset: "LABEL" };
    input.nutrients.protein_g = { value: "0,25", source: { dataset: "USDA_FDC", food_code: "123" } };
    const result = materialNutritionFormSchema.parse(input);
    expect(result.nutrients.kcal.value).toBe("0"); expect(result.nutrients.protein_g.value).toBe("0.25");
    expect(result.nutrients.protein_g.source?.food_code).toBe("123");
  });
  it.each(["grams_per_ml", "edible_grams_per_ea"] as const)("requires positive %s", key => {
    for (const value of ["0", "-2", "abc", "Infinity"]) expect(materialNutritionFormSchema.safeParse({ ...nutritionDefaults(), [key]: value }).success).toBe(false);
  });
});
