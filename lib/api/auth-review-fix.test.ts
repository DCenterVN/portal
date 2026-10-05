import {beforeEach, afterEach, describe, expect, it, vi} from "vitest";
import {NextRequest} from "next/server";
import {createRequire} from "node:module";
vi.mock("server-only", () => ({}));
import {loginJourney, customerOperation, acceptStaffInvite, switchStaffContext, listStaffContexts} from "./auth-journey-bff";
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {status, headers: {"Retry-After":"8", "Set-Cookie":"refresh_token=secret"}});
const request = (body: unknown, headers: Record<string,string> = {}) => new NextRequest("https://portal.test/api/auth/test", {method:"POST", headers:{"Content-Type":"application/json",Origin:"https://portal.test",cookie:"access_token=caller",...headers}, body:JSON.stringify(body)});
const error = (code: string, status: number) => ({code:status,status:"error",message:"denied",errors:{error_code:code},retryable:false});
beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://portal.test"));
const employee = {org_id:"o",branch_id:"b",member_type:"EMPLOYEE",roles:["SALES"]};
afterEach(() => {vi.unstubAllGlobals();vi.unstubAllEnvs();vi.restoreAllMocks();});
describe("review R1", () => {
 const handlers = [
  (r: NextRequest) => loginJourney(r,"customer"), (r: NextRequest) => loginJourney(r,"employee"),
  ...(["register","activate","resend","forgot","reset"] as const).map(op => (r: NextRequest) => customerOperation(r,op)),
  acceptStaffInvite, switchStaffContext,
 ];
 it.each(handlers)("R1 rejects untrusted POST before upstream or cookie", async handler => {
  const attacks: Record<string,string>[] = [{Origin:"https://attacker.invalid","Content-Type":"text/plain","Sec-Fetch-Site":"cross-site"},{Origin:"https://attacker.invalid"},{"Content-Type":"text/plain"},{Origin:"null"},{Origin:"","Sec-Fetch-Site":"cross-site"},{Origin:""},{Origin:"https://portal.test.evil"}];
  for (const headers of attacks) {
   const fetch=vi.fn(); vi.stubGlobal("fetch",fetch);
   const res=await handler(request({identifier:"attacker",password:"password-1234",token:"t",org_id:"o",branch_id:"b"},headers));
   expect(res.status).toBe(403);expect(await res.json()).toMatchObject({error:"FORBIDDEN"});expect(fetch).not.toHaveBeenCalled();expect(res.headers.get("set-cookie")).toBeNull();
  }
 });
 it.each(["customer","employee"] as const)("R1 cross-site text/plain %s login cannot replace a session", async journey => {
  const fetch=vi.fn(async (url: string) => {
   if (url.endsWith("/auth/web/login")) return json({access_token:"attacker-session",expires_in:900});
   if (url.endsWith("/auth/me")) return json({id:"attacker",status:"ACTIVE"});
   if (url.endsWith("/platform/me")) return json(error("NOT_FOUND",404),404);
   return json([employee,{...employee,branch_id:"other"}]);
  });vi.stubGlobal("fetch",fetch);
  const res=await loginJourney(request({identifier:"attacker@example.test",password:"attacker-password="},{Origin:"https://attacker.invalid","Content-Type":"text/plain","Sec-Fetch-Site":"cross-site"}),journey);
  expect(res.status).toBe(403);expect(await res.json()).toMatchObject({error:"FORBIDDEN"});expect(fetch).not.toHaveBeenCalled();expect(res.headers.get("set-cookie")).toBeNull();
 });
 it.each(["same-origin"])("R1 permits absent Origin with %s metadata and JSON charset", async site => {
  const fetch=vi.fn().mockResolvedValue(json({message:"ok"}));vi.stubGlobal("fetch",fetch);
  const r=request({email:"a@example.test"},{"Sec-Fetch-Site":site,"Content-Type":"application/json; charset=utf-8"});r.headers.delete("Origin");
  expect((await customerOperation(r,"forgot")).status).toBe(200);expect(fetch).toHaveBeenCalledTimes(1);
 });
});
describe("review R2", () => {
 it("R2 accepts real invite envelope then rejects replay without a session", async () => {
  vi.stubGlobal("fetch",vi.fn().mockResolvedValueOnce(json({code:200,status:"success",message:"OK",data:{status:"activated"}})).mockResolvedValueOnce(json(error("invalid_token",400),400)));
  const res=await acceptStaffInvite(request({token:"proof",password:"password-1234"}));expect(res.status).toBe(200);expect(await res.json()).toEqual({status:"activated"});expect(res.headers.get("set-cookie")).toBeNull();
  const replay=await acceptStaffInvite(request({token:"proof",password:"password-1234"}));expect(replay.status).toBe(400);expect(replay.headers.get("set-cookie")).toBeNull();
 });
 it.each([{status:"activated"},{code:200,status:"error",message:"OK",data:{status:"activated"}},{code:200,status:"success",message:"OK",data:{status:"wrong"}}])("R2 rejects invalid invite success %j", async body => {
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(json(body)));expect((await acceptStaffInvite(request({token:"proof",password:"password-1234"}))).status).toBe(503);
 });
});
describe("review R4", () => {
 it.each(["login","customer","invite","list","org lookup","switch","profile","platform","staff contexts","staff auto switch"])("R4 preserves real error envelope at %s", async endpoint => {
  const fetch=vi.fn(); const token=json({access_token:"temporary"}); const profile=json({id:"u",status:"ACTIVE"}); const notPlatform=json(error("NOT_FOUND",404),404);
  if (["profile","platform","staff contexts","staff auto switch"].includes(endpoint)) fetch.mockResolvedValueOnce(token);
  if (["platform","staff contexts","staff auto switch"].includes(endpoint)) fetch.mockResolvedValueOnce(profile);
  if (["staff contexts","staff auto switch"].includes(endpoint)) fetch.mockResolvedValueOnce(notPlatform);
  if (endpoint === "staff auto switch" || endpoint === "switch") fetch.mockResolvedValueOnce(json([employee]));
  fetch.mockResolvedValue(json({...error("FORBIDDEN",403),access_token:"secret",data:{token:"secret"}},403));vi.stubGlobal("fetch",fetch);
  const r=request(endpoint === "invite" ? {token:"proof",password:"password-1234"} : endpoint === "customer" ? {email:"a@example.test"} : ["org lookup","switch"].includes(endpoint) ? {org_id:"o",branch_id:"b"} : {identifier:"a",password:"password-1234"});
  const res= endpoint === "customer" ? await customerOperation(r,"forgot") : endpoint === "invite" ? await acceptStaffInvite(r) : endpoint === "list" ? await listStaffContexts(r) : ["org lookup","switch"].includes(endpoint) ? await switchStaffContext(r) : await loginJourney(r,"employee");
  expect(res.status).toBe(403);const body=await res.json();expect(body).toMatchObject({error:"FORBIDDEN",message:"denied"});expect(res.headers.get("retry-after")).toBe("8");expect(res.headers.get("set-cookie")).toBeNull();expect(JSON.stringify(body)).not.toContain("secret");
 });
});


