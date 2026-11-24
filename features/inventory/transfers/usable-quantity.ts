import { formatQuantity } from "@/lib/stock-transfer";

export type UsableRow = { on_hand_quantity?: number; available_quantity: number; usable_quantity?: number; uom: string };

const milli = (value: number) => Math.round(value * 1000);

const HELD = "Phần còn lại đang được giữ cho đơn hoặc đang chờ kiểm.";

export const usableRows = <T extends UsableRow>(rows: T[]) => rows.filter(row => (row.usable_quantity ?? row.available_quantity) > 0);

export const usableLabel = (row: UsableRow) => (row.usable_quantity === undefined ? "" : `Chuyển được ${formatQuantity(row.usable_quantity, row.uom)}`);

export const usableNote = (row: UsableRow) =>
  row.usable_quantity !== undefined && milli(row.usable_quantity) < milli(row.on_hand_quantity ?? row.available_quantity) ? HELD : "";

export function usableError(row: UsableRow | undefined, milli: number) {
  if (!row || row.usable_quantity === undefined || milli <= Math.round(row.usable_quantity * 1000)) return "";
  return `Chỉ chuyển được ${formatQuantity(row.usable_quantity, row.uom)}. ${HELD} Giảm số lượng.`;
}
