import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET as readyzHandler } from "./route";

describe("Portal readyz route handler", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("1. Returns 200 ready when all dependencies (auth, org, integration) are healthy", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    } as unknown as Response);

    const res = await readyzHandler();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("ready");
    expect(data.dependencies).toEqual({
      auth: "ready",
      org: "ready",
      integration: "ready",
    });
    expect(JSON.stringify(data)).not.toContain("mock-bff");
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("2. Returns 503 degraded when a dependency (e.g. auth) fails or is unreachable", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("8080") || url.includes("auth")) {
        return Promise.reject(new Error("Connection refused"));
      }
      return Promise.resolve({
        ok: true,
        status: 200,
      } as unknown as Response);
    });

    const res = await readyzHandler();
    expect(res.status).toBe(503);

    const data = await res.json();
    expect(data.status).toBe("degraded");
    expect(data.dependencies.auth).toBe("unreachable");
    expect(data.dependencies.org).toBe("ready");
    expect(data.dependencies.integration).toBe("ready");
    expect(JSON.stringify(data)).not.toContain("mock-bff");
  });

  it("3. Returns 503 degraded when a dependency returns non-2xx status", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("8081") || url.includes("org")) {
        return Promise.resolve({
          ok: false,
          status: 500,
        } as unknown as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
      } as unknown as Response);
    });

    const res = await readyzHandler();
    expect(res.status).toBe(503);

    const data = await res.json();
    expect(data.status).toBe("degraded");
    expect(data.dependencies.org).toBe("unreachable");
  });
});
