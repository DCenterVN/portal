"use client";

import type { Route } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SupplierOverview } from "@/lib/api/supplier-overview";

export type ChartColorVar = "--chart-1" | "--chart-2" | "--chart-3" | "--chart-4" | "--chart-5";

export type DonutSegment = {
  id: string;
  label: string;
  value: number;
  plus?: boolean;
  colorVar: ChartColorVar;
  href: Route;
};

export type DonutChartProps = {
  title: string;
  subtitle?: string;
  centerLabel: string;
  centerValue: number;
  emptyText: string;
  segments: DonutSegment[];
  footer?: string;
};

export type MaterialBarItem = {
  code: string;
  label: string;
  active: number;
  draft: number;
};

export type DishSummary = {
  selling: number;
  ready: number;
  drafts: number;
  hasMoreDrafts: boolean;
};

export type StageBarItem = {
  id: string;
  label: string;
  count: number;
  colorVar: "--chart-1" | "--chart-2" | "--chart-3" | "--chart-5";
  href: Route;
};

export type ConsoleChartsProps = {
  loading: boolean;
  canProduct: boolean;
  canSupplier: boolean;
  canProductionOrder: boolean;
  canSalesOrder: boolean;
  materialBars?: MaterialBarItem[];
  dishSummary?: DishSummary | null;
  supplierOverview?: SupplierOverview;
  orderSummary?: StageBarItem[] | null;
  salesSummary?: StageBarItem[] | null;
};

