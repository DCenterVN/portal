import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {beforeEach,describe,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({profile:{id:"private-user-id",email:"a@example.com",phone:"",display_name:"Tên cũ",status:"ACTIVE",created_at:"2026-10-26",memberships:[],avatar_url:null},tab:"general"}));
vi.mock("next/navigation",()=>({useRouter:()=>({replace:vi.fn(),push:vi.fn(),refresh:vi.fn()})}));
vi.mock("swr",()=>({default:()=>({data:state.profile,isLoading:false,mutate:vi.fn()})}));
vi.mock("react",async original=>({...await original<typeof import("react")>(),useEffect:()=>{},useState:()=>[state.tab,vi.fn()]}));
vi.mock("./account-edit-container",()=>({AccountEditContainer:({section}: {section:string})=><div>editor-{section}</div>}));
import ProfileClient from "@/app/(store)/me/profile-client";
beforeEach(()=>{state.profile.display_name="Tên cũ";state.tab="general";});
describe("customer account",()=>{
 it("renders the general editor without exposing an identifier",()=>{
  const html=renderToStaticMarkup(<ProfileClient/>);
  expect(html).toContain("editor-general");expect(html).not.toContain("private-user-id");expect(html).not.toContain("Mã NV");
 });
 it("reads the shared cache for the hero immediately",()=>{
  expect(renderToStaticMarkup(<ProfileClient/>)).toContain("Tên cũ");
  state.profile.display_name="Tên mới";
  expect(renderToStaticMarkup(<ProfileClient/>)).toContain("Tên mới");
 });
 it("keeps the security tab and mounts its editor",()=>{
  state.tab="security";
  const html=renderToStaticMarkup(<ProfileClient/>);
  expect(html).toContain("editor-security");expect(html).not.toContain("forgot-password");
 });
});

vi.mock("next-intl",async original=>{const actual=await original<typeof import("next-intl")>();const messages=await import("@/messages/vi.json");const catalog:Record<string,unknown>=messages.default;return {...actual,useLocale:()=>"vi",useTranslations:(namespace:string)=>actual.createTranslator({locale:"vi",messages:catalog,namespace})};});
