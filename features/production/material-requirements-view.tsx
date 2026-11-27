"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { Checkbox, Field } from "@/components/patterns/form-field";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { StatusBadge, statusTone } from "@/components/patterns/status-badge";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Card, CardContent } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePager } from "@/components/patterns/table-pager";
import { useLocalPages } from "@/lib/local-pages";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { formatQuantity, uomLabel } from "@/lib/stock-transfer";
import { formatVND } from "@/lib/format";
import { statusLabel } from "@/lib/status-labels";
import { useAccess } from "@/lib/access-boundary";
import { purchasePriceKey } from "@/lib/purchase-price";
import type { MaterialRequirement } from "@/lib/api/production";
import { quoteSchema } from "./requirement-schemas";
import { targetStatuses } from "./order-status";
import { ProductionFlowBar } from "./production-flow-bar";
import { useMaterialRequirements } from "./use-material-requirements";

function hasLinePrice(line: MaterialRequirement): boolean {
  const quote = quoteSchema.parse(line).price;
  if (quote === undefined) return Boolean(line.normalized_unit_price);
  return quote !== null;
}

export function RequirementsTable({ lines }: { lines: MaterialRequirement[] }) {
  const showPrice = useAccess().can(purchasePriceKey);
  const pages = useLocalPages(lines, `${lines.length}:${lines[0]?.sku_ref ?? ""}`);
  const columns = [
    { label: "Nguyên liệu", numeric: false },
    { label: "Nhu cầu", numeric: true },
    { label: "Mùa", numeric: false },
    ...(showPrice
      ? [
          { label: "Giá bán tham khảo / giá hợp đồng", numeric: true },
          { label: "Nguồn", numeric: false },
          { label: "Ngày nguồn", numeric: false },
        ]
      : []),
  ];
  return <><Table><TableHeader><TableRow>{columns.map(col => <TableHead key={col.label} className={col.numeric ? "text-right" : undefined}>{col.label}</TableHead>)}</TableRow></TableHeader><TableBody>
    {lines.length === 0 && <TableRow><TableCell colSpan={columns.length}><EmptyState title="Không có dòng phù hợp" description="Hãy đổi bộ lọc để xem nhu cầu nguyên liệu." /></TableCell></TableRow>}
    {pages.rows.map(line => {
      const quote = quoteSchema.parse(line).price;
      const observedAt = quote === undefined ? line.reference_observed_at : quote?.observed_at;
      return <TableRow key={`${line.sku_ref}-${line.uom}`}>
        <TableCell className="font-medium text-foreground">{line.name}</TableCell>
        <TableCell className="text-right tabular-nums">{formatQuantity(line.quantity, line.uom)}</TableCell>
        <TableCell className="text-sm text-muted-foreground">{line.season_months?.length ? `Tháng ${line.season_months.join(", ")}` : "Chưa biết mùa"}</TableCell>
        {showPrice && <>
          <TableCell className="text-right tabular-nums">{quote === undefined ? line.normalized_unit_price ? `${formatVND(Number(line.normalized_unit_price))}${line.reference_pack_uom ? `/${uomLabel(line.reference_pack_uom)}` : ""}` : "Chưa có giá" : quote ? `${formatVND(quote.unit_price_vnd)}/${uomLabel(quote.uom)}` : "Chưa có giá"}</TableCell>
          <TableCell className="text-sm">{statusLabel(quote === undefined ? line.price_source : quote?.source ?? "Chưa có nguồn giá")}</TableCell>
          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{observedAt ? (formatDate(observedAt) || observedAt) : "Chưa biết ngày nguồn"}</TableCell>
        </>}
      </TableRow>;
    })}
  </TableBody></Table>{(pages.hasPrevious || pages.hasNext) && <TablePager label="Phân trang nhu cầu nguyên liệu" status={`Trang ${pages.page}`} hasPrevious={pages.hasPrevious} onPrevious={pages.previous} hasNext={pages.hasNext} onNext={pages.next} />}</>;
}

