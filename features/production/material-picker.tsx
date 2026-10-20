"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, Checkbox } from "@/components/ui/field";
import { getMaterials, type Material, type MaterialPage } from "@/lib/api/sales";

export function MaterialFilters({ categories = [], onApply, busy = false, showSearch = true }: {
  categories?: MaterialPage["categories"]; onApply: (query: string) => void; busy?: boolean; showSearch?: boolean;
}) {
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
    query.set("include_unknown", data.has("include_unknown") ? "true" : "false");
    onApply(query.toString());
  };
  return <form onSubmit={apply} className="space-y-3" aria-label="Bộ lọc nguyên liệu">
    <div className="grid gap-3 md:grid-cols-3">
      {showSearch && <label>Tìm nguyên liệu<Input name="q" placeholder="Tên hoặc mã nguyên liệu" /></label>}
      {categories.length > 0 && <label>Danh mục<Select name="category_slug"><option value="">Tất cả danh mục</option>{categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}</Select></label>}
      <label>Tháng<Select name="month"><option value="">Tất cả tháng</option>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}</Select></label>
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
  const [page, setPage] = useState<MaterialPage | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async (filter: string, cursor = "") => {
    setBusy(true); setError("");
    try { setPage(await getMaterials(`${filter}&cursor=${encodeURIComponent(cursor)}`)); }
    catch (e) { setPage(null); setError(e instanceof Error ? e.message : "Không tải được nguyên liệu"); }
    finally { setBusy(false); }
  };
  useEffect(() => { void load(""); }, []);
  return <section className="space-y-3 rounded-xl border border-line p-4" aria-label="Chọn nguyên liệu" aria-busy={busy}>
    <MaterialFilters categories={page?.categories} busy={busy} onApply={filter => { setQuery(filter); void load(filter); }} />
    {error && <div role="alert">{error} <Button variant="outline" onClick={() => void load(query)}>Thử lại</Button></div>}
    {busy && <p role="status">Đang tải nguyên liệu…</p>}
    {page?.season_message && <p>{page.season_message}</p>}
    {page && !page.items.length && <p>Không có nguyên liệu phù hợp. Hãy đổi bộ lọc.</p>}
    <ul className="space-y-2">{page?.items.map(material => <li key={material.id} className="flex items-center justify-between gap-3 border-b border-line py-2">
      <div>{material.name} · {material.uom_code}<p className="text-sm text-muted-foreground">{material.normalized_unit_price ?? "Chưa có giá"} {material.reference_pack_uom} · giá bán seed tham khảo</p></div>
      <Button type="button" variant="outline" disabled={!material.selectable || busy} onClick={() => onSelect(material)}>Chọn {material.name}</Button>
    </li>)}</ul>
    <div className="flex gap-2"><Button type="button" variant="outline" disabled={busy || !query} onClick={() => { setQuery(""); void load(""); }}>Đặt lại</Button>
      {page?.next_cursor && <Button type="button" variant="outline" disabled={busy} onClick={() => void load(query, page.next_cursor)}>Trang sau</Button>}</div>
  </section>;
}
