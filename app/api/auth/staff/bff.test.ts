const identityToken = "eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ1Iiwib3JnX2lkIjoibWFpbiIsImJyYW5jaF9pZCI6Im1haW4ifQ.signature";
import {afterEach, describe, expect, it, vi} from "vitest";
import {NextRequest} from "next/server";
vi.mock("server-only",()=>({}));
import {POST as login} from "./login/route";
import {POST as forgot} from "./forgot/route";
import {POST as reset} from "./reset/route";
import {POST as invite} from "./invite/accept/route";
const request=(body:unknown,cookie="")=>new NextRequest("http://localhost/api/auth/staff/test",{method:"POST",body:JSON.stringify(body),headers:{"Content-Type":"application/json","Sec-Fetch-Site":"same-origin",cookie}});
const json=(body:unknown,status=200,headers:Record<string,string>={})=>new Response(JSON.stringify(body),{status,headers});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
describe("S11 staff recovery dependency and invite BFF",()=>{
 it.each([forgot,reset])("D3 blocks without issuing/consuming generic tokens or exposing account",async handler=>{const fetch=vi.fn();vi.stubGlobal("fetch",fetch);const res=await handler(request({email:"staff@example.com",token:"secret",new_password:"password-1234"}));expect(res.status).toBe(503);expect(await res.json()).toMatchObject({error:"INTERNAL_ERROR"});expect(res.headers.get("cache-control")).toBe("no-store");expect(res.headers.get("set-cookie")).toBeNull();expect(fetch).not.toHaveBeenCalled();});
 it("accepts exact invite DTO via invite purpose endpoint; never password reset; no credentials/cookies",async()=>{const fetch=vi.fn().mockResolvedValue(json({code:200,status:"success",message:"OK",data:{status:"activated",token:"secret",access_token:"secret"}},200,{"set-cookie":"refresh_token=secret"}));vi.stubGlobal("fetch",fetch);const res=await invite(request({token:"invite-proof",password:"password-1234"}));expect(res.status).toBe(200);expect(await res.json()).toEqual({status:"activated"});expect(res.headers.get("cache-control")).toBe("no-store");expect(res.headers.get("set-cookie")).toBeNull();expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/auth/invite/accept"),expect.objectContaining({cache:"no-store",body:JSON.stringify({token:"invite-proof",password:"password-1234"})}));});
 it.each([{}, {token:"t",password:"short"},{token:"t",password:"é".repeat(129)},{token:"t",password:"a".repeat(257)},{token:"t",password:"password-1234",account_type:"EMPLOYEE"},{token:[],password:"password-1234"}])("invalid invite never reaches auth",async body=>{const fetch=vi.fn();vi.stubGlobal("fetch",fetch);expect((await invite(request(body))).status).toBe(400);expect(fetch).not.toHaveBeenCalled();});
 it("malformed JSON is canonical BAD_REQUEST",async()=>{vi.stubGlobal("fetch",vi.fn());const res=await invite(new NextRequest("http://localhost",{method:"POST",headers:{"Content-Type":"application/json","Sec-Fetch-Site":"same-origin"},body:"{"}));expect(res.status).toBe(400);expect(await res.json()).toMatchObject({error:"BAD_REQUEST"});expect(fetch).not.toHaveBeenCalled();});
 it.each([[400,"invalid_token"],[429,"rate_limit_exceeded"],[503,"service_busy"]])("expired/replayed/rate/busy preserve %s/%s and retry without cookies",async(status,error)=>{vi.stubGlobal("fetch",vi.fn().mockResolvedValue(json({error,token:"secret"},status,{"Retry-After":"8","set-cookie":"access_token=secret"})));const res=await invite(request({token:"expired",password:"password-1234"}));expect(res.status).toBe(status);expect(await res.json()).toEqual({error});expect(res.headers.get("retry-after")).toBe("8");expect(res.headers.get("set-cookie")).toBeNull();});
 it("transport and malformed upstream fail closed without internal details",async()=>{vi.stubGlobal("fetch",vi.fn().mockRejectedValue(Error("secret")));let res=await invite(request({token:"t",password:"password-1234"}));expect(res.status).toBe(503);expect(await res.json()).toMatchObject({error:"INTERNAL_ERROR"});vi.stubGlobal("fetch",vi.fn().mockResolvedValue(json([])));res=await invite(request({token:"t",password:"password-1234"}));expect(res.status).toBe(503);});
 it("staff login reuses batch A policy and denies customer before publishing session",async()=>{const fetch=vi.fn().mockResolvedValueOnce(json({access_token:identityToken})).mockResolvedValueOnce(json({id:"u",status:"ACTIVE"})).mockResolvedValueOnce(json([{org_id:"main",branch_id:"main",member_type:"CUSTOMER",roles:[]}])).mockResolvedValue(json({}));vi.stubGlobal("fetch",fetch);const res=await login(request({identifier:"customer",password:"p"}));expect(res.status).toBe(403);expect(res.headers.get("set-cookie")).toBeNull();expect(fetch.mock.calls.some(c=>String(c[0]).endsWith("/auth/web/logout"))).toBe(true);});
});

const employee={org_id:"main",branch_id:"main",member_type:"EMPLOYEE",status:"ACTIVE",roles:["SALES"]};

describe("S17 platform entry survives shared resolver removal", () => {
 it.each([json({error:"INTERNAL_ERROR"},503),json({code:200,status:"success",message:"OK",data:{role:"PLATFORM_SUPPORT"}})])("platform lookup failure never publishes a session", async upstream => {
  const fetch=vi.fn().mockResolvedValueOnce(json({access_token:identityToken})).mockResolvedValueOnce(json({id:"u",status:"ACTIVE"})).mockResolvedValueOnce(upstream).mockResolvedValue(json({}));
  vi.stubGlobal("fetch",fetch);
  const res=await login(request({identifier:"platform",password:"password-1234"}));
  expect(res.status).toBe(503);expect(res.headers.get("set-cookie")).toBeNull();
  expect(fetch.mock.calls.some(call=>String(call[0]).endsWith("/auth/web/logout"))).toBe(true);
 });
 it("verified platform staff land on /platform with a secure session", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(json({access_token:identityToken, expires_in:900}))
   .mockResolvedValueOnce(json({id:"u",status:"ACTIVE"}))
   .mockResolvedValueOnce(json([employee]))
      .mockResolvedValueOnce(json({action_keys:["org:role:update"]}));
  vi.stubGlobal("fetch",fetch);
  const res=await login(request({identifier:"platform",password:"password-1234"}));
  expect(res.status).toBe(200);expect(await res.json()).toMatchObject({next_path:"/roles"});
  expect(res.headers.get("set-cookie")).toMatch(new RegExp(`access_token=${identityToken.replaceAll(".", "\\.")}`));
  expect(res.headers.get("set-cookie")).toMatch(/HttpOnly/);

  expect(fetch).toHaveBeenNthCalledWith(4,expect.stringContaining("/org/permissions/me?org_id=main&branch_id=main"),expect.objectContaining({cache:"no-store",headers:{Authorization:`Bearer ${identityToken}`}}));
  expect(fetch).toHaveBeenCalledTimes(4);
 });
});

describe("R4-1 staff marker issuance", () => {
 it("platform landing clears an old employee marker and never sets it", async () => {
  vi.stubGlobal("fetch", vi.fn()
   .mockResolvedValueOnce(json({access_token:identityToken,expires_in:900},200,{"set-cookie":"__Host-refresh_token=rt; Path=/; Secure; HttpOnly; Max-Age=86400"}))
   .mockResolvedValueOnce(json({id:"u",status:"ACTIVE"}))
   .mockResolvedValueOnce(json([employee]))
      .mockResolvedValueOnce(json({action_keys:["org:role:update"]})));
  const res = await login(request({identifier:"platform",password:"password-1234"},"access_token=old; portal_plane=employee"));
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({next_path:"/roles"});
  expect(res.cookies.get("portal_plane")).toMatchObject({value:"",maxAge:0,httpOnly:true,secure:true,path:"/",sameSite:"strict"});
  expect(res.headers.getSetCookie().some(cookie=>cookie.startsWith("portal_plane=employee"))).toBe(false);
 });
});
