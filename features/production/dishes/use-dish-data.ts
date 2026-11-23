import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as dishes from "@/lib/api/dishes";
import type { getMaterialTree, listMaterials, Material as CatalogMaterial, MaterialCategory } from "@/lib/api/material-catalog";
import type { getRawLabels } from "@/lib/api/sales";
import { useAccess } from "@/lib/access-boundary";
import { groupNodes, sortCategories, uomOf } from "@/lib/dishes/ingredients";
import type { DishContent } from "@/lib/dishes/types";
export type MaterialInfo = { name: string; group: string | null; category: string; uom: string; imageUrl: string | null; retired: boolean; allergens: string[] | null };
type Deps = Pick<typeof dishes, "previewCost" | "safeMessage"> & { getRawLabels: typeof getRawLabels; getMaterialTree: typeof getMaterialTree; listMaterials: typeof listMaterials };
export type Catalog = { tree: MaterialCategory[]; items: CatalogMaterial[] };
export function useDishData(content: DishContent | null, deps: Deps) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [retired, setRetired] = useState<CatalogMaterial[]>([]);
  const [allergens, setAllergens] = useState<Record<string, string[] | null>>({});
  const canCreate = useAccess().can("sales:product:create");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const materialTree = sortCategories(await deps.getMaterialTree());
      setCatalog({ tree: materialTree, items: await deps.listMaterials("ACTIVE", materialTree) });
    } catch (e) { setError(e instanceof Error ? deps.safeMessage(e.message) : "Không tải được danh mục"); }
    finally { setLoading(false); }
  }, [deps]);
  useEffect(() => { void load(); }, [load]);
  const ingredientIds = content?.ingredients.flatMap(line => line.sku_ref ? [line.sku_ref] : []).join(",") ?? "";
  const tree = useMemo(() => groupNodes(catalog?.tree ?? []), [catalog]);
  const known = useMemo(() => new Map([...retired, ...(catalog?.items ?? [])].map(item => [item.id, item])), [catalog, retired]);
  const lookedUp = useRef(false);
  useEffect(() => {
    if (!catalog || lookedUp.current || !ingredientIds.split(",").some(id => id && !known.has(id))) return;
    lookedUp.current = true;
    void Promise.all([deps.listMaterials("DRAFT", catalog.tree), deps.listMaterials("SUSPENDED", catalog.tree)]).then(lists => setRetired(lists.flat())).catch(() => setError("Không tải được thông tin nguyên liệu. Thử lại."));
  }, [catalog, ingredientIds, known, deps]);
  const asked = useRef(new Set<string>());
  useEffect(() => {
    for (const id of ingredientIds.split(",").filter(id => id && !asked.current.has(id))) {
      asked.current.add(id);
      void deps.getRawLabels(id).then(labels => setAllergens(current => ({ ...current, [id]: labels.allergen_summary.known ? labels.allergen_summary.contains : null }))).catch(() => undefined);
    }
  }, [ingredientIds, deps]);
  const materials = useMemo(() => Object.fromEntries(ingredientIds.split(",").flatMap(id => {
    const item = known.get(id);
    return item ? [[id, { name: item.name, group: item.group.toUpperCase() || null, category: item.category.toUpperCase(), uom: uomOf(item.unit), imageUrl: item.imageUrl, retired: item.status === "SUSPENDED", allergens: allergens[id] ?? null } satisfies MaterialInfo]] : [];
  })), [ingredientIds, known, allergens]);
  const [cost, setCost] = useState<dishes.CostPreview | null>(null);
  const [costError, setCostError] = useState("");
  const [costLoading, setCostLoading] = useState(false);
  const [costRetry, setCostRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    setCost(null); setCostError("");
    if (!content?.servings || !content.ingredients.length || content.ingredients.some(line => !line.sku_ref || Number(line.quantity) <= 0 || !Number.isFinite(Number(line.quantity)) || Number(line.yield_pct) < 1 || Number(line.yield_pct) > 100)) { setCostLoading(false); return; }
    setCostLoading(true);
    const timer = setTimeout(() => void deps.previewCost(content).then(value => { if (alive) setCost(value); }).catch(() => { if (alive) setCostError("Không tải được giá vốn. Thử lại."); }).finally(() => { if (alive) setCostLoading(false); }), 600);
    return () => { alive = false; clearTimeout(timer); };
  }, [content, deps, costRetry]);
  return { tree, materials, catalog, canCreate, loading, error, load, cost, costError, costLoading, retryCost: () => setCostRetry(n => n + 1) };
}
