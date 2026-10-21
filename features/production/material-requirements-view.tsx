"use client";

import { z } from "zod";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/state";
import { Checkbox, Field, Select } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, PageShell } from "@/components/ui/page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listPackages } from "@/lib/api/sales";
import { getTargets, getMaterialRequirements, getFoodPlan, type ProductionTarget, type MaterialRequirements, type MaterialRequirement } from "@/lib/api/production";

const quoteSchema = z.object({ price: z.object({ unit_price_vnd: z.number().int().nonnegative(), uom: z.enum(["KG", "L", "EA"]), source: z.enum(["SEED_RETAIL_REFERENCE", "CONTRACT"]), observed_at: z.string().nullable() }).strict().nullable().optional() });
const pinsSchema = z.object({ pack_plan: z.object({ recipe_versions: z.array(z.object({ sku_ref: z.string(), bom_ref: z.string(), version: z.number().int().positive() }).strict()) }).nullable().optional() });

function RequirementsTable({ lines }: { lines: MaterialRequirement[] }) {
  return <Table><TableHeader><TableRow>{["Nguyên liệu", "Nhu cầu", "Mùa", "Giá bán seed tham khảo / giá hợp đồng", "Đơn vị giá", "Nguồn", "Ngày nguồn"].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>
    {lines.length === 0 && <TableRow><TableCell colSpan={7}><EmptyState title="Không có dòng phù hợp" description="Hãy đổi bộ lọc để xem nhu cầu nguyên liệu." /></TableCell></TableRow>}
    {lines.map(line => { const quote = quoteSchema.parse(line).price; return <TableRow key={`${line.sku_ref}-${line.uom}`}><TableCell>{line.name}</TableCell>
      <TableCell className="tabular-nums">{line.quantity} {line.uom}</TableCell>
      <TableCell>{line.season_months?.length ? `Tháng ${line.season_months.join(", ")}` : "Chưa biết mùa"}</TableCell>
      <TableCell>{quote === undefined ? line.normalized_unit_price ?? "Chưa có giá" : quote ? `${quote.unit_price_vnd} VND/${quote.uom}` : "Chưa có giá"}</TableCell>
      <TableCell>{quote === undefined ? line.reference_pack_uom ?? "Chưa có quy cách" : quote?.uom ?? "Chưa có giá"}</TableCell>
      <TableCell>{quote === undefined ? line.price_source : quote?.source ?? "Chưa có nguồn giá"}</TableCell><TableCell>{(quote === undefined ? line.reference_observed_at : quote?.observed_at) ?? "Chưa biết ngày nguồn"}</TableCell>
    </TableRow>; })}
  </TableBody></Table>;
}

export function MaterialRequirementsView({ targetId, foodPlanId }: { targetId?: string; foodPlanId?: string }) {
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
  return <PageShell>
    <PageHeader title="Nhu cầu nguyên liệu" description="Nhu cầu theo định mức hiện tại, chưa trừ tồn kho. Giá bán seed chỉ để tham khảo." />
    {!foodPlanId && <label>Chỉ tiêu<Select value={selected} onChange={e => setSelected(e.target.value)}><option value="">Chọn chỉ tiêu</option>{targets.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</Select></label>}
    {!id && <p>Chọn chỉ tiêu để đọc nhu cầu nguyên liệu.</p>}
    {id && <form className="space-y-3" aria-label="Bộ lọc nguyên liệu" onSubmit={event => {
      event.preventDefault();
      const params = new URLSearchParams();
      if (month) params.set("month", month);
      params.set("include_unknown", String(includeUnknown));
      if (priceMin) params.set("price_min", priceMin);
      if (priceMax) params.set("price_max", priceMax);
      if (priceMin || priceMax) params.set("price_uom", "KG");
      setQuery(params.toString());
    }}>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Tháng" htmlFor="requirements-month"><Select id="requirements-month" name="month" value={month} onChange={event => setMonth(event.target.value)}><option value="">Tất cả</option>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</Select></Field>
        <Field label="Giá từ" htmlFor="requirements-price-min"><Input id="requirements-price-min" name="price_min" type="number" min="0" step="1" value={priceMin} onChange={event => setPriceMin(event.target.value)} /></Field>
        <Field label="Giá đến" htmlFor="requirements-price-max"><Input id="requirements-price-max" name="price_max" type="number" min="0" step="1" value={priceMax} onChange={event => setPriceMax(event.target.value)} /></Field>
      </div>
      <Checkbox name="include_unknown" label="Bao gồm nguyên liệu chưa biết mùa" checked={includeUnknown} onChange={event => setIncludeUnknown(event.target.checked)} />
      <Button type="submit" variant="outline" disabled={busy}>Lọc nguyên liệu</Button>
    </form>}
    {error && <ErrorState title="Không tải được nhu cầu" description={error} onRetry={() => void load()} />}
    <Card><CardContent aria-busy={busy} className="space-y-4 pt-6">
      {busy && <Skeleton title="Đang tính nhu cầu nguyên liệu…" />}
      {data && !error && <>
        <p>Revision: {Object.values(data.plan_revisions).map((revision, index) => `Thực đơn ${index + 1}: ${revision}`).join(" · ")}</p>
        <div><p>Phiên bản công thức đã pin</p>{pins.flatMap((pin, i) => pin?.recipe_versions.map(item => <p key={`${i}-${item.bom_ref}`}>{packNames[item.sku_ref] || "Gói đã pin"} · công thức v{item.version}</p>) ?? [])}{!pins.some(pin => pin?.recipe_versions.length) && <p>Định mức nguyên liệu trực tiếp, không pin công thức gói.</p>}</div>
        <p>Tính lúc {data.computed_at}. Tổng {data.total} dòng · Đang ẩn {data.hidden_count} dòng.</p>
        {data.season_message && <p>{data.season_message}</p>}
        <RequirementsTable lines={data.lines} />
        {data.hidden_count > 0 && <p>Đã ẩn {data.hidden_count} / {data.total} nguyên liệu</p>}
        <details><summary>Tổng nhu cầu đầy đủ theo SKU và đơn vị</summary><RequirementsTable lines={data.all_lines} /></details>
      </>}
    </CardContent></Card>
    <Link href="/production/targets">Danh sách chỉ tiêu</Link>
  </PageShell>;
}
