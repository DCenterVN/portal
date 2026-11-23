import type { DishContent } from "./types";

export const uomOf = (unit: string) => unit === "KG" ? "G" : unit === "L" ? "ML" : unit;
export const uomLabel = (uom: string) => uom === "G" ? "g" : uom === "ML" ? "ml" : "cái";
export const isSeasoningCategory = (category: string) => ["GIA_VI", "COT_NUOC_DUNG"].includes(category.toUpperCase());

export function addIngredient(content: DishContent, material: { id: string; unit: string }): DishContent {
  if (content.ingredients.some(line => line.sku_ref === material.id)) return content;
  return { ...content, ingredients: [...content.ingredients, { row: crypto.randomUUID(), sku_ref: material.id, quantity: "", uom: uomOf(material.unit), yield_pct: "100" }] };
}
