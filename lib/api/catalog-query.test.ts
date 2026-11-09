import { describe, expect, it } from "vitest";
import { buildCatalogQuery, readNutritionFilters } from "./catalog-query";

describe("catalog nutrition query", () => {
  it("omits empty filters, retains cursor and page size", () => {
    expect(buildCatalogQuery({ branch_id: "seed-branch" }, "next+/=").get("cursor")).toBe("next+/=");
    expect(buildCatalogQuery({ branch_id: "seed-branch" }).get("branch_id")).toBe("seed-branch");
    expect(buildCatalogQuery().toString()).toBe("page_size=100");
  });
  it("keeps zero, decimal protein and repeated AND labels through a URL roundtrip", () => {
    const filters = { kcal_max: 0, protein_min: 30.5, label: ["HIGH_PROTEIN", "LOW_FAT"] };
    const query = buildCatalogQuery(filters);
    expect(query.get("kcal_max")).toBe("0"); expect(query.get("protein_min")).toBe("30.5");
    expect(query.getAll("label")).toEqual(filters.label);
    expect(readNutritionFilters(query)).toEqual(filters);
    expect(readNutritionFilters(new URLSearchParams("label=HIGH_PROTEIN,LOW_FAT")).label).toEqual(filters.label);
  });
  it("excludes invalid numbers and unknown labels", () => {
    const query = buildCatalogQuery({ kcal_max: -1, protein_min: NaN, label: ["unknown"] });
    expect(query.toString()).toBe("page_size=100");
    expect(buildCatalogQuery({ kcal_max: 1.5 }).has("kcal_max")).toBe(false);
  });
});