describe("Round 2", () => {
 it.each(["portal.test", "portal.internal:3000"])("R2-1 accepts real Next adapter listener URL with Host %s", async host => {

  const {Readable} = await import("node:stream");
  const require = createRequire(import.meta.url);
  const {AsyncLocalStorage} = await import("node:async_hooks");
  vi.stubGlobal("AsyncLocalStorage", AsyncLocalStorage);
  const server = require("next/dist/server/next-server").default;
  const {NextRequestAdapter} = require("next/dist/server/web/spec-extension/adapters/next-request");
  const nodeRequest = {url:"/api/auth/login", method:"POST", headers:{host,origin:"https://portal.test","x-forwarded-host":"portal.test","x-forwarded-proto":"https","sec-fetch-site":"same-origin","content-type":"application/json"},body:Readable.from([JSON.stringify({identifier:"u",password:"password-1234"})])};
  server.prototype.attachRequestMeta.call({fetchHostname:"localhost",port:3000,nextConfig:{experimental:{}}},nodeRequest,{},true);
  const adapted: NextRequest = NextRequestAdapter.fromNodeNextRequest(nodeRequest,new AbortController().signal);
  expect(adapted).toBeInstanceOf(NextRequest);expect(adapted.url).toBe("https://localhost:3000/api/auth/login");
  const fetch=vi.fn().mockResolvedValueOnce(json({access_token:"session"})).mockResolvedValueOnce(json({id:"u",status:"ACTIVE"}));vi.stubGlobal("fetch",fetch);
  expect((await loginJourney(adapted,"customer")).status).toBe(200);expect(fetch).toHaveBeenCalledTimes(2);
 });
 it.each(["cross-site","same-site","none"])("R2-1 rejects %s even with matching public Origin and forged hosts", async site => {
  const fetch=vi.fn();vi.stubGlobal("fetch",fetch);
  const res=await loginJourney(request({identifier:"u",password:"password-1234"},{"Sec-Fetch-Site":site,Host:"portal.test","X-Forwarded-Host":"portal.test"}),"customer");
  expect(res.status).toBe(403);expect(fetch).not.toHaveBeenCalled();expect(res.headers.get("set-cookie")).toBeNull();
 });
 it("R2-1 absent metadata uses configured public origin, never URL or host", async () => {
  const fetch=vi.fn().mockResolvedValue(json({message:"ok"}));vi.stubGlobal("fetch",fetch);
  const r=new NextRequest("https://localhost:3000/api/auth/forgot",{method:"POST",headers:{Origin:"https://portal.test","Content-Type":"application/json"},body:JSON.stringify({email:"a@test.test"})});
  expect((await customerOperation(r,"forgot")).status).toBe(200);
  fetch.mockClear();r.headers.set("Origin","https://localhost:3000");r.headers.set("Host","localhost:3000");r.headers.set("X-Forwarded-Host","localhost:3000");
  const res=await customerOperation(r,"forgot");expect(res.status).toBe(403);expect(fetch).not.toHaveBeenCalled();expect(res.headers.get("set-cookie")).toBeNull();
 });
 it("R2-1 dev fallback allows localhost:3000; production without configuration fails closed", async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL","");vi.stubEnv("NODE_ENV","development");
  const fetch=vi.fn().mockResolvedValue(json({message:"ok"}));vi.stubGlobal("fetch",fetch);
  expect((await customerOperation(request({email:"a@test.test"},{Origin:"http://localhost:3000"}),"forgot")).status).toBe(200);
  vi.stubEnv("NODE_ENV","production");fetch.mockClear();
  expect((await customerOperation(request({email:"a@test.test"},{Origin:"http://localhost:3000"}),"forgot")).status).toBe(403);expect(fetch).not.toHaveBeenCalled();
 });
 const malformed = [
  {error:"FORBIDDEN",message:"denied",data:{access_token:"SECRET"}},
  {code:503,status:"error",message:"denied",errors:{fields:{access_token:"SECRET"}},data:{refresh_token:"SECRET"}},
  {error:"VALIDATION_ERROR",message:"denied",errors:{fields:[{field:"email",message:"invalid",value:"SECRET",token:"SECRET"}]},retryable:true,retry_after_ms:8000,data:{token:"SECRET"}},
  {unexpected:{access_token:"SECRET"}},
 ];
 it.each(malformed)("R2-2 allowlists malformed error %j at every error boundary", async body => {
  const cases: [(r: NextRequest)=>Promise<Response>, unknown][] = [
   [(r)=>loginJourney(r,"customer"),{identifier:"u",password:"password-1234"}],
   [(r)=>customerOperation(r,"forgot"),{email:"a@test.test"}],
   [acceptStaffInvite,{token:"t",password:"password-1234"}], [listStaffContexts,{}], [switchStaffContext,{org_id:"o",branch_id:"b"}],
  ];
  for (const [handler,dto] of cases) {
   const fetch=vi.fn().mockResolvedValue(json(body,503));vi.stubGlobal("fetch",fetch);
   const res=await handler(request(dto));
   const text=await res.text();expect(res.status).toBe(503);expect(text).not.toContain("SECRET");expect(text).not.toMatch(/access_token|refresh_token|"token"|"value"/);expect(res.headers.get("set-cookie")).toBeNull();
  }
 });
 it("R2-2 preserves only validation names/messages and retry metadata", async () => {
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(json(malformed[2],400)));
  const res=await acceptStaffInvite(request({token:"t",password:"password-1234"}));
  expect(await res.json()).toEqual({error:"VALIDATION_ERROR",message:"denied",retryable:true,retry_after_ms:8000,errors:{fields:[{field:"email",message:"invalid"}]}});expect(res.headers.get("retry-after")).toBe("8");
 });
});


