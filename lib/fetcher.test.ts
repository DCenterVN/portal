import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetcher, mutationFetcher, apiFetch, FetchError } from "./fetcher";

describe("fetcher and apiFetch", () => {
  const originalFetch = global.fetch;

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
    expect(mockFetch).toHaveBeenCalledWith("/api/branches/123", undefined);
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
    expect(mockFetch).toHaveBeenNthCalledWith(1, "/api/branches/456", undefined);
    expect(mockFetch).toHaveBeenNthCalledWith(2, "/api/auth/refresh", { method: "POST" });
    expect(mockFetch).toHaveBeenNthCalledWith(3, "/api/branches/456", undefined);
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
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/refresh", { method: "POST" });
  });

  it("Ca 4: Hai request 401 song song -> chi 1 lan refresh (single-flight)", async () => {
    let refreshCallCount = 0;

    const mockFetch = vi.fn().mockImplementation(async (url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : String(url);

      if (urlStr === "/api/auth/refresh") {
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
    expect(mockFetch).not.toHaveBeenCalledWith("/api/auth/refresh", expect.anything());
  });
});

describe("mutationFetcher", () => {
  const originalFetch = global.fetch;

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
    expect(global.fetch).toHaveBeenCalledWith("/api/operations/test-op", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(bodyArg),
    });
  });
});
