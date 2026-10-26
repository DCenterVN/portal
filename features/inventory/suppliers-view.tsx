"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TextInput, Select } from "@/components/ui/field";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { PageShell, PageHeader } from "@/components/ui/page";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/state";
import { SupplierForm } from "./supplier-form";

import { type useSuppliers } from "./use-suppliers";

type SuppliersViewProps = ReturnType<typeof useSuppliers>;

export function SuppliersView({ can, read, page, loading, error, q, status, cursors, create, setCreate, setQ, setStatus, setCursors, setRevision }: SuppliersViewProps) {
  if (!read) return <ErrorState denied title="Bạn không có quyền xem nhà cung cấp" />;
  return <PageShell>
    <PageHeader title="Nhà cung cấp" description="Hồ sơ, bảng giá tham chiếu và các lần nhập hàng." />
    <div className="my-6 flex flex-wrap gap-3 lg:flex-nowrap">
      <div className="min-w-0 flex-1 basis-full lg:basis-0"><TextInput aria-label="Tìm nhà cung cấp theo tên hoặc mã" placeholder="Ví dụ Gạo An Bình" value={q} onChange={event => { setQ(event.target.value); setCursors([""]); }} /></div>
      <div className="w-full sm:w-auto lg:w-48"><Select aria-label="Lọc trạng thái nhà cung cấp" value={status} onChange={event => { setStatus(event.target.value); setCursors([""]); }}><option value="">Mọi trạng thái</option><option value="ACTIVE">Đang hợp tác</option><option value="SUSPENDED">Đã ngừng</option></Select></div>
      {can("inventory:supplier:create") && <Button className="shrink-0" onClick={() => setCreate(true)}>Thêm nhà cung cấp</Button>}
    </div>
    {loading ? <Skeleton title="Đang tải nhà cung cấp" /> : error ? <ErrorState title={error} onRetry={() => setRevision(value => value + 1)} /> : !page?.items.length ? <EmptyState title="Chưa có nhà cung cấp phù hợp" description="Thử tên hoặc mã khác, hoặc thêm nhà cung cấp để lập bảng giá." /> : <Table className="min-w-xl">
      <TableHeader><TableRow><TableHead>Mã NCC</TableHead><TableHead>Tên nhà cung cấp</TableHead><TableHead>Trạng thái</TableHead><TableHead>Bảng giá</TableHead></TableRow></TableHeader>
      <TableBody>{page.items.map(supplier => <TableRow key={supplier.id}><TableCell>{supplier.code}</TableCell><TableCell><Link href={`/inventory/suppliers/${encodeURIComponent(supplier.id)}`}>{supplier.name}</Link></TableCell><TableCell>{supplier.status === "ACTIVE" ? "Đang hợp tác" : "Đã ngừng"}</TableCell><TableCell><Link href={`/inventory/suppliers/${encodeURIComponent(supplier.id)}?tab=agreements`}>Bảng giá</Link></TableCell></TableRow>)}</TableBody>
    </Table>}
    {!loading && !error && Boolean(page?.items.length) && <p className="mt-2 text-sm text-fg-3 sm:hidden">Vuốt ngang bảng để mở đầy đủ cột Bảng giá.</p>}
    <nav aria-label="Phân trang nhà cung cấp" className="mt-4 flex justify-between"><Button variant="outline" disabled={loading || cursors.length === 1} onClick={() => setCursors(items => items.slice(0, -1))}>Trang trước</Button><Button variant="outline" disabled={loading || !page?.next_cursor} onClick={() => { if (page?.next_cursor) setCursors(items => [...items, page.next_cursor]); }}>Trang sau</Button></nav>
    {create && <SupplierForm onClose={() => setCreate(false)} onSaved={() => { setCreate(false); setCursors([""]); setRevision(value => value + 1); }} />}
  </PageShell>;
}
