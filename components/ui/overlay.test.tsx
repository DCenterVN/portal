import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";

// Node has no DOM: `direct` runs a component as a plain function (hooks become slots, effects are skipped);
// `mounted` flips the `useState(false)` mount guards so the SSR markup shows the portal content.
const hooks = vi.hoisted(() => ({ direct: false, mounted: false, slots: [] as unknown[], cursor: 0 }));
vi.mock("react", async (original) => {
  const actual = await original<typeof import("react")>();
  const slot = <T,>(init: () => T): [number, T] => {
    const index = hooks.cursor++;
    if (!(index in hooks.slots)) hooks.slots[index] = init();
    return [index, hooks.slots[index] as T];
  };
  return {
    ...actual,
    useState: (initial: unknown) => {
      const start = hooks.mounted && initial === false ? true : initial;
      if (!hooks.direct) return actual.useState(start);
      const [index, value] = slot(() => start);
      return [value, (next: unknown) => {
        hooks.slots[index] = typeof next === "function" ? (next as (prev: unknown) => unknown)(hooks.slots[index]) : next;
      }];
    },
    useRef: (value: unknown) => (hooks.direct ? slot(() => ({ current: value }))[1] : actual.useRef(value)),
    useCallback: (fn: unknown, deps: unknown[]) => (hooks.direct ? fn : actual.useCallback(fn as () => void, deps)),
    useMemo: (fn: () => unknown, deps: unknown[]) => (hooks.direct ? fn() : actual.useMemo(fn, deps)),
    useEffect: (fn: () => void, deps: unknown[]) => (hooks.direct ? undefined : actual.useEffect(fn, deps)),
  };
});
vi.mock("react-dom", async (original) => ({
  ...(await original<typeof import("react-dom")>()),
  createPortal: (children: React.ReactNode) => children,
}));

import {
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";
import { Button } from "./button";
import { MenuItem, Popover, popoverDismiss } from "./popover";
import { ToastContainer, ToastProvider, useToast, type ToastMessage } from "./toast";
import { ColdChainViolationModal } from "../modals/cold-chain-violation-modal";
import { CONSOLE_NAV } from "@/mocks/console";

type AnyProps = Record<string, unknown> & { children?: React.ReactNode };
type Node = React.ReactElement<AnyProps>;

const css = readFileSync("app/globals.css", "utf8");
const tagWith = (html: string, tag: string, attribute = "") => html.match(new RegExp(`<${tag}\\b[^>]*${attribute}[^>]*>`))?.[0] ?? "";
const classesOf = (element: string) => element.match(/class="([^"]*)"/)?.[1].split(" ") ?? [];

function findAll(tree: React.ReactNode, match: (node: Node) => boolean): Node[] {
  if (!React.isValidElement(tree)) return [];
  const node = tree as Node;
  const own = match(node) ? [node] : [];
  return own.concat(React.Children.toArray(node.props.children).flatMap((child) => findAll(child, match)));
}

function mountedMarkup(element: React.ReactElement) {
  hooks.mounted = true;
  vi.stubGlobal("document", { body: {} });
  vi.stubGlobal("HTMLElement", class {});
  try {
    return renderToStaticMarkup(element);
  } finally {
    hooks.mounted = false;
    vi.unstubAllGlobals();
  }
}

beforeEach(() => {
  hooks.slots = [];
  hooks.cursor = 0;
});

