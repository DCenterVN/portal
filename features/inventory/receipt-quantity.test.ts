import { describe, expect, it } from "vitest";
import { receiptQuantityText } from "./receipt-lines";

describe("số lượng phiếu nhập", () => {
  it("5.000 kg đọc là 5 kg, không phải năm nghìn", () => {
    expect(receiptQuantityText("5.000", "KG")).toBe("5 kg");
  });
  it("giữ phần lẻ kiểu Việt Nam", () => {
    expect(receiptQuantityText("2.500", "KG")).toBe("2,5 kg");
  });
});
