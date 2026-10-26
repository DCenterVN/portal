import {afterEach, describe, expect, it, vi} from "vitest";
import {changePassword, requestEmailChange, confirmEmailChange, updateProfile, getAccountProfile, presignAvatar, finalizeAvatar, deleteAvatar} from "./account-client";
const profile = {id:"u",email:"a@example.com",phone:"",display_name:"Tên",status:"ACTIVE",created_at:"2026-10-26",memberships:[],avatar_key:null,avatar_url:null};
const envelope = (data: unknown) => ({code:200,status:"success",message:"",data});
afterEach(()=>vi.unstubAllGlobals());
describe("account client",()=>{
 it("decodes flat profile and strips private fields",async()=>{
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(Response.json({...profile,password_hash:"private"})));
  expect(await getAccountProfile()).toEqual(profile);
 });
 it("decodes profile envelope",async()=>{
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(Response.json(envelope({display_name:"Tên"}))));
  expect(await updateProfile({display_name:"Tên"})).toEqual({display_name:"Tên"});
 });
 it("accepts empty 204 without parsing JSON",async()=>{
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(null,{status:204})));
  await expect(changePassword({current_password:"old",new_password:"new"})).resolves.toBeUndefined();
 });
 it.each([401,429,503])("never refreshes or replays mutation %i",async status=>{
  const fetch=vi.fn().mockResolvedValue(Response.json({error:"invalid_current_password",message:"sql private"},{status,headers:{"Retry-After":"30"}}));
  vi.stubGlobal("fetch",fetch);
  await expect(changePassword({current_password:"old",new_password:"new"})).rejects.toMatchObject({status,code:"invalid_current_password"});
  expect(fetch).toHaveBeenCalledTimes(1);
 });
 it("pending email and confirmation use flat status",async()=>{
  const fetch=vi.fn().mockResolvedValueOnce(Response.json({status:"pending"},{status:202})).mockResolvedValueOnce(Response.json({status:"success"}));
  vi.stubGlobal("fetch",fetch);
  expect(await requestEmailChange({current_password:"old",new_email:"b@example.com"})).toEqual({status:"pending"});
  expect(await confirmEmailChange({token:"test-only"})).toEqual({status:"success"});
 });
 it("decodes avatar grant, finalize and deletion envelopes",async()=>{
  const grant={upload_id:"u",upload_url:"http://localhost:9000/bucket",upload_method:"POST",form_fields:{key:"avatar"},expires_in:60};
  vi.stubGlobal("fetch",vi.fn().mockResolvedValueOnce(Response.json(envelope(grant))).mockResolvedValueOnce(Response.json(envelope({avatar_key:"key",avatar_url:"http://localhost:9000/key"}))).mockResolvedValueOnce(Response.json(envelope({message:"deleted"}))));
  expect(await presignAvatar({file_name:"a.png",content_type:"image/png",file_size:1})).toEqual(grant);
  expect(await finalizeAvatar({upload_id:"u"})).toHaveProperty("avatar_key","key");
  expect(await deleteAvatar()).toEqual({message:"deleted"});
 });
 it("rejects malformed profile safely",async()=>{
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(Response.json({secret:"private"})));
  await expect(getAccountProfile()).rejects.toThrow("Không thể đọc phản hồi");
 });
});