describe("S7 refresh/logout client IP", () => {
 const route = async (name: "refresh" | "logout") => name === "refresh"
  ? (await import("../../app/api/auth/refresh/route")).POST
  : (await import("../../app/api/auth/logout/route")).POST;
 const edge = (ip: string | null = "::FFFF:C000:0201") => {
  const req = request({}, {cookie: "access_token=caller; refresh_token=refresh; CSRF-Token=csrf", "User-Agent": "test-agent", "X-Forwarded-For": "198.51.100.99, 198.51.100.100", Forwarded: "for=198.51.100.99"});
  if (ip !== null) req.headers.set("X-Real-IP", ip);
  return req;
 };
 const allowed = (name: string) => ({cookie: "access_token=caller; refresh_token=refresh; CSRF-Token=csrf", "x-csrf-token": "csrf", "user-agent": "test-agent", ...(name === "logout" ? {authorization: "Bearer caller"} : {})});
 for (const name of ["refresh", "logout"] as const) {
  it.each([["192.0.2.1", "192.0.2.1"], ["::FFFF:C000:0201", "192.0.2.1"], ["2001:0DB8:0000:0000:0000:0000:0000:0001", "2001:db8::1"]])(`${name} forwards one canonical IP from %s with the exact allowlist`, async (raw, canonical) => {
   vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "trusted-kong");
   const fetch = vi.fn().mockResolvedValue(json({message: "ok", access_token: "rotated", expires_in: 900})); vi.stubGlobal("fetch", fetch);
   const res = await (await route(name))(edge(raw)); expect(res.status).toBe(200);
   expect(fetch).toHaveBeenCalledTimes(1);
   expect(Object.fromEntries(new Headers(fetch.mock.calls[0][1].headers))).toEqual({...allowed(name), "x-forwarded-for": canonical});
   if (name === "refresh") {
    expect(await res.json()).toEqual({message: "ok"});
    expect(res.headers.get("set-cookie")).toContain("access_token=rotated");
   } else expect(res.headers.get("set-cookie")).toContain("access_token=;");
  });
  it.each([null, "", "192.0.2.1, 192.0.2.1", "192.0.2.1:80", "[::1]", "[::1]:80", "fe80::1%eth0", "invalid"])(`${name} rejects invalid ingress %s with 503 before fetch`, async ip => {
   vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "trusted-kong");
   const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
   const res = await (await route(name))(edge(ip));
   expect(res.status).toBe(503); expect(await res.json()).toMatchObject({error: "INTERNAL_ERROR"}); expect(fetch).not.toHaveBeenCalled();
  });
  it(`${name} rejects duplicate identical X-Real-IP values`, async () => {
   vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "trusted-kong");
   const req = edge("192.0.2.1"); req.headers.append("X-Real-IP", "192.0.2.1");
   const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
   expect((await (await route(name))(req)).status).toBe(503); expect(fetch).not.toHaveBeenCalled();
  });
  it(`${name} fails closed on unknown mode`, async () => {
   vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "invalid");
   const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
   expect((await (await route(name))(edge())).status).toBe(503); expect(fetch).not.toHaveBeenCalled();
  });
  it(`${name} preserves auth 429 and Retry-After`, async () => {
   vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "trusted-kong");
   const fetch = vi.fn().mockResolvedValue(json(error("rate_limit_exceeded", 429), 429)); vi.stubGlobal("fetch", fetch);
   const res = await (await route(name))(edge());
   expect(res.status).toBe(429); expect(res.headers.get("retry-after")).toBe("8");
   expect(await res.json()).toEqual(error("rate_limit_exceeded", 429));
   expect(Object.fromEntries(new Headers(fetch.mock.calls[0][1].headers))).toEqual({...allowed(name), "x-forwarded-for": "192.0.2.1"});
  });
 }
 it("unset mode warns once across refresh and logout and forwards no browser claims", async () => {
  vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", undefined); vi.resetModules();
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const fetch = vi.fn().mockImplementation(async () => json({message: "ok"})); vi.stubGlobal("fetch", fetch);
  for (const name of ["refresh", "logout", "refresh"] as const) {
   expect((await (await route(name))(edge())).status).toBe(200);
   expect(Object.fromEntries(new Headers(fetch.mock.calls.at(-1)![1].headers))).toEqual(allowed(name));
  }
  expect(warn).toHaveBeenCalledTimes(1);
 });
});
