import { statusLabel } from "@/lib/status-labels";

export const NAMES_FAILED = "Không tải được tên hàng";

export const resolveName = (names: Map<string, string>, failed: boolean, sku: string, position: number | undefined, unknown: string) =>
  names.get(sku) ?? (failed ? NAMES_FAILED : position ? `Nguyên liệu dòng ${position}` : unknown);

export const skuStatusNote = (status?: string) => (status && status !== "ACTIVE" ? statusLabel(status) : "");
