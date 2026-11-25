import { describe, expect, it } from "vitest";
import { blockingCostErrors, costPreviewErrors } from "./precheck-cost";
import type { CostPreview, DishContent } from "./types";

const content = {
  schema_version: 1, name: "M", category_ref: "c", tags: [], servings: 2, reason: null, base: null,
  ingredients: [
    { row: "r1", sku_ref: "sku-a", quantity: "100", uom: "G", yield_pct: "100" },
    { row: "r2", sku_ref: "sku-b", quantity: "50", uom: "G", yield_pct: "100" },
    { row: "r3", sku_ref: "sku-a", quantity: "20", uom: "G", yield_pct: "100" },
  ],
  seasonings: [
    { row: "g1", slot: "GIA_VI_THEM", package_ref: "pkg-1", removable: false },
    { row: "g2", slot: "NUOC_CHAM", package_ref: "pkg-1", removable: false },
  ],
} as DishContent;

const line = (over: Partial<CostPreview["lines"][number]>): CostPreview["lines"][number] =>
  ({ sku_ref: "sku-a", name: "Muối tiêu hồng", quantity: "1", uom: "G", cost_vnd: 100, missing: null, ...over });
const preview = (lines: CostPreview["lines"], complete = false): CostPreview => ({ complete, total_vnd: 0, per_serving_vnd: 0, lines });

