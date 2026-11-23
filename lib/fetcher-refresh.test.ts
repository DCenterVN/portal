import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const res = (status: number) => new Response("{}", { status });

function stubLocks(request?: (name: string, run: () => Promise<unknown>) => Promise<unknown>) {
  let queue: Promise<unknown> = Promise.resolve();
  const serial = (_name: string, run: () => Promise<unknown>) => (queue = queue.then(run, run));
  vi.stubGlobal("navigator", { locks: { request: request ?? serial } });
}

function stubStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) });
}

async function load() {
  vi.resetModules();
  return import("./fetcher");
}

describe("refresh hardening", () => {
  const originalFetch = global.fetch;
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("no CSRF-Token cookie -> no refresh request", async () => {
    vi.stubGlobal("document", { cookie: "theme=dark" });
    const fetchMock = vi.fn(async () => res(401));
    global.fetch = fetchMock as typeof fetch;
    const { doRefresh } = await load();
    expect(await doRefresh()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("guest loading the store frame sends no refresh, a signed-in user does", async () => {
    const fetchMock = vi.fn(async () => res(401));
    global.fetch = fetchMock as typeof fetch;
    vi.resetModules();
    const { fetchStoreUser } = await import("@/features/store/store-frame");
    vi.stubGlobal("document", { cookie: "" });
    await expect(fetchStoreUser(vi.fn(async () => res(401)))).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(0);
    vi.stubGlobal("document", { cookie: "a=b; CSRF-Token=xyz" });
    await fetchStoreUser(vi.fn(async () => res(401)));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refresh call carries a timeout signal", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const fetchMock = vi.fn(async (_url: unknown, _init?: RequestInit) => res(200));
    global.fetch = fetchMock as typeof fetch;
    const { doRefresh } = await load();
    await doRefresh();
    expect(timeout).toHaveBeenCalledWith(15_000);
    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("rejected navigator.locks falls back to an unlocked refresh without throwing", async () => {
    stubLocks(() => Promise.reject(new Error("denied")));
    let refreshed = false;
    global.fetch = vi.fn(async (url: unknown) => {
      if (String(url).endsWith("/api/auth/refresh")) { refreshed = true; return res(200); }
      return res(refreshed ? 200 : 401);
    }) as typeof fetch;
    const { apiFetch } = await load();
    expect((await apiFetch("/api/x")).status).toBe(200);
  });

  it("refresh 503 is retried with growing waits and recovers", async () => {
    let refreshCalls = 0;
    global.fetch = vi.fn(async (url: unknown) => {
      if (String(url).endsWith("/api/auth/refresh")) return res(++refreshCalls < 3 ? 503 : 200);
      return res(refreshCalls >= 3 ? 200 : 401);
    }) as typeof fetch;
    const { apiFetch } = await load();
    const pending = apiFetch("/api/x");
    await vi.advanceTimersByTimeAsync(2000);
    expect((await pending).status).toBe(200);
    expect(refreshCalls).toBe(3);
  });

  it("refresh 503 every time -> temporary error after 3 tries, no redirect to login", async () => {
    const status = 503;
    const location = { pathname: "/console", href: "" };
    vi.stubGlobal("window", { location });
    let refreshCalls = 0;
    global.fetch = vi.fn(async (url: unknown) => {
      if (String(url).endsWith("/api/auth/refresh")) { refreshCalls++; return res(status); }
      return res(401);
    }) as typeof fetch;
    const { apiFetch } = await load();
    const pending = apiFetch("/api/x");
    await vi.advanceTimersByTimeAsync(5000);
    expect((await pending).status).toBe(503);
    expect(refreshCalls).toBe(3);
    expect(location.href).toBe("");
  });

  it.each([
    ["429", () => Promise.resolve(res(429))],
    ["504", () => Promise.resolve(res(504))],
    ["502", () => Promise.resolve(res(502))],
    ["a non-JSON 500", () => Promise.resolve(new Response("<html>oops</html>", { status: 500, headers: { "content-type": "text/html" } }))],
    ["a network error", () => Promise.reject(new TypeError("offline"))],
  ])("refresh %s is never resent and is not a lost session", async (_kind, outcome) => {
    const location = { pathname: "/console", href: "" };
    vi.stubGlobal("window", { location });
    let refreshCalls = 0;
    global.fetch = vi.fn(async (url: unknown) => {
      if (String(url).endsWith("/api/auth/refresh")) { refreshCalls++; return outcome(); }
      return res(401);
    }) as typeof fetch;
    const { apiFetch } = await load();
    const pending = apiFetch("/api/x");
    await vi.advanceTimersByTimeAsync(5000);
    expect((await pending).status).toBe(503);
    expect(refreshCalls).toBe(1);
    expect(location.href).toBe("");
  });

  it("timeout comes from NEXT_PUBLIC_AUTH_REFRESH_TIMEOUT_MS", async () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH_REFRESH_TIMEOUT_MS", "1234");
    const timeout = vi.spyOn(AbortSignal, "timeout");
    global.fetch = vi.fn(async () => res(200)) as typeof fetch;
    const { doRefresh } = await load();
    await doRefresh();
    expect(timeout).toHaveBeenCalledWith(1234);
  });

  it("a refresh stamp from the future is ignored", async () => {
    stubStorage();
    localStorage.setItem("auth:refreshed-at", String(Date.now() + 3_600_000));
    const fetchMock = vi.fn(async () => res(200));
    global.fetch = fetchMock as typeof fetch;
    const { doRefresh } = await load();
    expect(await doRefresh()).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  describe("one token rotation at a time inside a tab", () => {
    function rotationProbe() {
      const state = { inFlight: 0, max: 0, refreshCalls: 0, release: [] as (() => void)[] };
      global.fetch = vi.fn(async (url: unknown) => {
        const path = String(url);
        if (!path.endsWith("/api/auth/refresh") && !path.endsWith("/api/auth/web/switch-branch")) return res(state.refreshCalls ? 200 : 401);
        if (path.endsWith("/api/auth/refresh")) state.refreshCalls++;
        state.inFlight++;
        state.max = Math.max(state.max, state.inFlight);
        await new Promise<void>((resolve) => state.release.push(resolve));
        state.inFlight--;
        return res(200);
      }) as typeof fetch;
      return state;
    }
    const drain = async (state: ReturnType<typeof rotationProbe>, times: number) => {
      for (let i = 0; i < times; i++) {
        await vi.advanceTimersByTimeAsync(50);
        state.release.splice(0).forEach((resolve) => resolve());
      }
    };

    it("switching branch while a refresh runs", async () => {
      stubLocks();
      stubStorage();
      const state = rotationProbe();
      const { apiFetch } = await load();
      const { switchBranch } = await import("@/features/console/use-branch-switch");
      const first = apiFetch("/api/x");
      await vi.advanceTimersByTimeAsync(50);
      const switching = switchBranch("b1");
      await drain(state, 4);
      await Promise.all([first, switching]);
      expect(state.max).toBe(1);
    });

    it("a 401 on another request while switching branch", async () => {
      stubLocks();
      stubStorage();
      const state = rotationProbe();
      const { apiFetch } = await load();
      const { switchBranch } = await import("@/features/console/use-branch-switch");
      const switching = switchBranch("b1");
      await vi.advanceTimersByTimeAsync(50);
      const other = apiFetch("/api/x");
      await drain(state, 4);
      await Promise.all([switching, other]);
      expect(state.max).toBe(1);
    });

    it("a 401 on the switch-branch call itself does not start a nested refresh", async () => {
      stubLocks();
      stubStorage();
      const fetchMock = vi.fn(async () => res(401));
      global.fetch = fetchMock as typeof fetch;
      const { switchBranch } = await import("@/features/console/use-branch-switch");
      await expect(switchBranch("b1")).rejects.toThrow();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it.each([401, 403])("refresh %i -> login", async (status) => {
    const location = { pathname: "/console", href: "" };
    vi.stubGlobal("window", { location });
    global.fetch = vi.fn(async (url: unknown) => String(url).endsWith("/api/auth/refresh") ? res(status) : res(401)) as typeof fetch;
    const { apiFetch } = await load();
    expect((await apiFetch("/api/x")).status).toBe(401);
    expect(location.href).toContain("/staff/login");
  });

  it("branch switch takes the refresh lock and stamps the rotation", async () => {
    stubLocks();
    stubStorage();
    const { withRefreshLock, doRefresh } = await load();
    const { switchBranch } = await import("@/features/console/use-branch-switch");
    const since = Date.now();
    let release!: () => void;
    const holder = withRefreshLock(() => new Promise<void>((resolve) => { release = resolve; }));
    const fetchMock = vi.fn(async () => res(200));
    global.fetch = fetchMock as typeof fetch;
    const switching = switchBranch("b1");
    await vi.advanceTimersByTimeAsync(100);
    expect(fetchMock).not.toHaveBeenCalled();
    release();
    await holder;
    await switching;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockClear();
    expect(await doRefresh(since)).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("branch switch 401 goes straight to the staff login, not a retry message", async () => {
    const location = { pathname: "/console", href: "" };
    vi.stubGlobal("window", { location });
    global.fetch = vi.fn(async () => res(401)) as typeof fetch;
    vi.resetModules();
    const { switchBranch } = await import("@/features/console/use-branch-switch");
    await expect(switchBranch("b1")).rejects.toThrow();
    expect(location.href).toBe("/staff/login?redirect=%2Fconsole");
  });
});
