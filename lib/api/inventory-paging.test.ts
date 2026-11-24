import { afterEach, expect, it, vi } from "vitest";
import { envelope, supplierID } from "@/mocks/supplier-contract";
import { getBranchLots, getStockRows } from "./stock-transfers";
import { getShelfPlacementsPage } from "./production";

afterEach(() => vi.unstubAllGlobals());
const queryOf = (url: unknown) => new URL(String(url), "http://portal").searchParams;
const stock = (n: number) => ({ sku_ref: supplierID, branch_ref: supplierID, available_quantity: n, uom: "KG" });
const lot = (id: string) => ({ id, sku_ref: supplierID, branch_ref: supplierID, supplier_lot_code: "LO", remaining_quantity: 1, uom: "KG", expires_at: "2026-12-01T00:00:00Z", status: "APPROVED" });
const reply = (fetch: ReturnType<typeof vi.fn>, ...pages: unknown[]) => { for (const page of pages) fetch.mockResolvedValueOnce(Response.json(envelope(page))); vi.stubGlobal("fetch", fetch); };

it("tồn kho đọc hết các trang, mỗi lần tối đa 100 dòng", async () => {
  const fetch = vi.fn();
  reply(fetch, { items: [stock(1)], next_cursor: "c2" }, { items: [stock(2)], next_cursor: "" });
  const rows = await getStockRows(supplierID);
  expect(rows.map(row => row.available_quantity)).toEqual([1, 2]);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(queryOf(fetch.mock.calls[0][0]).get("page_size")).toBe("100");
  expect(queryOf(fetch.mock.calls[1][0]).get("cursor")).toBe("c2");
});

it("lô của chi nhánh đọc hết các trang và không xin quá 100 dòng", async () => {
  const fetch = vi.fn();
  reply(fetch, { items: [lot("0198fd55-3f46-7a01-9e52-f4c0de000001")], next_cursor: "c2" }, { items: [lot("0198fd55-3f46-7a01-9e52-f4c0de000002")], next_cursor: null });
  expect(await getBranchLots(supplierID)).toHaveLength(2);
  expect(queryOf(fetch.mock.calls[0][0]).get("page_size")).toBe("100");
});

it("kệ hàng đi theo con trỏ trang", async () => {
  const fetch = vi.fn();
  reply(fetch, { items: [{ id: "k1", shelf_code: "KE-1", trace_code: "QR-1", status: "PLACED", available_quantity: 1, placed_quantity: 1, uom: "EA" }], next_cursor: "k2" });
  const page = await getShelfPlacementsPage("k1");
  expect(queryOf(fetch.mock.calls[0][0]).get("cursor")).toBe("k1");
  expect(page.items).toHaveLength(1);
  expect(page.next_cursor).toBe("k2");
});
