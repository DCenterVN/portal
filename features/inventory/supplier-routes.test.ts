import { expect, it } from "vitest";
import { legacySupplierPath, supplierHref, supplierSection } from "./supplier-routes";

const id = "11111111-1111-4111-8111-111111111111";

it("đổi đường dẫn cũ sang đường mới", () => {
  expect(legacySupplierPath(id, { tab: "receipts" })).toBe(`/inventory/suppliers/${id}/receipts`);
  expect(legacySupplierPath(id, { tab: "overview" })).toBe(`/inventory/suppliers/${id}/info`);
  expect(legacySupplierPath(id, { tab: "agreements" })).toBe(`/inventory/suppliers/${id}`);
  expect(legacySupplierPath(id, { edit: "1" })).toBe(`/inventory/suppliers/${id}/edit`);
  expect(legacySupplierPath(id, { tab: "agreements", new: "1" })).toBe(`/inventory/suppliers/${id}/prices/new`);
  expect(legacySupplierPath(id, {})).toBeNull();
  expect(legacySupplierPath(id, { tab: "lạ" })).toBeNull();
});

it("tab sáng đúng theo đường dẫn", () => {
  expect(supplierSection(`/inventory/suppliers/${id}`, id).tab).toBe("agreements");
  expect(supplierSection(`/inventory/suppliers/${id}/receipts`, id).tab).toBe("receipts");
  expect(supplierSection(`/inventory/suppliers/${id}/info`, id).tab).toBe("overview");
  expect(supplierSection(`/inventory/suppliers/${id}/edit`, id)).toEqual({ tab: "overview", label: "Sửa thông tin" });
  expect(supplierSection(`/inventory/suppliers/${id}/prices/new`, id).label).toBe("Thêm bảng giá");
  expect(supplierSection(`/inventory/suppliers/${id}/prices/abc`, id).tab).toBe("agreements");
  expect(supplierSection(null, id).tab).toBe("agreements");
});

it("link trỏ đúng đường mới", () => {
  expect(supplierHref.price(id, "a b")).toBe(`/inventory/suppliers/${id}/prices/a%20b`);
  expect(supplierHref.create).toBe("/inventory/suppliers/new");
});
