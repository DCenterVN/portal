import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
import { proxy } from "./proxy";

function request(path: string, cookie?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("portal proxy route boundary", () => {
  it("allows exact public routes and their descendants", () => {
    expect(proxy(request("/login")).status).toBe(200);
    expect(proxy(request("/api/auth/refresh")).status).toBe(200);
    expect(proxy(request("/traceability/TRC-1")).status).toBe(200);
    expect(proxy(request("/api/public/traceability/TRC-1")).status).toBe(200);
  });

  it("serves the brand icon to logged-out visitors", () => {
    expect(proxy(request("/icon.svg")).status).toBe(200);
    expect(proxy(request("/icon.svg?icon.2mvlep7kotriv.svg")).status).toBe(200);
  });

  it("does not treat a matching string prefix as a public route", () => {
    const loginLookalike = proxy(request("/login-evil"));
    const apiLookalike = proxy(request("/api/authentic"));
    const traceLookalike = proxy(request("/traceability-evil"));

    expect(loginLookalike.status).toBe(307);
    expect(loginLookalike.headers.get("location")).toContain("/login?redirect=%2Flogin-evil");
    expect(apiLookalike.status).toBe(307);
    expect(traceLookalike.status).toBe(307);
  });

  it("accepts access or refresh session cookies for protected routes", () => {
    expect(proxy(request("/orders", "access_token=jwt")).status).toBe(200);
    expect(proxy(request("/orders", "__Host-refresh_token=refresh")).status).toBe(200);
  });
});

describe("S15 staff proxy boundary",()=>{
 it.each(["/staff/login","/staff/forgot-password","/staff/reset-password","/staff/invite/accept?token=t","/invite/accept?token=t"])("public staff/legacy invite path %s stays public even with another-plane cookie",path=>{for(const cookie of [undefined,"access_token=customer","__Host-refresh_token=staff"])expect(proxy(request(path,cookie)).status).toBe(200);});
 it.each(["/staff/register","/staff/register/child"])("staff self-register %s is 404 with/without session",path=>{expect(proxy(request(path)).status).toBe(404);expect(proxy(request(path,"access_token=jwt")).status).toBe(404);});
 it.each(["/staff/switch-org","/staff/switch-branch","/console","/console/orders"])("protected staff route %s needs session and redirects staff login",path=>{const res=proxy(request(path));expect(res.status).toBe(307);expect(res.headers.get("location")).toContain("/staff/login?redirect="+encodeURIComponent(path));expect(proxy(request(path,"refresh_token=session; portal_plane=employee")).status).toBe(200);});
 it.each(["/staff/login/evil","/staff/login-evil","/staff/invite/accept/evil"])("staff public route lookalike %s is protected",path=>{expect(proxy(request(path)).status).toBe(307);});
 it.each(["/login","/register","/staff/login"])("cookie alone never skips %s or decides eligibility",path=>{expect(proxy(request(path,"access_token=jwt")).status).toBe(200);});
 it("store redirects customer and platform path stays reachable with session",()=>{expect(proxy(request("/me")).headers.get("location")).toContain("/login?redirect=%2Fme");expect(proxy(request("/platform/companies","access_token=platform")).status).toBe(200);});
});

// The app route group is authoritative; every new console page must join this family.
import {readdirSync} from "node:fs";
import {join, relative} from "node:path";
const consoleRoot = join(process.cwd(), "app/(console)");
function pages(dir: string): string[] {
 return readdirSync(dir,{withFileTypes:true}).flatMap(entry => entry.isDirectory() ? pages(join(dir,entry.name)) : entry.name === "page.tsx" ? ["/" + relative(consoleRoot,dir).replaceAll("\\","/")] : []);
}
const consolePages = pages(consoleRoot);
describe("review R3 real route groups", () => {
 it.each([...consolePages,"/platform/companies","/platform/staff","/switch-branch","/switch-org"])("R3 unauthenticated %s uses staff login", path => {
  expect(proxy(request(path)).headers.get("location")).toBe("http://localhost:3000/staff/login?redirect=" + encodeURIComponent(path));
 });
 it.each(["/orders","/me","/products/sku","/checkout"])("R3 customer %s uses customer login", path => {
  expect(proxy(request(path)).headers.get("location")).toBe("http://localhost:3000/login?redirect=" + encodeURIComponent(path));
 });
});

import {CONSOLE_ROUTES} from "./lib/fetcher";
it("R3 route registry equals authoritative console route group", () => {
 expect([...CONSOLE_ROUTES].sort()).toEqual(consolePages.sort());
});

describe("R4-1 employee console marker", () => {
 it.each([
  ["customer", "/console", "access_token=customer; refresh_token=customer"],
  ["platform", "/console", "access_token=platform; __Host-refresh_token=platform"],
  ["platform", "/branches", "access_token=platform"],
 ])("%s session without employee marker redirects %s to context selection", (_plane, path, cookie) => {
  const res = proxy(request(path, cookie));
  expect(res.status).toBe(307);
  expect(res.headers.get("location")).toBe("http://localhost:3000/staff/switch-org?redirect=" + encodeURIComponent(path));
 });
 it.each(CONSOLE_ROUTES)("employee marker permits console route %s and descendants", path => {
  for (const target of [path, `${path}/detail`]) {
   expect(proxy(request(target, "refresh_token=session; portal_plane=employee")).headers.get("x-middleware-next")).toBe("1");
   expect(proxy(request(target, "refresh_token=session")).status).toBe(307);
  }
 });
 it("marker alone cannot replace a session and other marker values cannot open console", () => {
  expect(proxy(request("/console", "portal_plane=employee")).headers.get("location")).toContain("/staff/login?");
  expect(proxy(request("/console", "access_token=customer; portal_plane=customer")).headers.get("location")).toContain("/staff/switch-org?");
 });
 it.each(["/staff/switch-org", "/staff/switch-branch", "/platform/companies", "/orders", "/branches-lookalike"])("session without marker still permits unchanged route %s", path => {
  expect(proxy(request(path, "access_token=session")).headers.get("x-middleware-next")).toBe("1");
 });
});


describe("R5-1 console BFF employee boundary", () => {
 it.each([
  ["customer", "/api/console", "access_token=customer; refresh_token=customer"],
  ["platform", "/api/console/x", "access_token=platform; __Host-refresh_token=platform"],
  ["refresh-only", "/api/console", "refresh_token=customer"],
  ["host-refresh-only", "/api/console/x", "__Host-refresh_token=platform"],
  ["wrong-marker", "/api/console", "access_token=customer; portal_plane=customer"],
 ])("%s session cannot reach %s without employee marker", async (_plane, path, cookie) => {
  const res = proxy(request(path, cookie));
  expect(res.status).toBe(403);
  expect(await res.json()).toEqual({error: "FORBIDDEN"});
  expect(res.headers.get("location")).toBeNull();
 });
 it.each(["/api/console", "/api/console/x"])("employee session permits %s", path => {
  for (const session of ["access_token=employee", "refresh_token=employee", "__Host-refresh_token=employee"]) {
   expect(proxy(request(path, `${session}; portal_plane=employee`)).headers.get("x-middleware-next")).toBe("1");
  }
 });
 it.each(["/api/console", "/api/console/x"])("no session keeps the existing redirect for %s", path => {
  for (const cookie of [undefined, "portal_plane=employee"]) {
   const res = proxy(request(path, cookie));
   expect(res.status).toBe(307);
   expect(res.headers.get("location")).toBe("http://localhost:3000/login?redirect=" + encodeURIComponent(path));
  }
 });
 it.each(["/api/console-lookalike", "/api/orders", "/api/products", "/api/auth/context", "/api/public/products"])("other API prefix %s stays reachable with customer session", path => {
  expect(proxy(request(path, "access_token=customer")).headers.get("x-middleware-next")).toBe("1");
 });
});
