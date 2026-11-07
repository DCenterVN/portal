import { FetchError } from "@/lib/fetcher";

export type TransferStatus = "IN_TRANSIT" | "RECEIVED" | "CANCELLED";
export type VarianceReason = "SHORT" | "DAMAGED" | "OTHER";

export const TRANSFER_STATUS_LABEL: Record<TransferStatus, string> = { IN_TRANSIT: "Đang chuyển", RECEIVED: "Đã nhận", CANCELLED: "Đã huỷ" };
export const TRANSFER_STATUS_TONE = { IN_TRANSIT: "warning", RECEIVED: "success", CANCELLED: "danger" } as const;
export const VARIANCE_LABEL: Record<VarianceReason, string> = { SHORT: "Thiếu hàng", DAMAGED: "Hư hỏng", OTHER: "Lý do khác" };
export const VARIANCE_REASONS = Object.keys(VARIANCE_LABEL) as VarianceReason[];
export const FEFO_LOT = "fefo";
export const FEFO_LABEL = "Tự chọn lô hết hạn trước";
export const BRANCH_FALLBACK = "—";
export const SEARCH_FROM = 8;

const QUANTITY = /^\d+(?:[.,]\d{1,3})?$/;

export function toMilli(value: string): number | null {
  const text = value.trim();
  if (!QUANTITY.test(text)) return null;
  const [whole, fraction = ""] = text.replace(",", ".").split(".");
  return Number(whole) * 1000 + Number(fraction.padEnd(3, "0"));
}

export const fromMilli = (milli: number) => `${Math.floor(milli / 1000)}.${String(milli % 1000).padStart(3, "0")}`;

export function formatQuantity(value: string | number, uom = ""): string {
  const milli = typeof value === "number" ? Math.round(value * 1000) : toMilli(value);
  if (milli === null) return "";
  const [whole, fraction] = fromMilli(milli).split(".");
  const text = `${Number(whole).toLocaleString("vi-VN")}${fraction === "000" ? "" : `,${fraction.replace(/0+$/, "")}`}`;
  return uom ? `${text} ${uom.toLowerCase()}` : text;
}

export function shortfall(sent: string, received: string): string {
  const gap = (toMilli(sent) ?? 0) - (toMilli(received) ?? 0);
  return gap > 0 ? fromMilli(gap) : "0.000";
}

export type ReceiveRow = { sent: string; received: string; reason: string };

export function receiveRowError(row: ReceiveRow): { received?: string; reason?: string } {
  const milli = toMilli(row.received);
  const sent = toMilli(row.sent) ?? 0;
  if (milli === null) return { received: "Nhập số nhận, tối đa 3 số lẻ." };
  if (milli > sent) return { received: `Số nhận không được lớn hơn số gửi (${formatQuantity(row.sent)}).` };
  if (milli < sent && !row.reason) return { reason: "Chọn lý do lệch cho dòng nhận thiếu." };
  return {};
}

export const hasVariance = (rows: ReceiveRow[]) => rows.some(row => (toMilli(row.received) ?? 0) < (toMilli(row.sent) ?? 0));

export function insufficientSku(error: unknown): string | undefined {
  if (!(error instanceof FetchError) || error.code !== "insufficient_stock") return undefined;
  return error.message.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
}

export function transferError(error: unknown): string {
  if (!(error instanceof FetchError)) return "Không thực hiện được. Hãy thử lại.";
  if (error.code === "insufficient_stock") return "Số lượng vượt quá tồn khả dụng ở chi nhánh gửi. Giảm số lượng hoặc chọn lô khác.";
  if (error.status === 403) return "Tài khoản của bạn chưa có quyền thực hiện thao tác này ở chi nhánh đang chọn.";
  if (error.status === 404) return "Không tìm thấy phiếu chuyển hàng này ở chi nhánh đang chọn.";
  if (error.status === 409) return "Phiếu hoặc tồn kho vừa thay đổi. Tải lại để xem bản mới, dữ liệu bạn nhập vẫn được giữ.";
  if (error.status === 422) return "Thông tin phiếu chưa hợp lệ. Kiểm tra lại chi nhánh nhận, số lượng và lô.";
  return "Hệ thống tạm bận, thử lại sau ít phút.";
}

export const transferEnds = (transfer: { from_branch_name?: string | null; to_branch_name?: string | null }) => ({
  from: transfer.from_branch_name || BRANCH_FALLBACK,
  to: transfer.to_branch_name || BRANCH_FALLBACK,
});

export type LotInfo = { code: string; expires?: string };
export function lotInfo(line: { source_lot_code?: string | null; source_lot_expires_at?: string | null }): LotInfo | undefined {
  return line.source_lot_code ? { code: line.source_lot_code, expires: line.source_lot_expires_at ?? undefined } : undefined;
}
