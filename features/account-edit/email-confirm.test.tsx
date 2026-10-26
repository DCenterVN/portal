import {beforeEach,afterEach,describe,it,expect,vi} from "vitest";
const h=vi.hoisted(()=>({slots:[] as unknown[],cursor:0,effects:[] as (()=>void)[],events:[] as string[]}));
vi.mock("react",()=>({useState:(initial:unknown)=>{const i=h.cursor++;if(!(i in h.slots))h.slots[i]=initial;return [h.slots[i],(v:unknown)=>{h.slots[i]=v;}];},useRef:(initial:unknown)=>{const i=h.cursor++;if(!(i in h.slots))h.slots[i]={current:initial};return h.slots[i];},useEffect:(effect:()=>void)=>{h.effects.push(effect);}}));
vi.mock("swr",()=>({useSWRConfig:()=>({mutate:vi.fn()})}));
vi.mock("next-intl",()=>({useTranslations:()=>(key:string)=>key}));
import * as client from "@/lib/api/account-client";
import {useEmailConfirm} from "./use-email-confirm";
function model(){h.cursor=0;return useEmailConfirm();}
beforeEach(()=>{h.slots=[];h.cursor=0;h.effects=[];h.events=[];vi.restoreAllMocks();vi.stubGlobal("window",{location:{href:"http://localhost:3001/email/confirm?token=proof&tracking=secret#fragment",pathname:"/email/confirm"},history:{replaceState:vi.fn(()=>{h.events.push("scrub");})}});});
afterEach(()=>vi.unstubAllGlobals());
describe("account email confirmation",()=>{
 it("scrubs full query/fragment before profile request and never auto confirms",async()=>{const profile=vi.spyOn(client,"getAccountProfile").mockImplementation(async()=>{h.events.push("get");return {} as Awaited<ReturnType<typeof client.getAccountProfile>>;});const confirm=vi.spyOn(client,"confirmEmailChange");model();h.effects[0]();h.effects[0]();await Promise.resolve();expect(h.events).toEqual(["scrub","get"]);expect(profile).toHaveBeenCalledOnce();expect(confirm).not.toHaveBeenCalled();expect(window.history.replaceState).toHaveBeenCalledWith(null,"","/email/confirm");});
 it("explicit submit holds latch and clears token/cache on success",async()=>{vi.spyOn(client,"getAccountProfile").mockResolvedValue({} as Awaited<ReturnType<typeof client.getAccountProfile>>);let finish!:(value:{status:"success"})=>void;const confirm=vi.spyOn(client,"confirmEmailChange").mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));model();h.effects[0]();await Promise.resolve();const current=model();const pending=current.confirm();await current.confirm();expect(confirm).toHaveBeenCalledOnce();expect(confirm).toHaveBeenCalledWith({token:"proof"});finish({status:"success"});await pending;expect(model().state).toBe("done");await model().confirm();expect(confirm).toHaveBeenCalledOnce();});
 it("empty URL does not request or confirm",()=>{window.location.href="http://localhost:3001/email/confirm";const profile=vi.spyOn(client,"getAccountProfile");model();h.effects[0]();expect(model().state).toBe("empty");expect(profile).not.toHaveBeenCalled();});
});
