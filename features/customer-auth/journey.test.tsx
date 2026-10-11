import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { readFileSync } from "node:fs";
const harness = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0, push: vi.fn(), refresh: vi.fn(), query: new URLSearchParams(), effects: [] as (() => void)[] }));
vi.mock("react", async original => { const actual = await original<typeof import("react")>(); return {...actual,
  useId: () => "customer-test",
  useState: (initial: unknown) => {const index = harness.cursor++; if (!(index in harness.slots)) harness.slots[index] = initial; return [harness.slots[index], (value: unknown) => {harness.slots[index] = value;}];},
  useRef: (initial: unknown) => {const index = harness.cursor++; if (!(index in harness.slots)) harness.slots[index] = {current: initial}; return harness.slots[index];},
  useEffect: (effect: () => void) => {harness.effects.push(effect);}
}; });
vi.mock("next/navigation", () => ({useRouter: () => ({push: harness.push, refresh: harness.refresh}), useSearchParams: () => harness.query}));
import { CustomerAuthShell } from "@/components/layout/customer-auth-shell";
import { LoginForm } from "./login-form";
import * as client from "@/lib/api/customer-auth";
function render(component: () => ReactElement): ReactElement { harness.cursor = 0; return component(); }
type Props = {children?: React.ReactNode; onSubmit?: (event: React.FormEvent<HTMLFormElement>) => Promise<void>};
function findForm(tree: ReactElement): ReactElement<Props> {
  if (tree.type === "form") return tree as ReactElement<Props>;
  for (const child of React.Children.toArray((tree.props as Props).children)) { if (React.isValidElement(child)) {try {return findForm(child);} catch { /* Search remaining children. */ }} }
  throw Error("No form rendered");
}
async function submit(tree: ReactElement, fields: Record<string, string>) {
  const form = {querySelector: vi.fn(() => ({focus: vi.fn()}))};
  vi.stubGlobal("FormData", class { get(key: string) {return fields[key] ?? null;} });
  await findForm(tree).props.onSubmit?.({preventDefault() {}, currentTarget: form} as unknown as React.FormEvent<HTMLFormElement>);
  return form;
}
beforeEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); harness.slots = []; harness.cursor = 0; harness.effects = []; harness.query = new URLSearchParams(); harness.push.mockReset(); harness.refresh.mockReset(); });
describe("S3 customer login", () => {
  it("shell has one customer marker, one main, skip link and Bếp Tươi brand", () => {const html = renderToStaticMarkup(<CustomerAuthShell><span>form</span></CustomerAuthShell>); expect(html.match(/<main/g)).toHaveLength(1); expect(html.match(/data-auth-journey="customer"/g)).toHaveLength(1); expect(html).toContain('href="#main"'); expect(html).toContain("Bếp Tươi"); expect(html).not.toContain("employee"); });
  it("real labels pair with unique IDs and current-password autocomplete", () => {const html = renderToStaticMarkup(render(LoginForm)); const ids = [...html.matchAll(/<label[^>]*for="([^"]+)"/g)].map(match => match[1]); expect(ids).toHaveLength(2); expect(new Set(ids).size).toBe(2); for (const id of ids) expect(html).toContain(`id="${id}"`); expect(html).toContain('autoComplete="current-password"'); expect(html).not.toContain("Nhân viên"); });
  it("submits identifier once while pending and uses server next_path without client redirect", async () => {
    let resolve!: (value: {next_path: string}) => void;
    const login = vi.spyOn(client, "login").mockImplementation(() => new Promise(r => {resolve = r;}));
    harness.query = new URLSearchParams("redirect=/console");
    const tree = render(LoginForm); const pending = submit(tree, {identifier: " a@example.com ", password: "password-1234"});
    await submit(tree, {identifier: "a@example.com", password: "password-1234"});
    expect(login).toHaveBeenCalledTimes(1); expect(login).toHaveBeenCalledWith("a@example.com", "password-1234", "/console");
    expect(renderToStaticMarkup(render(LoginForm))).toContain('aria-busy="true"');
    resolve({next_path: "/"}); await pending; expect(harness.push).toHaveBeenCalledWith("/"); expect(harness.refresh).toHaveBeenCalledOnce();
  });
  it("empty input never sends request and error is accessible", async () => {const login = vi.spyOn(client, "login"); await submit(render(LoginForm), {identifier: "", password: ""}); expect(login).not.toHaveBeenCalled(); const html = renderToStaticMarkup(render(LoginForm)); expect(html).toContain('role="alert"'); expect(html).toContain('aria-invalid="true"'); expect(html).toContain('aria-describedby='); });
  it("failed request clears busy and surfaces error", async () => {vi.spyOn(client, "login").mockRejectedValue(Error("Không thể đăng nhập")); await submit(render(LoginForm), {identifier: "a", password: "p"}); expect(renderToStaticMarkup(render(LoginForm))).toContain("Đăng nhập không thành công."); expect(renderToStaticMarkup(render(LoginForm))).toContain('aria-busy="false"'); });
  it("client reuses transport and sends only identifier/password to customer BFF", async () => {const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({next_path: "/"}))); vi.stubGlobal("fetch", fetch); expect(await client.login("a", "p")).toMatchObject({next_path: "/"}); expect(fetch).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({body: JSON.stringify({identifier: "a", password: "p"})})); expect(String(fetch.mock.calls[0][0])).toContain("/api/auth/login"); expect(readFileSync("lib/api/customer-auth.ts", "utf8")).toContain("fetcher"); });
});

