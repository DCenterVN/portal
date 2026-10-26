import { beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Trash2 } from "lucide-react";

const harness = vi.hoisted(() => ({ slots: [] as unknown[], cursor: 0 }));
vi.mock("react", async (original) => {
  const actual = await original<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      const index = harness.cursor++;
      if (!(index in harness.slots)) harness.slots[index] = initial;
      return [harness.slots[index], (next: unknown) => {
        harness.slots[index] = typeof next === "function" ? (next as (prev: unknown) => unknown)(harness.slots[index]) : next;
      }];
    },
  };
});

import { Button, buttonVariants } from "./button";
import { Field, Select, TextInput, Textarea } from "./field";
import { Checkbox } from "./checkbox";
import { Switch } from "./switch";
import { Tabs, nextTab } from "./tabs";
import { Input } from "./input";
import { PasswordInput } from "@/components/patterns/password-input";
import { passwordError } from "@/features/customer-auth/form-feedback";

type AnyProps = Record<string, unknown> & { children?: React.ReactNode };
type Node = React.ReactElement<AnyProps>;

function render<P>(component: (props: P) => React.ReactNode, props: P): Node {
  harness.cursor = 0;
  return component(props) as Node;
}

function find(tree: Node, match: (node: Node) => boolean): Node {
  if (match(tree)) return tree;
  for (const child of React.Children.toArray(tree.props.children)) {
    if (!React.isValidElement(child)) continue;
    try { return find(child as Node, match); } catch { /* keep searching siblings */ }
  }
  throw Error("node not found");
}

const classes = (markup: string, tag: string) => markup.match(new RegExp(`<${tag}\\b[^>]*class="([^"]+)"`))?.[1].split(" ") ?? [];
const blurWith = (value: string) => ({ currentTarget: { value }, target: { value } });

beforeEach(() => { harness.slots = []; harness.cursor = 0; });

describe("Button (FR-4)", () => {
  it.each([["sm", "h-8"], ["md", "h-10"], ["lg", "h-12"]] as const)("size %s is %s tall", (size, height) => {
    expect(classes(renderToStaticMarkup(<Button size={size}>Lưu</Button>), "button")).toContain(height);
  });

  it("keeps a 44px tap target on mobile for sm and md", () => {
    for (const size of ["sm", "md"] as const) expect(buttonVariants({ size })).toContain("max-md:h-11");
  });

  it("primary is solid --p with white text, --p-hover in 100ms, 2px focus ring, 8px corners", () => {
    const own = classes(renderToStaticMarkup(<Button variant="primary">Đặt hàng</Button>), "button");
    expect(own).toEqual(expect.arrayContaining(["bg-p", "text-on-p", "hover:bg-p-hover", "duration-100", "focus-visible:ring-2", "rounded-lg"]));
    expect(own).not.toContain("duration-200");
    expect(own).not.toContain("rounded-full");
  });

  it("danger is an --err outline with icon, never a solid err fill", () => {
    const markup = renderToStaticMarkup(<Button variant="danger"><Trash2 aria-hidden="true" />Xoá sản phẩm</Button>);
    const own = classes(markup, "button");
    expect(own).toEqual(expect.arrayContaining(["border", "border-err", "text-err", "bg-transparent"]));
    expect(own.filter((name) => /^bg-(?:err|\[var\(--(?:err|destructive|color-danger)\)\])$/.test(name))).toEqual([]);
    expect(markup).toMatch(/<button\b[^>]*><svg\b/);
  });
});

describe("Field validates on blur (FR-4)", () => {
  const props = (validate = passwordError) => ({
    label: "Mật khẩu", htmlFor: "pw", validate,
    children: <PasswordInput id="pw" name="password" minLength={12} maxLength={256} />,
  });
  const input = (tree: Node) => find(tree, (node) => node.type === PasswordInput);
  const html = (tree: Node) => renderToStaticMarkup(tree);

  it("does not validate while typing", () => {
    (input(render(Field, props())).props.onChange as ((e: unknown) => void) | undefined)?.(blurWith("abc"));
    const markup = html(render(Field, props()));
    expect(markup).not.toContain("aria-invalid");
    expect(markup).not.toContain('role="alert"');
  });

  it("shows the error on blur and points aria-describedby at it", () => {
    (input(render(Field, props())).props.onBlur as (e: unknown) => void)(blurWith("abc"));
    const markup = html(render(Field, props()));
    expect(markup).toMatch(/<input[^>]*aria-invalid="true"/);
    expect(markup).toMatch(/<input[^>]*aria-describedby="pw-error"/);
    expect(markup).toMatch(/<p id="pw-error"[^>]*role="alert"[^>]*>passwordTooShort<\/p>/);
  });

  it.each([[11, "passwordTooShort"], [12, ""], [256, ""], [257, "passwordTooLong"]] as const)(
    "password of %i chars: blur gives '%s'",
    (length, expected) => {
      (input(render(Field, props())).props.onBlur as (e: unknown) => void)(blurWith("x".repeat(length)));
      const markup = html(render(Field, props()));
      if (expected) expect(markup).toContain(`>${expected}</p>`);
      else expect(markup).not.toContain("aria-invalid");
    },
  );

  it("clears the error once the value is fixed and blurred again", () => {
    (input(render(Field, props())).props.onBlur as (e: unknown) => void)(blurWith("abc"));
    (input(render(Field, props())).props.onBlur as (e: unknown) => void)(blurWith("x".repeat(12)));
    expect(html(render(Field, props()))).not.toContain("aria-invalid");
  });

  it("keeps the caller's onBlur and a server error wins", () => {
    const onBlur = vi.fn();
    const tree = render(Field, { ...props(), error: "Sai mật khẩu", children: <PasswordInput id="pw" onBlur={onBlur} /> });
    (input(tree).props.onBlur as (e: unknown) => void)(blurWith("abc"));
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(html(render(Field, { ...props(), error: "Sai mật khẩu" }))).toContain(">Sai mật khẩu</p>");
  });

  it("reuses the password toggle: show/hide flips the input type", () => {
    const toggle = (tree: Node) => find(tree, (node) => node.props.type === "button");
    const pwProps = { id: "pw", name: "password" };
    expect(renderToStaticMarkup(render(PasswordInput, pwProps))).toMatch(/<input[^>]*type="password"/);
    (toggle(render(PasswordInput, pwProps)).props.onClick as () => void)();
    const shown = renderToStaticMarkup(render(PasswordInput, pwProps));
    expect(shown).toMatch(/<input[^>]*type="text"/);
    expect(shown).toContain('aria-label="Ẩn mật khẩu"');
  });
});

