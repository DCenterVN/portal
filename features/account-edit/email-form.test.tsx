import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {beforeEach,describe,expect,it,vi} from "vitest";
const h=vi.hoisted(()=>({active:false,slots:[] as unknown[],cursor:0}));
vi.mock("react",async original=>{const actual=await original<typeof import("react")>();return {...actual,useState:(initial:unknown)=>{if(!h.active)return actual.useState(initial);const i=h.cursor++;if(!(i in h.slots))h.slots[i]=initial;return [h.slots[i],(v:unknown)=>{h.slots[i]=v;}];},useRef:(initial:unknown)=>{if(!h.active)return actual.useRef(initial);const i=h.cursor++;if(!(i in h.slots))h.slots[i]={current:initial};return h.slots[i];}};});
vi.mock("next-intl",async original=>{const actual=await original<typeof import("next-intl")>();const messages:Record<string,unknown>=(await import("@/messages/vi.json")).default;return {...actual,useTranslations:(namespace:string)=>actual.createTranslator({locale:"vi",messages,namespace})};});
import * as client from "@/lib/api/account-client";
import {FetchError} from "@/lib/fetcher";
import {EmailForm} from "@/components/patterns/account/email-form";
import {useAccountEmail} from "./use-account-email";
function model(){h.cursor=0;return useAccountEmail();}
beforeEach(()=>{h.active=false;h.slots=[];vi.restoreAllMocks();});
describe("account email request",()=>{
 it("renders current email separately, labels proof and pending feedback",()=>{const html=renderToStaticMarkup(<EmailForm current="old@example.test" email="new@example.test" password="" pending={false} sent error="" onEmail={vi.fn()} onPassword={vi.fn()} onSubmit={vi.fn()}/>);expect(html).toContain("old@example.test");expect(html).toContain("Đã gửi xác nhận tới email mới.");expect(html).toContain('autoComplete="current-password"');expect(html).toContain('for="account-email"');});
 it("holds deferred latch, records pending without profile mutation and clears proof",async()=>{h.active=true;let finish!:(value:{status:"pending"})=>void;const request=vi.spyOn(client,"requestEmailChange").mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));const profile=vi.spyOn(client,"updateProfile");model().setEmail("new@example.test");model().setPassword("proof");const current=model();const pending=current.submit();await current.submit();expect(request).toHaveBeenCalledOnce();finish({status:"pending"});await pending;expect(model().sent).toBe(true);expect(model().password).toBe("");expect(profile).not.toHaveBeenCalled();h.active=false;});
 it("checks ambiguous unauthorized with GET and never replays request",async()=>{h.active=true;const request=vi.spyOn(client,"requestEmailChange").mockRejectedValue(new FetchError("denied",401,{error:"UNAUTHORIZED"}));const profile=vi.spyOn(client,"getAccountProfile").mockRejectedValue(Error("expired"));model().setEmail("new@example.test");model().setPassword("proof");await model().submit();expect(request).toHaveBeenCalledOnce();expect(profile).toHaveBeenCalledOnce();expect(model().reauth).toBe(true);h.active=false;});
});
