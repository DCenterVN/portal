"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { TablePager } from "@/components/patterns/table-pager";
import { SupplierFormContainer } from "./supplier-form-container";

import { type useSuppliers } from "./use-suppliers";

type SuppliersViewProps = ReturnType<typeof useSuppliers>;

export function SuppliersView({ can, read, page, rows, categoryState, setCategoryRevision, loading, error, q, status, cursors, create, setCreate, setQ, setStatus, setCursors, setRevision }: SuppliersViewProps) {
  if (!read) return <ErrorState denied title="Bạn không có quyền xem nhà cung cấp" />;
  return <PageShell>
    <PageHeading title="Nhà cung cấp" description="Hồ sơ, bảng giá tham chiếu và các lần nhập hàng." />
    <div className="my-6 flex flex-wrap gap-3 lg:flex-nowrap">
      <div className="min-w-0 flex-1 basis-full lg:basis-0"><Input aria-label="Tìm nhà cung cấp theo tên hoặc mã" placeholder="Ví dụ Gạo An Bình" value={q} onChange={event => { setQ(event.target.value); setCursors([""]); }} /></div>
      <div className="w-full sm:w-auto lg:w-48"><NativeSelect aria-label="Lọc trạng thái nhà cung cấp" value={status} onChange={event => { setStatus(event.target.value); setCursors([""]); }}><NativeSelectOption value="">Mọi trạng thái</NativeSelectOption><NativeSelectOption value="ACTIVE">Đang hợp tác</NativeSelectOption><NativeSelectOption value="SUSPENDED">Đã ngừng</NativeSelectOption></NativeSelect></div>
      {can("inventory:supplier:create") && <Button className="shrink-0" onClick={() => setCreate(true)}>Thêm nhà cung cấp</Button>}
    </div>
    <Table className="min-w-xl">
      <TableHeader><TableRow>{["Mã NCC", "Tên nhà cung cấp", "Nhóm NL cha", "Liên hệ", "Trạng thái", "Bảng giá"].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
      <TableBody>
        {loading ? <TableRow><TableCell colSpan={6}><LoadingState title="Đang tải nhà cung cấp" /></TableCell></TableRow>
        : error ? <TableRow><TableCell colSpan={6}><ErrorState title={error} onRetry={() => setRevision(value => value + 1)} /></TableCell></TableRow>
        : !rows?.length ? <TableRow><TableCell colSpan={6}><EmptyState title="Chưa có nhà cung cấp phù hợp" description="Thử tên hoặc mã khác, hoặc thêm nhà cung cấp để lập bảng giá."
          action={q || status ? <Button variant="outline" onClick={() => { setQ(""); setStatus(""); setCursors([""]); }}>Xoá lọc</Button> : can("inventory:supplier:create") ? <Button onClick={() => setCreate(true)}>Thêm nhà cung cấp</Button> : undefined} /></TableCell></TableRow>
        : rows.map(supplier => <TableRow key={supplier.id} className="h-10">
          <TableCell>{supplier.code}</TableCell>
          <TableCell><Link className="font-medium underline-offset-4 hover:underline" href={`/inventory/suppliers/${encodeURIComponent(supplier.id)}`}>{supplier.name}</Link></TableCell>
          <TableCell>
            {supplier.material_category_codes?.length ? categoryState === "loading" ? <span role="status">Đang tải nhóm</span>
              : categoryState === "error" ? <Button variant="ghost" onClick={() => setCategoryRevision(value => value + 1)}>Thử lại nhóm</Button>
              : supplier.parentNames.length ? <div className="flex flex-wrap gap-1.5">{supplier.parentNames.slice(0, 2).map(name => <Badge key={name} variant="secondary">{name}</Badge>)}
                {supplier.parentNames.length > 2 && <Badge variant="outline" tabIndex={0} title={supplier.parentNames.join(", ")} aria-label={supplier.parentNames.join(", ")}>+{supplier.parentNames.length - 2}</Badge>}</div>
              : <span>Cần cập nhật nhóm</span> : <span>{supplier.material_categories?.length ? "Cần cập nhật nhóm" : "Chưa khai nhóm"}</span>}
          </TableCell>
          <TableCell>{supplier.contact_name || supplier.contact_phone ? <>{supplier.contact_name}{supplier.contact_name && supplier.contact_phone && <span className="text-muted-foreground"> · </span>}{supplier.contact_phone && <a className="underline-offset-4 hover:underline" href={`tel:${supplier.contact_phone}`}>{supplier.contact_phone}</a>}</> : <span className="text-muted-foreground">Chưa cung cấp</span>}</TableCell>
          <TableCell><StatusBadge tone={supplier.status === "ACTIVE" ? "success" : "warning"}>{supplier.status === "ACTIVE" ? "Đang hợp tác" : "Đã ngừng"}</StatusBadge></TableCell>
          <TableCell><Link className="font-medium text-primary underline-offset-4 hover:underline" href={`/inventory/suppliers/${encodeURIComponent(supplier.id)}?tab=agreements`} title={`Mở bảng giá của ${supplier.name}`} aria-label={`Mở bảng giá của ${supplier.name}`}>Bảng giá</Link></TableCell>
        </TableRow>)}
      </TableBody>
    </Table>
    {!loading && !error && Boolean(page?.items.length) && <p className="mt-2 text-sm text-muted-foreground sm:hidden">Vuốt ngang bảng để mở đầy đủ cột Bảng giá.</p>}
    <TablePager label="Phân trang nhà cung cấp" className="mt-4" busy={loading} hasPrevious={cursors.length > 1} onPrevious={() => setCursors(items => items.slice(0, -1))} hasNext={Boolean(page?.next_cursor)} onNext={() => { if (page?.next_cursor) setCursors(items => [...items, page.next_cursor]); }} />
    {create && <SupplierFormContainer onClose={() => setCreate(false)} onSaved={() => { setCreate(false); setCursors([""]); setRevision(value => value + 1); }} />}
  </PageShell>;
}
