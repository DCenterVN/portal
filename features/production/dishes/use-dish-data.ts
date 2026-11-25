import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import type * as dishes from "@/lib/api/dishes";
import type { getMaterialTree, listMaterials, Material as CatalogMaterial, MaterialCategory } from "@/lib/api/material-catalog";
import type { getRawLabels } from "@/lib/api/sales";
import { useAccess } from "@/lib/access-boundary";
import { groupNodes, sortCategories, uomOf } from "@/lib/dishes/ingredients";
import type { DishContent } from "@/lib/dishes/types";

export type MaterialInfo = { name: string; group: string | null; category: string; uom: string; imageUrl: string | null; retired: boolean; draft: boolean; allergens: string[] | null };
type Deps = Pick<typeof dishes, "previewCost" | "safeMessage"> & { getRawLabels: typeof getRawLabels; getMaterialTree: typeof getMaterialTree; listMaterials: typeof listMaterials };
export type Catalog = { tree: MaterialCategory[]; items: CatalogMaterial[] };

const EMPTY_MATERIALS: CatalogMaterial[] = [];

export function useDishData(content: DishContent | null, deps: Deps) {
  const canCreate = useAccess().can("sales:product:create");
  const catalogSwr = useSWR<Catalog>("dish-catalog", async () => {
    const materialTree = sortCategories(await deps.getMaterialTree());
    return { tree: materialTree, items: await deps.listMaterials("ACTIVE", materialTree) };
  }, { revalidateOnFocus: false });
  const catalog = catalogSwr.data ?? null;
  const ingredientIds = content?.ingredients.flatMap(line => line.sku_ref ? [line.sku_ref] : []).join(",") ?? "";
  const needsInactive = useMemo(() => {
    if (!catalog) return false;
    const activeIds = new Set(catalog.items.map(item => item.id));
    return ingredientIds.split(",").some(id => id && !activeIds.has(id));
  }, [catalog, ingredientIds]);
  const retiredSwr = useSWR<CatalogMaterial[]>(
    catalog && needsInactive ? "dish-catalog-inactive" : null,
    () => Promise.all([deps.listMaterials("DRAFT", catalog!.tree), deps.listMaterials("SUSPENDED", catalog!.tree)]).then(lists => lists.flat()),
    { revalidateOnFocus: false }
  );
  const retired = retiredSwr.data ?? EMPTY_MATERIALS;
  const retiredReady = !needsInactive || retiredSwr.data !== undefined || Boolean(retiredSwr.error);
  const [allergens, setAllergens] = useState<Record<string, string[] | null>>({});
  const allergenAsked = useRef<Set<string>>(new Set());
  const load = useCallback(async () => {
    await catalogSwr.mutate();
    if (needsInactive) await retiredSwr.mutate();
  }, [catalogSwr, retiredSwr, needsInactive]);

  const tree = useMemo(() => groupNodes(catalog?.tree ?? []), [catalog]);
  const known = useMemo(() => new Map([...retired, ...(catalog?.items ?? [])].map(item => [item.id, item])), [catalog, retired]);
  const hasUnknown = useMemo(() => ingredientIds.split(",").some(id => id && !known.has(id)), [ingredientIds, known]);

  useEffect(() => {
    for (const id of ingredientIds.split(",").filter(id => id && !allergenAsked.current.has(id))) {
      allergenAsked.current.add(id);
      void deps.getRawLabels(id).then(labels => {
        const value = labels.allergen_summary.known ? labels.allergen_summary.contains : null;
        setAllergens(current => ({ ...current, [id]: value }));
      }).catch(() => {
        allergenAsked.current.delete(id);
      });
    }
  }, [ingredientIds, deps]);

  const materials = useMemo(() => Object.fromEntries(ingredientIds.split(",").flatMap(id => {
    const item = known.get(id);
    return item ? [[id, { name: item.name, group: item.group.toUpperCase() || null, category: item.category.toUpperCase(), uom: uomOf(item.unit), imageUrl: item.imageUrl, retired: item.status === "SUSPENDED", draft: item.status === "DRAFT", allergens: allergens[id] ?? null } satisfies MaterialInfo]] : [];
  })), [ingredientIds, known, allergens]);
  const inactiveIds = useMemo(() => new Set(retired.map(item => item.id)), [retired]);

  const [cost, setCost] = useState<dishes.CostPreview | null>(null);
  const [costError, setCostError] = useState("");
  const [costLoading, setCostLoading] = useState(false);
  const [costRetry, setCostRetry] = useState(0);
  const costInput = useMemo(() => {
    const hasSeasonings = content?.seasonings.some(line => Boolean(line.package_ref)) ?? false;
    if (!content?.servings || (!content.ingredients.length && !hasSeasonings) || !catalog || (hasUnknown && !retiredReady)) {
      return { key: "", content: null as DishContent | null };
    }
    const activeIngredients = content.ingredients.filter(line => !line.sku_ref || (known.has(line.sku_ref) && !inactiveIds.has(line.sku_ref)));
    if ((content.ingredients.length > 0 && !activeIngredients.length) || (!activeIngredients.length && !hasSeasonings) || activeIngredients.some(line => !line.sku_ref || Number(line.quantity) <= 0 || !Number.isFinite(Number(line.quantity)) || Number(line.yield_pct) < 1 || Number(line.yield_pct) > 100)) {
      return { key: "", content: null as DishContent | null };
    }
    return {
      key: JSON.stringify({
        servings: content.servings,
        ingredients: activeIngredients.map(({ sku_ref, quantity, uom, yield_pct }) => ({ sku_ref, quantity, uom, yield_pct })),
        seasonings: content.seasonings.map(line => line.package_ref),
      }),
      content: { ...content, ingredients: activeIngredients },
    };
  }, [content, catalog, hasUnknown, retiredReady, known, inactiveIds]);
  const costKey = costInput.key;
  const costContentRef = useRef<DishContent | null>(null);
  costContentRef.current = costInput.content;
  const lastTabRefresh = useRef(0);

  useEffect(() => {
    let alive = true;
    setCost(null); setCostError("");
    const activeContent = costContentRef.current;
    if (!costKey || !activeContent) { setCostLoading(false); return; }
    setCostLoading(true);
    const runPreview = async () => {
      try { return await deps.previewCost(activeContent); }
      catch (err) {
        if (!activeContent.seasonings.length || !activeContent.ingredients.length) throw err;
        return deps.previewCost({ ...activeContent, seasonings: [] });
      }
    };
    const timer = setTimeout(() => void runPreview().then(value => { if (alive) setCost(value); }).catch(() => { if (alive) setCostError("Không tải được giá vốn. Thử lại."); }).finally(() => { if (alive) setCostLoading(false); }), 600);
    return () => { alive = false; clearTimeout(timer); };
  }, [costKey, costRetry, deps]);

  useEffect(() => {
    if (!costKey || !cost || cost.complete || costLoading) return;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastTabRefresh.current < 2000) return;
      lastTabRefresh.current = now;
      setCostRetry(n => n + 1);
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [costKey, cost, costLoading]);

  const rawError = catalogSwr.error ?? retiredSwr.error;
  const error = rawError instanceof Error ? deps.safeMessage(rawError.message) : rawError ? "Không tải được danh mục" : "";

  return {
    tree,
    materials,
    catalog,
    catalogReady: Boolean(catalog) && retiredReady,
    canCreate,
    loading: catalogSwr.isLoading,
    error,
    load,
    cost,
    costError,
    costLoading,
    retryCost: () => setCostRetry(n => n + 1),
  };
}
