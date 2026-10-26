import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe,it,expect,vi,beforeEach} from "vitest";
import {NameForm} from "@/components/patterns/account/name-form";
import {PasswordForm} from "@/components/patterns/account/password-form";
import {validateName,validatePassword} from "./use-account-edit";
describe("account edit forms",()=>{
 it("normalizes names and rejects empty/control/51 code points",()=>{
  expect(validateName("  Nguyễn  ")).toBe("");
  for(const value of [" ","A\nB","😀".repeat(51)]) expect(validateName(value)).not.toBe("");
  expect(validateName("😀".repeat(50))).toBe("");
 });
 it("checks password confirmation, code points and UTF8 limit",()=>{
  expect(validatePassword("old","a".repeat(12),"a".repeat(12))).toBe("");
  for(const next of ["a".repeat(11),"😀".repeat(65)]) expect(validatePassword("old",next,next)).not.toBe("");
  expect(validatePassword("old","a".repeat(12),"different")).not.toBe("");
 });
 it("renders associated labels and inline error",()=>{
  const html=renderToStaticMarkup(<NameForm value="Tên" onChange={()=>{}} onSubmit={vi.fn()} pending={false} error="Tên chưa hợp lệ"/>);
  expect(html).toContain('for="account-name"'); expect(html).toContain('aria-invalid="true"'); expect(html).toContain('id="account-name-error"');
 });
 it("renders all password fields and locks submission",()=>{
  const html=renderToStaticMarkup(<PasswordForm current="" next="" confirmation="" onChange={()=>{}} onSubmit={vi.fn()} pending={true}/>);
  expect(html).toContain('autoComplete="current-password"'); expect(html.match(/autoComplete="new-password"/g)).toHaveLength(2);
  expect(html).toContain("Đang lưu"); expect(html).toContain("disabled");
 });
});

const h=vi.hoisted(()=>({active:false,slots:[] as unknown[],cursor:0,read:vi.fn(),mutate:vi.fn(),profile:{display_name:"Tên cũ"}}));
vi.mock("react",async original=>{const actual=await original<typeof import("react")>();return {...actual,
 useState:(initial:unknown)=>{if(!h.active)return actual.useState(initial);const i=h.cursor++;if(!(i in h.slots))h.slots[i]=initial;return [h.slots[i],(value:unknown)=>{h.slots[i]=value;}];},
 useRef:(initial:unknown)=>{if(!h.active)return actual.useRef(initial);const i=h.cursor++;if(!(i in h.slots))h.slots[i]={current:initial};return h.slots[i];},
 useEffect:(effect:()=>void)=>{if(h.active)effect();else actual.useEffect(effect);}
};});
vi.mock("swr",()=>({default:()=>({data:h.profile,mutate:h.read}),useSWRConfig:()=>({mutate:h.mutate})}));
vi.mock("next-intl",async original=>{const actual=await original<typeof import("next-intl")>();const messages=await import("@/messages/vi.json");const catalog:Record<string,unknown>=messages.default;return {...actual,useTranslations:(namespace:string)=>actual.createTranslator({locale:"vi",messages:catalog,namespace})};});
import * as client from "@/lib/api/account-client";
import {useAccountEdit} from "./use-account-edit";
function model(){h.cursor=0;return useAccountEdit("/login");}
beforeEach(()=>{vi.restoreAllMocks();h.active=false;h.slots=[];h.profile.display_name="Tên cũ";h.read.mockReset();h.mutate.mockReset();});
describe("account deferred mutations",()=>{
 it("holds name latch through read-back and reports success only after GET",async()=>{
  h.active=true;let finish!:()=>void;let read!:()=>void;
  const update=vi.spyOn(client,"updateProfile").mockImplementation(()=>new Promise(resolve=>{finish=()=>resolve({display_name:"Tên mới"});}));
  h.read.mockImplementation(()=>new Promise(resolve=>{read=()=>{h.profile.display_name="Tên mới";resolve(h.profile);};}));
  model().setName("Tên mới");const current=model();const pending=current.saveName();await current.saveName();expect(update).toHaveBeenCalledTimes(1);
  finish();await Promise.resolve();await current.saveName();expect(update).toHaveBeenCalledTimes(1);expect(model().notice).toBe("");
  read();await pending;expect(h.read).toHaveBeenCalledOnce();expect(model().notice).toContain("Đã lưu");expect(model().profile.data?.display_name).toBe("Tên mới");h.active=false;
 });
 it("does not report save success when read-back fails",async()=>{
  h.active=true;vi.spyOn(client,"updateProfile").mockResolvedValue({display_name:"Tên mới"});h.read.mockRejectedValue(Error("offline"));
  const current=model();await current.saveName();expect(model().notice).toBe("");expect(model().nameError).not.toBe("");h.active=false;
 });
 it("submits password once before render and clears shared profile on success",async()=>{
  h.active=true;let finish!:()=>void;const change=vi.spyOn(client,"changePassword").mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
  model().setPassword({current:"old",next:"new-password12",confirmation:"new-password12"});const current=model();const pending=current.savePassword();await current.savePassword();expect(change).toHaveBeenCalledOnce();finish();await pending;
  expect(model().reauth).toBe(true);expect(model().password.current).toBe("");expect(h.mutate).toHaveBeenCalledWith(client.ACCOUNT_PROFILE_KEY,undefined,{revalidate:false});h.active=false;
 });
});
