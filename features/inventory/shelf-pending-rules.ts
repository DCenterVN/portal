import { formatQuantity } from "@/lib/stock-transfer";
import { statusLabel } from "@/lib/status-labels";
import type { ShelfPendingLot } from "@/lib/api/shelf-pending";

const SOURCE_PREFIX: Record<string, string> = { TRANSFER: "Phiếu chuyển", DELIVERY_RETURN: "Đơn" };
const unit = (uom: string, value: number) => formatQuantity(value, uom);

export function pendingRowView(lot: ShelfPendingLot) {
  const prefix = SOURCE_PREFIX[lot.origin];
  const returned = lot.origin === "DELIVERY_RETURN";
  return {
    originLabel: statusLabel(lot.origin),
    source: lot.source_code ? `${prefix ? `${prefix} ` : ""}${lot.source_code}` : "",
    pending: unit(lot.uom, lot.pending_quantity),
    inspection: returned ? `Cần kiểm ${unit(lot.uom, lot.inspection_quantity)}` : "",
  };
}

export const inspectionBlock = (lot: Pick<ShelfPendingLot, "origin">, confirmed: boolean) =>
  lot.origin === "DELIVERY_RETURN" && !confirmed ? "Hàng giao hỏng quay về cần được kiểm. Hãy kiểm hàng rồi đánh dấu đã kiểm trước khi xếp lên kệ." : "";
