import {afterEach,describe,expect,it,vi} from "vitest";
import {validateAvatar,uploadAvatar} from "./account-avatar";
const file=new File([new Uint8Array([1,2])],"a.png",{type:"image/png"});
const grant={upload_id:"u",upload_url:"https://storage.example/bucket",upload_method:"POST",form_fields:{key:"k",policy:"proof"},expires_in:60};
afterEach(()=>{vi.unstubAllGlobals();});
describe("direct account avatar",()=>{
 it.each([0,2097153])("rejects size %i",async size=>{await expect(validateAvatar(new File([new Uint8Array(size)],"a.png",{type:"image/png"}))).rejects.toThrow();});
 it("checks decoded image dimensions and releases bitmap",async()=>{const close=vi.fn();vi.stubGlobal("createImageBitmap",vi.fn().mockResolvedValue({width:2049,height:1,close}));await expect(validateAvatar(file)).rejects.toThrow();expect(close).toHaveBeenCalledOnce();});
 it("posts all policy fields and file without authorization or multipart header",async()=>{const fetch=vi.fn().mockResolvedValue(new Response(null,{status:204}));vi.stubGlobal("fetch",fetch);await uploadAvatar(file,grant,"https://storage.example");const options=fetch.mock.calls[0][1];expect(options.credentials).toBe("omit");expect(options.headers).toBeUndefined();expect(options.body.get("policy")).toBe("proof");expect(options.body.get("file")).toBeInstanceOf(File);});
 it("supports PUT and rejects foreign URL, unsafe redirect or unknown method before upload",async()=>{const fetch=vi.fn().mockResolvedValue(new Response(null,{status:200}));vi.stubGlobal("fetch",fetch);await uploadAvatar(file,{...grant,upload_method:"PUT"},"https://storage.example");expect(fetch.mock.calls[0][1]).toMatchObject({method:"PUT",credentials:"omit",redirect:"error",body:file});fetch.mockClear();for(const patch of [{upload_url:"https://evil.example/k"},{upload_url:"https://user:pass@storage.example/k"},{upload_method:"PATCH"}])await expect(uploadAvatar(file,{...grant,...patch},"https://storage.example")).rejects.toThrow();expect(fetch).not.toHaveBeenCalled();});
 it("does not finalize a failed upload",async()=>{vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(null,{status:403})));await expect(uploadAvatar(file,grant,"https://storage.example")).rejects.toThrow();expect(fetch).toHaveBeenCalledOnce();});
});
