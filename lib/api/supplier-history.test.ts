import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { envelope, supplierID } from "@/mocks/supplier-contract";
import { getSupplierHistory } from "./supplier-history";
import { GET } from "@/app/api/inventory/suppliers/[id]/goods-receipts/route";
import { forwardInventory } from "./inventory-bff";

vi.mock("./inventory-bff", () => ({ forwardInventory: vi.fn().mockResolvedValue(new Response()) }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
const receipt = {
  id: supplierID, branch_ref: supplierID, supplier_ref: supplierID, status: "DRAFT",
  created_at: "2026-10-26T01:00:00Z", expected_at: "2026-10-27T01:00:00Z", completed_at: null,
  total_amount_vnd: 253, lines: [{ receipt_line_ref: supplierID, sku_ref: supplierID, uom: "KG", expected_quantity: "2.500", actual_quantity: "0.000", unit_cost_vnd: 101, expected_amount_vnd: 253, actual_amount_vnd: 0 }],
};
it("history đọc đúng envelope và snapshot từng dòng, truyền filter/cursor", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json(envelope({ items: [receipt], total: 1, next_cursor: "next" })));
  vi.stubGlobal("fetch", fetch);
  const result = await getSupplierHistory(supplierID, { cursor: "opaque+cursor", from: "2026-10-01", to: "2026-10-27" });
  expect(result.items[0].lines[0]).toEqual(receipt.lines[0]);
  const query = new URL(String(fetch.mock.calls[0][0])).searchParams;
  expect(Object.fromEntries(query)).toEqual({ page_size: "20", cursor: "opaque+cursor", from: "2026-10-01", to: "2026-10-27" });
  expect(result.next_cursor).toBe("next");
});
it("history giữ null legacy, giá 0 và từ chối body phẳng", async () => {
  const legacy = { ...receipt, lines: [{ ...receipt.lines[0], unit_cost_vnd: null, actual_amount_vnd: null }] };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json(envelope({ items: [legacy], total: 1, next_cursor: "" }))).mockResolvedValueOnce(Response.json({ items: [], total: 0, next_cursor: "" })));
  expect((await getSupplierHistory(supplierID)).items[0].lines[0].unit_cost_vnd).toBeNull();
  await expect(getSupplierHistory(supplierID)).rejects.toThrow();
});
it("history không biến lỗi quyền thành trang rỗng", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ errors: { error_code: "FORBIDDEN", message: "Không có quyền" } }, { status: 403 })));
  await expect(getSupplierHistory(supplierID)).rejects.toMatchObject({ status: 403 });
});
it("BFF chỉ forward query history cho phép, branch không lấy từ URL", async () => {
  await GET(new NextRequest(`http://localhost/api/inventory/suppliers/${supplierID}/goods-receipts?page_size=20&cursor=next&from=2026-10-01&to=2026-10-27&branch_ref=forged`), { params: Promise.resolve({ id: supplierID }) });
  expect(vi.mocked(forwardInventory).mock.calls[0].slice(1)).toEqual([`/inventory/suppliers/${supplierID}/goods-receipts?page_size=20&cursor=next&from=2026-10-01&to=2026-10-27`, "GET"]);
});
