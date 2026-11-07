import { z } from "zod";
import type { StockTransfer } from "@/lib/api/stock-transfers";
import { formatQuantity, fromMilli, receiveRowError, toMilli } from "@/lib/stock-transfer";

export type ReceiveValues = { rows: Array<{ received: string; reason: string }> };

export const receiveDefaults = (transfer: StockTransfer): ReceiveValues => ({
  rows: transfer.lines.map(line => ({ received: formatQuantity(line.sent_qty), reason: "" })),
});

export function receiveSchema(transfer: StockTransfer) {
  const row = z.object({ received: z.string(), reason: z.string() });
  return z.object({ rows: z.array(row) }).superRefine((values, ctx) => {
    values.rows.forEach((value, index) => {
      const problem = receiveRowError({ sent: transfer.lines[index].sent_qty, received: value.received, reason: value.reason });
      if (problem.received) ctx.addIssue({ code: "custom", path: ["rows", index, "received"], message: problem.received });
      if (problem.reason) ctx.addIssue({ code: "custom", path: ["rows", index, "reason"], message: problem.reason });
    });
  });
}

export function receiveBody(transfer: StockTransfer, values: ReceiveValues, evidence: string[]) {
  return {
    lines: transfer.lines.map((line, index) => {
      const received = toMilli(values.rows[index].received) ?? 0;
      const short = received < (toMilli(line.sent_qty) ?? 0);
      return { line_id: line.id, received_qty: fromMilli(received), ...(short ? { variance_reason: values.rows[index].reason } : {}) };
    }),
    evidence_refs: evidence,
  };
}