describe("Overlay & Modal System (00)", () => {
  it("Dialog components define structure properly", () => {
    const dialogElement = React.createElement(
      Dialog,
      { open: true },
      React.createElement(
        DialogContent,
        null,
        React.createElement(
          DialogHeader,
          null,
          React.createElement(DialogTitle, null, "Tiêu đề Hộp thoại"),
          React.createElement(DialogDescription, null, "Mô tả hộp thoại")
        ),
        React.createElement(DialogFooter, null, "Nội dung chân")
      )
    );

    expect(dialogElement).toBeDefined();
  });

  it("ColdChainViolationModal strictly conforms to fail-closed principle", () => {
    const modalElement = React.createElement(ColdChainViolationModal, {
      open: true,
      onOpenChange: () => {},
      lotCode: "#LOT-2026-CH-0091",
      measuredTemp: "-12,4 °C",
      thresholdTemp: "-18,0 °C",
    });

    expect(modalElement).toBeDefined();
  });

  it("DialogContent supports Layer 5 critical and Layer 6 session with proper layer prop", () => {
    const criticalDialog = React.createElement(
      Dialog,
      { open: true },
      React.createElement(DialogContent, { layer: "critical" }, "Nội dung cảnh báo")
    );
    expect(criticalDialog.props.open).toBe(true);

    const sessionDialog = React.createElement(
      Dialog,
      { open: true },
      React.createElement(DialogContent, { layer: "session" }, "Khóa phiên")
    );
    expect(sessionDialog.props.open).toBe(true);
  });

  it("ToastProvider and hook are properly defined", () => {
    expect(typeof ToastProvider).toBe("function");
    expect(typeof useToast).toBe("function");
  });
});

describe("Popover / menu (FR-4): glass L3, no scrim", () => {
  const menu = (align?: "start" | "end") => renderToStaticMarkup(
    <Popover trigger="Tài khoản" menu align={align} defaultOpen>
      <MenuItem>Hồ sơ</MenuItem>
      <MenuItem>Đăng xuất</MenuItem>
    </Popover>,
  );

  it("panel is glass L3: --glass-l3 fill, 24px blur, --glass-edge border, --shadow-l3, 8px corners", () => {
    const panel = classesOf(tagWith(menu(), "div", 'role="menu"'));
    expect(panel).toEqual(expect.arrayContaining(["bg-glass-l3", "glass-blur-l3", "border", "border-glass-edge", "shadow-l3", "rounded-lg", "absolute", "top-full"]));
    expect(css).toMatch(/@utility glass-blur-l3 \{[^}]*backdrop-filter: blur\(24px\);/);
    expect(css).toMatch(/@utility glass-blur-l2 \{[^}]*backdrop-filter: blur\(16px\);/);
  });

  it("has no scrim and does not cover the page", () => {
    const html = menu();
    expect(html).not.toMatch(/bg-scrim|\bfixed\b|inset-0/);
    expect(html).not.toContain("aria-modal");
  });

  it("is a menu of menuitems wired to its trigger, aligned start or end", () => {
    const html = menu("end");
    const trigger = tagWith(html, "button", 'aria-haspopup="menu"');
    const panel = tagWith(html, "div", 'role="menu"');
    expect(trigger).toContain('aria-expanded="true"');
    expect(trigger.match(/aria-controls="([^"]+)"/)?.[1]).toBe(panel.match(/id="([^"]+)"/)?.[1]);
    expect(html.match(/role="menuitem"/g)).toHaveLength(2);
    expect(classesOf(panel)).toContain("right-0");
    expect(classesOf(tagWith(menu("start"), "div", 'role="menu"'))).toContain("left-0");
  });

  it("stays closed until opened, and a plain popover is not a menu", () => {
    const closed = renderToStaticMarkup(<Popover trigger="Giỏ">Nội dung</Popover>);
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).not.toContain("Nội dung");
    const open = renderToStaticMarkup(<Popover trigger="Giỏ" defaultOpen>Nội dung</Popover>);
    expect(open).toContain("Nội dung");
    expect(open).not.toMatch(/role="menu"|aria-haspopup/);
  });

  it("Esc closes and returns focus to the trigger; a press outside closes without stealing focus", () => {
    const close = vi.fn();
    const trigger = { focus: vi.fn() };
    const inside = {};
    const dismiss = popoverDismiss({ contains: (node) => node === inside }, trigger, close);

    dismiss.keydown({ key: "Enter" });
    dismiss.pointerdown({ target: inside });
    expect(close).not.toHaveBeenCalled();

    dismiss.keydown({ key: "Escape" });
    expect(close).toHaveBeenCalledTimes(1);
    expect(trigger.focus).toHaveBeenCalledTimes(1);

    dismiss.pointerdown({ target: {} });
    expect(close).toHaveBeenCalledTimes(2);
    expect(trigger.focus).toHaveBeenCalledTimes(1);
  });
});

