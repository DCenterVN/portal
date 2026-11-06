import { describe, it, expect } from "vitest";
import React from "react";
import { readFileSync } from "node:fs";
import { AlertDialogAction, AlertDialogCancel } from "./alert-dialog";
import { ConfirmDialog } from "../patterns/confirm-dialog";
import { CONSOLE_NAV } from "@/mocks/console";

type AnyProps = Record<string, unknown> & { children?: React.ReactNode };
type Node = React.ReactElement<AnyProps>;

function findAll(tree: React.ReactNode, match: (node: Node) => boolean): Node[] {
  if (!React.isValidElement(tree)) return [];
  const node = tree as Node;
  const own = match(node) ? [node] : [];
  return own.concat(React.Children.toArray(node.props.children).flatMap((child) => findAll(child, match)));
}

describe("Overlays are shadcn originals (Radix focus trap, Esc, scroll lock)", () => {
  it("dialog, sheet, popover, dropdown, command, sonner are the registry files, not custom wrappers", () => {
    for (const [file, primitive] of [["dialog", "DialogPrimitive"], ["sheet", "SheetPrimitive"], ["popover", "PopoverPrimitive"], ["dropdown-menu", "DropdownMenuPrimitive"], ["select", "SelectPrimitive"], ["alert-dialog", "AlertDialogPrimitive"]] as const) {
      const source = readFileSync(`components/ui/${file}.tsx`, "utf8");
      expect(source).toContain(`as ${primitive} } from "radix-ui"`);
    }
    expect(readFileSync("components/ui/command.tsx", "utf8")).toContain('from "cmdk"');
    expect(readFileSync("components/ui/sonner.tsx", "utf8")).toContain('from "sonner"');
  });
});

describe("ConfirmDialog", () => {
  const parts = (danger: boolean) => {
    const tree = ConfirmDialog({ open: true, onOpenChange: () => {}, title: "Xoá lô?", confirmLabel: "Xoá", danger, onConfirm: () => {} });
    return { action: findAll(tree, (node) => node.type === AlertDialogAction)[0], cancel: findAll(tree, (node) => node.type === AlertDialogCancel)[0] };
  };

  it("is an alert dialog: cancel gets Radix first focus, a danger confirm is destructive", () => {
    expect(parts(true).cancel).toBeDefined();
    expect(parts(true).action.props.variant).toBe("destructive");
    expect(parts(false).action.props.variant).toBe("default");
  });

  it("busy blocks close and disables both buttons", () => {
    const calls: boolean[] = [];
    const tree = ConfirmDialog({ open: true, onOpenChange: (value) => calls.push(value), title: "t", confirmLabel: "Xoá", busy: true, onConfirm: () => {} });
    (tree.props.onOpenChange as (value: boolean) => void)(false);
    expect(calls).toEqual([]);
    expect(findAll(tree, (node) => node.type === AlertDialogAction || node.type === AlertDialogCancel).every((node) => node.props.disabled)).toBe(true);
  });
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
