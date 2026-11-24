import { expect, it } from "vitest";
import { statusLabel } from "./status-labels";

it("mã trạng thái, kết quả kiểm và nguồn giá hiện bằng tiếng Việt", () => {
  expect(["DRAFT", "ACTIVE", "PASS", "FAIL", "SUPPLIER_PRICE"].map(statusLabel)).toEqual(["Nháp", "Đang dùng", "Đạt", "Không đạt", "Giá nhà cung cấp"]);
});
it("chữ Revision hiện là Lần sửa", () => {
  expect(statusLabel("REVISION")).toBe("Lần sửa");
});
it("mã lạ chưa có nhãn hiện Chưa rõ, không lộ mã", () => {
  expect(statusLabel("NGUON_MOI_CHUA_CO_NHAN")).toBe("Chưa rõ");
  expect(statusLabel("")).toBe("Chưa rõ");
});
