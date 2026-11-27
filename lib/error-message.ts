import { FetchError, FORBIDDEN_MESSAGE } from "@/lib/fetcher";

export function requestErrorMessage(error: unknown): string {
  if (error instanceof FetchError) {
    if (error.status === 401) return "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.";
    if (error.status === 403) return FORBIDDEN_MESSAGE;
    if (error.status === 404) return "Không tìm thấy dữ liệu này ở chi nhánh đang chọn.";
    if (error.status === 409) return "Dữ liệu vừa thay đổi. Tải lại để xem bản mới.";
    if (error.status === 422) return "Thông tin chưa hợp lệ. Kiểm tra lại rồi thử lại.";
    return "Hệ thống tạm bận, thử lại sau ít phút.";
  }
  if (error instanceof TypeError) return "Không kết nối được tới hệ thống. Kiểm tra mạng rồi thử lại.";
  return error instanceof Error && error.message ? error.message : "Không tải được dữ liệu. Thử lại sau.";
}

const SHORTAGE = /SKU\s+([0-9a-f-]{36})\s*:\s*thiếu\s+([\d.,]+)\s*([A-Za-z]+)/i;

export function shortageSku(error: unknown): string | undefined {
  return error instanceof FetchError && error.code === "insufficient_stock" ? SHORTAGE.exec(error.serviceMessage)?.[1] : undefined;
}

function readableAmount(amount: number, uom: string): string {
  const unit = uom.toUpperCase();
  const small = amount < 1 && (unit === "KG" || unit === "L");
  const value = small ? amount * 1000 : amount;
  const label = unit === "KG" ? (small ? "g" : "kg") : unit === "L" ? (small ? "ml" : "lít") : unit === "G" ? "g" : unit === "ML" ? "ml" : "cái";
  return `${Number(value.toFixed(3)).toLocaleString("vi-VN")} ${label}`;
}

type CodedContext = { variant?: string; materialName?: string; remaining?: number };

export function codedErrorMessage(error: unknown, context: CodedContext = {}): string | undefined {
  if (!(error instanceof FetchError)) return undefined;
  if (error.code === "target_quantity_exceeded") {
    const left = context.remaining === undefined ? "" : ` (còn ${context.remaining.toLocaleString("vi-VN")} suất)`;
    return `Tổng số suất đã lập kế hoạch vượt chỉ tiêu đã duyệt${left}.`;
  }
  if (error.code === "price_not_active") {
    return `Biến thể ${context.variant ? `“${context.variant}” ` : "này "}chưa có giá bán được duyệt. Hãy đề xuất và duyệt giá ở Bán hàng > Giá bán, rồi thử lại.`;
  }
  if (error.code === "insufficient_stock") {
    const found = SHORTAGE.exec(error.serviceMessage);
    if (!found) return "Kho không đủ nguyên liệu để cấp cho lệnh này. Nhập thêm nguyên liệu rồi thử lại.";
    const name = context.materialName ?? "Một nguyên liệu";
    return `${name} thiếu ${readableAmount(Number(found[2]), found[3])} trong kho. Nhập thêm nguyên liệu rồi thử lại.`;
  }
  return undefined;
}
