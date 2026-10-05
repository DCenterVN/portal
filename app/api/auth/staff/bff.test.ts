import {afterEach, describe, expect, it, vi} from "vitest";
import {NextRequest, NextResponse} from "next/server";
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
 it("staff login reuses batch A policy and denies customer before publishing session",async()=>{const fetch=vi.fn().mockResolvedValueOnce(json({access_token:"temp"})).mockResolvedValueOnce(json({id:"u",status:"ACTIVE"})).mockResolvedValueOnce(json({error:"NOT_FOUND"},404)).mockResolvedValueOnce(json([{org_id:"o",branch_id:"b",member_type:"CUSTOMER",roles:[]}])).mockResolvedValue(json({}));vi.stubGlobal("fetch",fetch);const res=await login(request({identifier:"customer",password:"p"}));expect(res.status).toBe(403);expect(res.headers.get("set-cookie")).toBeNull();expect(fetch.mock.calls.some(c=>String(c[0]).endsWith("/auth/web/logout"))).toBe(true);});
});

import {POST as branch, GET as branchContexts} from "./switch-branch/route";
import {POST as org, GET as orgContexts} from "./switch-org/route";
const employee={org_id:"o",branch_id:"b",member_type:"EMPLOYEE",status:"ACTIVE",roles:["SALES"]};
describe("S12 server verified staff contexts",()=>{
 it.each([branch,org])("missing session returns 401 before org/auth",async handler=>{const fetch=vi.fn();vi.stubGlobal("fetch",fetch);const res=await handler(request({org_id:"o",branch_id:"b"}));expect(res.status).toBe(401);expect(await res.json()).toMatchObject({error:"UNAUTHORIZED"});expect(fetch).not.toHaveBeenCalled();});
 it.each([branch,org])("accepts verified pair only after org, secure cookie and console landing",async handler=>{const fetch=vi.fn().mockResolvedValueOnce(json([employee,employee])).mockResolvedValueOnce(json({access_token:"rotated",expires_in:600,refresh_token:"secret",token:"secret"}));vi.stubGlobal("fetch",fetch);const res=await handler(request({org_id:"o",branch_id:"b"},"access_token=caller"));expect(res.status).toBe(200);expect(await res.json()).toEqual({next_path:"/console"});expect(res.headers.get("cache-control")).toBe("no-store");const cookie=res.headers.get("set-cookie");expect(cookie).toMatch(/access_token=rotated/);expect(cookie).toMatch(/HttpOnly/);expect(cookie).toMatch(/Secure/);expect(cookie).toMatch(/SameSite=Strict/i);expect(fetch).toHaveBeenNthCalledWith(1,expect.stringContaining("/org/access-contexts/me"),expect.objectContaining({cache:"no-store",headers:{Authorization:"Bearer caller"}}));expect(fetch).toHaveBeenNthCalledWith(2,expect.stringContaining("/auth/org-context"),expect.objectContaining({body:JSON.stringify({org_id:"o",branch_id:"b"})}));});
 it.each([branch,org])("rejects customer/platform/inactive/foreign choices without mutating auth",async handler=>{for(const rows of [[{...employee,member_type:"CUSTOMER"}],[{...employee,member_type:"PLATFORM"}],[{...employee,status:"SUSPENDED"}],[{...employee,org_id:"other"}],[{...employee,branch_id:"other"}],[]]) {const fetch=vi.fn().mockResolvedValueOnce(json(rows)).mockResolvedValueOnce(json({access_token:"must-not-be-issued"}));vi.stubGlobal("fetch",fetch);const res=await handler(request({org_id:"o",branch_id:"b"},"access_token=caller"));expect(res.status).toBe(403);expect(await res.json()).toMatchObject({error:"FORBIDDEN"});expect(fetch).toHaveBeenCalledTimes(1);expect(res.headers.get("set-cookie")).toBeNull();}});
 it.each([branch,org])("rejects missing branch/forged DTO/malformed JSON before org",async handler=>{for(const body of [{org_id:"o"},{org_id:"o",branch_id:"b",roles:["OWNER"]},{org_id:[],branch_id:"b"},{org_id:"o",branch_id:""}]) {const fetch=vi.fn();vi.stubGlobal("fetch",fetch);expect((await handler(request(body,"access_token=caller"))).status).toBe(400);expect(fetch).not.toHaveBeenCalled();}const res=await handler(new NextRequest("http://localhost",{method:"POST",body:"{",headers:{"Content-Type":"application/json","Sec-Fetch-Site":"same-origin",cookie:"access_token=caller"}}));expect(res.status).toBe(400);});
 it.each([branch,org])("org unavailable/schema invalid and switch failure never set cookie or landing",async handler=>{for(const response of [json({error:"service_busy"},503,{"Retry-After":"7"}),json({contexts:[employee]}),json([{...employee,roles:"OWNER"}]),json([{...employee,branch_id:null}])]) {const fetch=vi.fn().mockResolvedValue(response);vi.stubGlobal("fetch",fetch);const res=await handler(request({org_id:"o",branch_id:"b"},"access_token=caller"));expect(res.status).toBe(503);expect(res.headers.get("set-cookie")).toBeNull();expect((await res.json()).next_path).toBeUndefined();expect(fetch).toHaveBeenCalledTimes(1);}const fetch=vi.fn().mockResolvedValueOnce(json([employee])).mockResolvedValueOnce(json({error:"FORBIDDEN"},403));vi.stubGlobal("fetch",fetch);const res=await handler(request({org_id:"o",branch_id:"b"},"access_token=caller"));expect(res.status).toBe(403);expect(res.headers.get("set-cookie")).toBeNull();});
 it.each([orgContexts,branchContexts])("list dedupes ACTIVE employee pairs, never profile memberships",async handler=>{vi.stubGlobal("fetch",vi.fn().mockResolvedValue(json([employee,employee,{...employee,branch_id:"x",status:undefined},{...employee,member_type:"CUSTOMER"},{...employee,status:"SUSPENDED"}])));const res=await handler(new NextRequest("http://localhost",{headers:{"Content-Type":"application/json","Sec-Fetch-Site":"same-origin",cookie:"access_token=caller"}}));expect(res.status).toBe(200);expect(await res.json()).toEqual([{org_id:"o",branch_id:"b",roles:["SALES"]},{org_id:"o",branch_id:"x",roles:["SALES"]}]);});
 it("GET needs session and employee eligibility",async()=>{const fetch=vi.fn();vi.stubGlobal("fetch",fetch);expect((await orgContexts(new NextRequest("http://localhost"))).status).toBe(401);expect(fetch).not.toHaveBeenCalled();fetch.mockResolvedValue(json([{...employee,member_type:"CUSTOMER"}]));expect((await orgContexts(new NextRequest("http://localhost",{headers:{"Content-Type":"application/json","Sec-Fetch-Site":"same-origin",cookie:"access_token=caller"}}))).status).toBe(403);});
});

