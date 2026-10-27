import { z } from "zod";
import { inventoryRequest } from "./suppliers";
import type { MaterialCategory, MaterialCategoryTreeResponse } from "./inventory/types";

const code = z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/);
const name = z.string().trim().min(1).max(150);
const leaf = z.object({ code, name, children: z.array(z.never()).length(0) }).strict();
const parent = z.object({ code, name, children: z.array(leaf).max(100) }).strict();
const treeSchema: z.ZodType<MaterialCategoryTreeResponse> = z.object({ items: z.array(parent).max(100) }).strict().superRefine((tree, context) => {
  const nodes = tree.items.flatMap(item => [item, ...item.children]);
  const codes = nodes.map(item => item.code);
  const leaves = tree.items.reduce((total, item) => total + item.children.length, 0);
  if (new Set(codes).size !== codes.length || leaves > 100) context.addIssue({ code: "custom", message: "Danh mục trùng mã hoặc vượt giới hạn" });
});

export async function getMaterialCategories(): Promise<MaterialCategory[]> {
  const tree = await inventoryRequest("material-categories", treeSchema);
  return tree.items;
}
