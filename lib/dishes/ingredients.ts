import type { MaterialCategory } from "@/lib/api/material-catalog";
import type { DishContent, GroupNode, Line } from "./types";

export const uomOf = (unit: string) => unit === "KG" ? "G" : unit === "L" ? "ML" : unit;
export const uomLabel = (uom: string) => uom === "G" ? "g" : uom === "KG" ? "kg" : uom === "ML" ? "ml" : uom === "L" ? "lít" : "cái";

export function normalizeRecipeLine(line: Line): Line {
  if (line.uom !== "KG" && line.uom !== "L") return line;
  const numeric = Number(line.quantity);
  if (!Number.isFinite(numeric)) return line;
  return { ...line, uom: line.uom === "KG" ? "G" : "ML", quantity: String(Math.round(numeric * 1000 * 1000) / 1000) };
}

const categoryOrder = ["THIT", "CA_LOAI", "THUY_HAI_SAN", "TRUNG_SUA", "DO_CHE_BIEN", "RAU_CU", "CU_QUA", "NAM", "TRAI_CAY", "GAO_NGU_COC", "DO_KHO", "GIA_VI", "COT_NUOC_DUNG"];
const rank = (category: MaterialCategory) => { const index = categoryOrder.indexOf(category.code.toUpperCase()); return index < 0 ? categoryOrder.length : index; };
export const sortCategories = (tree: MaterialCategory[]) => [...tree].sort((a, b) => rank(a) - rank(b));

export const groupNodes = (tree: MaterialCategory[]): GroupNode[] => tree.flatMap(category => {
  const parent = category.code.toUpperCase();
  return [{ code: parent, parent_code: null }, ...category.groups.map(group => ({ code: group.code.toUpperCase(), parent_code: parent }))];
});

export function addIngredient(content: DishContent, material: { id: string; unit: string }): DishContent {
  if (content.ingredients.some(line => line.sku_ref === material.id)) return content;
  return { ...content, ingredients: [...content.ingredients, { row: crypto.randomUUID(), sku_ref: material.id, quantity: "", uom: uomOf(material.unit), yield_pct: "100" }] };
}
