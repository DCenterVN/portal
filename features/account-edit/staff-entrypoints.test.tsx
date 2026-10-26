import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe,it,expect,vi} from "vitest";
vi.mock("@/features/staff-profile/staff-profile-container",()=>({StaffProfileContainer:({editor}: {editor:React.ReactNode})=><main>Hồ sơ nhân viên{editor}</main>}));
vi.mock("./account-edit-container",()=>({AccountEditContainer:({loginPath}: {loginPath:string})=><p>{loginPath}</p>}));
import ConsoleAccount from "@/app/(console)/account/page";
import CompanyAccount from "@/app/company/account/page";
import PlatformAccount from "@/app/platform/account/page";
describe("staff entrypoints",()=>{
 it.each([ConsoleAccount,CompanyAccount,PlatformAccount])("composes the editor with employee login",Component=>{
  const html=renderToStaticMarkup(<Component/>);
  expect(html).toContain("/staff/login");expect(html).toContain("Hồ sơ nhân viên");
 });
});
