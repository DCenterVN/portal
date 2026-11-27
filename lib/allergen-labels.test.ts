import { expect, it } from "vitest";
import { flagLabel } from "./allergen-labels";

it("đổi mã dị ứng và kiêng thành tên tiếng Việt, không để lộ mã thô", () => {
  for (const code of ["LUPIN", "MOLLUSCS", "PORK", "BEEF", "ANIMAL", "ALCOHOL", "MSG", "SPICY", "NGU_VI_TAN"]) {
    const label = flagLabel(code);
    expect(label).not.toBe(code);
    expect(label).not.toMatch(/^[A-Z_]+$/);
  }
  expect(flagLabel("PORK")).toBe("Thịt heo");
  expect(flagLabel("MOLLUSCS")).toBe("Nhuyễn thể (mực, nghêu)");
});
