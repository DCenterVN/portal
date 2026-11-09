import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NutritionChip, NutritionDetail } from "./nutrition-view";
import type { CatalogNutrition } from "@/lib/nutrition";

const nutrition: CatalogNutrition = { per_serving: { kcal: "420", protein_g: "38", fat_g: "10", carb_g: "40", fiber_g: "5", sugar_g: "2", sodium_mg: "300" }, labels: ["HIGH_PROTEIN", "LOW_FAT", "HIGH_FIBRE"], summary: "", missing: [], components: [{ name: "Gói thịt", grams: "100", kcal: "120", protein_g: "20", fat_g: "3", carb_g: "2" }] };
describe("nutrition presentation", () => {
  it("renders serving chip with at most two labels", () => {
    const html = renderToStaticMarkup(<NutritionChip nutrition={nutrition} />);
    expect(html).toContain("420 kcal · 38 g đạm"); expect(html).toContain("Giàu đạm"); expect(html).toContain("Ít béo"); expect(html).not.toContain("Nhiều xơ");
  });
  it.each([null, { ...nutrition, missing: ["Muối"] }, { ...nutrition, per_serving: { ...nutrition.per_serving, kcal: null } }])("shows unknown data without a chip", value => {
    const html = renderToStaticMarkup(<NutritionChip nutrition={value} />);
    expect(html).toContain("Chưa đủ dữ liệu dinh dưỡng"); expect(html).not.toContain("g đạm");
  });
  it("renders all seven nutrients, component data, units, missing ingredient names and estimate", () => {
    const html = renderToStaticMarkup(<NutritionDetail nutrition={{ ...nutrition, missing: ["Muối"] }} />);
    for (const text of ["Dinh dưỡng mỗi suất", "Tinh bột", "Xơ", "Đường", "Natri", "300 mg", "Gói thịt", "Thiếu dữ liệu: Muối", "Ước tính từ nguyên liệu sống, chưa gồm dầu ăn tự thêm"]) expect(html).toContain(text);
  });
});
