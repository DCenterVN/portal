import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { envelope } from "@/mocks/supplier-contract";
import { getSupplierOverview, supplierOverviewSchema } from "./supplier-overview";
import { GET } from "@/app/api/inventory/suppliers/overview/route";

afterEach(() => vi.unstubAllGlobals());
const empty = {
  as_of: "2026-11-16T03:00:00Z",
  suppliers: { active: 0, suspended: 0 },
  price_coverage: { suppliers_with_active_price: 0, suppliers_without_active_price: 0, materials_priced: 0 },
  agreements: { draft: 0, expiring_within_14_days: 0 },
  receipts: { last_30_days: 0, last_received_at: null },
  attention: { expiring: [], without_price: [] },
};
it("đọc tổng quan qua envelope ở đường suppliers/overview", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json(envelope(empty)));
  vi.stubGlobal("fetch", fetch);
  expect(await getSupplierOverview()).toEqual(empty);
  expect(new URL(String(fetch.mock.calls[0][0])).pathname).toBe("/api/inventory/suppliers/overview");
});
it("ca rỗng hợp lệ: mọi số 0, hai danh sách rỗng, last_received_at là null", () => {
  expect(supplierOverviewSchema.parse(empty).receipts.last_received_at).toBeNull();
});
it("danh sách null được đọc thành mảng rỗng", () => {
  const parsed = supplierOverviewSchema.parse({ ...empty, attention: { expiring: null, without_price: null } });
  expect(parsed.attention).toEqual({ expiring: [], without_price: [] });
});
it("từ chối khi thiếu khối hoặc số âm", () => {
  expect(() => supplierOverviewSchema.parse({ ...empty, suppliers: undefined })).toThrow();
  expect(() => supplierOverviewSchema.parse({ ...empty, suppliers: { active: -1, suspended: 0 } })).toThrow();
});
it("BFF chuyển GET tới đường kho suppliers/overview", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json(envelope(empty)));
  vi.stubGlobal("fetch", fetch);
  const result = await GET(new NextRequest("http://portal.test/api/inventory/suppliers/overview?url=http://attacker", { headers: { cookie: "access_token=test-only" } }));
  expect(new URL(String(fetch.mock.calls[0][0])).pathname).toBe("/inventory/suppliers/overview");
  expect(new URL(String(fetch.mock.calls[0][0])).search).toBe("");
  expect(result.headers.get("cache-control")).toBe("no-store");
});
