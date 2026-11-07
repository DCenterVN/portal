import { formatDateTime } from "@/lib/format-date";
import type { StockTransfer } from "@/lib/api/stock-transfers";

export function transferHistory(transfer: StockTransfer, ends: { from: string; to: string }, me?: string) {
  const who = (user: string | null | undefined, branch: string) => `${user && user === me ? "Bạn · " : ""}${branch}`;
  const steps = [{ title: "Gửi hàng", at: transfer.sent_at, by: who(transfer.sent_by_ref, ends.from) }];
  if (transfer.received_at) steps.push({ title: "Nhận hàng", at: transfer.received_at, by: who(transfer.received_by_ref, ends.to) });
  if (transfer.cancelled_at) steps.push({ title: "Huỷ phiếu", at: transfer.cancelled_at, by: who(transfer.cancelled_by_ref, ends.from) });
  return steps;
}

export function TransferHistory({ steps }: { steps: ReturnType<typeof transferHistory> }) {
  return (
    <ol aria-label="Lịch sử trạng thái" className="grid gap-2 text-sm">
      {steps.map(step => (
        <li key={step.title} className="flex flex-wrap items-baseline gap-x-3">
          <span className="font-medium">{step.title}</span>
          <span className="tabular-nums text-muted-foreground">{formatDateTime(step.at)}</span>
          <span className="text-muted-foreground">{step.by}</span>
        </li>
      ))}
    </ol>
  );
}
