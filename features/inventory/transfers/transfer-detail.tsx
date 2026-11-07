"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { PageHeading } from "@/components/patterns/page-heading";
import { useAccess } from "@/lib/access-boundary";
import { formatDateTime } from "@/lib/format-date";
import { ReceiverSwitch } from "./receiver-switch";
import { TransferEvidence } from "./transfer-evidence";
import { TransferHistory, transferHistory } from "./transfer-history";
import { TransferLinesTable } from "./transfer-lines-table";
import { TransferStatusBadge } from "./transfer-status-badge";
import { useBranchLabels, useMaterialNames } from "./use-transfer-lookups";
import { useTransferDetail } from "./use-transfer-detail";

export function TransferDetail({ id }: { id: string }) {
  const { scope } = useAccess();
  const detail = useTransferDetail(id);
  const names = useBranchLabels();
  const material = useMaterialNames();
  const [confirming, setConfirming] = useState(false);
  const { transfer } = detail;
  if (detail.error) return <ErrorState title="Không mở được phiếu này ở chi nhánh đang chọn." description="Phiếu không tồn tại hoặc không thuộc chi nhánh bạn được xem." onRetry={detail.reload} />;
  if (!transfer) return <LoadingState />;
  const { from: sender, to: receiver } = names.ends(transfer);
  return (
    <PageShell>
      <PageHeading
        title={`Phiếu chuyển hàng ${transfer.code}`}
        description={`${sender} → ${receiver}`}
        badge={<TransferStatusBadge status={transfer.status} />}
        actions={<>
          <Button variant="outline" asChild><Link href="/inventory/stock-transfers">Về danh sách phiếu</Link></Button>
          {detail.canReceive && <Button asChild><Link href={`/inventory/stock-transfers/${transfer.id}/receive`}>Nhận hàng</Link></Button>}
          {detail.canCancel && <Button variant="destructive" onClick={() => setConfirming(true)}>Huỷ phiếu</Button>}
        </>}
      />
      <div className="mt-4 grid gap-6">
        {detail.needsReceiverBranch && <ReceiverSwitch receiver={transfer.to_branch_ref} receiverLabel={receiver} atSender={transfer.from_branch_ref === scope?.branchId} />}
        {detail.cancelError && <InlineAlert>{detail.cancelError}</InlineAlert>}
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="text-muted-foreground">Chi nhánh gửi</dt><dd className="font-medium">{sender}</dd></div>
          <div><dt className="text-muted-foreground">Chi nhánh nhận</dt><dd className="font-medium">{receiver}</dd></div>
          <div><dt className="text-muted-foreground">Người gửi</dt><dd className="font-medium">{transfer.sent_by_ref === scope?.userId ? "Bạn · " : ""}{sender}</dd></div>
          <div><dt className="text-muted-foreground">Giờ gửi</dt><dd className="font-medium tabular-nums">{formatDateTime(transfer.sent_at)}</dd></div>
        </dl>
        <section className="grid gap-2"><h2 className="font-semibold">Dòng hàng</h2><TransferLinesTable lines={transfer.lines} name={material} /></section>
        <section className="grid gap-2"><h2 className="font-semibold">Lịch sử trạng thái</h2><TransferHistory steps={transferHistory(transfer, { from: sender, to: receiver }, scope?.userId)} /></section>
        <section className="grid gap-2"><h2 className="font-semibold">Ảnh</h2><TransferEvidence transfer={transfer.id} media={transfer.evidence.map(item => item.media_ref)} /></section>
      </div>
      <ConfirmDialog open={confirming} onOpenChange={setConfirming} danger busy={detail.cancelling} title="Huỷ phiếu chuyển hàng?"
        description="Hàng đã trừ sẽ được hoàn lại đúng số vào kho chi nhánh gửi. Phiếu đã huỷ không mở lại được." confirmLabel="Huỷ phiếu"
        onConfirm={() => void detail.cancel().then(ok => ok && setConfirming(false))} />
    </PageShell>
  );
}
