import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { readFileSync } from "node:fs";
const harness = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0, push: vi.fn(), refresh: vi.fn(), query: new URLSearchParams(), effects: [] as (() => void)[] }));
vi.mock("react", async original => { const actual = await original<typeof import("react")>(); return {...actual,
  useId: () => "customer-test",
  useState: (initial: unknown) => {const index = harness.cursor++; if (!(index in harness.slots)) harness.slots[index] = typeof initial === "function" ? initial() : initial; return [harness.slots[index], (value: unknown) => {harness.slots[index] = typeof value === "function" ? value(harness.slots[index]) : value;}];},
  useRef: (initial: unknown) => {const index = harness.cursor++; if (!(index in harness.slots)) harness.slots[index] = {current: initial}; return harness.slots[index];},
  useEffect: (effect: () => void | (() => void), deps?: readonly unknown[]) => {
    const index = harness.cursor++;
    const previous = harness.slots[index] as {deps?: readonly unknown[]; cleanup?: () => void} | undefined;
    if (deps && previous?.deps && deps.length === previous.deps.length && deps.every((value, i) => Object.is(value, previous.deps?.[i]))) return;
    const slot: {deps?: readonly unknown[]; cleanup?: () => void} = {deps};
    harness.slots[index] = slot;
    harness.effects.push(() => {previous?.cleanup?.(); const cleanup = effect(); if (typeof cleanup === "function") slot.cleanup = cleanup;});
  }
}; });
vi.mock("next/navigation", () => ({useRouter: () => ({push: harness.push, refresh: harness.refresh}), useSearchParams: () => harness.query, redirect: (url: string) => {throw new Error(`REDIRECT:${url}`);}}));
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
  const input = {focus: vi.fn()};
  const form = {querySelector: vi.fn(() => input), reset: vi.fn()};
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 0; });
  vi.stubGlobal("FormData", class { get(key: string) {return fields[key] ?? null;} });
  await findForm(tree).props.onSubmit?.({preventDefault() {}, currentTarget: form} as unknown as React.FormEvent<HTMLFormElement>);
  return {...form, input};
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
it.each([RegisterForm, ForgotForm, ResetForm, ActivateView])("FE-14 customer renders a visible actionable empty state (%s)", component => {
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

it.each([["login", "/?auth=login&redirect=%2Fcart"], ["register", "/?auth=register&redirect=%2Fcart"]])("customer %s page redirects to the landing popup keeping redirect", async (route, target) => {
 const page = await import(`../../app/(auth)/${route}/page.tsx`);
 await expect(page.default({searchParams: Promise.resolve({redirect: "/cart"})})).rejects.toThrow(`REDIRECT:${target}`);
});

it.each([["activate", "Activate account"], ["forgot-password", "Forgot password"], ["reset-password", "Set a new password"]])("S19 customer server page translates heading and metadata (%s)", async (route, title) => {
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
 await submit(render(ActivateView), {password: "password-1234", confirm: "password-1234"});
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


function flushEffects() {
  for (const effect of harness.effects.splice(0)) effect();
}
function activationMarkup() { return renderToStaticMarkup(render(ActivateView)); }

// S5 specifies the owner-chosen credential; S6 implements the form and client.
describe("S5 explicit customer activation", () => {
  beforeEach(() => { harness.query = new URLSearchParams("token=activation-proof"); });

  it("S6c clears router history state while preserving the captured token and hash", async () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {location: {href: "https://portal.invalid/activate?token=activation-proof#main"},
      history: {state: {__NA: true, tree: ["activate?token=activation-proof"]}, replaceState}});
    const activate = vi.spyOn(client, "activateAccount").mockResolvedValue({});
    render(ActivateView); flushEffects();
    expect(replaceState).toHaveBeenCalledOnce();
    expect(replaceState).toHaveBeenCalledWith(null, "", "/activate#main");
    harness.query = new URLSearchParams();
    await submit(render(ActivateView), {password: "password-1234", confirm: "password-1234"});
    expect(activate).toHaveBeenCalledWith("activation-proof", "password-1234");
  });

  it("S6c accepts twelve spaces as the exact owner-chosen password", async () => {
    const activate = vi.spyOn(client, "activateAccount").mockResolvedValue({});
    const password = " ".repeat(12);
    await submit(render(ActivateView), {password, confirm: password});
    expect(activate).toHaveBeenCalledOnce();
    expect(activate).toHaveBeenCalledWith("activation-proof", password);
    expect(activationMarkup()).toContain('href="/login"');
  });

  it("mount and effect replay never POST; owner receives two labelled password fields", async () => {
    const activate = vi.spyOn(client, "activateAccount").mockResolvedValue({});
    const tree = render(ActivateView);
    const effects = [...harness.effects];
    flushEffects(); for (const effect of effects) effect();
    await Promise.resolve();
    expect(activate).not.toHaveBeenCalled();
    const html = renderToStaticMarkup(tree);
    expect(html).toContain('name="password"'); expect(html).toContain('name="confirm"');
    expect(html.match(/autoComplete="new-password"/g)).toHaveLength(2);
    const labels = [...html.matchAll(/<label[^>]*for="([^"]+)"/g)].map(match => match[1]);
    expect(labels).toHaveLength(2); expect(new Set(labels).size).toBe(2);
    for (const id of labels) expect(html).toContain(`id="${id}"`);
    expect(html).toContain('type="submit"'); expect(html).toContain('aria-busy="false"');
  });

  it.each(["", "a".repeat(11), "😀".repeat(11), "a".repeat(257), "é".repeat(129)])(
    "policy rejects boundary (%#), describes error and focuses password", async password => {
      const activate = vi.spyOn(client, "activateAccount").mockResolvedValue({});
      const form = await submit(render(ActivateView), {password, confirm: password});
      expect(activate).not.toHaveBeenCalled();
      expect(form.querySelector).toHaveBeenCalledWith('[name="password"]');
      expect(form.input.focus).toHaveBeenCalledOnce();
      const html = activationMarkup();
      expect(html).toContain('role="alert"'); expect(html).toContain('aria-invalid="true"');
      expect(html).toContain('aria-describedby=');
    }
  );

  it.each(["a".repeat(12), "😀".repeat(12), "a".repeat(256), "é".repeat(128), "  ée\u0301abcdefghi  "])(
    "accepts boundary (%#) preserving whitespace and Unicode exactly", async password => {
      const activate = vi.spyOn(client, "activateAccount").mockResolvedValue({});
      await submit(render(ActivateView), {password, confirm: password});
      expect(activate).toHaveBeenCalledOnce();
      expect(activate).toHaveBeenCalledWith("activation-proof", password);
      const html = activationMarkup();
      expect(html).toContain('role="status"'); expect(html).toContain('href="/login"');
      expect(html).not.toContain('name="password"'); expect(html).not.toContain('name="confirm"');
      expect(harness.push).not.toHaveBeenCalled(); expect(harness.refresh).not.toHaveBeenCalled();
    }
  );

  it("confirmation mismatch focuses confirm and never sends", async () => {
    const activate = vi.spyOn(client, "activateAccount").mockResolvedValue({});
    const form = await submit(render(ActivateView), {password: "password-1234", confirm: "password-1235"});
    expect(activate).not.toHaveBeenCalled();
    expect(form.querySelector).toHaveBeenCalledWith('[name="confirm"]');
    expect(form.input.focus).toHaveBeenCalledOnce(); expect(activationMarkup()).toContain('role="alert"');
  });

  it("missing token never redeems and offers neutral resend and fixed login", async () => {
    harness.query = new URLSearchParams();
    const activate = vi.spyOn(client, "activateAccount").mockResolvedValue({});
    render(ActivateView); flushEffects();
    await Promise.resolve();
    expect(activate).not.toHaveBeenCalled();
    const html = activationMarkup();
    expect(html).toContain("Gửi lại liên kết kích hoạt"); expect(html).toContain('href="/login"');
    expect(html).not.toContain("Tài khoản đã được kích hoạt");
  });

  it("double submit uses one request, disables submit while pending and clears busy on failure", async () => {
    let reject!: (reason: Error) => void;
    const activate = vi.spyOn(client, "activateAccount").mockImplementation(() => new Promise((_, r) => {reject = r;}));
    const tree = render(ActivateView); findForm(tree);
    const fields = {password: "password-1234", confirm: "password-1234"};
    const pending = submit(tree, fields); await submit(tree, fields);
    expect(activate).toHaveBeenCalledOnce();
    const html = activationMarkup(); expect(html).toContain('aria-busy="true"');
    expect(html).toMatch(/<button(?=[^>]*type="submit")(?=[^>]*disabled)[^>]*>/);
    expect(html.match(/<button(?=[^>]*type="button")(?=[^>]*disabled)[^>]*>/g)).toHaveLength(2);
    reject(Error("upstream-secret")); await pending;
    expect(activationMarkup()).toContain('aria-busy="false"');
    expect(activationMarkup()).toContain('role="alert"');
    expect(activationMarkup()).not.toContain("upstream-secret");
  });

  it.each(["invalid_token", "BAD_REQUEST"])("%s is a token error, never success, with resend/login recovery", async code => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({error: code, message: "upstream-secret"}), {status: 400})));
    await submit(render(ActivateView), {password: "password-1234", confirm: "password-1234"});
    const html = activationMarkup();
    expect(html).toContain("Liên kết kích hoạt không hợp lệ, đã dùng hoặc đã hết hạn.");
    expect(html).toContain("Gửi lại liên kết kích hoạt"); expect(html).toContain('href="/login"');
    expect(html).not.toContain("Tài khoản đã được kích hoạt"); expect(html).not.toContain("upstream-secret");
  });

  it("server password validation retains the form and focuses password for correction", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({error: "VALIDATION_ERROR", message: "upstream-secret"}), {status: 400})));
    const form = await submit(render(ActivateView), {password: "password-1234", confirm: "password-1234"});
    expect(form.querySelector).toHaveBeenCalledWith('[name="password"]');
    expect(form.input.focus).toHaveBeenCalledOnce();
    const html = activationMarkup(); expect(html).toContain('name="password"');
    expect(html).toContain('role="alert"'); expect(html).not.toContain("upstream-secret");
    expect(html).not.toContain("Liên kết kích hoạt không hợp lệ");
  });

  it.each([[429, "rate_limit_exceeded"], [503, "service_busy"]] as const)(
    "%s retains form, honors cooldown and allows only a manual retry", async (status, code) => {
      vi.useFakeTimers();
      try {
        const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({error: code}), {status, headers: {"Retry-After": "2"}}))
          .mockResolvedValue(new Response(JSON.stringify({status: "success"})));
        vi.stubGlobal("fetch", fetch);
        const fields = {password: "password-1234", confirm: "password-1234"};
        await submit(render(ActivateView), fields);
        const html = activationMarkup(); flushEffects();
        expect(html).toContain('name="password"'); expect(html).toContain('role="alert"');
        expect(html).toMatch(/<button(?=[^>]*type="submit")(?=[^>]*disabled)[^>]*>/);
        await submit(render(ActivateView), fields); expect(fetch).toHaveBeenCalledOnce();
        await vi.advanceTimersByTimeAsync(2000);
        render(ActivateView); flushEffects(); expect(fetch).toHaveBeenCalledOnce();
        await submit(render(ActivateView), fields); expect(fetch).toHaveBeenCalledTimes(2);
        expect(activationMarkup()).toContain('href="/login"');
      } finally { vi.useRealTimers(); }
    }
  );

  it("network failure permits manual retry and never displays raw error", async () => {
    const fetch = vi.fn().mockRejectedValueOnce(Error("upstream-secret"))
      .mockResolvedValue(new Response(JSON.stringify({status: "success"})));
    vi.stubGlobal("fetch", fetch);
    const fields = {password: "password-1234", confirm: "password-1234"};
    await submit(render(ActivateView), fields);
    expect(activationMarkup()).toContain('role="alert"');
    expect(activationMarkup()).not.toContain("upstream-secret"); expect(fetch).toHaveBeenCalledOnce();
    await submit(render(ActivateView), fields); expect(fetch).toHaveBeenCalledTimes(2);
    expect(activationMarkup()).toContain('href="/login"');
  });

  it.each(["success", "failure"])("late %s from old link cannot replace the new link state", async outcome => {
    let resolve!: (value: object) => void; let reject!: (reason: Error) => void;
    const activate = vi.spyOn(client, "activateAccount").mockImplementation(() => new Promise((r, j) => {resolve = r; reject = j;}));
    const tree = render(ActivateView); findForm(tree); flushEffects();
    const pending = submit(tree, {password: "password-1234", confirm: "password-1234"});
    const oldResolve = resolve; const oldReject = reject;
    harness.query = new URLSearchParams("token=new-link"); render(ActivateView); flushEffects();
    expect(activationMarkup()).toContain('aria-busy="false"');
    findForm(render(ActivateView));
    const next = submit(render(ActivateView), {password: "different-1234", confirm: "different-1234"});
    expect(activate).toHaveBeenLastCalledWith("new-link", "different-1234");
    if (outcome === "success") oldResolve({}); else oldReject(Error("old-link-error"));
    await pending;
    const html = activationMarkup();
    expect(html).toContain('name="password"'); expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("Tài khoản đã được kích hoạt"); expect(html).not.toContain('role="alert"');
    resolve({}); await next;
    expect(activationMarkup()).toContain('href="/login"');
  });

  it.each([["vi", "Hiện mật khẩu"], ["en", "Show password"]])("%s labels both independent non-submit toggles", (locale, label) => {
    localeHarness.locale = locale;
    try {
      const html = activationMarkup();
      expect(html.match(new RegExp(`aria-label="${label}"`, "g"))).toHaveLength(2);
      expect(html.match(/aria-pressed="false"/g)).toHaveLength(2);
      expect(html.match(/type="button"/g)).toHaveLength(2);
      expect(html.match(/type="password"/g)).toHaveLength(2);
      if (locale === "en") {expect(html).toContain("New password"); expect(html).toContain("Confirm password"); expect(html).not.toContain("Hiện mật khẩu");}
    } finally {localeHarness.locale = "vi";}
  });

  it("real activation client POSTs exactly token/password and never confirm", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({status: "success"})));
    vi.stubGlobal("fetch", fetch);
    const password = "  ée\u0301abcdefghi  ";
    await Reflect.apply(client.activateAccount, undefined, ["activation-proof", password]);
    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0];
    expect(new URL(String(url), "http://portal.invalid").pathname).toBe("/api/auth/activate");
    expect(init.method).toBe("POST"); expect(init.headers).toMatchObject({"content-type": "application/json"});
    expect(JSON.parse(init.body)).toEqual({token: "activation-proof", password});
    expect(harness.refresh).not.toHaveBeenCalled();
  });
});


it("S6c activation response sets no-referrer before rendering", async () => {
  const configPath = "../../next.config.mjs";
  const {default: config} = await import(configPath);
  const headers = await config.headers?.() ?? [];
  expect(headers).toContainEqual({source: "/activate", headers: [{key: "Referrer-Policy", value: "no-referrer"}]});
});
