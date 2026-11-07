import { z } from "zod";
import { FEFO_LOT, formatQuantity, fromMilli, toMilli } from "@/lib/stock-transfer";
import type { LotRow, StockRow } from "@/lib/api/stock-transfers";

export type SendValues = { to: string; lines: Array<{ sku: string; quantity: string; lot: string }> };
export const blankLine = (sku = "") => ({ sku, quantity: "", lot: FEFO_LOT });
export const MAX_LINES = 100;

export type LotOption = { id: string; label: string; meta: string };

export function lotOptions(lots: LotRow[], sku: string, now = Date.now()): LotOption[] {
  const usable = lots.filter(lot => lot.sku_ref === sku && lot.status === "APPROVED" && lot.remaining_quantity > 0 && Date.parse(lot.expires_at) > now)
    .sort((left, right) => Date.parse(left.expires_at) - Date.parse(right.expires_at));
  return usable.map(lot => ({ id: lot.id, label: lot.supplier_lot_code, meta: `Còn ${formatQuantity(lot.remaining_quantity, lot.uom)}` }));
}

export function sendSchema(stock: StockRow[], lots: LotRow[]) {
  const available = new Map(stock.map(row => [row.sku_ref, row]));
  const line = z.object({ sku: z.string().min(1, "Chọn nguyên liệu cần gửi."), quantity: z.string(), lot: z.string() }).superRefine((value, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: "custom", path: ["quantity"], message });
    const milli = toMilli(value.quantity);
    if (!milli) return issue("Nhập số lượng lớn hơn 0, tối đa 3 số lẻ.");
    const row = available.get(value.sku);
    if (row && milli > Math.round(row.available_quantity * 1000)) return issue(`Chỉ còn khả dụng ${formatQuantity(row.available_quantity, row.uom)}. Giảm số lượng.`);
    const lot = lots.find(item => item.id === value.lot);
    if (lot && milli > Math.round(lot.remaining_quantity * 1000)) issue(`Lô ${lot.supplier_lot_code} chỉ còn ${formatQuantity(lot.remaining_quantity, lot.uom)}. Chọn lô khác hoặc giảm số lượng.`);
  });
  return z.object({ to: z.string().min(1, "Chọn chi nhánh nhận."), lines: z.array(line).min(1, "Thêm ít nhất một dòng hàng.") });
}

export function sendBody(values: SendValues, stock: StockRow[]) {
  return {
    to_branch_ref: values.to,
    lines: values.lines.map(line => ({
      sku_ref: line.sku, uom: stock.find(row => row.sku_ref === line.sku)?.uom ?? "",
      quantity: fromMilli(toMilli(line.quantity) ?? 0),
      ...(line.lot === FEFO_LOT ? {} : { lot_ref: line.lot }),
    })),
  };
}
