import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { forwardSales } = vi.hoisted(() => ({
  forwardSales: vi.fn(async () => new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { "content-type": "application/json" } })),
}));
vi.mock("@/lib/api/sales-bff", () => ({ forwardSales }));

import { DELETE, PATCH } from "./route";

const validId = "123e4567-e89b-12d3-a456-426614174000";

describe("/api/sales/skus/[id]", () => {
  beforeEach(() => forwardSales.mockClear());

  it.each([".", "..", "bad-id"])("từ chối id không phải UUID %s với 400 trước khi gọi upstream", async bad => {
    const patchRes = await PATCH(new NextRequest(`http://localhost/api/sales/skus/${bad}`, { method: "PATCH" }), { params: Promise.resolve({ id: bad }) });
    const delRes = await DELETE(new NextRequest(`http://localhost/api/sales/skus/${bad}`, { method: "DELETE" }), { params: Promise.resolve({ id: bad }) });
    expect(patchRes.status).toBe(400);
    expect(delRes.status).toBe(400);
    expect(forwardSales).not.toHaveBeenCalled();
  });

  it("chuyển tiếp UUID hợp lệ cho PATCH và DELETE", async () => {
    const patchReq = new NextRequest(`http://localhost/api/sales/skus/${validId}`, { method: "PATCH" });
    const delReq = new NextRequest(`http://localhost/api/sales/skus/${validId}`, { method: "DELETE" });
    const patchRes = await PATCH(patchReq, { params: Promise.resolve({ id: validId }) });
    const delRes = await DELETE(delReq, { params: Promise.resolve({ id: validId }) });
    expect(patchRes.status).toBe(200);
    expect(delRes.status).toBe(200);
    expect(forwardSales).toHaveBeenNthCalledWith(1, patchReq, `/sales/skus/${validId}`, "PATCH");
    expect(forwardSales).toHaveBeenNthCalledWith(2, delReq, `/sales/skus/${validId}`, "DELETE");
  });
});
