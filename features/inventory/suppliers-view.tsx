"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page";
import { DataTable } from "@/components/patterns/data-table/data-table";
import type { DataTableColumn, DataTablePagination, ToolbarConfig } from "@/components/patterns/data-table/types";
import { PageHeading } from "@/components/patterns/page-heading";
import { ErrorState } from "@/components/patterns/empty-state";
import type { Supplier } from "@/lib/api/suppliers";
import { SupplierGroupBar } from "./supplier-group-bar";
import { SupplierSectionTabs } from "./supplier-section-tabs";
import { SupplierContactLine, SupplierPhoto, SupplierStatusBadge } from "./supplier-detail-view";
import { SupplierMaterialsPanel } from "./supplier-materials-panel";
import { supplierHref } from "./supplier-routes";
import { type useSuppliers } from "./use-suppliers";

type SuppliersViewProps = ReturnType<typeof useSuppliers>;

const statusOptions = [{ value: "ACTIVE", label: "Đang hợp tác" }, { value: "SUSPENDED", label: "Ngừng hợp tác" }];
const dash = <span aria-label="Chưa có" className="text-muted-foreground">—</span>;

export function groupLabels(supplier: Supplier) {
  const names = (supplier.material_category_labels ?? []).map(label => label.name);
  return { shown: names.slice(0, 3), more: Math.max(0, names.length - 3) };
}

const columns: DataTableColumn<Supplier>[] = [
  { id: "name", header: "Tên nhà cung cấp", sortable: true, cell: supplier => <div className="flex min-w-0 items-center gap-3">
    <SupplierPhoto name={supplier.name} url="" onError={() => {}} />
    <span className="min-w-0"><span className="block font-semibold">{supplier.name}</span><span className="block break-all text-xs text-muted-foreground md:hidden">{supplier.code}</span></span>
    {supplier.status !== "ACTIVE" && <SupplierStatusBadge status={supplier.status} />}
  </div> },
  { id: "code", header: "Mã", sortable: true, hideBelow: "md", className: "text-sm", cell: supplier => <span className="break-all">{supplier.code}</span> },
  { id: "groups", header: "Nhóm nguyên liệu", hideable: true, hideBelow: "md", className: "text-sm whitespace-normal", cell: supplier => {
    const { shown, more } = groupLabels(supplier);
    return shown.length ? <span>{shown.join(", ")}{more > 0 && <span className="text-muted-foreground"> +{more}</span>}</span> : dash;
  } },
  { id: "contact", header: "Người liên hệ", hideable: true, hideBelow: "md", className: "text-xs text-muted-foreground", cell: supplier => supplier.contact_name || supplier.contact_phone ? <SupplierContactLine supplier={supplier} /> : dash },
];

export function SuppliersView({ can, read, url, page, rows, categories, loading, error, setRevision, expanded, toggle }: SuppliersViewProps) {
  if (!read) return <ErrorState denied title="Bạn không có quyền xem nhà cung cấp" />;
  const { state } = url;
  const total = page?.total;
  const filtered = Boolean(state.q || Object.keys(state.filters).length);
  const status = loading && !rows ? "loading" : error && !rows ? "error" : "ready";
  const toolbar: ToolbarConfig = {
    search: { value: url.query, onChange: url.setQuery, placeholder: "Tên nhà cung cấp, mã", label: "Tìm nhà cung cấp" },
    filters: [{ id: "status", title: "Trạng thái", options: statusOptions, selected: state.filters.status ?? [], onChange: values => url.setFilter("status", values), single: true }],
    active: filtered, onClear: url.clear,
    below: <SupplierGroupBar categories={categories} selected={state.filters.category?.[0] ?? ""} onSelect={code => url.setFilter("category", code ? [code] : [])} />,
    primary: can("inventory:supplier:create") ? <Button asChild className="shrink-0"><Link href={supplierHref.create}>Thêm nhà cung cấp</Link></Button> : undefined,
  };
  const pagination: DataTablePagination = {
    kind: "page", page: state.page, pageSize: state.pageSize, pageSizes: [10, 20, 50], count: rows?.length ?? 0, total, busy: loading,
    onPage: url.setPage, onPageSize: url.setPageSize,
  };
  return <PageShell>
    <PageHeading title="Nhà cung cấp" description="Hồ sơ, bảng giá tham chiếu và các lần nhập hàng." />
    <SupplierSectionTabs />
    <DataTable<Supplier>
      mode="server" columns={columns} rows={rows} rowId={supplier => supplier.id} rowLabel={supplier => supplier.name}
      status={status} error={error} onRetry={() => setRevision(value => value + 1)} toolbar={toolbar} storageKey="inventory-suppliers"
      sort={state.sort} onSortChange={url.setSort} pagination={pagination} paginationLabel="Phân trang nhà cung cấp"
      empty={{ title: "Chưa có nhà cung cấp phù hợp", description: "Thử tên hoặc mã khác, hoặc thêm nhà cung cấp để lập bảng giá." }}
      expandedIds={expanded} onToggleRow={toggle} renderExpanded={supplier => <div className="px-4 py-3"><SupplierMaterialsPanel supplier={supplier} onChanged={() => setRevision(value => value + 1)} /></div>}
    />
  </PageShell>;
}
