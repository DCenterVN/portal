"use client";

import { RefreshCw } from "lucide-react";
import { ErrorState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { PageHeading } from "@/components/patterns/page-heading";
import { StatusBadge } from "@/components/patterns/status-badge";
import { DataTable } from "@/components/patterns/data-table/data-table";
import type { DataTableColumn, ToolbarConfig } from "@/components/patterns/data-table/types";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page";
import { formatQuantity } from "@/lib/stock-transfer";
import { cn } from "@/lib/utils";
import { InventoryFlowBar } from "../inventory-flow-bar";
import { StockLotSheet } from "./stock-lot-sheet";
import { stockGroupLabels, stockIssueMeta, type StockRowModel } from "./stock-model";
import type { StockGroupFilter, StockHealthFilter, useStockOverview } from "./use-stock-overview";

type Props = ReturnType<typeof useStockOverview>;

const GROUP_OPTIONS: { value: StockGroupFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "RAW", label: "Nguyên liệu" },
  { value: "SEMI", label: "Bán thành phẩm" },
  { value: "FINISHED", label: "Thành phẩm món" },
];

const STATUS_FILTER_OPTIONS: { value: Exclude<StockHealthFilter, "ALL">; label: string }[] = [
  { value: "ATTENTION", label: "Cần xử lý" },
  { value: "UNUSABLE", label: "Có hàng không dùng được" },
  { value: "EXPIRING_SOON", label: "Sắp hết hạn (3 ngày)" },
  { value: "PENDING_QC", label: "Chờ kiểm đầu vào" },
  { value: "OK", label: "Đạt chuẩn" },
  { value: "EMPTY", label: "Hết tồn (0)" },
];

