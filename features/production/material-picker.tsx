"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { z } from "zod";
import { FetchError } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, Checkbox } from "@/components/ui/field";
import { EntityPicker } from "@/components/ui/entity-picker";
import { getMaterialCategories } from "@/lib/api/material-categories";
import type { MaterialCategory } from "@/lib/api/inventory/types";
import { MaterialCreateForm } from "./material-create-form";
import { EmptyState, Skeleton } from "@/components/ui/state";
import { createMaterial, getMaterials, type Material, type MaterialPage, type CreateMaterialInput, type ExistingMaterial } from "@/lib/api/sales";
import { getProductionContext } from "@/lib/api/production";

const duplicateSchema = z.object({ errors: z.object({ existing: z.object({ id: z.string(), code: z.string(), name: z.string() }) }) });

export function MaterialFilters({ categories = [], onApply, busy = false, showSearch = true }: {
  categories?: MaterialCategory[]; onApply: (query: string) => void; busy?: boolean; showSearch?: boolean;
}) {
  const instance = useId();
  const [parent, setParent] = useState("");
  const [leaf, setLeaf] = useState("");
  const [error, setError] = useState("");
  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const min = String(data.get("price_min") ?? ""), max = String(data.get("price_max") ?? "");
    if ((min && !/^\d+$/.test(min)) || (max && !/^\d+$/.test(max)) || (min && max && BigInt(min) > BigInt(max))) {
      setError("Giá phải là số nguyên VND, giá từ không lớn hơn giá đến."); return;
    }
    setError("");
    const query = new URLSearchParams();
    data.forEach((value, key) => { if (String(value)) query.set(key, String(value)); });
    query.delete("parent"); query.delete("leaf");
    const codes = leaf ? [leaf] : categories.find(item => item.code === parent)?.children.map(item => item.code);
    if (codes?.length) query.set("group_codes", codes.join(","));
    if (parent === "ungrouped") query.set("ungrouped", "true");
    query.set("include_unknown", data.has("include_unknown") ? "true" : "false");
    onApply(query.toString());
  };
  return <form onSubmit={apply} className="space-y-3" aria-label="Bộ lọc nguyên liệu">
    <div className="grid gap-3 md:grid-cols-3">
      {showSearch && <label>Tìm nguyên liệu<Input name="q" placeholder="Tên hoặc mã nguyên liệu" /></label>}
      <EntityPicker name={`${instance}-parent`} serializeValue={false} label="Nhóm cấp 1" items={[{ code: "", name: "Tất cả nhóm", children: [] }, { code: "ungrouped", name: "Chưa phân nhóm", children: [] }, ...categories]} status="ready" value={parent} getId={item => item.code} getLabel={item => item.name} onChange={id => { setParent(id ?? ""); setLeaf(""); }} />
      <EntityPicker key={parent} name={`${instance}-leaf`} serializeValue={false} label="Nhóm cấp 2" items={categories.find(item => item.code === parent)?.children ?? []} status="ready" value={leaf} getId={item => item.code} getLabel={item => item.name} onChange={id => setLeaf(id ?? "")} />
      <label>Tháng mùa<Select name="month"><option value="">Tất cả tháng</option>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}</Select></label>
      <label>Giá từ<Input name="price_min" inputMode="numeric" /></label>
      <label>Giá đến<Input name="price_max" inputMode="numeric" /></label>
      <label>Đơn vị giá<Select name="price_uom" defaultValue="KG"><option>KG</option><option>L</option><option>EA</option></Select></label>
    </div>
    <Checkbox name="include_unknown" value="true" label="Bao gồm nguyên liệu chưa biết mùa" defaultChecked />
    {error && <p role="alert">{error}</p>}
    <Button type="submit" variant="outline" disabled={busy}>Lọc nguyên liệu</Button>
  </form>;
}

