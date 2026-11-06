"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAccess } from "@/lib/access-boundary";
import { toast } from "@/components/ui/toast";
import { getDraftProducts, listFoodSets, getFoodSet, type FoodSet, type FoodPackage, type DraftProduct, type Material } from "@/lib/api/sales";
import { createFoodPlan, getFoodPlan, getFoodPlans, getTargets, getMaterialRequirements, updateFoodPlan, publishFoodPlan, resumeFoodPlanHandoff, reviewFoodPlan, type FoodProductPlan, type ProductionTarget, type PreparationPlanInput, type PackPlanInput } from "@/lib/api/production";
import { isStale, loadPackOptions, packMessage } from "./pack-shared";
import { percentRatio, pinnedPlanSchema, positiveQuantity, ratioPercent, ratioTotal, servingCount, slotRatioValues } from "./food-plan-ratios";
import { slotCountMessage } from "./food-set-rules";

export type ComponentLine = NonNullable<PreparationPlanInput["components"]>[number] & { name: string };

export function useFoodPlans(initialPlans: FoodProductPlan[], targetId?: string) {
  const { can } = useAccess();
  const [mode, setMode] = useState("raw");
  const [sets, setSets] = useState<FoodSet[]>([]);
  const [packs, setPacks] = useState<FoodPackage[]>([]);
  const [chosenSet, setChosenSet] = useState<FoodSet | null>(null);
  const [ratios, setRatios] = useState<Record<string, string>>({});
  const [setCursor, setSetCursor] = useState<string | null>(null);
  const [plans, setPlans] = useState(initialPlans);
  const [targets, setTargets] = useState<ProductionTarget[]>([]);
  const [products, setProducts] = useState<DraftProduct[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FoodProductPlan | null>(null);
  const [productRef, setProductRef] = useState("");
  const [code, setCode] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [kits, setKits] = useState("1");
  const [servings, setServings] = useState("");
  const [components, setComponents] = useState<ComponentLine[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const load = async () => {
    setBusy(true); setError("");
    try {
      const [allTargets, allProducts] = await Promise.all([getTargets(), getDraftProducts()]);
      setTargets(allTargets); setProducts(allProducts);
      if (targetId) setPlans(await getFoodPlans(targetId));
      setReady(true);
    } catch (e) { setError(packMessage(e)); }
    finally { setBusy(false); }
  };
  useEffect(() => { void load(); }, [targetId]);
  const canCreate = can("production:food_plan:create");
  const canUpdate = can("production:food_plan:update");
  const target = targets.find(t => t.id === targetId);
  const availableProducts = products.filter(p => target?.lines.some(line => line.product_ref === p.id));
  const validCounts = /^[1-9]\d*$/.test(kits) && /^[1-9]\d*$/.test(servings);
  const total = validCounts ? (BigInt(kits) * BigInt(servings)).toString() : "";
  const slotCountError = chosenSet ? slotCountMessage(chosenSet.slots) : "";
  const validRatios = !!chosenSet && !slotCountError && chosenSet.slots.every(slot => ratioTotal(slotRatioValues(slot, ratios)) === 1000000n);
  const valid = !!total && BigInt(total) <= 1000000n && !!productRef && !!code.trim() && !!servingSize.trim() && (mode === "pack" ? validRatios : components.length > 0 && components.length <= 100 && components.every(c => positiveQuantity(c.quantity)));
  const loadSets = async (append = false) => {
    setBusy(true); setError("");
    try { const page = await listFoodSets({ cursor: append ? setCursor ?? undefined : undefined }); setSets(current => append ? [...current, ...page.items] : page.items); setSetCursor(page.next_cursor); }
    catch (e) { setError(packMessage(e)); } finally { setBusy(false); }
  };
  const begin = async (plan?: FoodProductPlan) => {
    setError(""); setNotice(""); setBusy(true);
    try {
      const current = plan ? await getFoodPlan(plan.id) : null;
      if (!current) await loadSets();
      const requirements = current ? await getMaterialRequirements("food-plans", current.id) : null;
      const pinned = pinnedPlanSchema.parse(current ?? {}).pack_plan;
      setMode(pinned ? "pack" : "raw"); setChosenSet(null); setRatios({});
      if (pinned) {
        const definition = await getFoodSet(pinned.set_ref);
        setSets([definition]);
        if (definition.updated_at !== pinned.set_updated_at) setError("Set đã đổi từ lúc chốt. Chọn lại set trước khi lưu; thực đơn cũ vẫn giữ nguyên.");
        else {
          setChosenSet(definition);
          setRatios(Object.fromEntries(pinned.slot_ratios.flatMap(slot => slot.options.map(option => [`${slot.slot}:${option.sku_ref ?? "empty"}`, ratioPercent(option.ratio)]))));
        }
        setPacks(await loadPackOptions());
      }
      setEditing(current); setProductRef(current?.product_ref ?? availableProducts[0]?.id ?? "");
      setCode(current?.variant_sku_code ?? ""); setServingSize(current?.serving_size ?? "");
      const count = current ? current.servings_per_set ?? 4 : 0;
      setServings(count ? String(count) : "");
      setKits(current ? (BigInt(String(current.planned_quantity).replace(/\.0+$/, "")) / BigInt(count)).toString() : "1");
      setComponents(pinned ? [] : current?.components.map(c => ({ ...c, quantity: String(c.quantity), name: requirements?.all_lines.find(row => row.sku_ref === c.sku_ref)?.name ?? "Nguyên liệu đã chọn" })) ?? []);
      setShowForm(true);
    } catch (e) { setError(packMessage(e)); }
    finally { setBusy(false); }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !targetId || !valid || (editing ? !canUpdate : !canCreate)) return;
    setBusy(true); setError("");
    const common = { product_ref: productRef, variant_sku_code: code.trim(), planned_quantity: total, uom: "EA", serving_size: servingSize, servings_per_set: Number(servings), nutrition_snapshot: editing?.nutrition_snapshot ?? {} };
    const input: PreparationPlanInput = mode === "pack" && chosenSet ? { ...common, pack_plan: {
      schema_version: 1, set_ref: chosenSet.id, set_updated_at: chosenSet.updated_at,
      slot_ratios: chosenSet.slots.map(slot => ({ slot: slot.slot, options: slot.options.map((option): PackPlanInput["slot_ratios"][number]["options"][number] => ({ sku_ref: option.sku_ref, ratio: percentRatio(ratios[`${slot.slot}:${option.sku_ref}`] ?? "0") })).concat(slot.removable ? [{ sku_ref: null, ratio: percentRatio(ratios[`${slot.slot}:empty`] ?? "0") }] : []) })),
    } } : { ...common, components: components.map(({ sku_ref, quantity, uom }) => ({ sku_ref, quantity, uom })) };
    try {
      const revision = editing?.revision;
      if (editing && !revision) throw new Error("Thiếu revision. Tải lại set trước khi sửa.");
      const saved = editing ? await updateFoodPlan(editing.id, { ...input, expected_revision: revision ?? 0 }) : await createFoodPlan(targetId, input);
      setPlans(current => [saved, ...current.filter(p => p.id !== saved.id)]); setShowForm(false); setNotice("Đã lưu set");
    } catch (e) { if (isStale(e)) { toast.error("Dữ liệu đã đổi, tải lại"); setShowForm(false); await load(); } else setError(packMessage(e)); }
    finally { setBusy(false); }
  };
  const legacyAction = async (plan: FoodProductPlan) => {
    setBusy(true); setError("");
    try {
      const updated = plan.status === "DRAFT" ? await reviewFoodPlan(plan.id) : plan.status === "REVIEWED" ? (await publishFoodPlan(plan.id)).food_plan : (await resumeFoodPlanHandoff(plan.id)).food_plan;
      setPlans(current => current.map(p => p.id === updated.id ? updated : p));
    } catch (e) { setError(packMessage(e)); }
    finally { setBusy(false); }
  };
  const chooseSet = async (id: string | null) => {
    setChosenSet(null);
    if (!editing) { setCode(""); setServingSize(""); setServings(""); }
    if (!id) return;
    setBusy(true); setError("");
    try {
      const [definition, options] = await Promise.all([getFoodSet(id), loadPackOptions()]);
      if (definition.product_ref !== productRef) throw new Error("Chọn set thuộc sản phẩm trong chỉ tiêu.");
      if (editing && definition.code !== code) throw new Error("Mã set giữ nguyên khi sửa định mức.");
      const count = servingCount(definition.variant_label);
      const countError = slotCountMessage(definition.slots);
      if (countError) throw new Error(countError);
      if (!editing) { setCode(definition.code); setServingSize(count ? definition.variant_label : ""); setServings(count ?? ""); }
      setChosenSet(definition); setPacks(options);
      setRatios(Object.fromEntries(definition.slots.flatMap(slot => slot.options.map(option => [`${slot.slot}:${option.sku_ref}`, option.is_default ? "100" : "0"]))));
    } catch (e) { setError(packMessage(e)); } finally { setBusy(false); }
  };
  const changeProduct = (id: string | null) => { setProductRef(id ?? ""); setChosenSet(null); setCode(""); setServingSize(""); setServings(""); };
  const changeServingSize = (value: string) => { setServingSize(value); setServings(servingCount(value) ?? ""); };
  const changeMode = (value: string) => { setMode(value); if (value === "pack" && !sets.length) void loadSets(); };
  const setRatio = (key: string, value: string) => setRatios(current => ({ ...current, [key]: value }));
  const changeComponent = (index: number, change: Partial<ComponentLine>) => setComponents(current => current.map((row, i) => i === index ? { ...row, ...change } : row));
  const removeComponent = (index: number) => setComponents(current => current.filter((_, i) => i !== index));
  const addMaterial = (m: Material) => setComponents(current => current.some(c => c.sku_ref === m.id) ? current : [...current, { sku_ref: m.id, name: m.name, quantity: "0.200", uom: m.uom_code }]);
  return {
    can, canCreate, canUpdate, plans, targets, products, sets, packs, setCursor, chosenSet, ratios, mode, showForm, setShowForm, editing,
    productRef, code, servingSize, kits, setKits, servings, components, busy, error, ready, notice,
    availableProducts, total, slotCountError, valid,
    load, loadSets, begin, save, legacyAction, chooseSet, changeProduct, changeServingSize, changeMode, setRatio, changeComponent, removeComponent, addMaterial,
  };
}

export type FoodPlansState = ReturnType<typeof useFoodPlans>;
