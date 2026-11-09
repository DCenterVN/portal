import { nutritionLabels } from "@/lib/nutrition";

export interface NutritionFilters { kcal_max?: number; protein_min?: number; label?: string[]; }
export function buildCatalogQuery(filters: NutritionFilters & { branch_id?: string } = {}, cursor?: string) {
  const query = new URLSearchParams({ page_size: "100" });
  if (filters.branch_id) query.set("branch_id", filters.branch_id);
  if (cursor) query.set("cursor", cursor);
  for (const key of ["kcal_max", "protein_min"] as const) {
    const value = filters[key];
    if (value !== undefined && Number.isFinite(value) && value >= 0 && (key !== "kcal_max" || Number.isInteger(value))) query.set(key, String(value));
  }
  for (const label of filters.label ?? []) if (label in nutritionLabels) query.append("label", label);
  return query;
}
export function readNutritionFilters(query: URLSearchParams): NutritionFilters {
  const number = (key: string) => {
    const value = query.get(key);
    return value !== null && value.trim() !== "" && /^[0-9]+(\.[0-9]+)?$/.test(value) ? Number(value) : undefined;
  };
  return { kcal_max: number("kcal_max"), protein_min: number("protein_min"), label: query.getAll("label").flatMap(value => value.split(",")).filter(value => value in nutritionLabels) };
}
