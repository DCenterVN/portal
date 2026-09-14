import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as createTarget } from "./targets/route";
import { POST as placeOnShelf } from "../inventory/shelf-placements/route";
import { GET as getPublicTrace } from "../public/traceability/[trace_code]/route";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

function request(path: string, method: "GET" | "POST", body?: string, token = "jwt") {
  return new NextRequest(`http://localhost:3000${path}`, {
    method,
    headers: token ? { cookie: `access_token=${token}`, "content-type": "application/json" } : {},
    ...(body === undefined ? {} : { body }),
  });
}

describe("Production and Inventory BFF fail-closed forwarding", () => {
  it("rejects protected calls without contacting an upstream", async () => {
    global.fetch = vi.fn();
    const response = await createTarget(request("/api/production/targets", "POST", "{}", ""));
    expect(response.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON locally", async () => {
    global.fetch = vi.fn();
    const response = await createTarget(request("/api/production/targets", "POST", "{bad"));
    expect(response.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("keeps public traceability public", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ trace_code: "TRC-1", qc_status: "PASSED" }), {
      status: 200,
      headers: { "content-type": "application/json", "x-request-id": "trace-request" },
    }));
    const response = await getPublicTrace(
      request("/api/public/traceability/TRC-1", "GET", undefined, ""),
      { params: Promise.resolve({ trace_code: "TRC-1" }) },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("trace-request");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/public/traceability/TRC-1"),
      expect.objectContaining({ headers: expect.not.objectContaining({ Authorization: expect.anything() }) }),
    );
  });

  it("preserves Production business errors", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "state_conflict" }), {
      status: 409, headers: { "content-type": "application/json" },
    }));
    const response = await createTarget(request("/api/production/targets", "POST", "{}"));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: "state_conflict" });
  });

  it("forwards Inventory idempotency and authorization headers", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ trace_code: "TRC-2" }), {
      status: 201, headers: { "content-type": "application/json" },
    }));
    const req = request("/api/inventory/shelf-placements", "POST", JSON.stringify({
      finished_lot_ref: crypto.randomUUID(), branch_ref: crypto.randomUUID(), shelf_code: "A-01", placed_quantity: 1,
    }));
    req.headers.set("Idempotency-Key", "shelf-placement-key");
    const response = await placeOnShelf(req);
    expect(response.status).toBe(201);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/inventory/shelf-placements"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer jwt", "Idempotency-Key": "shelf-placement-key" }),
      }),
    );
  });

  it("returns 502 when an upstream is unavailable", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    const response = await placeOnShelf(request("/api/inventory/shelf-placements", "POST", "{}"));
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ error: "upstream_unavailable" });
  });
});
