import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PATCH as profile } from "./profile/route";
import { DELETE as avatarDelete } from "./profile/avatar/route";
import { POST as presign } from "./profile/avatar/presign/route";
import { POST as finalize } from "./profile/avatar/finalize/route";
import { POST as password } from "./password/change/route";
import { POST as emailChange } from "./email/change/route";
import { POST as emailConfirm } from "./email/confirm/route";
import { GET as sessions } from "./sessions/route";
import { DELETE as revoke } from "./sessions/[id]/route";
import { POST as logoutAll } from "./logout-all/route";

const id = "11111111-1111-4111-8111-111111111111";
const envelope = (data: unknown) => ({ code: 200, status: "success", message: "", data });
const cases = [
  { handler: profile, method: "PATCH", path: "profile", body: { display_name: "Dawn" }, reply: envelope({ display_name: "Dawn" }) },
  { handler: avatarDelete, method: "DELETE", path: "profile/avatar", reply: envelope({ message: "removed" }) },
  { handler: presign, method: "POST", path: "profile/avatar/presign", body: { file_name: "photo.png", content_type: "image/png", file_size: 200 }, reply: envelope({ upload_id: "upload", upload_url: "https://storage.example/upload", upload_method: "POST", form_fields: {}, expires_in: 300 }) },
  { handler: finalize, method: "POST", path: "profile/avatar/finalize", body: { upload_id: "upload" }, reply: envelope({ avatar_key: "avatar", avatar_url: "https://storage.example/avatar" }) },
  { handler: password, method: "POST", path: "password/change", body: { current_password: "old-password", new_password: "new-password-12" }, status: 204 },
  { handler: emailChange, method: "POST", path: "email/change", body: { new_email: "new@example.test", current_password: "old-password" }, reply: { status: "pending" }, status: 202 },
  { handler: emailConfirm, method: "POST", path: "email/confirm", body: { token: "proof" }, reply: { status: "success" } },
  { handler: logoutAll, method: "POST", path: "logout-all", status: 204 },
  { handler: sessions, method: "GET", path: "sessions?page=1&limit=10", reply: { items: [], pagination: { current_page: 1, total_pages: 1, total_items: 0, limit: 10 } } },
];
function request(method: string, body?: unknown, origin = "http://localhost:3000", authenticated = true) {
  return new NextRequest("http://localhost:3000/api/auth/account", {
    method,
    headers: { origin, "Sec-Fetch-Site": "same-origin", "Content-Type": "application/json", cookie: authenticated ? "access_token=jwt; refresh_token=refresh; CSRF-Token=csrf" : "", "X-CSRF-Token": "csrf" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("account BFF route contracts", () => {
  it("accepts the dev runtime origin and rejects another origin", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(envelope({ display_name: "Dawn" }))));
    vi.stubGlobal("fetch", fetch);
    function devRequest(origin: string) {
      return new NextRequest("http://localhost:3003/api/auth/profile", {
        method: "PATCH", headers: { origin, "Sec-Fetch-Site": "same-origin", "Content-Type": "application/json", cookie: "access_token=jwt" },
        body: JSON.stringify({ display_name: "Dawn" }),
      });
    }
    expect((await profile(devRequest("http://localhost:3003"))).status).toBe(200);
    expect((await profile(devRequest("http://localhost:3002"))).status).toBe(403);
    expect(fetch).toHaveBeenCalledOnce();
    vi.stubEnv("NODE_ENV", "production");
    expect((await profile(devRequest("http://localhost:3003"))).status).toBe(403);
  });
  it.each(cases)("forwards $method $path with credentials and CSRF", async test => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    const fetch = vi.fn().mockResolvedValue(new Response(test.reply ? JSON.stringify(test.reply) : null, { status: test.status || 200 }));
    vi.stubGlobal("fetch", fetch);
    const response = await test.handler(request(test.method, test.body));
    expect(response.status).toBe(test.status || 200);
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`/auth/${test.path.replaceAll("?", "\\?")}$`)), expect.objectContaining({
      method: test.method, cache: "no-store",
      headers: expect.objectContaining({ Authorization: "Bearer jwt", Cookie: "refresh_token=refresh; CSRF-Token=csrf", "X-CSRF-Token": "csrf" }),
      ...(test.body ? { body: JSON.stringify(test.body) } : {}),
    }));
    expect(response.headers.get("cache-control")).toBe("no-store");
    if ([password, logoutAll, emailConfirm].includes(test.handler as typeof password)) expect(response.headers.get("set-cookie")).toContain("access_token=; Path=/; Max-Age=0");
  });
  it("forwards exact session DELETE path and credentials", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    const response = await revoke(request("DELETE"), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(204);
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/auth/sessions/${id}`), expect.objectContaining({ method: "DELETE", headers: expect.objectContaining({ Authorization: "Bearer jwt", Cookie: "refresh_token=refresh; CSRF-Token=csrf", "X-CSRF-Token": "csrf" }) }));
  });
  it.each(cases.filter(test => test.method !== "GET"))("rejects cross-origin and anonymous $path before forwarding", async test => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    expect((await test.handler(request(test.method, test.body, "https://attacker.example"))).status).toBe(403);
    expect((await test.handler(request(test.method, test.body, "http://localhost:3000", false))).status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([429, 503])("preserves public errors and Retry-After (%s)", async status => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ errors: { error_code: "service_busy" }, private_detail: "secret" }), { status, headers: { "Retry-After": "7" } })));
    const response = await profile(request("PATCH", { display_name: "Dawn" }));
    expect(response.status).toBe(status);
    expect(response.headers.get("retry-after")).toBe("7");
    expect(await response.json()).toEqual({ error: "service_busy" });
  });
  it.each([{ display_name: "" }, { display_name: "x".repeat(51) }, { display_name: "An", role: "admin" }])("rejects invalid profile DTO %j", async body => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    expect((await profile(request("PATCH", body))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
});
