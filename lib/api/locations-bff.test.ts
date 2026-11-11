import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as provinces } from "@/app/api/locations/provinces/route";
import { GET as communes } from "@/app/api/locations/provinces/[code]/communes/route";
import { GET as detail } from "@/app/api/sales/orders/[id]/route";
import { POST as cancel } from "@/app/api/sales/orders/[id]/cancel/route";
import { getLocations } from "./locations";
import { proxy } from "@/proxy";

vi.mock("@/lib/api/auth-journey-bff", () => ({ AUTH_FORBIDDEN_ERROR: { error: "forbidden" } }));

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => { vi.stubGlobal("fetch", fetchMock); vi.stubEnv("INTEGRATION_INTERNAL_URL", "http://integration:8082"); vi.stubEnv("SALES_INTERNAL_URL", "http://sales:8086"); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); fetchMock.mockReset(); });
it("tỉnh/xã public, dùng integration env và trả raw array đúng contract", async () => {
  const rows = [{ code: "01", name: "Hà Nội" }];
  fetchMock.mockImplementation(async () => Response.json(rows));
  const request = new NextRequest("http://portal/api/locations/provinces");
  expect(proxy(request).headers.get("x-middleware-next")).toBe("1");
  expect(await (await provinces(request)).json()).toEqual(rows);
  expect(await (await communes(request, { params: Promise.resolve({ code: "01" }) })).json()).toEqual(rows);
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(["http://integration:8082/locations/vn/provinces", "http://integration:8082/locations/vn/provinces/01/communes"]);
  for (const [, init] of fetchMock.mock.calls) {
    expect(init?.method).toBe("GET");
    expect(new Headers(init?.headers).has("Authorization")).toBe(false);
  }
  expect(await getLocations("/api/locations/provinces")).toEqual(rows);
});
it.each(["html", "offline"])("lỗi %s luôn trả JSON", async kind => {
  fetchMock.mockImplementation(async () => {
    if (kind === "offline") throw new Error("offline");
    return new Response("<html>Bad gateway</html>", { status: 502, headers: { "content-type": "text/html" } });
  });
  const response = await provinces(new NextRequest("http://portal/api/locations/provinces"));
  expect(response.status).toBe(502);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(await response.json()).toMatchObject({ error: "upstream_unavailable" });
});
it("detail/cancel BFF giữ nguyên toàn bộ query và key", async () => {
  fetchMock.mockImplementation(async () => Response.json({}));
  const query = "?branch_id=branch&page_size=50";
  const headers = { cookie: "access_token=customer", "Idempotency-Key": "cancel-key", "Content-Type": "application/json" };
  await detail(new NextRequest(`http://portal/api/sales/orders/order${query}`, { headers }), { params: Promise.resolve({ id: "order" }) });
  await cancel(new NextRequest(`http://portal/api/sales/orders/order/cancel${query}`, { method: "POST", headers, body: JSON.stringify({ reason: "Đổi ý" }) }), { params: Promise.resolve({ id: "order" }) });
  expect(fetchMock.mock.calls[0][0]).toBe(`http://sales:8086/sales/orders/order${query}`);
  expect(fetchMock.mock.calls[1][0]).toBe(`http://sales:8086/sales/orders/order/cancel${query}`);
  expect(new Headers(fetchMock.mock.calls[1][1]?.headers).get("Idempotency-Key")).toBe("cancel-key");
});