describe("Modal / sheet (FR-4): solid, fixed, scrim, 12px", () => {
  const modal = (props: Record<string, unknown> = {}) => mountedMarkup(
    <Dialog open>
      <DialogContent {...props}>
        <DialogTitle>Xoá sản phẩm</DialogTitle>
        Nội dung
      </DialogContent>
    </Dialog>,
  );

  it.each(["standard", "critical", "session"] as const)("layer %s is a solid --l1 surface over a fixed --scrim", (layer) => {
    const html = modal({ layer });
    const container = classesOf(html.match(/^<div\b[^>]*>/)![0]);
    expect(container).toEqual(expect.arrayContaining(["fixed", "inset-0"]));
    expect(container.some((name) => /^z-\(--z-modal(-critical|-session)?\)$/.test(name))).toBe(true);
    expect(classesOf(tagWith(html, "div", 'aria-hidden="true"'))).toEqual(expect.arrayContaining(["fixed", "inset-0", "bg-scrim"]));
    const surface = classesOf(tagWith(html, "div", 'role="dialog"'));
    expect(surface).toEqual(expect.arrayContaining(["bg-l1", "rounded-xl", "shadow-l3"]));
    expect(html).not.toMatch(/glass|blur/);
  });

  it("is aria-modal and labelled by its title without the caller wiring ids", () => {
    const html = modal();
    const surface = tagWith(html, "div", 'role="dialog"');
    expect(surface).toContain('aria-modal="true"');
    const labelledBy = surface.match(/aria-labelledby="([^"]+)"/)?.[1];
    expect(labelledBy).toBeTruthy();
    expect(tagWith(html, "h2")).toContain(`id="${labelledBy}"`);
    expect(tagWith(modal({ "aria-labelledby": "own-title" }), "div", 'role="dialog"')).toContain('aria-labelledby="own-title"');
  });

  it("sheet slides up from the bottom on mobile in 300ms and stays still for reduced motion", () => {
    const html = modal({ variant: "sheet" });
    expect(classesOf(html.match(/^<div\b[^>]*>/)![0])).toContain("max-md:items-end");
    const surface = classesOf(tagWith(html, "div", 'role="dialog"'));
    expect(surface).toEqual(expect.arrayContaining(["bg-l1", "rounded-xl", "max-md:rounded-b-none", "max-md:animate-sheet-in", "motion-reduce:animate-none"]));
    expect(css).toMatch(/--animate-sheet-in: sheet-in 300ms/);
    expect(css).toMatch(/@keyframes sheet-in \{[^}]*translateY\(100%\)/);
    expect(classesOf(tagWith(modal(), "div", 'role="dialog"'))).not.toContain("max-md:animate-sheet-in");
  });

  it("first focus never lands on the destructive button of a danger confirm", () => {
    const buttons = (danger: boolean) => findAll(
      ConfirmDialog({ open: true, onOpenChange: () => {}, title: "Xoá lô?", confirmLabel: "Xoá", danger, onConfirm: () => {} }),
      (node) => node.type === Button,
    );
    const focused = (danger: boolean) => buttons(danger).filter((node) => node.props.autoFocus);

    expect(focused(true)).toHaveLength(1);
    expect(focused(true)[0].props.variant).not.toMatch(/danger|destructive/);
    expect(buttons(true).find((node) => /danger|destructive/.test(String(node.props.variant)))?.props.autoFocus).toBeFalsy();
    expect(focused(false).map((node) => node.props.children)).toEqual(["Xoá"]);
  });
});

