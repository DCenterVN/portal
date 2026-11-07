import { expect, it } from "vitest";
import { BRANCH_CODE_PATTERN, branchCodeFromName } from "./branch-code";

it("bỏ dấu, viết hoa, nối bằng gạch ngang", () => {
  expect(branchCodeFromName("Cửa hàng Cầu Giấy")).toBe("CUA-HANG-CAU-GIAY");
  expect(branchCodeFromName("  Đống Đa  (Hà Nội) ")).toBe("DONG-DA-HA-NOI");
});

it("tên rỗng hoặc toàn ký hiệu ra mã rỗng, mã dài bị cắt 64 ký tự", () => {
  expect(branchCodeFromName("  !!! ")).toBe("");
  expect(branchCodeFromName("a".repeat(100))).toHaveLength(64);
});

it("mã sinh ra hợp lệ theo luật của org", () => {
  expect(BRANCH_CODE_PATTERN.test(branchCodeFromName("Thử đóng"))).toBe(true);
  expect(BRANCH_CODE_PATTERN.test("A")).toBe(false);
  expect(BRANCH_CODE_PATTERN.test("a b")).toBe(false);
});
