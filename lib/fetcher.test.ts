import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetcher, mutationFetcher, FetchError } from "./fetcher";

describe("fetcher", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should fetch and parse JSON on successful 200 response", async () => {
    const mockData = { id: "123", name: "Resort Alpha" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    } as unknown as Response);

    const result = await fetcher<typeof mockData>("/api/resorts/123");
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith("/api/resorts/123", undefined);
  });

  it("should throw FetchError on 400 Bad Request", async () => {
    const errorPayload = { message: "Invalid resort ID", code: "VALIDATION_FAILED" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => errorPayload,
    } as unknown as Response);

    await expect(fetcher("/api/resorts/invalid")).rejects.toThrow(FetchError);
    await expect(fetcher("/api/resorts/invalid")).rejects.toMatchObject({
      message: "Invalid resort ID",
      status: 400,
      info: errorPayload,
    });
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
