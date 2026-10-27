"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextInput, Select } from "@/components/ui/field";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { PageShell, PageHeader } from "@/components/ui/page";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/state";
import { SupplierFormContainer } from "./supplier-form-container";

import { type useSuppliers } from "./use-suppliers";

type SuppliersViewProps = ReturnType<typeof useSuppliers>;

export function SuppliersView({ can, read, page, rows, categoryState, setCategoryRevision, loading, error, q, status, cursors, create, setCreate, setQ, setStatus, setCursors, setRevision }: SuppliersViewProps) {
  if (!read) return <ErrorState denied title="Bạn không có quyền xem nhà cung cấp" />;
  return <PageShell>
    <PageHeader title="Nhà cung cấp" description="Hồ sơ, bảng giá tham chiếu và các lần nhập hàng." />
    <div className="my-6 flex flex-wrap gap-3 lg:flex-nowrap">
      <div className="min-w-0 flex-1 basis-full lg:basis-0"><TextInput aria-label="Tìm nhà cung cấp theo tên hoặc mã" placeholder="Ví dụ Gạo An Bình" value={q} onChange={event => { setQ(event.target.value); setCursors([""]); }} /></div>
      <div className="w-full sm:w-auto lg:w-48"><Select aria-label="Lọc trạng thái nhà cung cấp" value={status} onChange={event => { setStatus(event.target.value); setCursors([""]); }}><option value="">Mọi trạng thái</option><option value="ACTIVE">Đang hợp tác</option><option value="SUSPENDED">Đã ngừng</option></Select></div>
      {can("inventory:supplier:create") && <Button className="shrink-0" onClick={() => setCreate(true)}>Thêm nhà cung cấp</Button>}
    </div>
    <Table className="min-w-xl">
      <TableHeader><TableRow>{["Mã NCC", "Tên nhà cung cấp", "Nhóm NL cha", "Liên hệ", "Trạng thái", "Bảng giá"].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
      <TableBody>
        {loading ? <TableRow><TableCell colSpan={6}><Skeleton title="Đang tải nhà cung cấp" /></TableCell></TableRow>
        : error ? <TableRow><TableCell colSpan={6}><ErrorState title={error} onRetry={() => setRevision(value => value + 1)} /></TableCell></TableRow>
        : !rows?.length ? <TableRow><TableCell colSpan={6}><EmptyState title="Chưa có nhà cung cấp phù hợp" description="Thử tên hoặc mã khác, hoặc thêm nhà cung cấp để lập bảng giá."
          action={q || status ? <Button variant="outline" onClick={() => { setQ(""); setStatus(""); setCursors([""]); }}>Xoá lọc</Button> : can("inventory:supplier:create") ? <Button onClick={() => setCreate(true)}>Thêm nhà cung cấp</Button> : undefined} /></TableCell></TableRow>
        : rows.map(supplier => <TableRow key={supplier.id}>
          <TableCell>{supplier.code}</TableCell>
          <TableCell><Link href={`/inventory/suppliers/${encodeURIComponent(supplier.id)}`}>{supplier.name}</Link></TableCell>
          <TableCell>
            {supplier.material_category_codes?.length ? categoryState === "loading" ? <span role="status">Đang tải nhóm</span>
              : categoryState === "error" ? <Button variant="ghost" onClick={() => setCategoryRevision(value => value + 1)}>Thử lại nhóm</Button>
              : supplier.parentNames.length ? <div className="flex flex-wrap gap-1.5">{supplier.parentNames.slice(0, 2).map(name => <Badge key={name} variant="secondary" dot={false}>{name}</Badge>)}
                {supplier.parentNames.length > 2 && <span tabIndex={0} title={supplier.parentNames.join(", ")} aria-label={supplier.parentNames.join(", ")} className="rounded-full bg-tint px-2 text-sm">+{supplier.parentNames.length - 2}</span>}</div>
              : <span>Cần cập nhật nhóm</span> : <span>{supplier.material_categories?.length ? "Cần cập nhật nhóm" : "Chưa khai nhóm"}</span>}
          </TableCell>
          <TableCell><div className="grid gap-1"><span>{supplier.contact_name || "Chưa cung cấp"}</span>{supplier.contact_phone ? <a href={`tel:${supplier.contact_phone}`}>{supplier.contact_phone}</a> : <span>Chưa cung cấp</span>}</div></TableCell>
          <TableCell><Button variant="ghost" onClick={() => { setStatus(supplier.status); setCursors([""]); }}><Badge variant={supplier.status === "ACTIVE" ? "active" : "suspended"}>{supplier.status === "ACTIVE" ? "Đang hợp tác" : "Đã ngừng"}</Badge></Button></TableCell>
          <TableCell><Link href={`/inventory/suppliers/${encodeURIComponent(supplier.id)}?tab=agreements`} title={`Mở bảng giá của ${supplier.name}`} aria-label={`Mở bảng giá của ${supplier.name}`}>Bảng giá</Link></TableCell>
        </TableRow>)}
      </TableBody>
    </Table>
    {!loading && !error && Boolean(page?.items.length) && <p className="mt-2 text-sm text-fg-3 sm:hidden">Vuốt ngang bảng để mở đầy đủ cột Bảng giá.</p>}
    <nav aria-label="Phân trang nhà cung cấp" className="mt-4 flex justify-between"><Button variant="outline" disabled={loading || cursors.length === 1} onClick={() => setCursors(items => items.slice(0, -1))}>Trang trước</Button><Button variant="outline" disabled={loading || !page?.next_cursor} onClick={() => { if (page?.next_cursor) setCursors(items => [...items, page.next_cursor]); }}>Trang sau</Button></nav>
    {create && <SupplierFormContainer onClose={() => setCreate(false)} onSaved={() => { setCreate(false); setCursors([""]); setRevision(value => value + 1); }} />}
  </PageShell>;
}
