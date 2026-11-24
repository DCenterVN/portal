import { expect, it } from "vitest";
import { variantLabel } from "./food-plan-ratios";

it("mã set sinh từ mã định danh không hiện cho người dùng", () => {
  expect(variantLabel("D-01a1bc1a-91fe-701e-9055-a32f0db01511-2")).toBe("—");
  expect(variantLabel("VAR-01a1bc1a-91fe")).toBe("—");
  expect(variantLabel("SV-01a1c5af-3512-74b8-a0d4-40c76b6615d7")).toBe("—");
  expect(variantLabel("VN-SET-BUN-BO")).toBe("VN-SET-BUN-BO");
});
