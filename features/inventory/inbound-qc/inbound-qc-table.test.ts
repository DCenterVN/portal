import { expect, it } from "vitest";
import { lotListKey, lotListQuery, lotTableState } from "./inbound-qc-table";

it("địa chỉ thành trạng thái bảng: mã lô, trạng thái, trang, cỡ trang", () => {
  const state = lotTableState("q=LO-7&f.status=UNDER_QC&page=3&size=20");
  expect(lotListQuery(state)).toEqual({ status: "UNDER_QC", q: "LO-7", page: 3, limit: 20 });
  expect(lotListKey(state)).toBe("page=3&limit=20&status=UNDER_QC&q=LO-7");
});

it("địa chỉ trống là trang 1, 10 dòng, lô Đã nhận; chọn trạng thái khác cập nhật query; trang sai về 1", () => {
  expect(lotListQuery(lotTableState(""))).toEqual({ status: "RECEIVED", q: "", page: 1, limit: 10 });
  expect(lotListQuery(lotTableState("f.status=APPROVED"))).toEqual({ status: "APPROVED", q: "", page: 1, limit: 10 });
  expect(lotListQuery(lotTableState("f.status=UNDER_QC"))).toEqual({ status: "UNDER_QC", q: "", page: 1, limit: 10 });
  expect(lotTableState("page=abc&size=7").page).toBe(1);
  expect(lotTableState("size=7").pageSize).toBe(10);
});
