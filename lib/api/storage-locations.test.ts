import { expect, it } from "vitest";
import { locationParams, normalizeLocationCode } from "./storage-locations";

it("mã tự viết hoa, bỏ ký tự lạ, cắt ở 32", () => {
  expect(normalizeLocationCode("kho lạnh_1-a")).toBe("KHOLNH1-A");
  expect(normalizeLocationCode("a".repeat(40))).toBe("A".repeat(32));
});

it("tham số danh sách: trang, số dòng, khu, đang dùng, tìm", () => {
  const query = locationParams({ q: "kho", zone: "COLD", active: false, page: 2, limit: 10 });
  expect(Object.fromEntries(query)).toEqual({ page: "2", limit: "10", q: "kho", zone: "COLD", active: "false" });
  expect(Object.fromEntries(locationParams())).toEqual({ page: "1", limit: "20" });
});
