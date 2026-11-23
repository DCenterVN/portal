import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
import { POST } from "./route";

afterEach(() => vi.unstubAllGlobals());

function upstream() {
  const headers = new Headers({ "content-type": "application/json" });
  headers.append("Set-Cookie", "refresh_token=new; Path=/; Max-Age=172800; HttpOnly; SameSite=Strict");
  headers.append("Set-Cookie", "CSRF-Token=c; Path=/; Max-Age=172800; SameSite=Strict");
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ access_token: "a", expires_in: 900 }), { status: 200, headers })));
}

const request = (cookie: string) => new NextRequest("https://portal.test/api/auth/refresh", { method: "POST", headers: { cookie } });

describe("refresh route", () => {
  it("renews portal_plane for employees with the refresh cookie lifetime", async () => {
    upstream();
    const res = await POST(request("refresh_token=old; CSRF-Token=c; portal_plane=employee"));
    expect(res.status).toBe(200);
    expect(res.cookies.get("portal_plane")?.value).toBe("employee");
    expect(res.cookies.get("portal_plane")?.maxAge).toBe(172800);
  });

  it("does not create portal_plane for customers", async () => {
    upstream();
    const res = await POST(request("refresh_token=old; CSRF-Token=c"));
    expect(res.cookies.get("portal_plane")).toBeUndefined();
  });
});

describe("refresh route upstream signal", () => {
  it("passes a signal that follows the request and aborts on the server timeout", async () => {
    vi.stubEnv("AUTH_ROTATE_TIMEOUT_MS", "20");
    upstream();
    const fetchMock = vi.mocked(fetch);
    const controller = new AbortController();
    const req = new NextRequest("https://portal.test/api/auth/refresh", { method: "POST", headers: { cookie: "refresh_token=old; CSRF-Token=c" }, signal: controller.signal });
    await POST(req);
    const signal = (fetchMock.mock.calls[0][1] as RequestInit).signal as AbortSignal;
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal.aborted).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(signal.aborted).toBe(true);
    vi.unstubAllEnvs();
  });

  it("aborts when the browser cancels the request", async () => {
    upstream();
    const controller = new AbortController();
    const req = new NextRequest("https://portal.test/api/auth/refresh", { method: "POST", headers: { cookie: "refresh_token=old; CSRF-Token=c" }, signal: controller.signal });
    await POST(req);
    const signal = (vi.mocked(fetch).mock.calls[0][1] as RequestInit).signal as AbortSignal;
    controller.abort();
    expect(signal.aborted).toBe(true);
  });
});

describe("refresh route timeout", () => {
  it.each(["TimeoutError", "AbortError"])("upstream %s -> 504 TIMEOUT, not 500", async (name) => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new DOMException("aborted", name); }));
    const res = await POST(request("refresh_token=old; CSRF-Token=c"));
    expect(res.status).toBe(504);
    expect(await res.json()).toMatchObject({ error: "TIMEOUT" });
  });
});
