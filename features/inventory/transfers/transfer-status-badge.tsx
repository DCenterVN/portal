import { StatusBadge } from "@/components/patterns/status-badge";
import { TRANSFER_STATUS_LABEL, TRANSFER_STATUS_TONE, type TransferStatus } from "@/lib/stock-transfer";

export function TransferStatusBadge({ status }: { status: TransferStatus }) {
  return <StatusBadge tone={TRANSFER_STATUS_TONE[status]}>{TRANSFER_STATUS_LABEL[status]}</StatusBadge>;
}
