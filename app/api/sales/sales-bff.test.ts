import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as createOrder } from "./orders/route";
import { POST as activateProduct } from "./products/[id]/activate/route";
import { POST as cancelOrder } from "./orders/[id]/cancel/route";

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; vi.restoreAllMocks(); });
function request(path: string, body?: string, token = "jwt") {
  return new NextRequest(`http://localhost:3000${path}`, { method: "POST", headers: token ? { cookie: `access_token=${token}`, "content-type": "application/json" } : {}, ...(body === undefined ? {} : { body }) });
}

describe("Sales BFF fail-closed forwarding", () => {
  it("rejects unauthenticated calls without contacting Sales", async () => {
    global.fetch = vi.fn();
    const response = await createOrder(request("/api/sales/orders", "{}", ""));
    expect(response.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON instead of retrying or fabricating data", async () => {
    global.fetch = vi.fn();
    const response = await createOrder(request("/api/sales/orders", "{bad"));
    expect(response.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it("preserves upstream business errors and body", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "state_conflict", message: "giỏ hàng không còn hoạt động" }), { status: 409, headers: { "content-type": "application/json" } }));
    const response = await createOrder(request("/api/sales/orders", JSON.stringify({ cart_ref: crypto.randomUUID() })));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: "state_conflict" });
  });
  it("returns 502 when Sales cannot be reached", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    const response = await createOrder(request("/api/sales/orders", JSON.stringify({ cart_ref: crypto.randomUUID() })));
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ error: "upstream_unavailable" });
  });
  it("allows activate with an empty body and forwards no fabricated payload", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "product-id", status: "ACTIVE" }), { status: 200, headers: { "content-type": "application/json" } }));
    const response = await activateProduct(request("/api/sales/products/product-id/activate"), { params: Promise.resolve({ id: "product-id" }) });
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/sales/products/product-id/activate"), expect.not.objectContaining({ body: expect.anything() }));
  });
  it("forwards the idempotency key on order cancellation", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "order-id", status: "CANCELLED" }), { status: 200, headers: { "content-type": "application/json" } }));
    const req = request("/api/sales/orders/order-id/cancel", JSON.stringify({ reason: "customer_request" }));
    req.headers.set("Idempotency-Key", "cancel-key");
    const response = await cancelOrder(req, { params: Promise.resolve({ id: "order-id" }) });
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/sales/orders/order-id/cancel"), expect.objectContaining({ headers: expect.objectContaining({ "Idempotency-Key": "cancel-key" }) }));
  });
});

describe("AC-5 BFF giỏ hàng forward branch_id", () => {
  const branch = "0198fd55-3f46-7a01-9e52-f4c0de000020";
  const sku = "0198fd55-3f46-7a01-9e52-f4c0de000002";
  const cartItems = async () => (await import("./carts/[cart_id]/items/route")).POST;
  const upstreamUrl = () => String(vi.mocked(global.fetch).mock.calls[0][0]);

  it("giữ query branch_id trên URL upstream", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { items: [] } }), { status: 201, headers: { "content-type": "application/json" } }));
    const post = await cartItems();
    const response = await post(request(`/api/sales/carts/cart-1/items?branch_id=${branch}`, JSON.stringify({ sku_ref: sku, quantity: 1 })), { params: Promise.resolve({ cart_id: "cart-1" }) });
    expect(response.status).toBe(201);
    const url = new URL(upstreamUrl());
    expect(url.pathname).toBe("/sales/carts/cart-1/items");
    expect(url.searchParams.get("branch_id")).toBe(branch);
  });

  it("không chuyển tiếp query lạ lên upstream", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 201, headers: { "content-type": "application/json" } }));
    const post = await cartItems();
    await post(request(`/api/sales/carts/cart-1/items?branch_id=${branch}&org_id=evil`, JSON.stringify({ sku_ref: sku, quantity: 1 })), { params: Promise.resolve({ cart_id: "cart-1" }) });
    expect(new URL(upstreamUrl()).searchParams.get("branch_id")).toBe(branch);
    expect(new URL(upstreamUrl()).searchParams.has("org_id")).toBe(false);
  });

  it("giữ nguyên lỗi 409 hết hàng của upstream", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "state_conflict", message: "hết hàng" }), { status: 409, headers: { "content-type": "application/json" } }));
    const post = await cartItems();
    const response = await post(request(`/api/sales/carts/cart-1/items?branch_id=${branch}`, JSON.stringify({ sku_ref: sku, quantity: 1 })), { params: Promise.resolve({ cart_id: "cart-1" }) });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: "state_conflict" });
    expect(new URL(upstreamUrl()).searchParams.get("branch_id")).toBe(branch);
  });
});
