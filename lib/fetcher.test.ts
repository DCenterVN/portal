import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetcher, mutationFetcher, apiFetch, FetchError } from "./fetcher";
import { isEmployeeRoute } from "./fetcher";

it.each(["/inventory/suppliers", "/inventory/suppliers/detail", "/inventory/goods-receipts/new"])("supplier employee route %s", path => {
  expect(isEmployeeRoute(path)).toBe(true);
  expect(isEmployeeRoute(`${path}-lookalike`)).toBe(path.includes("/suppliers/"));
});

describe("fetcher and apiFetch", () => {
  const originalFetch = global.fetch;
  const serverUrl = (path: string) => new URL(path, "http://127.0.0.1:3000");

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("Ca 1: 200 -> khong goi refresh, fetch duoc goi dung 1 lan", async () => {
    const mockData = { id: "123", name: "Chi nhánh Hà Nội" };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    } as unknown as Response);
    global.fetch = mockFetch;

    const result = await fetcher<typeof mockData>("/api/branches/123");
    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(serverUrl("/api/branches/123"), undefined);
  });

  it("Ca 2: 401 -> refresh OK -> retry thanh cong (3 lan goi fetch theo thu tu)", async () => {
    const retryData = { id: "456", name: "Chi nhánh TP.HCM" };
    const mockFetch = vi.fn()
      // 1st call: original request -> 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ message: "Token expired" }),
      } as unknown as Response)
      // 2nd call: /api/auth/refresh -> 200 OK
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: "new-token" }),
      } as unknown as Response)
      // 3rd call: retried original request -> 200 OK
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => retryData,
      } as unknown as Response);

    global.fetch = mockFetch;

    const result = await fetcher<typeof retryData>("/api/branches/456");
    expect(result).toEqual(retryData);
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch).toHaveBeenNthCalledWith(1, serverUrl("/api/branches/456"), undefined);
    expect(mockFetch).toHaveBeenNthCalledWith(2, serverUrl("/api/auth/refresh"), { method: "POST" });
    expect(mockFetch).toHaveBeenNthCalledWith(3, serverUrl("/api/branches/456"), undefined);
  });

  it("Ca 3: 401 -> refresh cung hong -> khong retry vo han", async () => {
    const mockFetch = vi.fn()
      // 1st call: original request -> 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ message: "Token expired" }),
      } as unknown as Response)
      // 2nd call: /api/auth/refresh -> 401 Failed
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ message: "Refresh token invalid" }),
      } as unknown as Response);

    global.fetch = mockFetch;

    await expect(fetcher("/api/branches/secret")).rejects.toThrow(FetchError);
    // Should call initial request (1) + refresh (2), and stop cleanly (<= 3 calls)
    expect(mockFetch.mock.calls.length).toBeLessThanOrEqual(3);
    expect(mockFetch).toHaveBeenCalledWith(serverUrl("/api/auth/refresh"), { method: "POST" });
  });

  it("Ca 4: Hai request 401 song song -> chi 1 lan refresh (single-flight)", async () => {
    let refreshCallCount = 0;

    const mockFetch = vi.fn().mockImplementation(async (url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : String(url);

      if (urlStr.endsWith("/api/auth/refresh")) {
        refreshCallCount++;
        // Simulate network latency for refresh
        await new Promise((resolve) => setTimeout(resolve, 30));
        return {
          ok: true,
          status: 200,
          json: async () => ({ access_token: "refreshed-token" }),
        } as unknown as Response;
      }

      if (urlStr.includes("/api/resource-1") || urlStr.includes("/api/resource-2")) {
        // If refresh has happened, return 200 OK
        if (refreshCallCount > 0) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ success: true, url: urlStr }),
          } as unknown as Response;
        }
        // First attempt -> 401
        return {
          ok: false,
          status: 401,
          statusText: "Unauthorized",
          json: async () => ({ message: "Unauthorized" }),
        } as unknown as Response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({}),
      } as unknown as Response;
    });

    global.fetch = mockFetch;

    // Trigger two 401 requests in parallel
    const [res1, res2] = await Promise.all([
      fetcher<{ success: boolean; url: string }>("/api/resource-1"),
      fetcher<{ success: boolean; url: string }>("/api/resource-2"),
    ]);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    // CRITICAL: refresh must only be called ONCE
    expect(refreshCallCount).toBe(1);
  });

  it("should throw FetchError on 400 Bad Request", async () => {
    const errorPayload = { message: "Invalid branch ID", code: "VALIDATION_FAILED" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => errorPayload,
    } as unknown as Response);

    await expect(fetcher("/api/branches/invalid")).rejects.toThrow(FetchError);
  });

  it("should handle error response when body is not json", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      json: async () => {
        throw new Error("Cannot parse JSON");
      },
    } as unknown as Response);

    await expect(fetcher("/api/health")).rejects.toThrow("Bad Gateway");
  });

  it("apiFetch does not refresh for exempt auth endpoints", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "invalid_credentials" }),
    } as unknown as Response);
    global.fetch = mockFetch;

    const res = await apiFetch("/api/auth/login", { method: "POST" });
    expect(res.status).toBe(401);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).not.toHaveBeenCalledWith(serverUrl("/api/auth/refresh"), expect.anything());
  });
});

