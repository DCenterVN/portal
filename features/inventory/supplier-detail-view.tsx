"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccess } from "@/lib/access-boundary";
import { getSupplier, suspendSupplier, type Supplier } from "@/lib/api/suppliers";
import { PageShell, PageHeader } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/state";
import { FetchError } from "@/lib/fetcher";
import { Tabs } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SupplierForm } from "./supplier-form";
import { SupplierAgreementsView } from "./supplier-agreements-view";

export function SupplierDetailView({ supplierId, initialSupplier, initialTab = "overview" }: { supplierId: string; initialSupplier?: Supplier; initialTab?: "overview" | "agreements" }) {
  const { can } = useAccess();
  const read = can("inventory:supplier:read");
  const [supplier, setSupplier] = useState(initialSupplier);
  const [tab, setTab] = useState(initialTab);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [edit, setEdit] = useState(false);
  const [changeStatus, setChangeStatus] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!read) return;
    let live = true;
    getSupplier(supplierId).then(value => { if (live) { setSupplier(value); setError(""); setNotFound(false); } }).catch(cause => { if (live) { if (cause instanceof FetchError && cause.status === 404) { setSupplier(undefined); setNotFound(true); } else setError("Không tải được nhà cung cấp"); } });
    return () => { live = false; };
  }, [supplierId, read, revision]);
  async function change() {
    if (!supplier || !reason.trim() || busy || !can("inventory:supplier:update")) return;
    setBusy(true);
    try { setSupplier(await suspendSupplier(supplierId, supplier.status === "ACTIVE" ? "SUSPEND" : "ACTIVATE", reason.trim())); setChangeStatus(false); setReason(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thay đổi được trạng thái"); }
    finally { setBusy(false); }
  }
  if (!read) return <ErrorState denied title="Bạn không có quyền xem nhà cung cấp" />;
  if (notFound) return <EmptyState title="Không tìm thấy nhà cung cấp" action={<Link href="/inventory/suppliers">Quay lại nhà cung cấp</Link>} />;
  if (!supplier) return error ? <ErrorState title={error} onRetry={() => setRevision(value => value + 1)} /> : <Skeleton title="Đang tải hồ sơ nhà cung cấp" />;
  return <PageShell>
    <Link href="/inventory/suppliers">Nhà cung cấp</Link>
    <PageHeader title={supplier.name} description={`${supplier.code} · ${supplier.status === "ACTIVE" ? "Đang hợp tác" : "Đã ngừng hợp tác"}`} />
    {error && <ErrorState title={error} onRetry={() => setRevision(value => value + 1)} />}
    <Tabs label="Hồ sơ nhà cung cấp" idPrefix="supplier-detail" items={[{ id: "overview", label: "Thông tin" }, { id: "agreements", label: "Hợp đồng" }]} value={tab} onChange={setTab}>
      {tab === "agreements" ? <SupplierAgreementsView supplierId={supplierId} /> : <div className="mt-6 grid gap-4">
        <dl><dt>Mã số thuế</dt><dd>{supplier.tax_code || "Chưa cung cấp"}</dd></dl>
        {can("inventory:supplier:update") && <div className="flex flex-wrap gap-3"><Button onClick={() => setEdit(true)}>Sửa thông tin</Button><Button variant="outline" onClick={() => setChangeStatus(true)}>{supplier.status === "ACTIVE" ? "Ngừng hợp tác" : "Khôi phục hợp tác"}</Button></div>}
      </div>}
    </Tabs>
    {edit && <SupplierForm supplier={supplier} onClose={() => setEdit(false)} onSaved={value => { setSupplier(value); setEdit(false); }} />}
    <Dialog open={changeStatus} onOpenChange={open => { if (!busy) setChangeStatus(open); }}><DialogContent><DialogTitle>Thay đổi hợp tác với {supplier.name}</DialogTitle><DialogDescription>Ngừng hợp tác sẽ chặn tạo phiếu mới. Lịch sử vẫn được giữ.</DialogDescription><Field label="Lý do" htmlFor="supplier-reason"><Textarea id="supplier-reason" value={reason} onChange={event => setReason(event.target.value)} maxLength={500} /></Field><Button onClick={change} disabled={busy || !reason.trim()}>{busy ? "Đang lưu…" : "Xác nhận thay đổi"}</Button></DialogContent></Dialog>
  </PageShell>;
}
