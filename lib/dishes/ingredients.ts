import type { MaterialCategory } from "@/lib/api/material-catalog";
import type { DishContent, GroupNode, Line } from "./types";

export { sortCategories } from "@/features/production/materials-catalog";

export const uomOf = (unit: string) => {
  const code = unit.trim().toUpperCase();
  return code === "KG" ? "G" : code === "L" ? "ML" : code;
};
export const uomLabel = (uom: string) => {
  const code = uom.trim().toUpperCase();
  return code === "G" ? "g" : code === "KG" ? "kg" : code === "ML" ? "ml" : code === "L" ? "lít" : "cái";
};

export function normalizeRecipeLine(line: Line): Line {
  const code = line.uom.trim().toUpperCase();
  if (code !== "KG" && code !== "L") return code === line.uom ? line : { ...line, uom: code };
  const numeric = Number(line.quantity);
  if (!Number.isFinite(numeric)) return code === line.uom ? line : { ...line, uom: code };
  return { ...line, uom: code === "KG" ? "G" : "ML", quantity: String(Math.round(numeric * 1000 * 1000) / 1000) };
}

export const groupNodes = (tree: MaterialCategory[]): GroupNode[] => tree.flatMap(category => {
  const parent = category.code.toUpperCase();
  return [{ code: parent, parent_code: null }, ...category.groups.map(group => ({ code: group.code.toUpperCase(), parent_code: parent }))];
});

export function addIngredient(content: DishContent, material: { id: string; unit: string }): DishContent {
  if (content.ingredients.some(line => line.sku_ref === material.id)) return content;
  return { ...content, ingredients: [...content.ingredients, { row: crypto.randomUUID(), sku_ref: material.id, quantity: "", uom: uomOf(material.unit), yield_pct: "100" }] };
}