import { RegisterForm } from "./register-form";
import { ActivateView } from "./activate-view";
import { ForgotForm } from "./forgot-form";
import { ResetForm } from "./reset-form";
describe("S4 customer onboarding and recovery", () => {
  it.each(["short-pass1", "é".repeat(129), "a".repeat(257)])("register rejects out-of-policy password", async password => {const register = vi.spyOn(client, "register"); await submit(render(RegisterForm), {email: "a@example.com", password}); expect(register).not.toHaveBeenCalled(); expect(renderToStaticMarkup(render(RegisterForm))).toContain('role="alert"'); });
  it.each(["a".repeat(12), "é".repeat(128), "a".repeat(256)])("register accepts 12 characters through 256 UTF-8 bytes", async password => {const register = vi.spyOn(client, "register").mockResolvedValue({}); await submit(render(RegisterForm), {email: "a@example.com", password}); expect(register).toHaveBeenCalledWith("a@example.com", "", "", password); expect(renderToStaticMarkup(render(RegisterForm))).toContain('role="status"'); });
  it("register phone-only, optional name and no employee instructions", async () => {const register = vi.spyOn(client, "register").mockResolvedValue({}); const tree = render(RegisterForm); expect(renderToStaticMarkup(tree)).not.toContain("Nhân viên"); await submit(tree, {phone: "0901234567", display_name: "An", password: "password-1234"}); expect(register).toHaveBeenCalledWith("", "0901234567", "An", "password-1234"); });
  it("register empty identity and long name never send request", async () => {const register = vi.spyOn(client, "register"); await submit(render(RegisterForm), {password: "password-1234"}); await submit(render(RegisterForm), {email: "a@example.com", display_name: "a".repeat(51), password: "password-1234"}); expect(register).not.toHaveBeenCalled(); });
  it("activation reads token and does not redeem it twice under effect replay", async () => {harness.query = new URLSearchParams("token=activation-proof"); const activate = vi.spyOn(client, "activateAccount").mockResolvedValue({}); render(ActivateView); harness.effects[0](); harness.effects[0](); await Promise.resolve(); expect(activate).toHaveBeenCalledTimes(1); expect(activate).toHaveBeenCalledWith("activation-proof"); const html = renderToStaticMarkup(render(ActivateView)); expect(html).toContain('role="status"'); expect(html).toContain('href="/login"'); });
  it("activation missing token never redeems, expired/replayed token shows recovery", async () => {const activate = vi.spyOn(client, "activateAccount").mockRejectedValue(Error("invalid_token")); render(ActivateView); harness.effects[0](); expect(activate).not.toHaveBeenCalled(); harness.query = new URLSearchParams("token=expired-token"); render(ActivateView); harness.effects.at(-1)?.(); await Promise.resolve(); await Promise.resolve(); const html = renderToStaticMarkup(render(ActivateView)); expect(html).toContain('role="alert"'); expect(html).toContain("Gửi lại liên kết kích hoạt"); });
  it("forgot success is neutral even when server message exposes account", async () => {const forgot = vi.spyOn(client, "forgotPassword").mockResolvedValue({message: "EXISTING_ACCOUNT"}); await submit(render(ForgotForm), {email: "a@example.com"}); expect(forgot).toHaveBeenCalledWith("a@example.com"); const html = renderToStaticMarkup(render(ForgotForm)); expect(html).toContain("Nếu email này có tài khoản"); expect(html).not.toContain("EXISTING_ACCOUNT"); expect(html).toContain('href="/login"'); });
  it("forgot empty input/network failure does not claim sent", async () => {const forgot = vi.spyOn(client, "forgotPassword").mockRejectedValue(Error("offline")); await submit(render(ForgotForm), {}); expect(forgot).not.toHaveBeenCalled(); await submit(render(ForgotForm), {email: "a@example.com"}); expect(renderToStaticMarkup(render(ForgotForm))).toContain('role="alert"'); expect(renderToStaticMarkup(render(ForgotForm))).not.toContain("Nếu email này có tài khoản"); });
  it("reset missing token cannot submit even if called programmatically", async () => {const reset = vi.spyOn(client, "resetPassword"); await submit(render(ResetForm), {password: "password-1234", confirm: "password-1234"}); expect(reset).not.toHaveBeenCalled(); });
  it.each(["short", "é".repeat(129), "a".repeat(257)])("reset rejects password boundary", async password => {harness.query = new URLSearchParams("token=reset-proof"); const reset = vi.spyOn(client, "resetPassword"); await submit(render(ResetForm), {password, confirm: password}); expect(reset).not.toHaveBeenCalled(); });
  it("reset mismatch never sends; success links to customer login", async () => {harness.query = new URLSearchParams("token=reset-proof"); const reset = vi.spyOn(client, "resetPassword").mockResolvedValue({}); await submit(render(ResetForm), {password: "password-1234", confirm: "different"}); expect(reset).not.toHaveBeenCalled(); await submit(render(ResetForm), {password: "password-1234", confirm: "password-1234"}); expect(reset).toHaveBeenCalledWith("reset-proof", "password-1234"); expect(renderToStaticMarkup(render(ResetForm))).toContain('href="/login"'); });
  it("reset expired/replayed token remains an error", async () => {harness.query = new URLSearchParams("token=replayed"); vi.spyOn(client, "resetPassword").mockRejectedValue(Error("Liên kết đã hết hạn")); await submit(render(ResetForm), {password: "password-1234", confirm: "password-1234"}); const html = renderToStaticMarkup(render(ResetForm)); expect(html).toContain("Liên kết đặt lại không hợp lệ hoặc đã hết hạn."); expect(html).not.toContain("Đã đặt lại mật khẩu"); });
  it.each([RegisterForm, ForgotForm, ResetForm])("each customer form has labels, described errors and useId", component => {harness.query = new URLSearchParams("token=proof"); const html = renderToStaticMarkup(render(component)); for (const label of html.matchAll(/<label[^>]*for="([^"]+)"/g)) expect(html).toContain(`id="${label[1]}"`); });
});

it.each([[{email: "a@example.com", password: "short"}, "password"], [{password: "password-1234"}, "email"], [{email: "a@example.com", display_name: "a".repeat(51), password: "password-1234"}, "display_name"]])("S4 register focuses the field that failed validation", async (fields, field) => {
  vi.spyOn(client, "register").mockResolvedValue({});
  const form = await submit(render(RegisterForm), fields);
  expect(form.querySelector).toHaveBeenCalledWith(`[name="${field}"]`);
});

const localeHarness = vi.hoisted(() => ({locale: "vi", real: false}));
vi.mock("next-intl", async original => {
 const actual = await original<typeof import("next-intl")>();
 return {...actual, useTranslations: (namespace: string) => localeHarness.real ? actual.useTranslations(namespace) : actual.createTranslator({locale: localeHarness.locale, messages: JSON.parse(readFileSync(`messages/${localeHarness.locale}.json`, "utf8")), namespace})};
});

it("S19 customer real login and shell render English catalog", () => {
 localeHarness.locale = "en";
 try {
  const form = renderToStaticMarkup(render(LoginForm));
  expect(form).toContain("Email or phone number");
  expect(form).toContain("Sign in");
  const shell = renderToStaticMarkup(<CustomerAuthShell>form</CustomerAuthShell>);
  expect(shell).toContain("Skip to content");
  expect(shell).not.toContain("Bỏ qua");
 } finally {localeHarness.locale = "vi";}
});

it.each([[RegisterForm, "Create account"], [ForgotForm, "Enter your email"], [ResetForm, "Request a new link"], [ActivateView, "activation link is missing"]] as const)("S19 customer English form renders its own catalog (%s)", (component, copy) => {
 localeHarness.locale = "en";
 try {expect(renderToStaticMarkup(render(component))).toContain(copy);} finally {localeHarness.locale = "vi";}
});
it.each([LoginForm, RegisterForm, ForgotForm, ResetForm, ActivateView])("FE-14 customer renders a visible actionable empty state (%s)", component => {
 const html = renderToStaticMarkup(render(component));
 expect(html).toContain("lucide-inbox");
 expect(html).toContain('role="status"');
 expect(html).toMatch(/<input|href="\/forgot-password"/);
});

it("S19 customer shell supplies an explicit journey-only next-intl provider", () => {
 const tree = CustomerAuthShell({children: "form"});
 expect(tree.props).toMatchObject({locale: "vi", timeZone: "Asia/Ho_Chi_Minh", messages: {customerAuth: expect.any(Object)}});
 expect(Object.keys(tree.props.messages)).toEqual(["customerAuth"]);
});

vi.mock("next/headers", () => ({cookies: async () => ({get: () => ({value: localeHarness.locale})})}));
it("S19 customer English provider drives the real next-intl hook in login", () => {
 localeHarness.real = true;
 try {
  const html = renderToStaticMarkup(<CustomerAuthShell locale="en"><LoginForm /></CustomerAuthShell>);
  expect(html).toContain("Email or phone number");
  expect(html).toContain("Skip to content");
  expect(html).not.toContain("Đăng nhập");
 } finally {localeHarness.real = false;}
});

it.each([["login", "Sign in"], ["register", "Create a shopping account"], ["activate", "Activate account"], ["forgot-password", "Forgot password"], ["reset-password", "Set a new password"]])("S19 customer server page translates heading and metadata (%s)", async (route, title) => {
 localeHarness.locale = "en";
 try {
  const page = await import(`../../app/(auth)/${route}/page.tsx`);
  const html = renderToStaticMarkup(await page.default());
  expect(html).toContain(title);
  if (page.generateMetadata) expect(await page.generateMetadata()).toMatchObject({title});
 } finally {localeHarness.locale = "vi";}
});

it.each([[429,"rate_limit_exceeded","Quá nhiều yêu cầu. Vui lòng thử lại sau."],[403,"FORBIDDEN","Đăng nhập không thành công."],[500,"unknown_code","Hệ thống đang bận, vui lòng thử lại sau."]] as const)("D-141/D-142 customer login %s %s localizes without staff link", async (status,code,copy) => {
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({error:code,message:"invalid or expired token"}),{status})));
 await submit(render(LoginForm),{identifier:"customer",password:"password-1234"});
 const html=renderToStaticMarkup(render(LoginForm));expect(html).toContain(copy);expect(html).not.toContain('href="/staff/login"');expect(html).not.toContain("invalid or expired token");
});
it.each([[RegisterForm,"Đăng ký không thành công."],[ResetForm,"Liên kết đặt lại không hợp lệ hoặc đã hết hạn."]] as const)("D-142 %s uses localized fallback for upstream English", async (component,copy) => {
 harness.query=new URLSearchParams("token=proof");
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({error:"invalid_token",message:"invalid or expired token"}),{status:400})));
 await submit(render(component),{email:"a@example.com",password:"password-1234",confirm:"password-1234"});
 const html=renderToStaticMarkup(render(component));expect(html).toContain(copy);expect(html).not.toContain("invalid or expired token");
});
it.each([[400,"invalid_token","Liên kết kích hoạt không hợp lệ, đã dùng hoặc đã hết hạn."],[429,"rate_limit_exceeded","Quá nhiều yêu cầu. Vui lòng thử lại sau."]] as const)("D-142 activation %s %s localizes upstream English", async (status,code,copy) => {
 harness.query=new URLSearchParams("token=proof");
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({error:code,message:"invalid or expired token"}),{status})));
 render(ActivateView);harness.effects[0]();await new Promise(resolve=>setTimeout(resolve,0));
 const html=renderToStaticMarkup(render(ActivateView));expect(html).toContain(copy);expect(html).not.toContain("invalid or expired token");
});
it("D-142 activation resend never renders upstream English", async () => {
 const tree=render(ActivateView);
 const child=React.Children.toArray((tree.props as Props).children).find(child=>React.isValidElement<{onSent?:()=>void}>(child) && typeof child.props.onSent==="function") as ReactElement<{onSent:()=>void}>;
 const component=()=> (child.type as (props:{onSent:()=>void})=>ReactElement)(child.props);
 harness.slots=[];
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({error:"INTERNAL_ERROR",message:"invalid or expired token"}),{status:503})));
 await submit(render(component),{email:"a@example.com"});
 const html=renderToStaticMarkup(render(component));expect(html).toContain("Không gửi lại được liên kết.");expect(html).not.toContain("invalid or expired token");
});
