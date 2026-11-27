import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/patterns/status-badge";
import type { DataTableColumn } from "@/components/patterns/data-table/types";
import { formatDate } from "@/lib/format-date";
import { formatQuantity } from "@/lib/stock-transfer";
import { cn } from "@/lib/utils";
import { formatExpiryDelta, stockGroupLabels, stockIssueMeta, type StockRowModel } from "./stock-model";

export const stockColumns: DataTableColumn<StockRowModel>[] = [
  {
    id: "name",
    header: "Mặt hàng",
    sortable: true,
    sortValue: row => row.name,
    cell: row => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.name}</p>
        <p className="text-xs text-muted-foreground">
          {stockGroupLabels[row.group]}
          {row.skuCode ? <span className="font-mono"> · {row.skuCode}</span> : null}
        </p>
      </div>
    ),
  },
  {
    id: "usable",
    header: "Dùng được",
    align: "right",
    sortable: true,
    sortValue: row => row.usable,
    cell: row => (
      <span className={cn("font-semibold tabular-nums", row.usable <= 0 && row.onHand > 0 && "text-destructive")}>
        {formatQuantity(row.usable, row.uom)}
      </span>
    ),
  },
  {
    id: "on_hand",
    header: "Tổng tồn",
    align: "right",
    hideBelow: "md",
    sortable: true,
    sortValue: row => row.onHand,
    cell: row => (
      <div className="text-right tabular-nums">
        <p>{formatQuantity(row.onHand, row.uom)}</p>
        {(row.reserved > 0 || row.sellable > 0) && (
          <p className="text-xs text-muted-foreground">
            {[
              row.reserved > 0 ? `Giữ ${formatQuantity(row.reserved, row.uom)}` : "",
              row.sellable > 0 ? `Kệ ${formatQuantity(row.sellable, row.uom)}` : "",
            ].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    ),
  },
  {
    id: "nearest_expiry",
    header: "Hạn gần nhất",
    hideBelow: "md",
    sortable: true,
    sortValue: row => (row.nearestExpiresAt ? Date.parse(row.nearestExpiresAt) : Number.MAX_SAFE_INTEGER),
    cell: row => {
      if (!row.nearestExpiresAt) return <span className="text-muted-foreground">—</span>;
      const isExpired = row.expiredQty > 0;
      const isSoon = !isExpired && row.expiringSoonQty > 0;
      return (
        <div className="tabular-nums">
          <p className="text-sm">{formatDate(row.nearestExpiresAt)}</p>
          <p
            className={cn(
              "text-xs text-muted-foreground",
              isExpired && "font-medium text-destructive",
              isSoon && "font-medium text-warning",
            )}
          >
            {formatExpiryDelta(row.nearestExpiresAt)}
          </p>
        </div>
      );
    },
  },
  {
    id: "status",
    header: "Trạng thái",
    sortable: true,
    sortValue: row => stockIssueMeta[row.issueStatus].priority,
    cell: row => {
      const badge = stockIssueMeta[row.issueStatus];
      return (
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
            {row.shortDetail ? (
              <p className="mt-1 whitespace-normal break-words text-xs text-muted-foreground">{row.shortDetail}</p>
            ) : null}
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </div>
      );
    },
  },
];