describe("Checkbox 3 states (FR-4)", () => {
  it.each([[true, "true"], [false, "false"], ["indeterminate", "mixed"]] as const)("checked=%s renders aria-checked=%s", (checked, aria) => {
    const markup = renderToStaticMarkup(<Checkbox checked={checked} aria-label="Chọn tất cả" />);
    expect(markup).toMatch(new RegExp(`<button[^>]*role="checkbox"[^>]*aria-checked="${aria}"|<button[^>]*aria-checked="${aria}"[^>]*role="checkbox"`));
  });

  it.each([["indeterminate", true], [false, true], [true, false]] as const)("click when %s asks for %s", (checked, next) => {
    const onCheckedChange = vi.fn();
    ((Checkbox({ checked, onCheckedChange }) as Node).props.onClick as (e: unknown) => void)({});
    expect(onCheckedChange).toHaveBeenCalledWith(next);
  });

  it("is a native button so Space toggles; Enter does not", () => {
    const tree = Checkbox({ checked: false }) as Node;
    expect(tree.type).toBe("button");
    expect(tree.props.type).toBe("button");
    const keydown = (key: string) => { const preventDefault = vi.fn(); (tree.props.onKeyDown as (e: unknown) => void)({ key, preventDefault }); return preventDefault; };
    expect(keydown(" ")).not.toHaveBeenCalled();
    expect(keydown("Enter")).toHaveBeenCalledTimes(1);
  });

  it("box fills --p when checked or mixed, line-strong when empty", () => {
    expect(renderToStaticMarkup(<Checkbox checked="indeterminate" aria-label="a" />)).toContain("bg-p");
    expect(renderToStaticMarkup(<Checkbox checked={false} aria-label="a" />)).toContain("border-line-strong");
  });
});

describe("Switch (FR-4)", () => {
  it("exposes role=switch with aria-checked and toggles", () => {
    const onCheckedChange = vi.fn();
    const tree = Switch({ checked: false, onCheckedChange }) as Node;
    expect(tree.type).toBe("button");
    expect(tree.props.role).toBe("switch");
    expect(tree.props["aria-checked"]).toBe(false);
    (tree.props.onClick as (e: unknown) => void)({});
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("on uses --ok, off uses --line-strong", () => {
    const on = renderToStaticMarkup(<Switch checked aria-label="Nhận thông báo" />);
    const off = renderToStaticMarkup(<Switch checked={false} aria-label="Nhận thông báo" />);
    expect(on).toContain('aria-checked="true"');
    expect(on).toContain("bg-ok");
    expect(on).not.toContain("bg-p");
    expect(off).not.toContain("bg-ok");
    expect(off).toContain("border-line-strong");
  });
});


describe("Supplier controls", () => {
  it.each([Input, TextInput, Select, Textarea])("keeps full-width fields with 8px corners and keyboard focus", (Control) => {
    const markup = renderToStaticMarkup(<Control aria-label="Trường nhập" />);
    expect(markup).toContain("rounded-lg");
    expect(markup).not.toContain("rounded-md");
    expect(markup).toContain("w-full");
    expect(markup).toContain("focus-visible:ring-2");
  });

  it("suppresses the mouse outline on tabs while retaining keyboard focus", () => {
    const markup = renderToStaticMarkup(<Tabs label="Nhà cung cấp" idPrefix="supplier" items={[{ id: "overview", label: "Thông tin" }]} value="overview" onChange={() => {}}>Hồ sơ</Tabs>);
    expect(classes(markup, "button")).toEqual(expect.arrayContaining(["outline-none", "rounded-lg", "focus-visible:ring-2"]));
  });

  it("supports vertical arrow navigation as well as horizontal arrows", () => {
    expect(nextTab(["overview", "agreements"], "overview", "ArrowDown")).toBe("agreements");
    expect(nextTab(["overview", "agreements"], "overview", "ArrowUp")).toBe("agreements");
  });
});
