import { describe, expect, it } from "vitest";
import { hasServerCart, orderErrorMessage } from "./cart-model";

describe("lỗi đặt hàng nói bằng tiếng Việt", () => {
  it("hết hàng bảo khách giảm số lượng hoặc bỏ món", () => {
    expect(orderErrorMessage(409, "out_of_stock", "inventory stock insufficient")).toBe("Món trong giỏ không đủ hàng. Giảm số lượng hoặc bỏ món rồi đặt lại.");
  });
  it("giữ câu tiếng Việt do máy chủ trả về", () => {
    expect(orderErrorMessage(409, "out_of_stock", 'Món "Bún bò" không đủ hàng')).toBe('Món "Bún bò" không đủ hàng');
  });
  it("cửa hàng lệch với giỏ bảo chọn lại cửa hàng", () => {
    expect(orderErrorMessage(403, "data_scope_denied", "forbidden")).toBe("Giỏ hàng không thuộc cửa hàng đang chọn. Chọn lại cửa hàng ở trang sản phẩm rồi thêm món lại.");
  });
  it("lỗi máy chủ tiếng Anh không lộ ra, khách được dặn thử lại", () => {
    expect(orderErrorMessage(500, undefined, "internal error")).toBe("Chưa đặt được hàng. Vui lòng thử lại sau ít phút.");
    expect(orderErrorMessage(503, "unavailable", "service unavailable")).toBe("Chưa đặt được hàng. Vui lòng thử lại sau ít phút.");
  });
});

describe("giỏ trên máy chủ chỉ có sau khi thêm món đầu tiên", () => {
  it("giỏ trống ở máy khách thì không hỏi máy chủ, tránh lỗi 404 vô ích", () => {
    expect(hasServerCart([])).toBe(false);
    expect(hasServerCart([{ product_id: "p", name: "Bún", quantity: 1, price_snapshot_vnd: 1, uom: "EA", sku_code: "" }])).toBe(true);
  });
});
