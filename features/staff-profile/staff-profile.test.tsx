import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe,it,expect,vi} from "vitest";
import {StaffProfilePanel} from "./staff-profile-panel";
import type {UserProfile} from "@/lib/auth/client";
const data: UserProfile={id:"private-id",display_name:"Tên mới",email:"a@example.com",phone:"",status:"ACTIVE",created_at:"2026-10-26",memberships:[{org_id:"private-org",org_name:"",roles:["STAFF"]}]};
describe("staff profile panel",()=>{
 it("renders profile and injected editor without identifiers",()=>{
  const html=renderToStaticMarkup(<StaffProfilePanel profile={data} editor={<p>Editor</p>} onLogout={vi.fn()}/>);
  expect(html).toContain("Tên mới");expect(html).toContain("Editor");expect(html).toContain("Chưa có tên tổ chức");expect(html).not.toContain("private-");
 });
 it("keeps editing available without membership",()=>{
  const html=renderToStaticMarkup(<StaffProfilePanel profile={{...data,memberships:[]}} editor={<p>Editor</p>} onLogout={vi.fn()}/>);
  expect(html).toContain("chưa có phạm vi");expect(html).toContain("Editor");
 });
 it("renders avatar from fresh profile props",()=>{
  const html=renderToStaticMarkup(<StaffProfilePanel profile={{...data,avatar_url:"https://storage.example/avatar"}} onLogout={vi.fn()}/>);
  expect(html).toContain('src="https://storage.example/avatar"');
 });
});

vi.mock("next-intl",async original=>{const actual=await original<typeof import("next-intl")>();const messages=await import("@/messages/vi.json");const catalog:Record<string,unknown>=messages.default;return {...actual,useLocale:()=>"vi",useTranslations:(namespace:string)=>actual.createTranslator({locale:"vi",messages:catalog,namespace})};});
