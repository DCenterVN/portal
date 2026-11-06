"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { listPackages } from "@/lib/api/sales";
import { getTargets, getMaterialRequirements, getFoodPlan, type ProductionTarget, type MaterialRequirements } from "@/lib/api/production";
import { quoteSchema, pinsSchema } from "./requirement-schemas";

export function useMaterialRequirements(targetId?: string, foodPlanId?: string) {
  const [packNames, setPackNames] = useState<Record<string, string>>({});
  const [pins, setPins] = useState<z.infer<typeof pinsSchema>["pack_plan"][]>([]);
  const [targets, setTargets] = useState<ProductionTarget[]>([]);
  const [selected, setSelected] = useState(targetId ?? "");
  const [data, setData] = useState<MaterialRequirements | null>(null);
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("");
  const [includeUnknown, setIncludeUnknown] = useState(true);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scope = foodPlanId ? "food-plans" : "targets";
  const id = foodPlanId || selected;
  const loadData = async () => {
    const value = await getMaterialRequirements(scope, id, query);
    value.lines.forEach(line => quoteSchema.parse(line)); value.all_lines.forEach(line => quoteSchema.parse(line));
    const ids = foodPlanId ? [foodPlanId] : Object.keys(value.plan_revisions);
    const pinned = await Promise.all(ids.map(async planId => pinsSchema.parse(await getFoodPlan(planId)).pack_plan));
    return { value, pinned };
  };
  const load = async () => {
    setBusy(true); setData(null); setError("");
    try {
      if (id) { const result = await loadData(); setData(result.value); setPins(result.pinned); }
      else setTargets(await getTargets());
    }
    catch (e) { setError(e instanceof Error ? e.message : "Không tải được nhu cầu"); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    let active = true;
    if (!id) { setData(null); return; }
    setBusy(true); setData(null); setError("");
    loadData().then(({ value, pinned }) => { if (active) { setData(value); setPins(pinned); } })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Không tải được nhu cầu"); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [id, scope, query]);
  useEffect(() => {
    if (!foodPlanId) getTargets().then(setTargets).catch(e => setError(e instanceof Error ? e.message : "Không tải được chỉ tiêu"));
  }, [foodPlanId]);
  useEffect(() => {
    const remaining = new Set(pins.flatMap(pin => pin?.recipe_versions.map(item => item.sku_ref) ?? []));
    setPackNames({});
    if (!remaining.size) return;
    let active = true;
    const loadNames = async () => {
      let cursor: string | undefined;
      try {
        do {
          const page = await listPackages({ cursor, limit: 100 });
          if (!active) return;
          const found = page.items.filter(item => remaining.has(item.id));
          setPackNames(current => ({ ...current, ...Object.fromEntries(found.map(item => [item.id, item.name])) }));
          found.forEach(item => remaining.delete(item.id));
          cursor = page.next_cursor ?? undefined;
        } while (cursor && remaining.size);
      } catch {
        // Names are optional; requirements and pinned versions remain usable.
      }
    };
    void loadNames();
    return () => { active = false; };
  }, [pins]);
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    params.set("include_unknown", String(includeUnknown));
    if (priceMin) params.set("price_min", priceMin);
    if (priceMax) params.set("price_max", priceMax);
    if (priceMin || priceMax) params.set("price_uom", "KG");
    setQuery(params.toString());
  };
  return { packNames, pins, targets, selected, setSelected, data, month, setMonth, includeUnknown, setIncludeUnknown, priceMin, setPriceMin, priceMax, setPriceMax, busy, error, id, load, applyFilters };
}