const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function DonutChart({
  title,
  subtitle,
  centerLabel,
  centerValue,
  emptyText,
  segments,
  footer,
}: DonutChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let cumulative = 0;

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      {total === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative flex size-28 shrink-0 items-center justify-center">
            <svg viewBox="0 0 120 120" className="size-28 shrink-0 -rotate-90" role="img" aria-label={title}>
              <circle cx="60" cy="60" r={RING_RADIUS} fill="none" strokeWidth="14" className="stroke-muted" />
              {segments.map(segment => {
                if (segment.value <= 0) return null;
                const length = (segment.value / total) * RING_CIRCUMFERENCE;
                const offset = cumulative;
                cumulative += length;
                return (
                  <circle
                    key={segment.id}
                    cx="60"
                    cy="60"
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth="14"
                    strokeDasharray={`${length} ${RING_CIRCUMFERENCE}`}
                    strokeDashoffset={-offset}
                    style={{ stroke: `var(${segment.colorVar})` }}
                  />
                );
              })}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
              <span className="text-xl font-semibold tabular-nums">{centerValue}</span>
              <span className="text-xs text-muted-foreground">{centerLabel}</span>
            </div>
          </div>
          <ul className="w-full min-w-0 flex-1 space-y-1.5">
            {segments.map(segment => (
              <li key={segment.id}>
                <Link
                  href={segment.href}
                  className="flex items-center justify-between gap-2 rounded-sm px-2 py-1 text-xs transition-colors hover:bg-muted/60"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: `var(${segment.colorVar})` }}
                    />
                    <span className="truncate">{segment.label}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {segment.value}
                    {segment.plus ? "+" : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {footer && <p className="mt-3 border-t pt-2.5 text-xs text-muted-foreground tabular-nums">{footer}</p>}
    </Card>
  );
}

function StageBarCard({ title, items }: { title: string; items: StageBarItem[] }) {
  const maxCount = Math.max(1, ...items.map(item => item.count));
  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-3 space-y-1">
        {items.map(item => {
          const widthPct = (item.count / maxCount) * 100;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-2 rounded-sm px-1.5 py-1 text-xs transition-colors hover:bg-muted/60"
            >
              <span className="truncate font-medium">{item.label}</span>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                {widthPct > 0 && (
                  <span style={{ width: `${widthPct}%`, backgroundColor: `var(${item.colorVar})` }} />
                )}
              </div>
              <span className="tabular-nums text-muted-foreground">{item.count}</span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

export function ConsoleCharts({
  loading,
  canProduct,
  canSupplier,
  canProductionOrder,
  canSalesOrder,
  materialBars = [],
  dishSummary,
  supplierOverview,
  orderSummary,
  salesSummary,
}: ConsoleChartsProps) {
  const hasAnyChartPermission = canProduct || canSupplier || canProductionOrder || canSalesOrder;
  if (!hasAnyChartPermission) return null;

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2" aria-label="Đang tải biểu đồ tổng quan">
        {Array.from({ length: 2 }, (_, index) => (
          <Card key={index} className="p-4">
            <Skeleton className="h-4 w-44" />
            <div className="mt-4 space-y-2.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const showProductSection = canProduct && (materialBars.length > 0 || Boolean(dishSummary));
  const showSupplierSection = canSupplier && Boolean(supplierOverview);
  const showBranchStageSection = !canProduct && Boolean(orderSummary?.length || salesSummary?.length);

  if (!showProductSection && !showSupplierSection && !showBranchStageSection) return null;

  const maxMaterialTotal = Math.max(1, ...materialBars.map(item => item.active + item.draft));

  const supplierSegments: DonutSegment[] = supplierOverview
    ? (() => {
        const withPrice = supplierOverview.price_coverage.suppliers_with_active_price;
        const expiring = Math.min(supplierOverview.agreements.expiring_within_14_days, withPrice);
        const stable = Math.max(0, withPrice - expiring);
        return [
          {
            id: "stable",
            label: "Có giá ổn định",
            value: stable,
            colorVar: "--chart-1",
            href: "/inventory/suppliers?f.priced=today" as Route,
          },
          {
            id: "expiring",
            label: "Sắp hết hạn 14 ngày",
            value: expiring,
            colorVar: "--chart-5",
            href: "/inventory/suppliers?f.attention=expiring" as Route,
          },
          {
            id: "without-price",
            label: "Chưa có bảng giá",
            value: supplierOverview.price_coverage.suppliers_without_active_price,
            colorVar: "--chart-3",
            href: "/inventory/suppliers?f.attention=without_price" as Route,
          },
          {
            id: "suspended",
            label: "Ngừng hợp tác",
            value: supplierOverview.suppliers.suspended,
            colorVar: "--chart-4",
            href: "/inventory/suppliers?f.status=SUSPENDED" as Route,
          },
        ];
      })()
    : [];

  return (
    <div className="space-y-4">
      {showProductSection && (
        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="p-4 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Phân bổ nguyên liệu theo nhóm</h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ backgroundColor: "var(--chart-1)" }} />
                  Đang dùng
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ backgroundColor: "var(--chart-5)" }} />
                  Nháp
                </span>
              </div>
            </div>
            {materialBars.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Chưa có nguyên liệu nào trong danh mục.</p>
            ) : (
              <div className="mt-3 space-y-0.5">
                {materialBars.map(item => {
                  const total = item.active + item.draft;
                  const activePct = (item.active / maxMaterialTotal) * 100;
                  const draftPct = (item.draft / maxMaterialTotal) * 100;
                  return (
                    <Link
                      key={item.code}
                      href={`/production/materials?loai=${encodeURIComponent(item.code)}` as Route}
                      className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-2 rounded-sm px-1.5 py-1 text-xs transition-colors hover:bg-muted/60"
                    >
                      <span className="truncate font-medium">{item.label}</span>
                      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                        {activePct > 0 && (
                          <span style={{ width: `${activePct}%`, backgroundColor: "var(--chart-1)" }} />
                        )}
                        {draftPct > 0 && (
                          <span style={{ width: `${draftPct}%`, backgroundColor: "var(--chart-5)" }} />
                        )}
                      </div>
                      <span className="tabular-nums text-muted-foreground">{total}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

          {dishSummary && (
            <div className="lg:col-span-2">
              <DonutChart
                title="Tiến độ món ăn & mở bán"
                centerLabel="Món"
                centerValue={dishSummary.selling + dishSummary.ready + dishSummary.drafts}
                emptyText="Chưa có món ăn nào."
                segments={[
                  {
                    id: "selling",
                    label: "Đang mở bán",
                    value: dishSummary.selling,
                    colorVar: "--chart-1",
                    href: "/sales/products" as Route,
                  },
                  {
                    id: "ready",
                    label: "Đã hoàn tất công thức",
                    value: dishSummary.ready,
                    colorVar: "--chart-2",
                    href: "/production/dishes" as Route,
                  },
                  {
                    id: "drafts",
                    label: "Nháp đang soạn",
                    value: dishSummary.drafts,
                    plus: dishSummary.hasMoreDrafts,
                    colorVar: "--chart-5",
                    href: "/production/dishes?tab=drafts" as Route,
                  },
                ]}
              />
            </div>
          )}
        </div>
      )}

      {showSupplierSection && supplierOverview && (
        <DonutChart
          title="Độ phủ bảng giá nhà cung cấp"
          centerLabel="NCC"
          centerValue={supplierSegments.reduce((sum, segment) => sum + segment.value, 0)}
          emptyText="Chưa có nhà cung cấp nào."
          segments={supplierSegments}
          footer={`${supplierOverview.price_coverage.materials_priced} nguyên liệu đã có giá · ${supplierOverview.receipts.last_30_days} phiếu nhập 30 ngày qua`}
        />
      )}

      {showBranchStageSection && (
        <div className="grid gap-4 lg:grid-cols-2">
          {orderSummary && orderSummary.length > 0 && (
            <StageBarCard title="Tiến độ lệnh sản xuất tại chi nhánh" items={orderSummary} />
          )}
          {salesSummary && salesSummary.length > 0 && (
            <StageBarCard title="Tiến độ đơn hàng tại chi nhánh" items={salesSummary} />
          )}
        </div>
      )}
    </div>
  );
}