describe("costPreviewErrors", () => {
  it("complete và không thiếu dòng thì không có lỗi", () => {
    expect(costPreviewErrors(content, preview([line({})], true))).toEqual([]);
  });

  it("thiếu giá: khớp mọi dòng cùng sku_ref và liệt kê tên", () => {
    const errors = costPreviewErrors(content, preview([line({ cost_vnd: null, missing: "NO_PRICE" }), line({ sku_ref: "sku-b", name: "Cá bông biển", cost_vnd: null })]));
    expect(errors[0]).toEqual({ field: "cost", message: "Chưa có giá vốn cho: Muối tiêu hồng, Cá bông biển. Thêm báo giá nhà cung cấp hoặc nhập kho nguyên liệu trước khi hoàn tất." });
    expect(errors.slice(1)).toEqual([
      { row: "r1", field: "sku_ref", message: "Chưa có giá vốn — thêm báo giá nhà cung cấp hoặc nhập kho" },
      { row: "r3", field: "sku_ref", message: "Chưa có giá vốn — thêm báo giá nhà cung cấp hoặc nhập kho" },
      { row: "r2", field: "sku_ref", message: "Chưa có giá vốn — thêm báo giá nhà cung cấp hoặc nhập kho" },
    ]);
  });

  it("UOM_MISMATCH có thông báo riêng về khác đơn vị", () => {
    const errors = costPreviewErrors(content, preview([line({ missing: "UOM_MISMATCH", cost_vnd: null })]));
    expect(errors[0].message).toBe("Khác đơn vị tính giá vốn cho: Muối tiêu hồng. Cập nhật báo giá nhà cung cấp cùng đơn vị hoặc nhập kho.");
    expect(errors[1]).toEqual({ row: "r1", field: "sku_ref", message: "Có báo giá nhưng khác đơn vị — cập nhật báo giá cùng đơn vị hoặc nhập kho" });
  });

  it("NO_RECIPE từ gói gắn lỗi vào đúng dòng gia vị", () => {
    const errors = costPreviewErrors(content, preview([line({ sku_ref: "pkg-1", name: "Gói nước chấm", from: "PACKAGE", package_ref: "pkg-1", missing: "NO_RECIPE", cost_vnd: null })]));
    expect(errors[0]).toEqual({ field: "cost", message: "Chưa có công thức hiệu lực cho gói: Gói nước chấm." });
    expect(errors.slice(1)).toEqual([
      { row: "g1", field: "package_ref", message: "Gói nước chấm: Gói chưa có công thức hiệu lực" },
      { row: "g2", field: "package_ref", message: "Gói nước chấm: Gói chưa có công thức hiệu lực" },
    ]);
  });

  it("chưa complete nhưng không có dòng thiếu dùng thông báo chung", () => {
    expect(costPreviewErrors(content, preview([line({})]))).toEqual([
      { field: "cost", message: "Chưa đủ giá vốn nguyên liệu để hoàn tất món. Thêm báo giá nhà cung cấp hoặc nhập kho rồi thử lại." },
    ]);
  });

  it("dòng ingredients dùng G vẫn khớp khi preview trả KG", () => {
    const errors = costPreviewErrors(content, preview([line({ sku_ref: "sku-b", name: "Cá bông biển", uom: "KG", cost_vnd: null, missing: "NO_PRICE" })]));
    expect(errors.slice(1)).toEqual([{ row: "r2", field: "sku_ref", message: "Chưa có giá vốn — thêm báo giá nhà cung cấp hoặc nhập kho" }]);
  });

  it("một SKU có hai dòng khác hệ đơn vị: lỗi EA chỉ gắn vào dòng EA", () => {
    const mixed = { ...content, ingredients: [
      { row: "m1", sku_ref: "sku-a", quantity: "100", uom: "G", yield_pct: "100" },
      { row: "m2", sku_ref: "sku-a", quantity: "2", uom: "EA", yield_pct: "100" },
    ] } as DishContent;
    const errors = costPreviewErrors(mixed, preview([line({ uom: "EA", cost_vnd: null, missing: "UOM_MISMATCH" })]));
    expect(errors.slice(1)).toEqual([{ row: "m2", field: "sku_ref", message: "Có báo giá nhưng khác đơn vị — cập nhật báo giá cùng đơn vị hoặc nhập kho" }]);
  });

  it("một gói có hai nguyên liệu thiếu giá tạo hai lỗi cùng dòng gói và cùng field", () => {
    const single = { ...content, seasonings: [{ row: "g1", slot: "GIA_VI_THEM", package_ref: "pkg-1", removable: false }] } as DishContent;
    const errors = costPreviewErrors(single, preview([
      line({ sku_ref: "pkg-1", name: "Tỏi băm", from: "PACKAGE", package_ref: "pkg-1", cost_vnd: null, missing: "NO_PRICE" }),
      line({ sku_ref: "pkg-1", name: "Ớt xiêm", from: "PACKAGE", package_ref: "pkg-1", cost_vnd: null, missing: "NO_PRICE" }),
    ]));
    const rows = errors.slice(1);
    expect(rows).toEqual([
      { row: "g1", field: "package_ref", message: "Tỏi băm: Chưa có giá vốn — thêm báo giá nhà cung cấp hoặc nhập kho" },
      { row: "g1", field: "package_ref", message: "Ớt xiêm: Chưa có giá vốn — thêm báo giá nhà cung cấp hoặc nhập kho" },
    ]);
  });
});

describe("blockingCostErrors", () => {
  it("bỏ qua NO_PRICE nhưng vẫn chặn UOM_MISMATCH và NO_RECIPE", () => {
    expect(blockingCostErrors(content, preview([line({ missing: "NO_PRICE", cost_vnd: null })]))).toEqual([]);
    const blocking = blockingCostErrors(content, preview([
      line({ missing: "NO_PRICE", cost_vnd: null }),
      line({ sku_ref: "sku-b", missing: "UOM_MISMATCH", cost_vnd: null }),
      line({ sku_ref: "pkg-1", name: "Nước chấm", from: "PACKAGE", package_ref: "pkg-1", missing: "NO_RECIPE", cost_vnd: null }),
    ]));
    expect(blocking.slice(1)).toEqual([
      { row: "r2", field: "sku_ref", message: "Có báo giá nhưng khác đơn vị — cập nhật báo giá cùng đơn vị hoặc nhập kho" },
      { row: "g1", field: "package_ref", message: "Nước chấm: Gói chưa có công thức hiệu lực" },
      { row: "g2", field: "package_ref", message: "Nước chấm: Gói chưa có công thức hiệu lực" },
    ]);
  });
});
