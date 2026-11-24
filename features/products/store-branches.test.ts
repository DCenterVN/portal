import { expect, it } from "vitest";
import { storeBranches } from "./store-branches";

const row = (id: string, name: string, type: string) => ({ id, code: name.toUpperCase(), name, type });
const body = (items: unknown[]) => ({ code: 200, status: "success", message: "OK", data: { items } });
const id = (n: number) => `01a1b3df-926f-706d-94bf-c8732f79b3${String(10 + n)}`;

it("cửa hàng đứng trước bếp, mỗi nhóm xếp theo tên, loại hiện bằng chữ tiếng Việt", () => {
  const result = storeBranches(body([row(id(1), "Sunny", "CENTRAL_KITCHEN"), row(id(2), "Cửa hàng Thủ Đức", "STORE"), row(id(3), "Cửa hàng Cầu Giấy", "STORE"), row(id(4), "Tổng kho", "WAREHOUSE")]));
  expect(result).toEqual([
    { id: id(3), name: "Cửa hàng Cầu Giấy", kind: "Cửa hàng" },
    { id: id(2), name: "Cửa hàng Thủ Đức", kind: "Cửa hàng" },
    { id: id(1), name: "Sunny", kind: "Bếp trung tâm" },
    { id: id(4), name: "Tổng kho", kind: "Chi nhánh" },
  ]);
});
it("không để lộ mã hay trường nội bộ", () => {
  const [first] = storeBranches(body([{ ...row(id(1), "A", "STORE"), status: "ACTIVE", secret: "x" }]));
  expect(Object.keys(first).sort()).toEqual(["id", "kind", "name"]);
});
it("danh sách rỗng là rỗng, không phải lỗi", () => {
  expect(storeBranches(body([]))).toEqual([]);
});
it.each([null, {}, { code: 200, status: "success", message: "OK", data: {} }, body([{ id: "x", name: "A", type: "STORE" }])])("hình dạng sai thì báo lỗi: %j", bad => {
  expect(() => storeBranches(bad)).toThrow();
});