describe("Toast (FR-4): solid, role, placement, 10s undo", () => {
  const toast = (variant: ToastMessage["variant"], extra: Partial<ToastMessage> = {}): ToastMessage => ({ id: String(variant), title: `Thông báo ${variant}`, variant, ...extra });

  it("is a solid --l1 card; status for news, alert only for errors", () => {
    const html = mountedMarkup(<ToastContainer toasts={[toast("success"), toast("error")]} onDismiss={() => {}} />);
    const status = tagWith(html, "div", 'role="status"');
    expect(classesOf(status)).toEqual(expect.arrayContaining(["bg-l1", "shadow-l3", "rounded-lg"]));
    expect(html.match(/role="status"/g)).toHaveLength(1);
    expect(html.match(/role="alert"/g)).toHaveLength(1);
    expect(html).not.toMatch(/glass|blur/);
  });

  it.each([
    ["store", ["bottom-4", "inset-x-0", "mx-auto"], ["right-4", "top-4"]],
    ["crm", ["bottom-4", "right-4"], ["inset-x-0", "top-4"]],
  ] as const)("placement %s sits at the agreed corner", (placement, has, hasNot) => {
    const html = mountedMarkup(<ToastContainer placement={placement} toasts={[toast("info")]} onDismiss={() => {}} />);
    const container = classesOf(html.match(/^<div\b[^>]*>/)![0]);
    expect(container).toEqual(expect.arrayContaining(["fixed", "z-(--z-toast)", ...has]));
    for (const name of hasNot) expect(container).not.toContain(name);
  });

  it("an undo toast stays 10s, then closes by itself", () => {
    vi.useFakeTimers();
    hooks.direct = true;
    const context = () => {
      hooks.cursor = 0;
      return (ToastProvider({ children: null }) as Node).props.value as ReturnType<typeof useToast>;
    };
    context().toast({ title: "Đã xoá lô", action: { label: "Hoàn tác", onClick: () => {} } });
    expect(context().toasts).toHaveLength(1);
    vi.advanceTimersByTime(9_999);
    expect(context().toasts).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(context().toasts).toHaveLength(0);

    context().toast({ title: "Đã lưu" });
    vi.advanceTimersByTime(4_000);
    expect(context().toasts).toHaveLength(0);
  });

  it("Hoàn tác runs the undo and closes the toast", () => {
    const undo = vi.fn();
    const dismiss = vi.fn();
    const html = mountedMarkup(<ToastContainer toasts={[toast("success", { action: { label: "Hoàn tác", onClick: undo } })]} onDismiss={dismiss} />);
    expect(html).toMatch(/<button\b[^>]*>Hoàn tác<\/button>/);

    hooks.direct = true;
    hooks.mounted = true;
    vi.stubGlobal("document", { body: {} });
    const tree = ToastContainer({ toasts: [toast("success", { action: { label: "Hoàn tác", onClick: undo } })], onDismiss: dismiss });
    const item = findAll(tree, (node) => typeof node.type === "function" && "toast" in node.props)[0];
    const button = findAll((item.type as (props: AnyProps) => React.ReactNode)(item.props), (node) => node.type === "button" && node.props.children === "Hoàn tác")[0];
    (button.props.onClick as () => void)();
    expect(undo).toHaveBeenCalledTimes(1);
    expect(dismiss).toHaveBeenCalledTimes(1);
  });
});

afterEach(() => {
  hooks.direct = false;
  hooks.mounted = false;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Admin Shell & Sidebar Navigation", () => {
  it("CONSOLE_NAV contains real operations routes without the word resort", () => {
    const items = CONSOLE_NAV.flatMap((group) => group.items);
    expect(items.length).toBeGreaterThanOrEqual(6);

    const labels = items.map((item) => item.label);
    expect(labels).toContain("Bảng điều khiển");
    expect(labels).toContain("Kệ hàng");
    expect(labels).toContain("Kiểm định");
    expect(labels).toContain("Bảng giá");

    items.forEach((item) => {
      expect(item.label.toLowerCase()).not.toContain("resort");
      expect(item.href.toLowerCase()).not.toContain("resort");
    });
  });
});
