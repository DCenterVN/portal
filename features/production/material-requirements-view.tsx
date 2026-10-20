"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, PageShell } from "@/components/ui/page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MaterialFilters } from "./material-picker";
import { getTargets, getMaterialRequirements, type ProductionTarget, type MaterialRequirements, type MaterialRequirement } from "@/lib/api/production";

function RequirementsTable({ lines }: { lines: MaterialRequirement[] }) {
  return <Table><TableHeader><TableRow>{["Nguyên liệu", "Nhu cầu", "Mùa", "Giá bán seed tham khảo", "Cơ sở giá", "Nguồn", "Ngày nguồn"].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>
    {lines.length === 0 && <TableRow><TableCell colSpan={7}>Không có dòng phù hợp. Hãy đổi bộ lọc.</TableCell></TableRow>}
    {lines.map(line => <TableRow key={`${line.sku_ref}-${line.uom}`}><TableCell>{line.name}<p className="text-sm text-muted-foreground">{line.sku_code}</p></TableCell>
      <TableCell className="tabular-nums">{line.quantity} {line.uom}</TableCell>
      <TableCell>{line.season_months?.length ? `Tháng ${line.season_months.join(", ")}` : "Chưa biết mùa"}</TableCell>
      <TableCell>{line.normalized_unit_price ?? "Chưa có giá"}{line.normalized_unit_price && ` VND/${line.reference_pack_uom}`}</TableCell>
      <TableCell>{line.reference_price_vnd == null ? "Chưa có quy cách" : `${line.reference_price_vnd} VND / ${line.reference_pack_quantity ?? "?"} ${line.reference_pack_uom ?? ""}`}</TableCell>
      <TableCell>{line.price_source}</TableCell><TableCell>{line.reference_observed_at ?? "Chưa biết ngày nguồn"}</TableCell>
    </TableRow>)}
  </TableBody></Table>;
}

export function MaterialRequirementsView({ targetId, foodPlanId }: { targetId?: string; foodPlanId?: string }) {
  const [targets, setTargets] = useState<ProductionTarget[]>([]);
  const [selected, setSelected] = useState(targetId ?? "");
  const [data, setData] = useState<MaterialRequirements | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scope = foodPlanId ? "food-plans" : "targets";
  const id = foodPlanId || selected;
  const load = async () => {
    setBusy(true); setData(null); setError("");
    try {
      if (id) setData(await getMaterialRequirements(scope, id, query));
      else setTargets(await getTargets());
    }
    catch (e) { setError(e instanceof Error ? e.message : "Không tải được nhu cầu"); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    let active = true;
    if (!id) { setData(null); return; }
    setBusy(true); setData(null); setError("");
    getMaterialRequirements(scope, id, query).then(value => { if (active) setData(value); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Không tải được nhu cầu"); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [id, scope, query]);
  useEffect(() => {
    if (!foodPlanId) getTargets().then(setTargets).catch(e => setError(e instanceof Error ? e.message : "Không tải được chỉ tiêu"));
  }, [foodPlanId]);
  return <PageShell>
    <PageHeader title="Nhu cầu nguyên liệu" description="Nhu cầu theo định mức hiện tại, chưa trừ tồn kho. Giá bán seed chỉ để tham khảo." />
    {!foodPlanId && <label>Chỉ tiêu<Select value={selected} onChange={e => setSelected(e.target.value)}><option value="">Chọn chỉ tiêu</option>{targets.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</Select></label>}
    {!id && <p>Chọn chỉ tiêu để đọc nhu cầu nguyên liệu.</p>}
    {id && <MaterialFilters busy={busy} showSearch={false} onApply={setQuery} />}
    {error && <div role="alert">{error} <Button variant="outline" onClick={() => void load()}>Thử lại</Button></div>}
    <Card><CardContent aria-busy={busy} className="space-y-4 pt-6">
      {busy && <p role="status">Đang tính nhu cầu nguyên liệu…</p>}
      {data && <>
        <p>Revision: {Object.entries(data.plan_revisions).map(([plan, revision]) => `${plan}: ${revision}`).join(" · ")}</p>
        <p>Tính lúc {data.computed_at}. Tổng {data.total} dòng · Đang ẩn {data.hidden_count} dòng.</p>
        {data.season_message && <p>{data.season_message}</p>}
        <RequirementsTable lines={data.lines} />
        <details><summary>Tổng nhu cầu đầy đủ theo SKU và đơn vị</summary><RequirementsTable lines={data.all_lines} /></details>
      </>}
    </CardContent></Card>
    <Link href="/production/targets">Danh sách chỉ tiêu</Link>
  </PageShell>;
}
