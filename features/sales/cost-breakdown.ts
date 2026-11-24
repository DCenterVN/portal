import { formatVND } from "@/lib/format";
import { uomLabel } from "@/lib/stock-transfer";
import type { PricingPreview } from "@/lib/api/sales";

export function breakdownLine(item: PricingPreview["component_breakdown"][number], index: number) {
  const name = item.input_sku_name || `Thành phần ${index + 1}`;
  const amount = `${item.quantity} ${uomLabel(item.input_uom_code || item.uom)}`;
  return item.unit_cost_vnd === undefined || item.subtotal_vnd === undefined ? `${name}: ${amount}` : `${name}: ${amount} × ${formatVND(item.unit_cost_vnd)} = ${formatVND(item.subtotal_vnd)}`;
}