describe("mutationFetcher", () => {
  const originalFetch = global.fetch;
  const serverUrl = (path: string) => new URL(path, "http://127.0.0.1:3000");

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should send POST request with JSON body", async () => {
    const mockResponse = { ok: true, operationId: "op-1" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as unknown as Response);

    const bodyArg = { reason: "test", environment: "dev" };
    const result = await mutationFetcher("/api/operations/test-op", { arg: bodyArg });

    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(serverUrl("/api/operations/test-op"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(bodyArg),
    });
  });
});

describe("S15 route-family refresh redirects",()=>{
 afterEach(()=>vi.unstubAllGlobals());
 it.each([["/console/orders","/staff/login"],["/staff/switch-org","/staff/login"],["/me","/login"],["/orders","/login"]])("failed refresh from %s goes to %s",async(path,login)=>{const location={pathname:path,href:""};vi.stubGlobal("window",{location});const fetch=vi.fn().mockResolvedValue(new Response("{}",{status:401}));vi.stubGlobal("fetch",fetch);await apiFetch("/api/protected");expect(location.href).toBe(`${login}?redirect=${encodeURIComponent(path)}`);expect(fetch).toHaveBeenCalledTimes(2);});
 it.each(["/api/auth/staff/login","/api/auth/staff/forgot","/api/auth/staff/reset","/api/auth/staff/invite/accept","/api/auth/activate/resend"])("public auth mutation %s never refreshes or redirects on 401",async path=>{const location={pathname:"/staff/login",href:""};vi.stubGlobal("window",{location});const fetch=vi.fn().mockResolvedValue(new Response("{}",{status:401}));vi.stubGlobal("fetch",fetch);await apiFetch(path,{method:"POST"});expect(fetch).toHaveBeenCalledTimes(1);expect(location.href).toBe("");});
 it.each(["/api/auth/staff/switch-org","/api/auth/staff/switch-branch","/api/auth/login-evil"])("protected endpoint %s still refreshes",async path=>{vi.stubGlobal("fetch",vi.fn().mockResolvedValueOnce(new Response("{}",{status:401})).mockResolvedValueOnce(new Response("{}")).mockResolvedValueOnce(new Response("{}")));expect((await apiFetch(path)).status).toBe(200);expect(fetch).toHaveBeenCalledTimes(3);});
 it.each(["/login","/staff/login"])("already at %s never redirects into loop",async path=>{const location={pathname:path,href:""};vi.stubGlobal("window",{location});vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response("{}",{status:401})));await apiFetch("/api/protected");expect(location.href).toBe("");});
});

import {readdirSync} from "node:fs";
import {join, relative} from "node:path";
const consoleRoot = join(process.cwd(), "app/(console)");
function consolePages(dir: string): string[] {
 return readdirSync(dir,{withFileTypes:true}).flatMap(entry => entry.isDirectory() ? consolePages(join(dir,entry.name)) : entry.name === "page.tsx" ? ["/" + relative(consoleRoot,dir).replaceAll("\\","/")] : []);
}
describe("review R3 actual console refresh family", () => {
 afterEach(()=>vi.unstubAllGlobals());
 it.each([...consolePages(consoleRoot),"/platform","/platform/role-matrix","/switch-branch","/switch-org"])("R3 failed refresh from %s uses staff login", async path => {
  const location={pathname:path,href:""};vi.stubGlobal("window",{location});vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response("{}",{status:401})));
  await apiFetch("/api/protected");expect(location.href).toBe("/staff/login?redirect="+encodeURIComponent(path));
 });
});

 it.each([[429,"rate_limit_exceeded"],[403,"FORBIDDEN"],[400,"invalid_token"]])("D-142 shared fetcher exposes public status/code %s %s",async(status,code)=>{
  const original=global.fetch;
  try {global.fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({error:code,message:"invalid or expired token"}),{status}));
   await expect(fetcher("/api/auth/login")).rejects.toMatchObject({status,code});
  } finally {global.fetch=original;}
 });