export function MaterialPicker({ onSelect }: { onSelect: (material: Material) => void }) {
  const instance = useId();
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [categoryError, setCategoryError] = useState("");
  const [draft, setDraft] = useState("");
  const [existing, setExisting] = useState<ExistingMaterial | null>(null);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [reset, setReset] = useState(0);
  const [notice, setNotice] = useState("");
  const request = useRef(0);
  const createAttempt = useRef<{ payload: string; key: string } | null>(null);
  const [page, setPage] = useState<MaterialPage | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const load = async (filter: string, cursor = "") => {
    const current = ++request.current;
    setBusy(true); setError("");
    try { const result = await getMaterials(`${filter}&cursor=${encodeURIComponent(cursor)}`); if (current === request.current) setPage(result); }
    catch (e) { if (current === request.current) { setPage(null); setError(e instanceof Error ? e.message : "Không tải được nguyên liệu"); } }
    finally { if (current === request.current) setBusy(false); }
  };
  const loadCategories = () => { setCategoryError(""); void getMaterialCategories().then(setCategories).catch(() => setCategoryError("Không tải được nhóm nguyên liệu")); };
  useEffect(() => { void load(""); loadCategories(); void getProductionContext().then(context => setCanCreate(context.permissions?.includes("sales:product:create") ?? false)).catch(() => setCanCreate(false)); return () => { request.current++; }; }, []);
  const searchFilter = (filter: string) => { const params = new URLSearchParams(filter); if (draft.trim()) params.set("q", draft.trim()); return params.toString(); };
  const resetFilters = () => { setQuery(""); setDraft(""); setReset(current => current + 1); void load(""); };
  const selectCreated = (material: Material) => {
    onSelect(material); setNotice(`Đã chọn ${material.name} · ${material.sku_code}`); setCreating(false); resetFilters();
  };
  const handleCreate = async (input: CreateMaterialInput) => {
    const payload = JSON.stringify(input);
    if (createAttempt.current?.payload !== payload) createAttempt.current = { payload, key: crypto.randomUUID() };
    setCreateError(""); setExisting(null);
    try { selectCreated(await createMaterial(input, createAttempt.current.key)); createAttempt.current = null; }
    catch (e) {
      const duplicate = e instanceof FetchError && e.status === 409 ? duplicateSchema.safeParse(e.info) : null;
      if (duplicate?.success) setExisting(duplicate.data.errors.existing);
      else setCreateError(e instanceof Error ? e.message : "Không tạo được nguyên liệu");
    }
  };
  const useExisting = async (existing: ExistingMaterial) => {
    setCreateError("");
    try {
      const result = await getMaterials(new URLSearchParams({ q: existing.code }).toString());
      const material = result.items.find(item => item.id === existing.id && item.selectable);
      if (!material) throw new Error("Không chọn được nguyên liệu đã có. Hãy tải lại danh sách.");
      selectCreated(material);
    } catch (e) { setCreateError(e instanceof Error ? e.message : "Không tải được nguyên liệu đã có"); }
  };
  return <section className="space-y-3 rounded-xl border border-line p-4" aria-label="Chọn nguyên liệu" aria-busy={busy}>
    <MaterialFilters key={reset} showSearch={false} categories={categories} busy={busy} onApply={filter => { const next = searchFilter(filter); setQuery(next); void load(next); }} />
    {notice && <p role="status">{notice}</p>}
    {categoryError && <p role="alert">{categoryError} <Button type="button" variant="outline" onClick={loadCategories}>Tải lại nhóm</Button></p>}
    {error && <div role="alert">{error} <Button variant="outline" onClick={() => void load(query)}>Thử lại</Button></div>}
    {busy && <Skeleton title="Đang tải nguyên liệu…" />}
    {page?.season_message && <p>{page.season_message}</p>}
    {!busy && !error && page && !page.items.length && <EmptyState title="Không có nguyên liệu phù hợp" description="Hãy đổi bộ lọc để tìm nguyên liệu cần chuẩn bị." />}
    <div onChangeCapture={event => { const target = event.target; if (target instanceof HTMLInputElement && target.getAttribute("role") === "combobox") { setDraft(target.value); const filter = new URLSearchParams(query); filter.set("q", target.value); setQuery(filter.toString()); void load(filter.toString()); } }}>
      <EntityPicker key={reset} name={`${instance}-material`} label="Nguyên liệu" items={page?.items.filter(item => item.selectable)} status={busy ? "loading" : error ? "error" : "ready"} value={null} getId={item => item.id} getLabel={item => item.name} getMeta={item => `${item.sku_code} · ${item.uom_code} · ${item.normalized_unit_price ? `${item.normalized_unit_price} VND/${item.reference_pack_uom ?? item.uom_code}` : "Chưa có giá"}${item.material_group_code ? "" : " · Chưa phân nhóm"}`} onChange={id => { const material = page?.items.find(item => item.id === id); if (material) onSelect(material); }} />
    </div>
    {canCreate && !creating && !busy && !error && page?.items.length === 0 && draft.trim() && <Button type="button" variant="outline" onClick={() => { setExisting(null); setCreateError(""); setCreating(true); }}>Tạo nguyên liệu “{draft.trim()}”</Button>}
    {creating && <MaterialCreateForm initialName={draft} categories={categories} onCreate={handleCreate} onUseExisting={useExisting} existing={existing} error={createError} onCancel={() => setCreating(false)} />}
    <div className="flex gap-2"><Button type="button" variant="outline" disabled={busy || !query} onClick={resetFilters}>Đặt lại</Button>
      {page?.next_cursor && <Button type="button" variant="outline" disabled={busy} onClick={() => void load(query, page.next_cursor)}>Trang sau</Button>}</div>
  </section>;
}
