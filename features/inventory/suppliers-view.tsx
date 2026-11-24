"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DataTable } from "@/components/patterns/data-table/data-table";
import { withFilter } from "@/components/patterns/data-table/table-logic";
import type { DataTableColumn, DataTablePagination, ToolbarConfig } from "@/components/patterns/data-table/types";
import { ErrorState } from "@/components/patterns/empty-state";
import { PageHeading } from "@/components/patterns/page-heading";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page";
import type { Supplier } from "@/lib/api/suppliers";
import { SupplierContactLine, SupplierPhoto, SupplierStatusBadge } from "./supplier-detail-view";
import { SupplierGroupBar } from "./supplier-group-bar";
import { SupplierMaterialsPanel } from "./supplier-materials-panel";
import { SupplierOverviewStrip } from "./supplier-overview-view";
import { supplierHref } from "./supplier-routes";
import { supplierListUrl } from "./suppliers-table";
import { type useSuppliers } from "./use-suppliers";

type SuppliersViewProps = ReturnType<typeof useSuppliers>;

const statusOptions = [{ value: "ACTIVE", label: "Đang hợp tác" }, { value: "SUSPENDED", label: "Ngừng hợp tác" }];
const pricedOptions = [{ value: "today", label: "Có giá hiệu lực" }];
const dash = <span aria-label="Chưa có" className="text-muted-foreground">—</span>;

export function groupLabels(supplier: Supplier) {
  const names = (supplier.material_category_labels ?? []).map(label => label.name);
  return { shown: names.slice(0, 3), more: Math.max(0, names.length - 3) };
}

const columns: DataTableColumn<Supplier>[] = [
  {
    id: "name",
    header: "Nhà cung cấp",
    sortable: true,
    cell: supplier => (
      <div className="flex min-w-0 items-center gap-2.5">
        <SupplierPhoto name={supplier.name} url="" onError={() => {}} decorative />
        <div className="min-w-0">
          <span className="block truncate font-medium">{supplier.name}</span>
          {(supplier.contact_name || supplier.contact_phone) && (
            <span className="block truncate text-xs text-muted-foreground md:hidden">
              <SupplierContactLine supplier={supplier} />
            </span>
          )}
        </div>
        {supplier.status !== "ACTIVE" && <SupplierStatusBadge status={supplier.status} />}
      </div>
    ),
  },
  {
    id: "groups",
    header: "Nhóm nguyên liệu",
    className: "text-sm text-muted-foreground whitespace-normal",
    cell: supplier => {
      const { shown, more } = groupLabels(supplier);
      return shown.length ? <span>{shown.join(", ")}{more > 0 && <span className="text-muted-foreground"> +{more}</span>}</span> : dash;
    },
  },
  {
    id: "contact",
    header: "Liên hệ",
    hideBelow: "md",
    className: "text-sm text-muted-foreground",
    cell: supplier => supplier.contact_name || supplier.contact_phone ? <SupplierContactLine supplier={supplier} /> : dash,
  },
];

export function SuppliersView({
  can,
  read,
  url,
  page,
  rows,
  categories,
  overview,
  overviewLoading,
  overviewError,
  reloadOverview,
  attention,
  loading,
  error,
  setRevision,
  expanded,
  toggle,
}: SuppliersViewProps) {
  const pathname = usePathname() ?? supplierHref.list;
  if (!read) return <ErrorState denied title="Bạn không có quyền xem nhà cung cấp" />;
  const { state } = url;
  const total = page?.total;
  const pricedToday = state.filters.priced?.[0] === "today";
  const hrefFor = (next: typeof state) => {
    const query = supplierListUrl(next);
    return (query ? `${pathname}?${query}` : pathname) as Route;
  };
  const pricedHref = hrefFor(withFilter(state, "priced", pricedToday ? [] : ["today"]));
  const withoutPriceHref = hrefFor(withFilter(state, "attention", attention === "without_price" ? [] : ["without_price"]));
  const expiringHref = hrefFor(withFilter(state, "attention", attention === "expiring" ? [] : ["expiring"]));
  const closeAttentionHref = hrefFor(withFilter(state, "attention", []));
  const filtered = Boolean(state.q || state.filters.status?.length || state.filters.category?.length || state.filters.priced?.length);
  const status = loading && !rows ? "loading" : error && !rows ? "error" : "ready";
  const toolbar: ToolbarConfig = {
    search: { value: url.query, onChange: url.setQuery, placeholder: "Tìm nhà cung cấp…", label: "Tìm nhà cung cấp" },
    filters: [
      { id: "status", title: "Trạng thái", options: statusOptions, selected: state.filters.status ?? [], onChange: values => url.setFilter("status", values), single: true },
      { id: "priced", title: "Bảng giá", options: pricedOptions, selected: state.filters.priced ?? [], onChange: values => url.setFilter("priced", values), single: true },
    ],
    active: filtered,
    onClear: url.clear,
    below: <SupplierGroupBar categories={categories} selected={state.filters.category?.[0] ?? ""} onSelect={code => url.setFilter("category", code ? [code] : [])} />,
    primary: can("inventory:supplier:create") ? <Button asChild className="shrink-0"><Link href={supplierHref.create}>Thêm nhà cung cấp</Link></Button> : undefined,
  };
  const pagination: DataTablePagination = {
    kind: "page", page: state.page, pageSize: state.pageSize, pageSizes: [10, 20, 50], count: rows?.length ?? 0, total, busy: loading,
    onPage: url.setPage, onPageSize: url.setPageSize,
  };
  return (
    <PageShell>
      <PageHeading title="Nhà cung cấp" description="Hồ sơ, bảng giá tham chiếu và các lần nhập hàng." />
      <SupplierOverviewStrip
        overview={overview}
        loading={overviewLoading}
        error={overviewError}
        onRetry={reloadOverview}
        pricedToday={pricedToday}
        pricedHref={pricedHref}
        withoutPriceHref={withoutPriceHref}
        expiringHref={expiringHref}
        closeAttentionHref={closeAttentionHref}
        attention={attention}
      />
      <DataTable<Supplier>
        mode="server"
        columns={columns}
        rows={rows}
        rowId={supplier => supplier.id}
        rowLabel={supplier => supplier.name}
        status={status}
        error={error}
        onRetry={() => setRevision(value => value + 1)}
        toolbar={toolbar}
        storageKey="inventory-suppliers"
        sort={state.sort}
        onSortChange={url.setSort}
        pagination={pagination}
        paginationLabel="Phân trang nhà cung cấp"
        empty={{ title: "Chưa có nhà cung cấp phù hợp", description: "Thử tên khác, hoặc thêm nhà cung cấp để lập bảng giá." }}
        onRowOpen={supplier => toggle(supplier.id)}
        expandedIds={expanded}
        onToggleRow={toggle}
        renderExpanded={supplier => <div className="px-4 py-3"><SupplierMaterialsPanel supplier={supplier} onChanged={() => setRevision(value => value + 1)} /></div>}
      />
    </PageShell>
  );
}