function KpiCard({ title, count, hint, accent, active, onSelect }: {
  title: string; count: number; hint: string; accent: string; active: boolean; onSelect: () => void;
}) {
  return (
    <div
      role="button" tabIndex={0} aria-pressed={active} onClick={onSelect}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      className={cn(
        "cursor-pointer rounded-lg border border-t-[3px] bg-card p-4 transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        accent, active && "ring-2 ring-primary/40",
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{count}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

const columns: DataTableColumn<StockRowModel>[] = [
  {
    id: "name", header: "Mặt hàng", sortable: true, sortValue: row => row.name,
    cell: row => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.name}</p>
        <p className="text-xs text-muted-foreground">
          {stockGroupLabels[row.group]}{row.skuCode ? <span className="font-mono"> · {row.skuCode}</span> : null}
        </p>
      </div>
    ),
  },
  {
    id: "usable", header: "Dùng được", align: "right", sortable: true, sortValue: row => row.usable,
    cell: row => (
      <span className={cn("font-semibold tabular-nums", row.usable <= 0 && row.onHand > 0 && "text-destructive")}>
        {formatQuantity(row.usable, row.uom)}
      </span>
    ),
  },
  {
    id: "on_hand", header: "Tổng tồn sổ", align: "right", sortable: true, sortValue: row => row.onHand,
    cell: row => (
      <div className="text-right tabular-nums">
        <p>{formatQuantity(row.onHand, row.uom)}</p>
        {(row.reserved > 0 || row.pendingQcQty > 0) && (
          <p className="text-xs text-muted-foreground">
            {[row.reserved > 0 ? `Giữ ${formatQuantity(row.reserved, row.uom)}` : "", row.pendingQcQty > 0 ? `+${formatQuantity(row.pendingQcQty, row.uom)} chờ QC` : ""].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    ),
  },
  {
    id: "status", header: "Tình trạng & hạn dùng", sortable: true, sortValue: row => stockIssueMeta[row.issueStatus].priority,
    cell: row => {
      const badge = stockIssueMeta[row.issueStatus];
      return (
        <div className="min-w-0">
          <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
          <p className="mt-1 whitespace-normal text-xs text-muted-foreground">{row.issueSummary}</p>
        </div>
      );
    },
  },
];

export function StockOverviewView(props: Props) {
  if (!props.canReadStock) return <ErrorState denied title="Bạn không có quyền xem tồn kho" />;

  const toolbar: ToolbarConfig = {
    search: { value: props.query, onChange: props.setQuery, placeholder: "Tìm tên hàng, mã hàng hoặc số lô…", label: "Tìm mặt hàng tồn kho" },
    filters: [{
      id: "status", title: "Tình trạng", options: STATUS_FILTER_OPTIONS,
      selected: props.healthFilter === "ALL" ? [] : [props.healthFilter], single: true,
      onChange: values => props.setHealthFilter((values[0] as StockHealthFilter | undefined) ?? "ALL"),
    }],
    active: Boolean(props.query || props.groupFilter !== "ALL" || props.healthFilter !== "ALL"),
    onClear: props.clearFilters,
    below: (
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Lọc theo loại mặt hàng">
        {GROUP_OPTIONS.map(option => (
          <Button key={option.value} type="button" size="sm" variant={props.groupFilter === option.value ? "default" : "outline"} onClick={() => props.setGroupFilter(option.value)}>
            {option.label}
          </Button>
        ))}
        {props.summary.attentionItems > 0 && (
          <Button type="button" size="sm" variant={props.healthFilter === "ATTENTION" ? "default" : "outline"} onClick={() => props.setHealthFilter(props.healthFilter === "ATTENTION" ? "ALL" : "ATTENTION")}>
            Cần xử lý ({props.summary.attentionItems})
          </Button>
        )}
      </div>
    ),
  };

  return (
    <PageShell>
      <PageHeading
        className="mb-4"
        title="Tồn kho & hạn dùng"
        description="Theo dõi lượng dùng được thực tế, hàng đang giữ cho sản xuất hoặc đơn hàng, và lô sắp hết hạn tại chi nhánh."
        actions={
          <Button type="button" size="sm" variant="outline" disabled={props.refreshing} onClick={props.reload}>
            <RefreshCw className={cn("mr-1.5 size-4", props.refreshing && "animate-spin")} aria-hidden="true" />
            Làm mới
          </Button>
        }
      />

      <InventoryFlowBar current="stock" />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <KpiCard
          title="Mặt hàng đang có tồn"
          count={props.summary.totalActiveItems}
          hint="Còn tồn kho hoặc đang chờ kiểm đầu vào"
          accent="border-t-primary"
          active={props.healthFilter === "ALL"}
          onSelect={() => props.setHealthFilter("ALL")}
        />
        <KpiCard
          title="Sắp hết hạn (trong 3 ngày)"
          count={props.summary.expiringSoonItems}
          hint="Lô đạt chuẩn cần ưu tiên xuất theo FEFO"
          accent="border-t-warning"
          active={props.healthFilter === "EXPIRING_SOON"}
          onSelect={() => props.setHealthFilter(props.healthFilter === "EXPIRING_SOON" ? "ALL" : "EXPIRING_SOON")}
        />
        <KpiCard
          title="Cần xử lý (hết hạn / chờ QC)"
          count={props.summary.attentionItems}
          hint="Có hàng không dùng được hoặc lô mới nhập chờ duyệt"
          accent="border-t-destructive"
          active={props.healthFilter === "ATTENTION"}
          onSelect={() => props.setHealthFilter(props.healthFilter === "ATTENTION" ? "ALL" : "ATTENTION")}
        />
      </div>

      {props.canReadLots && props.lotsError && (
        <InlineAlert className="mb-4">{props.lotsError}</InlineAlert>
      )}

      <DataTable<StockRowModel>
        mode="client"
        columns={columns}
        rows={props.rows}
        rowId={row => row.skuRef}
        rowLabel={row => row.name}
        status={props.loading ? "loading" : props.error ? "error" : "ready"}
        error={props.error}
        onRetry={props.reload}
        toolbar={toolbar}
        storageKey="inventory-stock-overview"
        paginationLabel="Phân trang tồn kho"
        onRowOpen={row => props.selectSku(row.skuRef)}
        empty={{
          title: "Chưa có mặt hàng tồn kho phù hợp",
          description: "Thử bỏ bộ lọc hiện tại hoặc nhập thêm hàng ở Bước 1.",
        }}
      />

      <StockLotSheet
        row={props.selectedRow}
        canReadLots={props.canReadLots}
        canReadQc={props.canReadQc}
        lotsError={props.lotsError}
        onClose={() => props.selectSku(null)}
      />
    </PageShell>
  );
}
