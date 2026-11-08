import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { forwardService, serviceUrl } from "./service-bff";
afterEach(() => vi.unstubAllGlobals());
const options = { baseUrl: "http://inventory.test", path: "/inventory/suppliers", method: "POST" as const, unavailableMessage: "Kho không sẵn sàng" };
it("forward If-Match/key, không forward role; response luôn no-store", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ data: {} }, { status: 409 })); vi.stubGlobal("fetch", fetch);
  const request = new NextRequest("http://portal.test/api/inventory/suppliers", { method: "POST", headers: { cookie: "access_token=test-only", "If-Match": "3", "Idempotency-Key": "key", "X-Role": "ADMIN" }, body: "{}" });
  const response = await forwardService(request, options);
  expect(fetch.mock.calls[0][1].headers).toMatchObject({ "If-Match": "3", "Idempotency-Key": "key" });
  expect(fetch.mock.calls[0][1].headers).not.toHaveProperty("X-Role");
  expect(response.status).toBe(409);
  expect(response.headers.get("cache-control")).toBe("no-store");
});
it("thiếu cookie hoặc JSON sai không gọi upstream", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  expect((await forwardService(new NextRequest("http://portal.test", { method: "POST", body: "{}" }), options)).status).toBe(401);
  expect((await forwardService(new NextRequest("http://portal.test", { method: "POST", headers: { cookie: "access_token=test-only" }, body: "bad" }), options)).status).toBe(400);
  expect(fetch).not.toHaveBeenCalled();
});
it("thiếu env ở production báo lỗi nêu tên biến, ngoài production dùng localhost", () => {
  vi.stubEnv("ORG_INTERNAL_URL", ""); vi.stubEnv("ORG_SERVICE_URL", "");
  vi.stubEnv("NODE_ENV", "production");
  expect(() => serviceUrl("org")).toThrow("SERVICE_URL_MISSING: ORG_SERVICE_URL");
  vi.stubEnv("NODE_ENV", "development");
  expect(serviceUrl("org")).toBe("http://localhost:8081");
  vi.unstubAllEnvs();
});
