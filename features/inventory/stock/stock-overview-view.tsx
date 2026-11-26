"use client";

import { RefreshCw } from "lucide-react";
import { ErrorState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { PageHeading } from "@/components/patterns/page-heading";
import { DataTable } from "@/components/patterns/data-table/data-table";
import type { ToolbarConfig } from "@/components/patterns/data-table/types";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page";
import { cn } from "@/lib/utils";
import { stockColumns } from "./stock-columns";
import { StockLotSheet } from "./stock-lot-sheet";
import type { StockRowModel } from "./stock-model";
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
  { value: "UNUSABLE", label: "Không dùng được" },
  { value: "EXPIRING_SOON", label: "Sắp hết hạn (3 ngày)" },
  { value: "PENDING_QC", label: "Chờ kiểm QC" },
  { value: "OK", label: "Đạt chuẩn" },
  { value: "EMPTY", label: "Hết tồn (0)" },
];

function KpiCard({
  title,
  count,
  hint,
  tone = "neutral",
  active,
  onSelect,
}: {
  title: string;
  count: number;
  hint: string;
  tone?: "neutral" | "warning" | "danger";
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onClick={onSelect}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "cursor-pointer rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        active && "border-t-[3px] border-t-primary bg-muted/20",
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          count > 0 && tone === "danger" && "text-destructive",
          count > 0 && tone === "warning" && "text-warning",
        )}
      >
        {count}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function StockOverviewView(props: Props) {
  if (!props.canReadStock) return <ErrorState denied title="Bạn không có quyền xem tồn kho" />;

  const activeRows = props.allRows.filter(row => row.hasStock);
  const groupCounts: Record<StockGroupFilter, number> = {
    ALL: activeRows.length,
    RAW: activeRows.filter(row => row.group === "RAW").length,
    SEMI: activeRows.filter(row => row.group === "SEMI").length,
    FINISHED: activeRows.filter(row => row.group === "FINISHED").length,
  };

  const toolbar: ToolbarConfig = {
    search: {
      value: props.query,
      onChange: props.setQuery,
      placeholder: "Tìm tên hàng, mã SKU hoặc số lô…",
      label: "Tìm mặt hàng tồn kho",
    },
    filters: [{
      id: "status",
      title: "Trạng thái",
      options: STATUS_FILTER_OPTIONS,
      selected: props.healthFilter === "ALL" ? [] : [props.healthFilter],
      single: true,
      onChange: values => props.setHealthFilter((values[0] as StockHealthFilter | undefined) ?? "ALL"),
    }],
    active: Boolean(props.query || props.groupFilter !== "ALL" || props.healthFilter !== "ALL"),
    onClear: props.clearFilters,
    below: (
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Lọc theo loại mặt hàng">
        {GROUP_OPTIONS.map(option => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={props.groupFilter === option.value ? "secondary" : "outline"}
            onClick={() => props.setGroupFilter(option.value)}
          >
            {option.label} ({groupCounts[option.value]})
          </Button>
        ))}
      </div>
    ),
  };

  return (
    <PageShell>
      <PageHeading
        className="mb-5"
        title="Tồn kho & hạn dùng"
        description="Theo dõi lượng dùng được thực tế, hàng đang giữ lệnh và lô sắp hết hạn tại chi nhánh."
        actions={
          <Button type="button" size="sm" variant="outline" disabled={props.refreshing} onClick={props.reload}>
            <RefreshCw className={cn("mr-1.5 size-4", props.refreshing && "animate-spin")} aria-hidden="true" />
            Làm mới
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          title="Đang có tồn"
          count={props.summary.totalActiveItems}
          hint="Mặt hàng còn tồn hoặc chờ QC"
          active={props.healthFilter === "ALL"}
          onSelect={() => props.setHealthFilter("ALL")}
        />
        <KpiCard
          title="Sắp hết hạn (3 ngày)"
          count={props.summary.expiringSoonItems}
          hint="Lô cần ưu tiên xuất FEFO"
          tone="warning"
          active={props.healthFilter === "EXPIRING_SOON"}
          onSelect={() => props.setHealthFilter(props.healthFilter === "EXPIRING_SOON" ? "ALL" : "EXPIRING_SOON")}
        />
        <KpiCard
          title="Cần xử lý"
          count={props.summary.attentionItems}
          hint="Hết hạn, cách ly hoặc chờ QC"
          tone="danger"
          active={props.healthFilter === "ATTENTION"}
          onSelect={() => props.setHealthFilter(props.healthFilter === "ATTENTION" ? "ALL" : "ATTENTION")}
        />
      </div>

      {props.canReadLots && props.lotsError && (
        <InlineAlert className="mb-4">{props.lotsError}</InlineAlert>
      )}

      <DataTable<StockRowModel>
        mode="client"
        columns={stockColumns}
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
