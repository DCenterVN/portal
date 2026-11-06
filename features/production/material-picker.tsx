"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/patterns/form-field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { EntityPicker } from "@/components/patterns/entity-picker";
import type { MaterialCategory } from "@/lib/api/inventory/types";
import { MaterialCreateForm } from "./material-create-form";
import { EmptyState, LoadingState } from "@/components/patterns/empty-state";
import { TablePager } from "@/components/patterns/table-pager";
import type { Material } from "@/lib/api/sales";
import { useMaterialPicker } from "./use-material-picker";
import { InlineAlert } from "@/components/patterns/inline-alert";

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
      <label>Tháng mùa<NativeSelect name="month"><NativeSelectOption value="">Tất cả tháng</NativeSelectOption>{Array.from({ length: 12 }, (_, i) => <NativeSelectOption key={i + 1} value={i + 1}>Tháng {i + 1}</NativeSelectOption>)}</NativeSelect></label>
      <label>Giá từ<Input name="price_min" inputMode="numeric" /></label>
      <label>Giá đến<Input name="price_max" inputMode="numeric" /></label>
      <label>Đơn vị giá<NativeSelect name="price_uom" defaultValue="KG"><NativeSelectOption>KG</NativeSelectOption><NativeSelectOption>L</NativeSelectOption><NativeSelectOption>EA</NativeSelectOption></NativeSelect></label>
    </div>
    <Checkbox name="include_unknown" value="true" label="Bao gồm nguyên liệu chưa biết mùa" defaultChecked />
    {error && <InlineAlert>{error}</InlineAlert>}
    <Button type="submit" variant="outline" disabled={busy}>Lọc nguyên liệu</Button>
  </form>;
}

export function MaterialPicker({ onSelect }: { onSelect: (material: Material) => void }) {
  const { instance, categories, categoryError, draft, setDraft, existing, setExisting, createError, setCreateError, creating, setCreating, canCreate, reset, notice, page, query, setQuery, error, busy, load, loadCategories, searchFilter, resetFilters, handleCreate, pickExisting } = useMaterialPicker(onSelect);
  return <section className="space-y-3 rounded-xl border border-border p-4" aria-label="Chọn nguyên liệu" aria-busy={busy}>
    <MaterialFilters key={reset} showSearch={false} categories={categories} busy={busy} onApply={filter => { const next = searchFilter(filter); setQuery(next); void load(next); }} />
    {notice && <p role="status">{notice}</p>}
    {categoryError && <InlineAlert>{categoryError} <Button type="button" variant="outline" onClick={loadCategories}>Tải lại nhóm</Button></InlineAlert>}
    {error && <InlineAlert>{error} <Button variant="outline" onClick={() => void load(query)}>Thử lại</Button></InlineAlert>}
    {busy && <LoadingState title="Đang tải nguyên liệu…" />}
    {page?.season_message && <p>{page.season_message}</p>}
    {!busy && !error && page && !page.items.length && <EmptyState title="Không có nguyên liệu phù hợp" description="Hãy đổi bộ lọc để tìm nguyên liệu cần chuẩn bị." />}
    <div onChangeCapture={event => { const target = event.target; if (target instanceof HTMLInputElement && target.getAttribute("role") === "combobox") { setDraft(target.value); const filter = new URLSearchParams(query); filter.set("q", target.value); setQuery(filter.toString()); void load(filter.toString()); } }}>
      <EntityPicker key={reset} name={`${instance}-material`} label="Nguyên liệu" items={page?.items.filter(item => item.selectable)} status={busy ? "loading" : error ? "error" : "ready"} value={null} getId={item => item.id} getLabel={item => item.name} getMeta={item => `${item.sku_code} · ${item.uom_code} · ${item.normalized_unit_price ? `${item.normalized_unit_price} VND/${item.reference_pack_uom ?? item.uom_code}` : "Chưa có giá"}${item.material_group_code ? "" : " · Chưa phân nhóm"}`} onChange={id => { const material = page?.items.find(item => item.id === id); if (material) onSelect(material); }} />
    </div>
    {canCreate && !creating && !busy && !error && page?.items.length === 0 && draft.trim() && <Button type="button" variant="outline" onClick={() => { setExisting(null); setCreateError(""); setCreating(true); }}>Tạo nguyên liệu “{draft.trim()}”</Button>}
    {creating && <MaterialCreateForm initialName={draft} categories={categories} onCreate={handleCreate} onUseExisting={pickExisting} existing={existing} error={createError} onCancel={() => setCreating(false)} />}
    <div className="flex items-center gap-2"><Button type="button" variant="outline" disabled={busy || !query} onClick={resetFilters}>Đặt lại</Button>
      {page?.next_cursor && <TablePager className="pt-0" busy={busy} hasNext onNext={() => void load(query, page.next_cursor)} />}</div>
  </section>;
}
