"use client";

import { PageShell } from "@/components/ui/page";
import { DataTable } from "@/components/patterns/data-table/data-table";
import type { DataTableColumn, DataTablePagination, ToolbarConfig } from "@/components/patterns/data-table/types";
import { PageHeading } from "@/components/patterns/page-heading";
import { ErrorState } from "@/components/patterns/empty-state";
import { StatusBadge } from "@/components/patterns/status-badge";
import type { InboundLot } from "@/lib/api/inbound-qc";
import { formatDate } from "@/lib/format-date";
import { LotLocation } from "./lot-location";
import { LotQcPanel } from "./lot-qc-panel";
import { DEFAULT_LOT_STATUS } from "./inbound-qc-table";
import { lotStatusLabel, lotStatusTone } from "./qc-steps";
import { useInboundQc, type InboundLotsInitial } from "./use-inbound-qc";

const filters = ["RECEIVED", "UNDER_QC", "APPROVED", "QUARANTINED"].map(value => ({ value, label: lotStatusLabel[value] }));

export function InboundQcView({ focusLot = "", initial }: { focusLot?: string; initial?: InboundLotsInitial }) {
  const model = useInboundQc(focusLot, initial);
  const { url, page, rows, loading, error } = model;
  if (!model.allowed) return <ErrorState denied title="Bạn cần quyền kiểm chất lượng đầu vào" />;
  if (model.selected) return <PageShell><PageHeading title="Kiểm đầu vào" description="Làm lần lượt từng bước để duyệt hoặc từ chối lô nguyên liệu." /><LotQcPanel key={model.selected.id} source={model.selected} name={model.nameOf(model.selected)} onBack={model.back} /></PageShell>;
  const { state } = url;
  const columns: DataTableColumn<InboundLot>[] = [
    { id: "material", header: "Nguyên liệu", cell: lot => <span className="font-semibold">{model.nameOf(lot)}</span> },
    { id: "code", header: "Mã lô", cell: lot => <span className="break-all">{lot.supplier_lot_code}</span> },
    { id: "quantity", header: "Số lượng", align: "right", cell: lot => `${lot.initial_quantity.toLocaleString("vi-VN")} ${lot.uom}` },
    { id: "expires", header: "Hạn dùng", cell: lot => formatDate(lot.expires_at) },
    { id: "location", header: "Vị trí", cell: lot => <LotLocation code={lot.storage_location_code} catalog={model.catalog} /> },
    { id: "status", header: "Trạng thái", cell: lot => <StatusBadge tone={lotStatusTone[lot.status] ?? "neutral"}>{lotStatusLabel[lot.status] ?? "Đang xử lý"}</StatusBadge> },
  ];
  const toolbar: ToolbarConfig = {
    search: { value: url.query, onChange: url.setQuery, placeholder: "Mã lô", label: "Tìm theo mã lô" },
    filters: [{ id: "status", title: "Trạng thái", single: true, options: filters, selected: [state.filters.status?.[0] || DEFAULT_LOT_STATUS], onChange: values => { const next = values[0]; url.setFilter("status", !next || next === DEFAULT_LOT_STATUS ? [] : [next]); } }],
    active: Boolean(state.q || state.filters.status), onClear: url.clear,
  };
  const pagination: DataTablePagination = { kind: "page", page: state.page, pageSize: state.pageSize, pageSizes: [10, 20, 50], count: rows?.length ?? 0, total: page?.total, busy: loading, onPage: url.setPage, onPageSize: url.setPageSize };
  return <PageShell>
    <PageHeading title="Kiểm đầu vào" description="Lô nguyên liệu vừa nhận cần kiểm trước khi vào kho và tính giá vốn." />
    <DataTable<InboundLot>
      mode="server" columns={columns} rows={rows} rowId={lot => lot.id} rowLabel={lot => lot.supplier_lot_code} onRowOpen={model.select}
      status={loading && !rows ? "loading" : error && !rows ? "error" : "ready"} error={error} onRetry={model.reload}
      toolbar={toolbar} storageKey="inventory-inbound-qc" pagination={pagination} paginationLabel="Phân trang lô nguyên liệu"
      empty={{ title: "Không có lô nào ở trạng thái này", description: "Thử mã lô khác hoặc đổi trạng thái." }}
    />
  </PageShell>;
}
