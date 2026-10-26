import {beforeEach,afterEach,describe,it,expect,vi} from "vitest";
import {NextRequest} from "next/server";
vi.mock("server-only",()=>({}));
import {POST as presign} from "@/app/api/auth/profile/avatar/presign/route";
import {POST as finalize} from "@/app/api/auth/profile/avatar/finalize/route";
import {DELETE as remove} from "@/app/api/auth/profile/avatar/route";
const grant={upload_id:"u",upload_url:"http://localhost:9000/avatar",upload_method:"POST",form_fields:{key:"k"},expires_in:60};
const input={file_name:"a.png",content_type:"image/png",file_size:1};
function req(body?: unknown,method="POST",origin="http://localhost:3000") {
 return new NextRequest("http://localhost:3000/api/auth/profile/avatar",{method,headers:{origin,"content-type":"application/json",cookie:"access_token=test-only"},...(body===undefined ? {} : {body:JSON.stringify(body)})});
}
beforeEach(()=>{vi.stubEnv("NEXT_PUBLIC_SITE_URL","http://localhost:3000");vi.stubGlobal("fetch",vi.fn().mockResolvedValue(Response.json({code:200,status:"success",message:"",data:grant})));});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe("avatar BFF",()=>{
 it("preserves POST policy and strips unknown output",async()=>{
  const res=await presign(req(input));expect(res.status).toBe(200);expect((await res.json()).data).toEqual(grant);
 });
 it.each([0,2097153,1.5])("rejects file size %i before upstream",async size=>{
  expect((await presign(req({...input,file_size:size}))).status).toBe(400);expect(fetch).not.toHaveBeenCalled();
 });
 it("rejects unsupported MIME and injected owner",async()=>{
  expect((await presign(req({...input,content_type:"image/svg+xml"}))).status).toBe(400);
  expect((await presign(req({...input,user_id:"other"}))).status).toBe(400);expect(fetch).not.toHaveBeenCalled();
 });
 it("requires upload id for finalize",async()=>{
  expect((await finalize(req({}))).status).toBe(400);expect(fetch).not.toHaveBeenCalled();
 });
 it("decodes finalized avatar envelope",async()=>{
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({code:200,status:"success",message:"",data:{avatar_key:"k",avatar_url:"https://storage.example/k"}}));
  expect((await finalize(req({upload_id:"u"}))).status).toBe(200);
 });
 it("guards delete with configured origin",async()=>{
  expect((await remove(req(undefined,"DELETE","https://evil.example"))).status).toBe(403);expect(fetch).not.toHaveBeenCalled();
 });
 it("deletes without sending image bytes",async()=>{
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({code:200,status:"success",message:"",data:{message:"avatar removed"}}));
  expect((await remove(req(undefined,"DELETE"))).status).toBe(200);
  expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({method:"DELETE"});
 });
});
