import {afterEach, beforeEach, expect, it, vi} from "vitest";
import {NextRequest} from "next/server";
vi.mock("server-only", () => ({}));
import {PATCH} from "../../app/api/auth/profile/route";
import {POST} from "../../app/api/auth/password/change/route";
const request = (body: unknown, headers: Record<string, string> = {}) => new NextRequest("http://localhost:3000/api/auth/profile", {method: "POST", headers: {origin: "http://localhost:3000", "content-type": "application/json", cookie: "access_token=fixture", ...headers}, body: JSON.stringify(body)});
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), {status});
beforeEach(() => { vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"); vi.stubGlobal("fetch", vi.fn()); });
afterEach(() => {vi.unstubAllGlobals(); vi.unstubAllEnvs();});
it("normalizes NFC and strips internal output from handler envelope", async () => {
  vi.mocked(fetch).mockResolvedValue(reply({code:200,status:"success",message:"ok",data:{display_name:"Tén",private:"hidden"}}));
  const res = await PATCH(request({display_name:" Te\u0301n "}));
  expect(res.status).toBe(200); expect(await res.json()).toEqual({code:200,status:"success",message:"",data:{display_name:"Tén"}});
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/auth/profile"), expect.objectContaining({method:"PATCH",cache:"no-store",body:JSON.stringify({display_name:"Tén"}),headers:expect.objectContaining({Authorization:"Bearer fixture"})}));
  expect(res.headers.get("cache-control")).toBe("no-store");
});
it.each(["", " ", "a".repeat(51), "a\u0000b", null, [], 1])("rejects invalid names before upstream", async display_name => {
  const res = await PATCH(request({display_name})); expect(res.status).toBe(400); expect(await res.json()).toMatchObject({error:"VALIDATION_ERROR"}); expect(fetch).not.toHaveBeenCalled();
});
it("accepts 50 Unicode code points", async () => {
 vi.mocked(fetch).mockResolvedValue(reply({code:200,status:"success",message:"",data:{display_name:"😀".repeat(50)}}));
 expect((await PATCH(request({display_name:"😀".repeat(50)}))).status).toBe(200);
});
it.each<Record<string, string>>([{origin:"https://evil.test","sec-fetch-site":"same-origin"},{origin:""},{"sec-fetch-site":"same-site"},{"content-type":"text/plain"}])("rejects CSRF contradictions", async headers => {const res = await PATCH(request({display_name:"Tên"},headers)); expect(res.status).toBe(403); expect(fetch).not.toHaveBeenCalled();});
it("rejects missing session and injected principal", async () => {
 expect((await PATCH(request({display_name:"Tên"},{cookie:""}))).status).toBe(401);
 const res = await PATCH(request({display_name:"Tên",user_id:"other"})); expect(await res.json()).toMatchObject({error:"BAD_REQUEST"}); expect(fetch).not.toHaveBeenCalled();
});
it("caps request bytes and malformed JSON", async () => {
 expect((await PATCH(request({display_name:"a".repeat(17000)}))).status).toBe(400);
 const req = request({}); const malformed = new NextRequest(req.url,{method:"PATCH",headers:req.headers,body:"{"});
 expect(await (await PATCH(malformed)).json()).toMatchObject({error:"BAD_REQUEST"}); expect(fetch).not.toHaveBeenCalled();
});
it("204 clears all scoped session cookies without parsing body", async () => {
 vi.mocked(fetch).mockResolvedValue(new Response(null,{status:204}));
 const res = await POST(request({current_password:"old-password",new_password:"new-password-123"}));
 expect(res.status).toBe(204); expect(await res.text()).toBe("");
 for(const name of ["access_token","refresh_token","__Host-refresh_token","CSRF-Token","portal_plane"]) expect(res.cookies.get(name)).toMatchObject({value:"",path:"/",maxAge:0});
 expect(res.cookies.get("__Host-refresh_token")?.secure).toBe(true); expect(fetch).toHaveBeenCalledTimes(1);
});
it.each(["x".repeat(11),"é".repeat(129),"old-password"]) ("rejects invalid new password", async new_password => {
 expect((await POST(request({current_password:"old-password",new_password}))).status).toBe(400); expect(fetch).not.toHaveBeenCalled();
});
it.each([[401,"invalid_current_password"],[429,"rate_limit_exceeded"],[503,"service_busy"]] as const)("preserves error code/status/retry without cookies or raw messages", async (status,code) => {
 vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({errors:{error_code:code},message:"internal details"}),{status,headers:{"Retry-After":"3"}}));
 const res = await POST(request({current_password:"old",new_password:"new-password-123"}));
 expect(res.status).toBe(status); expect(await res.json()).toEqual({error:code,message:expect.any(String)}); expect(res.headers.get("retry-after")).toBe("3"); expect(res.headers.get("set-cookie")).toBeNull(); expect(fetch).toHaveBeenCalledTimes(1);
});
it("sanitizes network and malformed upstream failures",async () => {
 vi.mocked(fetch).mockRejectedValueOnce(Error("private host")).mockResolvedValueOnce(new Response("invalid"));
 for(let i=0;i<2;i++){const res=await PATCH(request({display_name:"Tên"})); expect(res.status).toBe(503); expect(await res.json()).toMatchObject({error:"INTERNAL_ERROR"});}
});
