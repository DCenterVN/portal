import type { CartItem } from "@/lib/api/sales";

export const validQuantity = (value: number) => Number.isInteger(value) && value > 0 && value <= 100_000;
export function unsellableItem(items: CartItem[], message: string) {
  return /không bán ở chi nhánh/.test(message) ? items.find(item => message.includes(`"${item.name}"`)) : undefined;
}

const SORRY = "Chưa đặt được hàng. Vui lòng thử lại sau ít phút.";
const vietnamese = (text: string) => /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(text);

export function orderErrorMessage(status: number, code: string | undefined, message: string) {
  if (code === "out_of_stock" || code === "insufficient_stock") return vietnamese(message) && /không đủ hàng/i.test(message) ? message : "Món trong giỏ không đủ hàng. Giảm số lượng hoặc bỏ món rồi đặt lại.";
  if (code === "data_scope_denied") return "Giỏ hàng không thuộc cửa hàng đang chọn. Chọn lại cửa hàng ở trang sản phẩm rồi thêm món lại.";
  return vietnamese(message) ? message : SORRY;
}

export const hasServerCart = (items: CartItem[]) => items.length > 0;
