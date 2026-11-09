"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAccess } from "@/lib/access-boundary";
import { toast } from "@/components/ui/toast";
import { createPackage, getPackage, listPackages, updatePackage, retirePackage, getDraftProducts, getRawLabels, updateRawLabels, type FoodPackage, type DraftProduct, type RawLabelsView, type Material } from "@/lib/api/sales";
import { listPackageRecipes, getPackageRecipe, createPackageRecipe, updatePackageRecipe, retirePackageRecipe, type PackageRecipe, type RecipeHistory, type RecipeComponent, type PrepStep } from "@/lib/api/production";
import { isStale, packMessage } from "./pack-shared";
import { initialPackageMetadata, packageCode, positive, unitsFor, yieldValid, type ComponentDraft } from "./package-rules";

export function usePackages() {
  const { can } = useAccess();
  const [rows, setRows] = useState<FoodPackage[]>([]);
  const [products, setProducts] = useState<DraftProduct[]>([]);
  const [histories, setHistories] = useState<Record<string, RecipeHistory>>({});
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [cursor, setCursor] = useState<string | undefined>();
  const [next, setNext] = useState<string | null>(null);
  const [selected, setSelected] = useState<FoodPackage | null>(null);
  const [metadata, setMetadata] = useState(initialPackageMetadata);
  const [editing, setEditing] = useState(false);
  const [detailBusy, setDetailBusy] = useState(false);
  const [recipe, setRecipe] = useState<PackageRecipe | null>(null);
  const [recipeEditing, setRecipeEditing] = useState(false);
  const [components, setComponents] = useState<ComponentDraft[]>([]);
  const [steps, setSteps] = useState<PrepStep[]>([]);
  const [raw, setRaw] = useState<{ id: string; name: string; uom_code?: string } | null>(null);
  const [labels, setLabels] = useState<RawLabelsView | null>(null);
  const [confirm, setConfirm] = useState<"" | "package" | "recipe">("");
  const load = async () => {
    setBusy(true); setError("");
    try {
      const page = await listPackages({ cursor, limit: 20 });
      setRows(page.items); setNext(page.next_cursor);
    } catch (e) { setError(packMessage(e)); }
    finally { setBusy(false); }
  };
  useEffect(() => { void load(); }, [cursor]);
  const open = async (row: FoodPackage) => {
    setDetailBusy(true); setDetailError(""); setRecipeEditing(false); setEditing(false);
    setSelected(row); setRecipe(null); setComponents([]);
    try {
      const current = await getPackage(row.id);
      const history = can("production:recipe:read") ? await listPackageRecipes(row.id) : null;
      setSelected(current); setMetadata(current); setRecipe(history?.current ?? null);
      if (history) setHistories(known => ({ ...known, [row.id]: history }));
    } catch (e) { setDetailError(packMessage(e)); }
    finally { setDetailBusy(false); }
  };
  const begin = async (create: boolean) => {
    setDetailBusy(true); setError(""); setDetailError("");
    try { setProducts(await getDraftProducts()); if (create) { setSelected(null); setMetadata(initialPackageMetadata); } else if (selected) setMetadata(selected); setEditing(true); }
    catch (e) { setError(packMessage(e)); }
    finally { setDetailBusy(false); }
  };
  const readLabels = async (item: { id: string; name: string; uom_code?: string }) => {
    setDetailBusy(true); setError(""); setLabels(null); setRaw(item);
    try { setLabels(await getRawLabels(item.id)); }
    catch (e) { setError(packMessage(e)); }
    finally { setDetailBusy(false); }
  };
  const failed = async (cause: unknown) => {
    if (!isStale(cause)) { setError(packMessage(cause)); return; }
    toast.error("Dữ liệu đã đổi, tải lại"); setEditing(false); setRecipeEditing(false);
    if (selected) await open(selected); if (raw) await readLabels(raw); await load();
  };
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (detailBusy || !(selected ? can("sales:variant:update") : can("sales:variant:create"))) return;
    setDetailBusy(true); setError("");
    const { product_ref, code, name, variant_label, net_weight_g, uom_code, temperature_regime } = metadata;
    const input = { product_ref, code, name, variant_label, net_weight_g, uom_code, temperature_regime };
    try {
      const saved = selected ? await updatePackage(selected.id, { ...input, expected_updated_at: selected.updated_at }) : await createPackage(input);
      setSelected(saved); setEditing(false); setRecipe(null); toast.success("Đã lưu gói"); await load(); await open(saved);
    } catch (e) {
      if (!selected && isStale(e)) { setMetadata(current => ({ ...current, code: packageCode(current.name) })); setError("Mã gói đã có, đã tạo mã mới. Hãy lưu lại."); }
      else await failed(e);
    }
    finally { setDetailBusy(false); }
  };
  const retire = async () => {
    setConfirm("");
    if (!selected || !can("sales:variant:delete") || detailBusy) return;
    setDetailBusy(true);
    try { await retirePackage(selected.id); setSelected(null); setEditing(false); toast.success("Đã ngừng gói"); await load(); }
    catch (e) { await failed(e); }
    finally { setDetailBusy(false); }
  };
  const selectVersion = async (version: number) => {
    if (!selected) return;
    setDetailBusy(true);
    try { setRecipe(await getPackageRecipe(selected.id, version)); setRecipeEditing(false); } catch (e) { setDetailError(packMessage(e)); } finally { setDetailBusy(false); }
  };
  const beginRecipe = () => {
    setComponents(recipe?.components.map(({ name, sku_ref, quantity, uom, yield_pct }) => ({ line: { sku_ref, quantity, uom, yield_pct }, name: name ?? "Nguyên liệu không còn bán", units: unitsFor(uom) })) ?? []);
    setSteps(recipe?.prep_steps ?? []); setRecipeEditing(true);
  };
  const validRecipe = components.length > 0 && components.length <= 100 && components.every(({ line }) => positive(line.quantity) && yieldValid(line.yield_pct)) && steps.every(step => step.instruction.trim() && Number.isInteger(step.duration_seconds) && step.duration_seconds >= 0);
  const saveRecipe = async (event: FormEvent) => {
    event.preventDefault(); if (!selected || !validRecipe || detailBusy || !(recipe ? can("production:recipe:update") : can("production:recipe:create"))) return;
    setDetailBusy(true); setError("");
    const input = { components: components.map(item => item.line), prep_steps: steps };
    try {
      if (recipe) await updatePackageRecipe(selected.id, recipe.version, { ...input, expected_version: recipe.version });
      else await createPackageRecipe(selected.id, input);
      toast.success("Đã lưu phiên bản công thức"); await open(selected); await load();
    } catch (e) { await failed(e); }
    finally { setDetailBusy(false); }
  };
  const retireRecipe = async () => {
    setConfirm("");
    if (!selected || !recipe || !can("production:recipe:delete") || detailBusy) return;
    setDetailBusy(true);
    try { await retirePackageRecipe(selected.id, recipe.version, { expected_version: recipe.version }); toast.success("Đã ngừng công thức"); await open(selected); await load(); }
    catch (e) { await failed(e); }
    finally { setDetailBusy(false); }
  };
  const saveLabels = async (event: FormEvent) => {
    event.preventDefault(); if (!raw || !labels || !can("sales:product:update") || detailBusy) return;
    setDetailBusy(true); setError("");
    const { allergen_summary, avoidance_flags, diet_flags, updated_at } = labels;
    try { setLabels(await updateRawLabels(raw.id, { allergen_summary, avoidance_flags, diet_flags, expected_updated_at: updated_at })); toast.success("Đã lưu khai báo nguyên liệu"); }
    catch (e) { await failed(e); }
    finally { setDetailBusy(false); }
  };
  const changeComponent = (index: number, change: Partial<RecipeComponent>) => setComponents(current => current.map((item, i) => i === index ? { ...item, line: { ...item.line, ...change } } : item));
  const changeStep = (index: number, change: Partial<PrepStep>) => setSteps(current => current.map((step, i) => i === index ? { ...step, ...change } : step));
  const addMaterial = (material: Material) => {
    if (components.some(item => item.line.sku_ref === material.id)) return;
    const units = unitsFor(material.uom_code);
    setComponents(current => [...current, { name: material.name, units, line: { sku_ref: material.id, quantity: "0.200", uom: units[0], yield_pct: "100" } }]);
  };
  const codeError = [...metadata.code].length > 56 ? "Mã gói tối đa 56 ký tự" : "";
  const validMetadata = !codeError && !!metadata.product_ref && !!metadata.code.trim() && !!metadata.name.trim() && !!metadata.variant_label.trim() && !!metadata.temperature_regime.trim() && Number.isInteger(metadata.net_weight_g) && metadata.net_weight_g > 0 && metadata.net_weight_g <= 2147483647;
  return {
    can, rows, products, histories, busy, error, detailError, cursor, setCursor, next, selected, metadata, setMetadata, editing, setEditing, detailBusy,
    recipe, recipeEditing, setRecipeEditing, components, setComponents, steps, setSteps, raw, labels, setLabels, confirm, setConfirm,
    codeError, validMetadata, validRecipe,
    load, open, begin, save, retire, selectVersion, beginRecipe, saveRecipe, retireRecipe, readLabels, saveLabels, changeComponent, changeStep, addMaterial,
  };
}

export type PackagesState = ReturnType<typeof usePackages>;