describe("S12 context failure hardening",()=>{
 it.each([branch,org])("invalid switch success never publishes a session",async handler=>{for(const body of [{},[],{access_token:""},{access_token:17}]){const fetch=vi.fn().mockResolvedValueOnce(json([employee])).mockResolvedValueOnce(json(body));vi.stubGlobal("fetch",fetch);const res=await handler(request({org_id:"o",branch_id:"b"},"access_token=caller"));expect(res.status).toBe(503);expect(res.headers.get("set-cookie")).toBeNull();expect((await res.json()).next_path).toBeUndefined();}});
 it.each([branch,org])("org and auth failures preserve retry and never leak credentials",async handler=>{for(const endpoint of ["org","auth"]){const fetch=vi.fn();if(endpoint==="auth")fetch.mockResolvedValueOnce(json([employee]));fetch.mockResolvedValueOnce(json({error:"service_busy",message:"retry",token:"secret",access_token:"secret"},503,{"Retry-After":"9","set-cookie":"access_token=secret"}));vi.stubGlobal("fetch",fetch);const res=await handler(request({org_id:"o",branch_id:"b"},"access_token=caller"));expect(res.status).toBe(503);expect(await res.json()).toEqual({error:"service_busy",message:"retry"});expect(res.headers.get("retry-after")).toBe("9");expect(res.headers.get("set-cookie")).toBeNull();}});
 it.each([branchContexts,orgContexts])("list malformed JSON/network failure is no-store INTERNAL_ERROR",async handler=>{for(const result of [()=>Promise.resolve(new Response("{")),()=>Promise.reject(Error("secret"))]){vi.stubGlobal("fetch",vi.fn(result));const res=await handler(new NextRequest("http://localhost",{headers:{"Content-Type":"application/json","Sec-Fetch-Site":"same-origin",cookie:"access_token=caller"}}));expect(res.status).toBe(503);expect(res.headers.get("cache-control")).toBe("no-store");expect(await res.json()).toMatchObject({error:"INTERNAL_ERROR"});}});
});


