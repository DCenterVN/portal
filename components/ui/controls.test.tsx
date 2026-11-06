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

import { Button } from "./button";
import { Field } from "@/components/patterns/form-field";
import { NativeSelect } from "./native-select";
import { Textarea } from "./textarea";
import { Checkbox } from "./checkbox";
import { Switch } from "./switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
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
  it.each([["sm", "h-8"], ["default", "h-9"], ["lg", "h-10"]] as const)("size %s is %s tall", (size, height) => {
    expect(classes(renderToStaticMarkup(<Button size={size}>Lưu</Button>), "button")).toContain(height);
  });

  it("default is solid --primary with white text, a 3px focus ring and 6px corners", () => {
    const own = classes(renderToStaticMarkup(<Button>Đặt hàng</Button>), "button");
    expect(own).toEqual(expect.arrayContaining(["bg-primary", "text-primary-foreground", "hover:bg-primary/90", "focus-visible:ring-[3px]", "focus-visible:ring-ring/50", "rounded-md"]));
    expect(own).not.toContain("rounded-full");
  });

  it("destructive is the --destructive fill and keeps its icon first", () => {
    const markup = renderToStaticMarkup(<Button variant="destructive"><Trash2 aria-hidden="true" />Xoá sản phẩm</Button>);
    const own = classes(markup, "button");
    expect(own).toEqual(expect.arrayContaining(["bg-destructive", "text-white", "hover:bg-destructive/90"]));
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
    expect(markup).not.toContain("aria-invalid=");
    expect(markup).not.toContain('role="alert"');
  });

  it("shows the error on blur and points aria-describedby at it", () => {
    (input(render(Field, props())).props.onBlur as (e: unknown) => void)(blurWith("abc"));
    const markup = html(render(Field, props()));
    expect(markup).toMatch(/<input[^>]*aria-invalid="true"/);
    expect(markup).toMatch(/<input[^>]*aria-describedby="pw-error"/);
    expect(markup).toMatch(/<div[^>]*role="alert"[^>]*id="pw-error"[^>]*>passwordTooShort<\/div>/);
  });

  it.each([[11, "passwordTooShort"], [12, ""], [256, ""], [257, "passwordTooLong"]] as const)(
    "password of %i chars: blur gives '%s'",
    (length, expected) => {
      (input(render(Field, props())).props.onBlur as (e: unknown) => void)(blurWith("x".repeat(length)));
      const markup = html(render(Field, props()));
      if (expected) expect(markup).toContain(`>${expected}</div>`);
      else expect(markup).not.toContain("aria-invalid=");
    },
  );

  it("clears the error once the value is fixed and blurred again", () => {
    (input(render(Field, props())).props.onBlur as (e: unknown) => void)(blurWith("abc"));
    (input(render(Field, props())).props.onBlur as (e: unknown) => void)(blurWith("x".repeat(12)));
    expect(html(render(Field, props()))).not.toContain("aria-invalid=");
  });

  it("keeps the caller's onBlur and a server error wins", () => {
    const onBlur = vi.fn();
    const tree = render(Field, { ...props(), error: "Sai mật khẩu", children: <PasswordInput id="pw" onBlur={onBlur} /> });
    (input(tree).props.onBlur as (e: unknown) => void)(blurWith("abc"));
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(html(render(Field, { ...props(), error: "Sai mật khẩu" }))).toContain(">Sai mật khẩu</div>");
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
  it.each([[true, "true", "checked"], [false, "false", "unchecked"], ["indeterminate", "mixed", "indeterminate"]] as const)("checked=%s renders aria-checked=%s", (checked, aria, state) => {
    const markup = renderToStaticMarkup(<Checkbox checked={checked} aria-label="Chọn tất cả" />);
    expect(markup).toMatch(/<button[^>]*role="checkbox"/);
    expect(markup).toContain(`aria-checked="${aria}"`);
    expect(markup).toContain(`data-state="${state}"`);
  });

  it("is a native button with type=button so Space toggles and a form is not submitted", () => {
    expect(renderToStaticMarkup(<Checkbox aria-label="a" />)).toMatch(/<button[^>]*type="button"/);
  });

  it("box fills --primary when checked or mixed, --input border when empty", () => {
    const own = classes(renderToStaticMarkup(<Checkbox checked={false} aria-label="a" />), "button");
    expect(own).toEqual(expect.arrayContaining(["border-input", "data-[state=checked]:bg-primary", "data-[state=checked]:text-primary-foreground"]));
  });
});

describe("Switch (FR-4)", () => {
  it("exposes role=switch with aria-checked", () => {
    const on = renderToStaticMarkup(<Switch checked aria-label="Nhận thông báo" />);
    const off = renderToStaticMarkup(<Switch checked={false} aria-label="Nhận thông báo" />);
    expect(on).toMatch(/<button[^>]*role="switch"/);
    expect(on).toContain('aria-checked="true"');
    expect(off).toContain('aria-checked="false"');
  });

  it("on uses --primary, off uses --input", () => {
    const own = classes(renderToStaticMarkup(<Switch checked aria-label="Nhận thông báo" />), "button");
    expect(own).toEqual(expect.arrayContaining(["data-[state=checked]:bg-primary", "data-[state=unchecked]:bg-input"]));
  });
});


describe("Supplier controls", () => {
  it("keeps the base Input full-width with the shadcn corners and keyboard focus ring", () => {
    const markup = renderToStaticMarkup(<Input aria-label="Trường nhập" />);
    expect(markup).toContain("rounded-md");
    expect(markup).toContain("w-full");
    expect(markup).toContain("focus-visible:ring-[3px]");
  });

  it.each([Input, NativeSelect, Textarea])("keeps full-width fields with the shadcn corners and keyboard focus", (Control) => {
    const markup = renderToStaticMarkup(<Control aria-label="Trường nhập" />);
    expect(markup).toContain("rounded-md");
    expect(markup).toContain("w-full");
    expect(markup).toContain("focus-visible:ring-[3px]");
  });

  it("renders shadcn tabs with tab roles and a keyboard focus ring", () => {
    const markup = renderToStaticMarkup(<Tabs value="overview"><TabsList aria-label="Nhà cung cấp"><TabsTrigger value="overview">Thông tin</TabsTrigger></TabsList><TabsContent value="overview">Hồ sơ</TabsContent></Tabs>);
    expect(markup).toContain('role="tablist"');
    expect(markup).toContain('role="tab"');
    expect(markup).toContain('role="tabpanel"');
    expect(classes(markup, "button")).toEqual(expect.arrayContaining(["focus-visible:ring-[3px]"]));
  });
});
