"use client";

import { formatDate } from "@/lib/format-date";
import { formatVND } from "@/lib/format";
import { uomLabel } from "@/lib/stock-transfer";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import type { Agreement } from "@/lib/api/supplier-agreements";
import type { Material } from "@/lib/api/sales";

type SupplierAgreementCardProps = {
  agreement: Agreement; materials: Material[]; canUpdate: boolean; busy: boolean;
  onOpenDraft: () => void; onSuspend: () => void; onAttach: () => void; onDownload: (ref: string) => void;
};

export function agreementStatus(agreement: Agreement) {
  if (agreement.status === "SUSPENDED") return { label: "Đã ngừng áp dụng", tone: "warning" } as const;
  if (agreement.effective_status === "EXPIRED") return { label: "Hết hạn", tone: "danger" } as const;
  if (agreement.status === "ACTIVE") return null;
  return { label: "Nháp", tone: "neutral" } as const;
}

export function SupplierAgreementCard({ agreement, materials, canUpdate, busy, onOpenDraft, onSuspend, onAttach, onDownload }: SupplierAgreementCardProps) {
  const status = agreementStatus(agreement);
  const documentRef = agreement.primary_document_ref ?? agreement.document_ref;
  const ownRange = agreement.lines.some(line => line.valid_from !== agreement.valid_from || line.valid_to !== agreement.valid_to);
  return <article className="grid gap-3 rounded-lg border border-border p-4">
    <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{agreement.code}</h3>{status && <StatusBadge tone={status.tone}>{status.label}</StatusBadge>}</div>
    <p className="text-sm text-muted-foreground">Áp dụng từ {formatDate(agreement.valid_from)} đến {formatDate(agreement.valid_to)}</p>
    {agreement.status_reason && <p>Lý do ngừng áp dụng: {agreement.status_reason}</p>}
    <Table><TableHeader><TableRow><TableHead>Nguyên liệu</TableHead><TableHead className="text-right">Giá</TableHead>{ownRange && <TableHead>Áp dụng</TableHead>}</TableRow></TableHeader>
      <TableBody>{agreement.lines.map(line => {
        const material = materials.find(item => item.id === line.sku_ref);
        return <TableRow key={line.price_line_ref ?? line.sku_ref}>
          <TableCell className="whitespace-normal"><span className="flex items-center gap-3">{material?.image_url ? <img src={material.image_url} alt="" className="size-9 shrink-0 rounded-lg object-cover" /> : <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-tint text-xs font-semibold">{(material?.name ?? "?").slice(0, 1).toLocaleUpperCase("vi")}</span>}{material?.name ?? "Nguyên liệu chưa tải được tên"}</span></TableCell>
          <TableCell className="text-right tabular-nums">{formatVND(line.unit_price_vnd)} / {uomLabel(line.uom)}</TableCell>
          {ownRange && <TableCell>{formatDate(line.valid_from)} đến {formatDate(line.valid_to)}</TableCell>}
        </TableRow>;
      })}</TableBody></Table>
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="mr-auto text-sm text-muted-foreground">{documentRef ? "Có chứng từ" : "Chưa có chứng từ (hợp đồng hoặc báo giá của nhà cung cấp)"}</span>
      {documentRef && <Button size="sm" variant="outline" disabled={busy} onClick={() => onDownload(documentRef)}>Tải chứng từ</Button>}
      {canUpdate && agreement.status === "ACTIVE" && !documentRef && <Button size="sm" variant="outline" disabled={busy} onClick={onAttach}>Gắn chứng từ</Button>}
      {canUpdate && agreement.status === "DRAFT" && <Button size="sm" variant="outline" onClick={onOpenDraft}>Mở bản nháp</Button>}
      {canUpdate && agreement.status === "ACTIVE" && agreement.effective_status !== "EXPIRED" && <Button size="sm" variant="outline" onClick={onSuspend}>Ngừng áp dụng</Button>}
    </div>
  </article>;
}
