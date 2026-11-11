import React from "react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { createFormControl, type UseFormProps } from "react-hook-form";
import { OrdersView } from "./orders-view";
import { useProductionOrders } from "./use-production-orders";
import { type ProductionOrder, startOrder } from "@/lib/api/production";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const hooks = vi.hoisted(() => ({ cursor: 0, slots: [] as unknown[], form: undefined as ReturnType<typeof createFormControl> | undefined, allowed: true }));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  return { ...actual, useState: (initial: unknown) => {
    const index = hooks.cursor++;
    if (!(index in hooks.slots)) hooks.slots[index] = initial;
    return [hooks.slots[index], (value: unknown) => {
      hooks.slots[index] = typeof value === "function" ? value(hooks.slots[index]) : value;
    }];
  } };
});
vi.mock("react-hook-form", async original => {
  const actual = await original<typeof import("react-hook-form")>();
  return { ...actual, useForm: (options: UseFormProps) => {
    hooks.form ??= actual.createFormControl(options);
    return { ...hooks.form, formState: { errors: {}, isSubmitting: false } };
  } };
});
vi.mock("@/hooks/use-loaded-list", () => ({ useLoadedList: (orders: ProductionOrder[]) => ({ items: orders, setItems: vi.fn(), loading: false, error: "", reload: vi.fn() }) }));
vi.mock("@/lib/access-boundary", () => ({ useAccess: () => ({ can: () => hooks.allowed, scope: { roles: ["VT-10"] } }) }));
vi.mock("@/components/ui/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const order: ProductionOrder = { id: "order-id", order_code: "PO-001", source_plan_ref: "plan", target_ref: "target", branch_ref: "branch", output_sku_ref: "sku", bom_ref: "bom", planned_quantity: 2, actual_output_quantity: 0, uom: "EA", status: "IN_PROGRESS", created_at: "2026-11-11" };
const fetcher = vi.fn<typeof fetch>();
type Node = React.ReactElement<Record<string, unknown> & { children?: React.ReactNode }>;
function nodes(tree: React.ReactNode): Node[] {
  if (!React.isValidElement<Record<string, unknown> & { children?: React.ReactNode }>(tree)) return [];
  return [tree, ...React.Children.toArray(tree.props.children).flatMap(nodes)];
}
function view() { hooks.cursor = 0; return OrdersView({ initialOrders: [order] }); }
function state() { hooks.cursor = 0; return useProductionOrders([order]); }
function control(tree: React.ReactNode, type: unknown, text?: string) {
  const found = nodes(tree).find(node => node.type === type && (!text || node.props.children === text));
  expect(found).toBeDefined();
  return found!;
}
function form() {
  if (!hooks.form) throw new Error("Form chưa mở");
  return hooks.form;
}
async function submit(value: string) {
  const tree = view();
  control(tree, Input);
  form().setValue("actualQuantity", value);
  const submit = control(tree, "form").props.onSubmit as () => Promise<void>;
  await submit();
}
beforeEach(() => {
  hooks.cursor = 0; hooks.slots = []; hooks.form = undefined; hooks.allowed = true;
  fetcher.mockReset().mockImplementation(async () => Response.json({ data: { ...order, status: "COMPLETED", actual_output_quantity: 3 } }));
  vi.stubGlobal("fetch", fetcher);
});
afterEach(() => vi.unstubAllGlobals());

it("startOrder sends cooking stage without role_code", async () => {
  await startOrder(order.id, "cooking");
  expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual({ stage: "cooking" });
});
it("cooking button requests cooking even for a preparation role", async () => {
  hooks.cursor = 0;
  const tree = OrdersView({ initialOrders: [{ ...order, status: "ALLOCATED" }] });
  await (control(tree, Button, "Bắt đầu nấu").props.onClick as () => Promise<void>)();
  expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual({ stage: "cooking" });
});
it("packaging opens a blank form with planned quantity as reference", () => {
  (control(view(), Button, "Đóng gói").props.onClick as () => void)();
  const tree = view();
  expect(control(tree, Dialog).props.open).toBe(true);
  expect(form().getValues("actualQuantity")).toBe("");
  expect(nodes(tree).some(node => React.Children.toArray(node.props.children).join("").includes("Kế hoạch: 2 hộp."))).toBe(true);
  expect(fetcher).not.toHaveBeenCalled();
});
it.each(["", "0", "-1", "1.5"])("blocks invalid output %s", async value => {
  (control(view(), Button, "Đóng gói").props.onClick as () => void)();
  await submit(value);
  expect(fetcher).not.toHaveBeenCalled();
  expect(form().getFieldState("actualQuantity").invalid).toBe(true);
  expect(control(view(), Dialog).props.open).toBe(true);
});
it("submits 3 for a plan of 2 and closes after success", async () => {
  (control(view(), Button, "Đóng gói").props.onClick as () => void)();
  await submit("3");
  expect(String(fetcher.mock.calls[0][0])).toContain(`/orders/${order.id}/completion`);
  expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body)).actual_output_quantity).toBe(3);
  expect(control(view(), Dialog).props.open).toBe(false);
});
it("API failure retains dialog and input for retry", async () => {
  fetcher.mockResolvedValueOnce(Response.json({}, { status: 500 }));
  (control(view(), Button, "Đóng gói").props.onClick as () => void)();
  await submit("3");
  expect(control(view(), Dialog).props.open).toBe(true);
  expect(form().getValues("actualQuantity")).toBe("3");
  await submit("3");
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(control(view(), Dialog).props.open).toBe(false);
});
it("hides packaging without update permission", () => {
  hooks.allowed = false;
  expect(nodes(view()).some(node => node.type === Button && node.props.children === "Đóng gói")).toBe(false);
  expect(state().canUpdate).toBe(false);
});
