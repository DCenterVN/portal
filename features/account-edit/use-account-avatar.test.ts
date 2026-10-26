import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
const h=vi.hoisted(()=>({slots:[] as unknown[],cursor:0,cleanup:[] as (()=>void)[]}));
vi.mock("react",()=>({useState:(initial:unknown)=>{const i=h.cursor++;if(!(i in h.slots))h.slots[i]=initial;return [h.slots[i],(v:unknown)=>{h.slots[i]=v;}];},useRef:(initial:unknown)=>{const i=h.cursor++;if(!(i in h.slots))h.slots[i]={current:initial};return h.slots[i];},useEffect:(effect:()=>()=>void)=>{if(!h.cleanup.length)h.cleanup.push(effect());}}));
vi.mock("next-intl",()=>({useTranslations:()=>(key:string)=>key}));
vi.mock("@/lib/api/account-avatar",()=>({validateAvatar:vi.fn().mockResolvedValue(undefined),uploadAvatar:vi.fn().mockResolvedValue(undefined)}));
import * as client from "@/lib/api/account-client";
import * as transport from "@/lib/api/account-avatar";
import {useAccountAvatar} from "./use-account-avatar";
const file=new File(["a"],"a.png",{type:"image/png"});
const grant={upload_id:"u",upload_url:"https://storage.example/k",upload_method:"POST",form_fields:{},expires_in:60};
const refresh=vi.fn();function model(){h.cursor=0;return useAccountAvatar(refresh);}
beforeEach(()=>{h.slots=[];h.cursor=0;h.cleanup=[];vi.restoreAllMocks();vi.spyOn(URL,"createObjectURL").mockReturnValue("blob:preview");vi.spyOn(URL,"revokeObjectURL").mockImplementation(()=>{});refresh.mockReset().mockResolvedValue(undefined);});
afterEach(()=>{for(const cleanup of h.cleanup)cleanup();});
describe("account avatar lifecycle",()=>{
 it("select/cancel do not presign and revoke preview",async()=>{const presign=vi.spyOn(client,"presignAvatar");await model().select(file);expect(model().preview).toBe("blob:preview");expect(presign).not.toHaveBeenCalled();model().cancel();expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");expect(model().preview).toBe("");});
 it("keeps latch during upload and read-back before clearing preview",async()=>{let done!:(v:typeof grant)=>void;const presign=vi.spyOn(client,"presignAvatar").mockImplementation(()=>new Promise(resolve=>{done=resolve;}));vi.spyOn(client,"finalizeAvatar").mockResolvedValue({avatar_key:"k",avatar_url:"https://storage.example/k"});await model().select(file);const pending=model().save();await model().save();expect(presign).toHaveBeenCalledOnce();done(grant);await pending;expect(transport.uploadAvatar).toHaveBeenCalled();expect(refresh).toHaveBeenCalledOnce();expect(model().preview).toBe("");});
 it("reads back ambiguous finalize and keeps preview for deliberate retry",async()=>{vi.spyOn(client,"presignAvatar").mockResolvedValue(grant);vi.spyOn(client,"finalizeAvatar").mockRejectedValue(Error("timeout"));await model().select(file);await model().save();expect(refresh).toHaveBeenCalledOnce();expect(model().preview).toBe("blob:preview");expect(model().error).not.toBe("");});
});
