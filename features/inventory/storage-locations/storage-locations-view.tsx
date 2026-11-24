"use client";

import { useState } from "react";
import { Pencil, Plus, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { DataTable } from "@/components/patterns/data-table/data-table";
import type { DataTableColumn, DataTablePagination, ToolbarConfig } from "@/components/patterns/data-table/types";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { ErrorState } from "@/components/patterns/empty-state";
import { PageHeading } from "@/components/patterns/page-heading";
import { StatusBadge } from "@/components/patterns/status-badge";
import { ZoneBadge } from "./zone-badge";
import { createStorageLocation, updateStorageLocation, zoneLabel, type StorageLocation } from "@/lib/api/storage-locations";
import { StorageLocationForm, type LocationFormValues } from "./storage-location-form";
import { type useStorageLocations } from "./use-storage-locations";

type Props = ReturnType<typeof useStorageLocations>;
type Editing = { mode: "create" } | { mode: "edit"; location: StorageLocation } | null;

const zoneOptions = Object.entries(zoneLabel).map(([value, label]) => ({ value, label }));
const statusOptions = [{ value: "ACTIVE", label: "Đang dùng" }, { value: "INACTIVE", label: "Đã tắt" }];

const columns: DataTableColumn<StorageLocation>[] = [
  { id: "code", header: "Mã", cell: location => <span className="font-semibold">{location.code}</span> },
  { id: "name", header: "Tên", cell: location => location.name },
  { id: "zone", header: "Khu", cell: location => <ZoneBadge zone={location.zone} /> },
  { id: "status", header: "Trạng thái", cell: location => <StatusBadge tone={location.active ? "success" : "neutral"}>{location.active ? "Đang dùng" : "Đã tắt"}</StatusBadge> },
];

export function StorageLocationsView({ can, read, url, page, rows, loading, error, reload }: Props) {
  const [editing, setEditing] = useState<Editing>(null);
  const [toggling, setToggling] = useState<StorageLocation | null>(null);
  const [busy, setBusy] = useState(false);
  if (!read) return <ErrorState denied title="Bạn không có quyền xem vị trí kho" />;
  const { state } = url;
  const canUpdate = can("inventory:lot:update");
  const save = async (values: LocationFormValues) => {
    if (editing?.mode === "edit") await updateStorageLocation(editing.location.id, { name: values.name, zone: values.zone });
    else await createStorageLocation(values);
    toast.success(editing?.mode === "edit" ? "Đã lưu vị trí kho" : "Đã thêm vị trí kho");
    setEditing(null);
    reload();
  };
  const toggle = async () => {
    if (!toggling) return;
    setBusy(true);
    try {
      await updateStorageLocation(toggling.id, { active: !toggling.active });
      toast.success(toggling.active ? "Đã tắt vị trí kho" : "Đã bật vị trí kho");
      setToggling(null);
      reload();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Không đổi được trạng thái. Hãy thử lại.");
    } finally { setBusy(false); }
  };
  const toolbar: ToolbarConfig = {
    search: { value: url.query, onChange: url.setQuery, placeholder: "Mã hoặc tên vị trí", label: "Tìm vị trí kho" },
    filters: [
      { id: "zone", title: "Khu", options: zoneOptions, selected: state.filters.zone ?? [], onChange: values => url.setFilter("zone", values), single: true },
      { id: "status", title: "Trạng thái", options: statusOptions, selected: state.filters.status ?? [], onChange: values => url.setFilter("status", values), single: true },
    ],
    active: Boolean(state.q || Object.keys(state.filters).length), onClear: url.clear,
    primary: canUpdate ? <Button className="shrink-0" onClick={() => setEditing({ mode: "create" })}><Plus aria-hidden="true" />Thêm vị trí</Button> : undefined,
  };
  const pagination: DataTablePagination = { kind: "page", page: state.page, pageSize: state.pageSize, pageSizes: [10, 20, 50], count: rows?.length ?? 0, total: page?.total, busy: loading, onPage: url.setPage, onPageSize: url.setPageSize };
  return <PageShell>
    <PageHeading title="Vị trí kho" description="Danh mục nơi cất lô nguyên liệu của chi nhánh. Bước Gán vị trí khi kiểm đầu vào chỉ chọn trong danh mục này." />
    <DataTable<StorageLocation>
      mode="server" columns={columns} rows={rows} rowId={location => location.id} rowLabel={location => location.code}
      status={loading && !rows ? "loading" : error && !rows ? "error" : "ready"} error={error} onRetry={reload}
      toolbar={toolbar} storageKey="inventory-storage-locations" pagination={pagination} paginationLabel="Phân trang vị trí kho"
      empty={{ title: "Chưa có vị trí kho phù hợp", description: "Thử mã hoặc bộ lọc khác, hoặc thêm vị trí mới." }}
      rowActions={canUpdate ? location => [
        { label: "Sửa", icon: Pencil, onSelect: () => setEditing({ mode: "edit", location }) },
        { label: location.active ? "Tắt" : "Bật", icon: location.active ? PowerOff : Power, danger: location.active, onSelect: () => setToggling(location) },
      ] : undefined}
    />
    <Sheet open={editing !== null} onOpenChange={open => { if (!open) setEditing(null); }}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[26rem]">
        <SheetHeader>
          <SheetTitle>{editing?.mode === "edit" ? "Sửa vị trí kho" : "Thêm vị trí kho"}</SheetTitle>
          <SheetDescription>{editing?.mode === "edit" ? "Đổi tên hoặc khu. Mã giữ nguyên." : "Nhập mã, tên và khu của vị trí."}</SheetDescription>
        </SheetHeader>
        {editing && <div className="px-4 pb-4"><StorageLocationForm key={editing.mode === "edit" ? editing.location.id : "new"} submitLabel={editing.mode === "edit" ? "Lưu" : "Thêm vị trí"}
          initial={editing.mode === "edit" ? { code: editing.location.code, name: editing.location.name, zone: editing.location.zone as LocationFormValues["zone"] } : undefined}
          onSubmit={save} onCancel={() => setEditing(null)} /></div>}
      </SheetContent>
    </Sheet>
    <ConfirmDialog open={toggling !== null} onOpenChange={open => { if (!open) setToggling(null); }} busy={busy} danger={toggling?.active}
      title={toggling?.active ? `Tắt vị trí ${toggling.code}?` : `Bật lại vị trí ${toggling?.code ?? ""}?`}
      description={toggling?.active ? "Vị trí đã tắt không còn hiện khi gán vị trí cho lô mới. Các lô đang ở đó giữ nguyên." : "Vị trí sẽ hiện lại khi gán vị trí cho lô."}
      confirmLabel={toggling?.active ? "Tắt vị trí" : "Bật vị trí"} onConfirm={() => void toggle()} />
  </PageShell>;
}