describe("S17 platform entry survives shared resolver removal", () => {
 it.each([json({error:"INTERNAL_ERROR"},503),json({code:200,status:"success",message:"OK",data:{role:"PLATFORM_SUPPORT"}})])("platform lookup failure never publishes a session", async upstream => {
  const fetch=vi.fn().mockResolvedValueOnce(json({access_token:"temporary"})).mockResolvedValueOnce(json({id:"u",status:"ACTIVE"})).mockResolvedValueOnce(upstream).mockResolvedValue(json({}));
  vi.stubGlobal("fetch",fetch);
  const res=await login(request({identifier:"platform",password:"password-1234"}));
  expect(res.status).toBe(503);expect(res.headers.get("set-cookie")).toBeNull();
  expect(fetch.mock.calls.some(call=>String(call[0]).endsWith("/auth/web/logout"))).toBe(true);
 });
 it("verified platform staff land on /platform/companies with a secure session", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(json({access_token:"temporary", expires_in:900}))
   .mockResolvedValueOnce(json({id:"u",status:"ACTIVE"}))
   .mockResolvedValueOnce(json({code:200,status:"success",message:"OK",data:{user_id:"01960000-0000-7000-8000-000000000001",role:"PLATFORM_SUPPORT",actions:["platform:org:read"]}}));
  vi.stubGlobal("fetch",fetch);
  const res=await login(request({identifier:"platform",password:"password-1234"}));
  expect(res.status).toBe(200);expect(await res.json()).toMatchObject({next_path:"/platform/companies"});
  expect(res.headers.get("set-cookie")).toMatch(/access_token=temporary/);
  expect(res.headers.get("set-cookie")).toMatch(/HttpOnly/);
  expect(fetch).toHaveBeenNthCalledWith(3,expect.stringContaining("/platform/me"),expect.objectContaining({cache:"no-store",headers:{Authorization:"Bearer temporary"}}));
  expect(fetch).toHaveBeenCalledTimes(3);
 });
});

describe("R4-1 staff marker issuance", () => {
 it("platform landing clears an old employee marker and never sets it", async () => {
  vi.stubGlobal("fetch", vi.fn()
   .mockResolvedValueOnce(json({access_token:"temporary",expires_in:900},200,{"set-cookie":"__Host-refresh_token=rt; Path=/; Secure; HttpOnly; Max-Age=86400"}))
   .mockResolvedValueOnce(json({id:"u",status:"ACTIVE"}))
   .mockResolvedValueOnce(json({code:200,status:"success",message:"OK",data:{user_id:"01960000-0000-7000-8000-000000000001",role:"PLATFORM_SUPPORT",actions:["platform:org:read"]}})));
  const res = await login(request({identifier:"platform",password:"password-1234"},"access_token=old; portal_plane=employee"));
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({next_path:"/platform/companies"});
  expect(res.cookies.get("portal_plane")).toMatchObject({value:"",maxAge:0,httpOnly:true,secure:true,path:"/",sameSite:"strict"});
  expect(res.headers.getSetCookie().some(cookie=>cookie.startsWith("portal_plane=employee"))).toBe(false);
 });
 it.each([branch,org])("successful staff switch sets marker matching rotated refresh cookie", async handler => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json([employee]))
   .mockResolvedValueOnce(json({access_token:"rotated",expires_in:600},200,{"set-cookie":"refresh_token=rt; Path=/; HttpOnly; Max-Age=43200; SameSite=Strict"})));
  const res = await handler(request({org_id:"o",branch_id:"b"},"access_token=caller"));
  expect(res.status).toBe(200);
  const refreshCookie = new NextResponse(null, {headers: res.headers}).cookies.get("refresh_token")!;
  expect(refreshCookie.sameSite).toBe("strict");
  expect(res.cookies.get("portal_plane")).toMatchObject({value:"employee",maxAge:refreshCookie.maxAge,httpOnly:refreshCookie.httpOnly,secure:refreshCookie.secure ?? false,path:refreshCookie.path,sameSite:refreshCookie.sameSite});
 });
 it.each([branch,org])("successful staff switch without refresh rotation sets a session marker", async handler => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json([employee])).mockResolvedValueOnce(json({access_token:"rotated",expires_in:600})));
  const res = await handler(request({org_id:"o",branch_id:"b"},"access_token=caller"));
  expect(res.status).toBe(200);
  expect(res.cookies.get("refresh_token")).toBeUndefined();
  expect(res.cookies.get("access_token")?.sameSite).toBe("strict");
  expect(res.cookies.get("portal_plane")).toMatchObject({value:"employee",httpOnly:true,secure:true,path:"/",sameSite:res.cookies.get("access_token")?.sameSite});
  expect(res.cookies.get("portal_plane")).not.toHaveProperty("maxAge");
 });
 it.each([branch,org])("failed staff switch never issues employee marker even with upstream cookies", async handler => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json([employee]))
   .mockResolvedValueOnce(json({error:"FORBIDDEN"},403,{"set-cookie":"refresh_token=must-not-publish; Max-Age=43200"})));
  const res = await handler(request({org_id:"o",branch_id:"b"},"access_token=caller"));
  expect(res.status).toBe(403);
  expect(res.headers.get("set-cookie")).toBeNull();
 });
});
