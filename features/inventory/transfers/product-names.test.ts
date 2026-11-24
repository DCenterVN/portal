import { describe, expect, it } from "vitest";
import { productNames } from "./product-names";

describe("tên món thành phẩm trong phiếu chuyển hàng", () => {
  it("mã suất bán trả về tên món để dòng hàng không hiện chưa rõ tên", () => {
    const names = productNames([
      { name: "Cá nục kho cà chua", sku_ref: "v1", variants: [{ id: "v1" }, { id: "v2" }] },
      { name: "Canh bí", variants: [] },
    ]);
    expect(names.get("v1")).toBe("Cá nục kho cà chua");
    expect(names.get("v2")).toBe("Cá nục kho cà chua");
    expect(names.has("p2")).toBe(false);
  });
});