export function MaterialRequirementsView({ targetId, foodPlanId }: { targetId?: string; foodPlanId?: string }) {
  const showPrice = useAccess().can(purchasePriceKey);
  const { packNames, pins, targets, selected, setSelected, data, month, setMonth, includeUnknown, setIncludeUnknown, priceMin, setPriceMin, priceMax, setPriceMax, busy, error, id, load, applyFilters } = useMaterialRequirements(targetId, foodPlanId);
  const quickTargets = targets.filter((t) => t.status === "APPROVED" || t.status === "IN_PLANNING" || t.status === "HANDED_OFF").slice(0, 5);
  const pricedCount = data ? data.all_lines.filter(hasLinePrice).length : 0;
  const unpricedCount = data ? data.all_lines.length - pricedCount : 0;

  return <PageShell>
    <PageHeading
      title="Nhu cầu nguyên liệu"
      description={`Nhu cầu theo định mức hiện tại, chưa trừ tồn kho.${showPrice ? " Giá bán chỉ để tham khảo." : ""}`}
      actions={<Link className={buttonVariants({ size: "sm", variant: "outline" })} href="/production/targets">Danh sách chỉ tiêu</Link>}
    />
    <ProductionFlowBar current="requirements" targetId={selected || targetId} foodPlanId={foodPlanId} />

    {(!foodPlanId || id) && (
      <Card className="mb-6">
        <CardContent className="space-y-4">
          {!foodPlanId && (
            <EntityPicker
              label="Chỉ tiêu"
              name="target"
              value={selected || null}
              onChange={value => setSelected(value ?? "")}
              items={targets}
              status="ready"
              getId={t => t.id}
              getLabel={t => t.title}
              getMeta={t => t.target_code}
              placeholder="Chọn chỉ tiêu"
              emptyText="Chưa có chỉ tiêu nào."
            />
          )}
          {id && (
            <form className="space-y-3" aria-label="Bộ lọc nguyên liệu" onSubmit={event => { event.preventDefault(); applyFilters(); }}>
              <div className={showPrice ? "grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end" : "grid gap-3 md:grid-cols-[1fr_auto] md:items-end"}>
                <Field label="Tháng" htmlFor="requirements-month">
                  <NativeSelect id="requirements-month" name="month" value={month} onChange={event => setMonth(event.target.value)}>
                    <NativeSelectOption value="">Tất cả</NativeSelectOption>
                    {Array.from({ length: 12 }, (_, index) => <NativeSelectOption key={index + 1} value={index + 1}>{index + 1}</NativeSelectOption>)}
                  </NativeSelect>
                </Field>
                {showPrice && <>
                  <Field label="Giá từ" htmlFor="requirements-price-min">
                    <Input id="requirements-price-min" name="price_min" type="number" min="0" step="1" value={priceMin} onChange={event => setPriceMin(event.target.value)} />
                  </Field>
                  <Field label="Giá đến" htmlFor="requirements-price-max">
                    <Input id="requirements-price-max" name="price_max" type="number" min="0" step="1" value={priceMax} onChange={event => setPriceMax(event.target.value)} />
                  </Field>
                </>}
                <Button type="submit" variant="outline" disabled={busy}>Lọc nguyên liệu</Button>
              </div>
              <Checkbox name="include_unknown" label="Bao gồm nguyên liệu chưa biết mùa" checked={includeUnknown} onChange={event => setIncludeUnknown(event.target.checked)} />
            </form>
          )}
        </CardContent>
      </Card>
    )}

    {!id && (
      <Card>
        <CardContent className="space-y-4">
          <EmptyState
            title="Chọn chỉ tiêu để đọc nhu cầu nguyên liệu"
            description="Chọn một chỉ tiêu ở ô phía trên hoặc bấm nhanh vào các chỉ tiêu đang triển khai bên dưới."
          />
          {quickTargets.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {quickTargets.map((t) => (
                <Button
                  key={t.id}
                  type="button"
                  variant="outline"
                  onClick={() => setSelected(t.id)}
                  className="h-auto w-full justify-between gap-3 py-2.5 text-left font-normal"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">{t.title}</span>
                    <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{t.target_code}</span>
                  </span>
                  <StatusBadge tone={statusTone(t.status)}>{targetStatuses[t.status] ?? t.status}</StatusBadge>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )}

    {error && <ErrorState title="Không tải được nhu cầu" description={error} onRetry={() => void load()} />}
    <div aria-busy={busy} className="space-y-4">
      {busy && <LoadingState title="Đang tính nhu cầu nguyên liệu…" />}
      {data && !error && <>
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="border-t-[3px] border-t-primary py-4">
            <CardContent className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Nguyên liệu cần chuẩn bị</p>
              <p className="text-2xl font-semibold tabular-nums text-foreground">{data.total} dòng</p>
              <p className="text-xs text-muted-foreground">Tính lúc {formatDateTime(data.computed_at)}. Tổng {data.total} dòng · Đang ẩn {data.hidden_count} dòng.</p>
            </CardContent>
          </Card>

          <Card className="border-t-[3px] border-t-primary py-4">
            <CardContent className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Độ phủ giá &amp; mùa vụ</p>
              {showPrice ? (
                <>
                  <p className="text-sm font-semibold tabular-nums text-foreground">{pricedCount} có giá · {unpricedCount} chưa có giá</p>
                  <Link className="inline-block text-xs font-medium text-primary underline-offset-4 hover:underline" href="/inventory/suppliers?f.attention=without_price">
                    Kiểm tra giá nhà cung cấp
                  </Link>
                </>
              ) : (
                <p className="text-sm font-semibold text-foreground">Thông tin mùa vụ</p>
              )}
              {data.season_message && <p className="text-xs text-muted-foreground">{data.season_message.charAt(0).toUpperCase() + data.season_message.slice(1)}</p>}
            </CardContent>
          </Card>

          <Card className="border-t-[3px] border-t-primary py-4">
            <CardContent className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Phiên bản &amp; thời điểm tính</p>
              <p className="text-xs text-muted-foreground">{statusLabel("REVISION")}: {Object.values(data.plan_revisions).map((revision, index) => `Thực đơn ${index + 1}: ${revision}`).join(" · ")}</p>
              <p className="pt-1 text-xs font-medium text-foreground">Phiên bản công thức đang dùng</p>
              {pins.flatMap((pin, i) => pin?.recipe_versions.map(item => <p className="text-xs text-muted-foreground" key={`${i}-${item.bom_ref}`}>{packNames[item.sku_ref] || "Gói đang dùng"} · công thức v{item.version}</p>) ?? [])}
              {!pins.some(pin => pin?.recipe_versions.length) && <p className="text-xs text-muted-foreground">Định mức nguyên liệu trực tiếp, không dùng công thức gói.</p>}
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden py-0"><CardContent className="p-0"><RequirementsTable lines={data.lines} /></CardContent></Card>
        {data.hidden_count > 0 && <p className="text-sm text-muted-foreground">Đã ẩn {data.hidden_count} / {data.total} nguyên liệu</p>}
        <Card><CardContent><details className="group"><summary className="cursor-pointer select-none text-sm font-medium text-foreground hover:text-primary">Tổng nhu cầu đầy đủ theo mã hàng và đơn vị</summary><div className="mt-4 overflow-x-auto rounded-lg border border-border"><RequirementsTable lines={data.all_lines} /></div></details></CardContent></Card>
      </>}
    </div>
  </PageShell>;
}
