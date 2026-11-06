"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { Checkbox, Field } from "@/components/patterns/form-field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Card, CardContent } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MaterialRequirement } from "@/lib/api/production";
import { quoteSchema } from "./requirement-schemas";
import { useMaterialRequirements } from "./use-material-requirements";


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
  const { packNames, pins, targets, selected, setSelected, data, month, setMonth, includeUnknown, setIncludeUnknown, priceMin, setPriceMin, priceMax, setPriceMax, busy, error, id, load, applyFilters } = useMaterialRequirements(targetId, foodPlanId);
  return <PageShell>
    <PageHeading title="Nhu cầu nguyên liệu" description="Nhu cầu theo định mức hiện tại, chưa trừ tồn kho. Giá bán seed chỉ để tham khảo." />
    {!foodPlanId && <label>Chỉ tiêu<NativeSelect value={selected} onChange={e => setSelected(e.target.value)}><NativeSelectOption value="">Chọn chỉ tiêu</NativeSelectOption>{targets.map(t => <NativeSelectOption key={t.id} value={t.id}>{t.title}</NativeSelectOption>)}</NativeSelect></label>}
    {!id && <p>Chọn chỉ tiêu để đọc nhu cầu nguyên liệu.</p>}
    {id && <form className="space-y-3" aria-label="Bộ lọc nguyên liệu" onSubmit={event => { event.preventDefault(); applyFilters(); }}>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Tháng" htmlFor="requirements-month"><NativeSelect id="requirements-month" name="month" value={month} onChange={event => setMonth(event.target.value)}><NativeSelectOption value="">Tất cả</NativeSelectOption>{Array.from({ length: 12 }, (_, index) => <NativeSelectOption key={index + 1} value={index + 1}>{index + 1}</NativeSelectOption>)}</NativeSelect></Field>
        <Field label="Giá từ" htmlFor="requirements-price-min"><Input id="requirements-price-min" name="price_min" type="number" min="0" step="1" value={priceMin} onChange={event => setPriceMin(event.target.value)} /></Field>
        <Field label="Giá đến" htmlFor="requirements-price-max"><Input id="requirements-price-max" name="price_max" type="number" min="0" step="1" value={priceMax} onChange={event => setPriceMax(event.target.value)} /></Field>
      </div>
      <Checkbox name="include_unknown" label="Bao gồm nguyên liệu chưa biết mùa" checked={includeUnknown} onChange={event => setIncludeUnknown(event.target.checked)} />
      <Button type="submit" variant="outline" disabled={busy}>Lọc nguyên liệu</Button>
    </form>}
    {error && <ErrorState title="Không tải được nhu cầu" description={error} onRetry={() => void load()} />}
    <Card><CardContent aria-busy={busy} className="space-y-4 pt-6">
      {busy && <LoadingState title="Đang tính nhu cầu nguyên liệu…" />}
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
