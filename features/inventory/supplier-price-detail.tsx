"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/patterns/status-badge";
import { PageHeading } from "@/components/patterns/page-heading";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { downloadDocument } from "@/lib/api/agreement-documents";
import { formatDate } from "@/lib/format-date";
import { toast } from "@/components/ui/toast";
import { useAccess } from "@/lib/access-boundary";
import { SupplierAgreementCard, agreementStatus } from "./supplier-agreement-card";
import { SupplierAgreementContainer } from "./supplier-agreement-container";
import { useContractMaterials } from "./use-contract-materials";
import { useSupplierPriceVersions } from "./use-supplier-price-versions";
import { useSupplierProfile } from "./supplier-profile-context";
import { supplierHref } from "./supplier-routes";

export function SupplierPriceDetail({ agreementId }: { agreementId: string }) {
  const { supplier, canUpdate } = useSupplierProfile();
  const { can } = useAccess();
  const read = can("inventory:supplier:read");
  const { versions, error, reload } = useSupplierPriceVersions(supplier.id, agreementId, read);
  const { materials } = useContractMaterials(read);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const back = <Link href={supplierHref.tab(supplier.id, "agreements")}>Quay lại các bảng giá</Link>;
  if (error) return <ErrorState title="Không tải được bảng giá" onRetry={reload} />;
  if (!versions) return <LoadingState title="Đang tải bảng giá" />;
  const current = versions[0];
  if (!current) return <EmptyState title="Không tìm thấy bảng giá" action={back} />;
  const download = async (ref: string) => {
    setBusy(true);
    try { window.open(await downloadDocument(supplier.id, ref), "_blank", "noopener,noreferrer"); }
    catch { toast.error("Không tải được chứng từ. Kiểm tra quyền và thử lại."); }
    finally { setBusy(false); }
  };
  return <section className="mt-6 grid min-w-0 grid-cols-1 gap-4 [&>*]:min-w-0" aria-label="Chi tiết bảng giá">
    <PageHeading title={`Bảng giá ${current.code}`} description="Dòng giá đang áp dụng và các phiên bản theo thời gian." actions={<>
      {canUpdate && current.status === "DRAFT" && <Button onClick={() => setEditing(true)}>Thêm phiên bản</Button>}
      <Button asChild variant="outline">{back}</Button></>} />
    <SupplierAgreementCard agreement={current} materials={materials ?? []} canUpdate={false} busy={busy} onOpenDraft={() => {}} onSuspend={() => {}} onAttach={() => {}} onDownload={ref => void download(ref)} />
    <div><h2 className="text-lg font-semibold">Các phiên bản</h2>
      <Table><TableHeader><TableRow><TableHead>Phiên bản</TableHead><TableHead>Trạng thái</TableHead><TableHead>Áp dụng</TableHead><TableHead>Lập lúc</TableHead><TableHead className="text-right">Số dòng giá</TableHead></TableRow></TableHeader>
        <TableBody>{versions.map(version => {
          const status = agreementStatus(version);
          return <TableRow key={version.version_id}><TableCell>Phiên bản {version.version}</TableCell>
            <TableCell><StatusBadge tone={status?.tone ?? "neutral"}>{status?.label ?? "Đang áp dụng"}</StatusBadge></TableCell>
            <TableCell>{formatDate(version.valid_from)} đến {formatDate(version.valid_to)}</TableCell><TableCell>{formatDate(version.created_at)}</TableCell>
            <TableCell className="text-right tabular-nums">{version.lines.length}</TableCell></TableRow>;
        })}</TableBody></Table></div>
    {editing && <SupplierAgreementContainer supplierId={supplier.id} supplierCode={supplier.code} agreement={current} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); reload(); }} onConflict={reload} />}
    {!canUpdate && <p className="text-sm text-muted-foreground">Bạn chỉ xem được bảng giá này.</p>}
  </section>;
}
