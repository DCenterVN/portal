import { useCallback, useEffect, useRef, useState } from "react";
import type * as dishes from "@/lib/api/dishes";
import type { getMaterialCategories } from "@/lib/api/material-categories";
import type { getMaterials, getRawLabels, Material } from "@/lib/api/sales";
import { useAccess } from "@/lib/access-boundary";
import type { DishContent, GroupNode } from "@/lib/dishes/types";
export type { Material } from "@/lib/api/sales";
export type MaterialInfo = { name: string; group: string | null; uom: string; allergens: string | null };
type Deps = Pick<typeof dishes, "getSaleCategories" | "getDishPack" | "searchPacks" | "getPackRecipe" | "previewCost" | "safeMessage"> & { getMaterials: typeof getMaterials; getRawLabels: typeof getRawLabels; getMaterialCategories: typeof getMaterialCategories };
export function useDishData(content: DishContent | null, deps: Deps) {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [tree, setTree] = useState<GroupNode[]>([]);
  const [materials, setMaterials] = useState<Record<string, MaterialInfo>>({});
  const canCreate = useAccess().can("sales:product:create");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [cats, groups] = await Promise.all([deps.getSaleCategories(), deps.getMaterialCategories()]);
      setCategories(cats.categories);
      setTree(groups.flatMap(group => [{ code: group.code, parent_code: null }, ...group.children.map(child => ({ code: child.code, parent_code: group.code }))]));
    } catch (e) { setError(e instanceof Error ? deps.safeMessage(e.message) : "Không tải được danh mục"); }
    finally { setLoading(false); }
  }, [deps]);
  useEffect(() => { void load(); }, [load]);
  const remember = useCallback(async (material: Material) => {
    setMaterials(current => ({ ...current, [material.id]: { name: material.name, group: material.material_group_code ?? null, uom: material.uom_code === "KG" ? "G" : material.uom_code === "L" ? "ML" : material.uom_code, allergens: null } }));
    try {
      const labels = await deps.getRawLabels(material.id);
      setMaterials(current => ({ ...current, [material.id]: { ...current[material.id], allergens: labels.allergen_summary.known ? labels.allergen_summary.contains.join(", ") || "Không có" : null } }));
    } catch { /* Missing declarations remain unknown. */ }
  }, [deps]);
  const ingredientIds = content?.ingredients.flatMap(line => line.sku_ref ? [line.sku_ref] : []).join(",") ?? "";
  useEffect(() => {
    let alive = true;
    const missing = new Set(ingredientIds.split(",").filter(id => id && !materials[id]));
    if (!missing.size) return;
    void (async () => {
      let cursor = "";
      do {
        const page = await deps.getMaterials(new URLSearchParams({ limit: "100", cursor }).toString());
        if (!alive) return;
        for (const item of page.items) if (missing.delete(item.id)) void remember(item);
        cursor = page.next_cursor ?? "";
      } while (cursor && missing.size);
    })().catch(() => { if (alive) setError("Không tải được thông tin nguyên liệu. Thử lại."); });
    return () => { alive = false; };
  }, [ingredientIds, deps, remember]);
  const [packQuery, setPackQuery] = useState("");
  const [packs, setPacks] = useState<dishes.PackOption[]>([]);
  const [packNext, setPackNext] = useState<string | null>(null);
  const [packLoading, setPackLoading] = useState(false);
  const [packError, setPackError] = useState("");
  const [packRetry, setPackRetry] = useState(0);
  const [recipes, setRecipes] = useState<Record<string, boolean>>({});
  const packRequest = useRef(0);
  const loadPacks = useCallback(async (cursor = "") => {
    const version = ++packRequest.current;
    setPackLoading(true); setPackError("");
    try {
      const page = await deps.searchPacks(packQuery, cursor);
      if (version !== packRequest.current) return;
      setPacks(current => [...new Map([...current, ...page.items.filter(pack => pack.status !== "RETIRED")].map(pack => [pack.id, pack])).values()]); setPackNext(page.next_cursor);
    } catch { if (version === packRequest.current) setPackError("Không tải được gói gia vị"); }
    finally { if (version === packRequest.current) setPackLoading(false); }
  }, [deps, packQuery]);
  useEffect(() => { const timer = setTimeout(() => void loadPacks(), 300); return () => { clearTimeout(timer); packRequest.current++; }; }, [loadPacks, packRetry]);
  const seasoningIds = content?.seasonings.flatMap(line => line.package_ref ? [line.package_ref] : []).join(",") ?? "";
  useEffect(() => {
    let alive = true;
    for (const id of seasoningIds.split(",").filter(Boolean)) {
      void Promise.all([deps.getPackRecipe(id), deps.getDishPack(id)]).then(([result, pack]) => { if (alive) { setRecipes(current => ({ ...current, [id]: !!result.current })); setPacks(current => [...new Map([...current, pack].map(item => [item.id, item])).values()]); } }).catch(() => { if (alive) setPackError("Không kiểm tra được công thức gia vị. Thử lại."); });
    }
    return () => { alive = false; };
  }, [seasoningIds, deps, packRetry]);
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
  return { categories, tree, materials, remember, canCreate, loading, error, load, packs, packNext, loadPacks, packQuery, setPackQuery, packLoading, packError, retryPacks: () => setPackRetry(n => n + 1), recipes, cost, costError, costLoading, retryCost: () => setCostRetry(n => n + 1) };
}
