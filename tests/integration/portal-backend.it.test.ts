import { describe, expect, it } from "vitest";

const portalBase = process.env.PORTAL_IT_BASE?.replace(/\/$/, "") ?? "";
const portalPublicBase = process.env.PORTAL_IT_PUBLIC_URL ?? portalBase;
const email = `portal-it-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
const phone = `090${String(Date.now()).slice(-7)}`;
const password = `PortalIT!${Date.now()}Aa`;
const cookies = new Map<string, string>();
let activationToken = "";
let authenticatedCookies = "";

function cookieHeader() {
  return [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");
}

function captureCookies(response: Response) {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  for (const cookie of headers.getSetCookie?.() ?? []) {
    const [pair, ...attributes] = cookie.split(";");
    const separator = pair.indexOf("=");
    if (separator < 0) continue;
    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    if (value === "" || attributes.some((attribute) => /^\s*max-age=0\s*$/i.test(attribute))) {
      cookies.delete(name);
    } else {
      cookies.set(name, value);
    }
  }
}

async function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (cookies.size > 0 && !headers.has("cookie")) headers.set("Cookie", cookieHeader());
  const response = await fetch(`${portalBase}${path}`, { ...init, headers });
  captureCookies(response);
  return response;
}

describe.skipIf(!process.env.PORTAL_IT_BASE)("portal and backend integration", () => {
  it("serves the landing page hero and product link", async () => {
    const response = await request("/");
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Tươi là một cảm giác.");
    expect(html).toContain("Sạch là điều kiểm chứng được.");
    expect(html).toContain('href="/products"');
  });

  it("serves public auth pages and redirects protected pages to login", async () => {
    for (const path of ["/login", "/register", "/products"]) {
      const response = await request(path);
      expect(response.status).toBe(200);
    }

    for (const path of ["/roles", "/console"]) {
      const response = await request(path, { redirect: "manual" });
      expect([307, 308]).toContain(response.status);
      const location = response.headers.get("location");
      expect(location).not.toBeNull();
      const redirect = new URL(location!, portalBase);
      expect(redirect.pathname).toBe("/staff/login");
      expect(redirect.searchParams.get("redirect")).toBe(path);
    }
  });

  it("registers a unique account and receives a valid activation email", async () => {
    const withoutOrigin = await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone, display_name: "Portal Integration", password }),
    });
    expect(withoutOrigin.status).toBe(403);
    expect(await withoutOrigin.json()).toMatchObject({ error: "FORBIDDEN" });

    const response = await request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: portalBase },
      body: JSON.stringify({ email, phone, display_name: "Portal Integration", password }),
    });
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ status: "success", message: "Accepted" });

    const deadline = Date.now() + 60_000;
    let activationMessage: { ID: string; Subject: string; Text: string } | undefined;
    while (Date.now() < deadline && !activationMessage) {
      const searchUrl = new URL("http://127.0.0.1:8025/api/v1/search");
      searchUrl.searchParams.set("query", `to:${email}`);
      const searchResponse = await fetch(searchUrl);
      expect(searchResponse.status).toBe(200);
      const search = await searchResponse.json() as { messages?: { ID: string }[] };
      const messageId = search.messages?.[0]?.ID;
      if (messageId) {
        const messageResponse = await fetch(`http://127.0.0.1:8025/api/v1/message/${encodeURIComponent(messageId)}`);
        expect(messageResponse.status).toBe(200);
        activationMessage = await messageResponse.json() as { ID: string; Subject: string; Text: string };
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    expect(activationMessage).toBeDefined();
    expect(activationMessage!.Subject).not.toMatch(/resort|\{\{/i);
    const activationLink = activationMessage!.Text.match(/https?:\/\/[^\s<>"')]+/)?.[0];
    expect(activationLink).toBeDefined();
    expect(activationLink!.startsWith(`${portalPublicBase}/activate?token=`)).toBe(true);
    activationToken = new URL(activationLink!).searchParams.get("token") ?? "";
    expect(activationToken.length).toBeGreaterThan(0);
  }, 70_000);

  // D-220: BFF activate chỉ gửi token, auth đòi token+password; bỏ it.fails khi PORTAL-ACTIVATE-PASSWORD-001 xong
  it.fails("activates the account once and rejects replay with 400", async () => {
    const response = await request("/api/auth/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: portalBase },
      body: JSON.stringify({ token: activationToken }),
    });
    expect(response.status).toBe(200);

    const replay = await request("/api/auth/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: portalBase },
      body: JSON.stringify({ token: activationToken }),
    });
    expect(replay.status).toBe(400);
    expect(await replay.json()).toMatchObject({ error: "BAD_REQUEST" });
  });

  // D-220: BFF activate chỉ gửi token, auth đòi token+password; bỏ it.fails khi PORTAL-ACTIVATE-PASSWORD-001 xong
  it.fails("logs in through the BFF, reads the profile, and rejects a wrong password without cookies", async () => {
    const response = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: portalBase },
      body: JSON.stringify({ identifier: email, password }),
    });
    expect(response.status).toBe(200);
    expect(cookies.has("access_token")).toBe(true);
    expect(await response.json()).toMatchObject({ user: { email } });
    authenticatedCookies = cookieHeader();

    const profile = await request("/api/auth/me", { headers: { Cookie: authenticatedCookies } });
    expect(profile.status).toBe(200);
    expect(await profile.json()).toMatchObject({ email });

    const wrongPassword = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: portalBase },
      body: JSON.stringify({ identifier: email, password: `${password}-wrong` }),
    });
    expect(wrongPassword.status).toBe(401);
    const wrongPasswordCookies = (wrongPassword.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
    expect(wrongPasswordCookies.some((cookie) => cookie.startsWith("access_token="))).toBe(false);
  });

  it("allows a customer session to open products", async () => {
    const products = await request("/products", { headers: { Cookie: authenticatedCookies } });
    expect(products.status).toBe(200);
  });

  it("blocks a customer session from roles and console", async () => {
    for (const path of ["/roles", "/console"]) {
      const response = await request(path, { headers: { Cookie: authenticatedCookies }, redirect: "manual" });
      expect(response.status).not.toBe(200);
    }
  });

  // D-220: BFF activate chỉ gửi token, auth đòi token+password; bỏ it.fails khi PORTAL-ACTIVATE-PASSWORD-001 xong
  it.fails("logs out, clears auth cookies, and rejects the former session", async () => {
    expect(authenticatedCookies).not.toBe("");
    const response = await request("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json", Origin: portalBase } });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "logged_out" });
    expect(cookies.has("access_token")).toBe(false);
    expect(cookies.has("refresh_token")).toBe(false);
    expect(cookies.has("__Host-refresh_token")).toBe(false);
    expect(cookies.has("CSRF-Token")).toBe(false);

    const profile = await request("/api/auth/me");
    expect(profile.status).toBe(401);
  });

  // Gap: /roles has no BFF route that returns org role and permission data.
  it.fails("returns org roles and permissions from the roles BFF route", async () => {
    const response = await request("/api/roles", { headers: { Cookie: authenticatedCookies } });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({
      roles: expect.any(Array),
      permissions: expect.any(Array),
    }));
  });
});
