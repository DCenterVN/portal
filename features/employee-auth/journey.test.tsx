import {beforeEach, describe, expect, it, vi} from "vitest";
import React, {type ReactElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";
const h = vi.hoisted(() => ({slots: [] as unknown[], cursor: 0, push: vi.fn(), refresh: vi.fn(), query: new URLSearchParams(), effects: [] as (() => void)[]}));
vi.mock("react", async original => {const actual = await original<typeof import("react")>(); return {...actual,
 useId: () => "staff-test",
 useState: (initial: unknown) => {const n=h.cursor++; if (!(n in h.slots)) h.slots[n]=initial; return [h.slots[n], (value: unknown) => {h.slots[n]=value;}];},
 useRef: (initial: unknown) => {const n=h.cursor++; if (!(n in h.slots)) h.slots[n]={current: initial}; return h.slots[n];},
 useEffect: (effect: () => void) => {h.effects.push(effect);}
};});
vi.mock("next/navigation", () => ({useRouter: () => ({push:h.push,refresh:h.refresh}), useSearchParams: () => h.query, redirect: (path: string) => {throw Error("REDIRECT:"+path);}}));
import {EmployeeAuthShell} from "@/components/layout/employee-auth-shell";
import {StaffLogin as LoginForm} from "./staff-login";
import * as client from "@/lib/api/employee-auth";
function render(component: () => ReactElement) {h.cursor=0; return component();}
type Props = {children?: React.ReactNode; onSubmit?: (e: React.FormEvent<HTMLFormElement>) => Promise<void>};
function form(tree: ReactElement): ReactElement<Props> {
 if(tree.type === "form") return tree as ReactElement<Props>;
 for(const child of React.Children.toArray((tree.props as Props).children)) if(React.isValidElement(child)) {try{return form(child);}catch{/* Keep searching sibling elements. */}}
 throw Error("No form");
}
async function submit(tree: ReactElement, fields: Record<string,string>) {
 const element={querySelector:vi.fn(() => ({focus:vi.fn()}))};
 vi.stubGlobal("requestAnimationFrame",(callback:FrameRequestCallback)=>{callback(0);return 0;});
 vi.stubGlobal("FormData",class {get(key:string){return fields[key] ?? null;}});
 await form(tree).props.onSubmit?.({preventDefault(){}, currentTarget:element} as unknown as React.FormEvent<HTMLFormElement>); return element;
}
beforeEach(() => {vi.restoreAllMocks(); vi.unstubAllGlobals(); h.slots=[];h.cursor=0;h.effects=[];h.query=new URLSearchParams();h.push.mockReset();h.refresh.mockReset();});
describe("S8 employee login", () => {
 it("owns one main, staff marker, skip link and solid branded shell", () => {const html=renderToStaticMarkup(<EmployeeAuthShell>staff</EmployeeAuthShell>);expect(html.match(/<main/g)).toHaveLength(1);expect(html.match(/data-auth-journey="employee"/g)).toHaveLength(1);expect(html).toContain('href="#main"');expect(html).toContain("Sunny");expect(html).not.toContain("<aside");expect(html).toContain("max-w-sm");expect(html).not.toMatch(/blur|gradient|bg-primary/);});
 it("labels pair with unique IDs; staff has no self-register", () => {const html=renderToStaticMarkup(render(LoginForm));const ids=[...html.matchAll(/<label[^>]*for="([^"]+)"/g)].map(m=>m[1]);expect(ids).toHaveLength(2);expect(new Set(ids).size).toBe(2);for(const id of ids) expect(html).toContain(`id="${id}"`);expect(html).toContain('autoComplete="current-password"');expect(html).toContain('href="/staff/forgot-password"');expect(html).not.toContain('/register');});
 it("single pending request uses server staff next_path, ignores redirect query", async () => {let done!: (v:{next_path:string})=>void;const login=vi.spyOn(client,"login").mockImplementation(()=>new Promise(r=>{done=r;}));h.query=new URLSearchParams("redirect=https://evil.com");const tree=render(LoginForm);const pending=submit(tree,{identifier:" staff@example.com ",password:"password-1234"});await submit(tree,{identifier:"staff@example.com",password:"password-1234"});expect(login).toHaveBeenCalledTimes(1);expect(renderToStaticMarkup(render(LoginForm))).toContain('aria-busy="true"');done({next_path:"/staff/switch-org"});await pending;expect(h.push).toHaveBeenCalledWith("/staff/switch-org");expect(h.refresh).toHaveBeenCalledOnce();});
 it("validation focuses missing field; upstream denial clears busy with accessible feedback", async () => {const login=vi.spyOn(client,"login").mockRejectedValue(new FetchError("wrong journey",403,{error:"FORBIDDEN"}));const element=await submit(render(LoginForm),{identifier:"staff"});expect(login).not.toHaveBeenCalled();expect(element.querySelector).toHaveBeenCalledWith('[name="password"]');await submit(render(LoginForm),{identifier:"staff",password:"p"});const html=renderToStaticMarkup(render(LoginForm));expect(html).toContain('role="alert"');expect(html).toContain('aria-invalid="true"');expect(html).toContain('aria-describedby=');expect(html).toContain('aria-busy="false"');expect(html).toContain('href="/login"');});
 it("client uses session transport and exact staff login DTO", async () => {const fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({next_path:"/console"})));vi.stubGlobal("fetch",fetch);await client.login("staff","password");expect(String(fetch.mock.calls[0][0])).toContain("/api/auth/staff/login");expect(fetch.mock.calls[0][1].body).toBe(JSON.stringify({identifier:"staff",password:"password"}));});
});

import {ForgotForm} from "./forgot-form";
import {ResetForm} from "./reset-form";
import {InviteForm} from "./invite-form";
describe("S9 staff onboarding, blocked recovery and contexts", () => {
 it.each([ForgotForm,ResetForm])("recovery explains availability without requesting or consuming token", component => {h.query=new URLSearchParams("token=secret");const html=renderToStaticMarkup(render(component));expect(html).toContain('role="status"');expect(html).toContain("Liên hệ quản trị");expect(html).toContain('href="/staff/login"');expect(html).not.toContain("secret");expect(html).not.toContain("<form");});
 it("missing invite token allows existing ACTIVE users to login without changing credentials", () => {const html=renderToStaticMarkup(render(InviteForm));expect(html).toContain('href="/staff/login"');expect(html).not.toContain("<form");});
 it.each(["short", "é".repeat(129), "a".repeat(257)])("invite rejects password policy before calling auth", async password => {h.query=new URLSearchParams("token=invite-proof");const accept=vi.spyOn(client,"acceptInvite");const element=await submit(render(InviteForm),{password,confirm:password});expect(accept).not.toHaveBeenCalled();expect(element.querySelector).toHaveBeenCalledWith('[name="password"]');expect(renderToStaticMarkup(render(InviteForm))).toContain('role="alert"');});
 it("invite rejects mismatch; accepts token once while pending and links staff login", async () => {h.query=new URLSearchParams("token=invite-proof");let done!: (v:{status:string})=>void;const accept=vi.spyOn(client,"acceptInvite").mockImplementation(()=>new Promise(r=>{done=r;}));await submit(render(InviteForm),{password:"password-1234",confirm:"different"});expect(accept).not.toHaveBeenCalled();const tree=render(InviteForm);const pending=submit(tree,{password:"password-1234",confirm:"password-1234"});await submit(tree,{password:"password-1234",confirm:"password-1234"});expect(accept).toHaveBeenCalledTimes(1);expect(accept).toHaveBeenCalledWith("invite-proof","password-1234");expect(renderToStaticMarkup(render(InviteForm))).toContain('aria-busy="true"');done({status:"activated"});await pending;const html=renderToStaticMarkup(render(InviteForm));expect(html).toContain('role="status"');expect(html).toContain('href="/staff/login"');expect(html).not.toContain("invite-proof");});
 it("expired/replayed invite never claims activated", async () => {h.query=new URLSearchParams("token=expired");vi.spyOn(client,"acceptInvite").mockRejectedValue(Error("invalid_token"));await submit(render(InviteForm),{password:"password-1234",confirm:"password-1234"});const html=renderToStaticMarkup(render(InviteForm));expect(html).toContain('role="alert"');expect(html).not.toContain("Đã nhận lời mời");});
 it("invite labels and new-password autocomplete are accessible", () => {h.query=new URLSearchParams("token=t");const html=renderToStaticMarkup(render(InviteForm));const ids=[...html.matchAll(/<label[^>]*for="([^"]+)"/g)].map(m=>m[1]);expect(ids).toHaveLength(2);for(const id of ids)expect(html).toContain(`id="${id}"`);expect(html).toContain('autoComplete="new-password"');});
});

describe("S10 staff public pages", () => {
 it.each([["login","staff-login"],["forgot-password","forgot-form"],["reset-password","reset-form"],["invite/accept","invite-form"]])("%s route owns its staff module and accessible heading", (route,module) => {const source=readFileSync(`app/(employee-auth)/staff/${route}/page.tsx`,"utf8");expect(source).toContain(`@/features/employee-auth/${module}`);expect(source).toContain("<h1");expect(source).not.toContain("customer-auth");});
 it("layout owns staff shell only", () => {const source=readFileSync("app/(employee-auth)/layout.tsx","utf8");expect(source).toContain("EmployeeAuthShell");expect(source).not.toContain("CustomerAuthShell");});
});

it("S12 switch-branch page imports only the branch chooser; switch-org redirects straight to it", ()=>{expect(readFileSync("app/(employee-auth)/staff/switch-branch/page.tsx","utf8")).toContain("@/features/employee-auth/branch-chooser");expect(readFileSync("next.config.mjs","utf8")).toContain('{source: "/staff/switch-org", destination: "/staff/switch-branch"');});

import BranchAlias from "@/app/(auth)/switch-branch/page";
import OrgAlias from "@/app/(auth)/switch-org/page";
import InviteAlias from "@/app/(employee-auth)/invite/accept/page";
describe("S13 legacy redirects",()=>{
 it.each([[BranchAlias,"/staff/switch-branch"],[OrgAlias,"/staff/switch-org"]])("switch alias redirects without rendering shared auth",(page,target)=>{expect(()=>page()).toThrow("REDIRECT:"+target);});
 it("invite alias preserves token safely and strips untrusted redirect",async()=>{await expect(InviteAlias({searchParams:Promise.resolve({token:"a&b/+=",redirect:"https://evil.com"})})).rejects.toThrow("REDIRECT:/staff/invite/accept?token=a%26b%2F%2B%3D");});
 it("missing token invite alias goes to staff accept for existing-user instructions",async()=>{await expect(InviteAlias({searchParams:Promise.resolve({})})).rejects.toThrow("REDIRECT:/staff/invite/accept");});
 it("profile context link uses staff selector, never treats profile memberships as proof",()=>{const source=readFileSync("features/account/staff/staff-account.tsx","utf8");expect(source).toContain('href="/staff/switch-branch"');expect(source).not.toContain('switch-org');});
});

const localeHarness = vi.hoisted(() => ({locale: "vi", real: false}));
vi.mock("next-intl", async original => {
 const actual = await original<typeof import("next-intl")>();
 return {...actual, useTranslations: (namespace: string) => localeHarness.real ? actual.useTranslations(namespace) : actual.createTranslator({locale: localeHarness.locale, messages: JSON.parse(readFileSync(`messages/${localeHarness.locale}.json`, "utf8")), namespace})};
});

it("S19 employee real login and shell render English catalog", () => {
 localeHarness.locale = "en";
 try {
  const form = renderToStaticMarkup(render(LoginForm));
  expect(form).toContain("Staff email or phone number");
  expect(form).toContain("Staff sign in");
  const shell = renderToStaticMarkup(<EmployeeAuthShell>form</EmployeeAuthShell>);
  expect(shell).toContain("Skip to content");
  expect(shell).not.toContain("Bỏ qua");
 } finally {localeHarness.locale = "vi";}
});

it.each([[ForgotForm, "Staff password recovery is currently unavailable"], [ResetForm, "Staff password reset is currently unavailable"], [InviteForm, "existing password"]] as const)("S19 employee English form preserves journey policy (%s)", (component, copy) => {
 localeHarness.locale = "en";
 try {const html = renderToStaticMarkup(render(component)); expect(html).toContain(copy); expect(html).toContain('href="/staff/login"'); expect(html).not.toContain("<form");} finally {localeHarness.locale = "vi";}
});
it("FE-14 staff initial login and missing invitation have visible empty states", () => {
 expect(renderToStaticMarkup(render(LoginForm))).toContain("<form");
 h.slots = [];
 expect(renderToStaticMarkup(render(InviteForm))).toContain('role="status"');
});

it("S19 employee shell supplies an explicit journey-only next-intl provider", () => {
 const tree = EmployeeAuthShell({children: "form"});
 expect(tree.props).toMatchObject({locale: "vi", timeZone: "Asia/Ho_Chi_Minh", messages: {employeeAuth: expect.any(Object)}});
 expect(Object.keys(tree.props.messages)).toEqual(["employeeAuth"]);
});

vi.mock("next/headers", () => ({cookies: async () => ({get: () => ({value: localeHarness.locale})})}));
it("S19 employee English provider drives the real next-intl hook in login", () => {
 localeHarness.real = true;
 try {
  const html = renderToStaticMarkup(<EmployeeAuthShell locale="en"><LoginForm /></EmployeeAuthShell>);
  expect(html).toContain("Staff email or phone number");
  expect(html).toContain("Skip to content");
  expect(html).not.toContain("Đăng nhập");
 } finally {localeHarness.real = false;}
});

it.each([["login", "Staff sign in"], ["forgot-password", "Staff password recovery"], ["reset-password", "Staff password reset"], ["invite/accept", "Accept staff invitation"], ["switch-branch", "Choose branch"]])("S19 employee server page translates heading and metadata (%s)", async (route, title) => {
 localeHarness.locale = "en";
 try {
  const page = route === "invite/accept" ? await import("../../app/(employee-auth)/staff/invite/accept/page") : await import(`../../app/(employee-auth)/staff/${route}/page.tsx`);
  const html = renderToStaticMarkup(await page.default());
  expect(html).toContain(title);
  if (page.generateMetadata) expect(await page.generateMetadata()).toMatchObject({title});
 } finally {localeHarness.locale = "vi";}
});

import {FetchError} from "@/lib/fetcher";
it.each([[429,"rate_limit_exceeded",false,"Quá nhiều yêu cầu. Vui lòng thử lại sau."],[403,"FORBIDDEN",true,"chưa có quyền nhân viên"],[403,"INTERNAL_ERROR",false,"Không thể đăng nhập."],[500,"FORBIDDEN",false,"Hệ thống đang bận, vui lòng thử lại sau."],[401,"UNAUTHORIZED",false,"Email/số điện thoại hoặc mật khẩu không đúng."]] as const)("D-141/D-142 staff login %s %s localizes feedback and gates customer link", async (status,code,link,copy) => {
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({error:code,message:"invalid or expired token"}),{status})));
 await submit(render(LoginForm),{identifier:"staff",password:"password-1234"});
 const html=renderToStaticMarkup(render(LoginForm));
 expect(html).toContain(copy);expect(html).toContain('href="/login"');expect(html.includes("Đăng nhập mua hàng")).toBe(link);expect(html).not.toContain("invalid or expired token");
});
it.each([[400,"invalid_token","Không thể nhận lời mời."],[429,"rate_limit_exceeded","Quá nhiều yêu cầu. Vui lòng thử lại sau."],[500,"unknown_code","Không thể nhận lời mời."]] as const)("D-142 invite %s %s never renders upstream English", async (status,code,copy) => {
 h.query=new URLSearchParams("token=proof");
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({error:code,message:"invalid or expired token"}),{status})));
 await submit(render(InviteForm),{password:"password-1234",confirm:"password-1234"});
 const html=renderToStaticMarkup(render(InviteForm));expect(html).toContain(copy);expect(html).not.toContain("invalid or expired token");
});
