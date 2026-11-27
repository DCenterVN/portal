import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const original = global.fetch;
afterEach(() => { global.fetch = original; });
const get = (path: string) => new NextRequest(`http://localhost:3000${path}`, { headers: { cookie: "access_token=jwt" } });

it.each([
  ["inventory-lots", "lot-1", () => import("./inventory-lots/[id]/route")],
  ["inbound-qc-inspections", "ins-1", () => import("./inbound-qc-inspections/[id]/route")],
  ["goods-receipts", "gr-1", () => import("./goods-receipts/[id]/route")],
])("GET %s/{id} chuyển tiếp đúng đường dẫn", async (name, id, load) => {
  global.fetch = vi.fn().mockResolvedValue(Response.json({ data: { id } }));
  const { GET } = await load();
  const response = await GET(get(`/api/inventory/${name}/${id}`), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(200);
  expect(new URL(String(vi.mocked(global.fetch).mock.calls[0][0])).pathname).toBe(`/inventory/${name}/${id}`);
});
