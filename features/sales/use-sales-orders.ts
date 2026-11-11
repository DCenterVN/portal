"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLoadedList } from "@/hooks/use-loaded-list";
import { useAccess } from "@/lib/access-boundary";
import { toast } from "@/components/ui/toast";
import { getStaffOrder, getStaffOrders, mutateStaffOrder, type StaffOrder } from "@/lib/api/staff-orders";
import { companyMemberships, type Membership } from "@/lib/api/platform-client";
import { getLocations } from "@/lib/api/locations";
import { availableActions, orderActions, type OrderAction } from "./order-actions";

export async function loadDrivers(branchId: string): Promise<Membership[]> {
  const members: Membership[] = [];
  for (let page = 1; ; page++) {
    const result = await companyMemberships(page, branchId);
    members.push(...result.items);
    if (result.items.length < result.limit) break;
  }
  return members.filter(member => member.branch_id === branchId && member.status === "ACTIVE" && member.role_codes.includes("SALES"));
}
export function actionSchema(action: OrderAction, order: StaffOrder) {
  return z.object({
    value: action === "ship" ? z.string().uuid("Chọn người giao trong danh sách")
      : action === "payments/confirm" ? z.string().trim().min(1, "Nhập mã giao dịch ngân hàng").max(128, "Mã giao dịch tối đa 128 ký tự")
      : action === "delivery-failure" || action === "cancel" && order.status === "CONFIRMED"
        ? z.string().trim().min(1, "Nhập lý do").max(500, "Lý do tối đa 500 ký tự")
        : z.string().trim().max(500, "Lý do tối đa 500 ký tự"),
  });
}
export function useSalesOrders(initialOrders?: StaffOrder[]) {
  const { can, scope } = useAccess();
  const list = useLoadedList(initialOrders, getStaffOrders);
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState<StaffOrder | null>(null);
  const [pending, setPending] = useState<{ order: StaffOrder; action: OrderAction } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const attempts = useRef(new Map<string, string>());
  const detail = useSWR(selected ? ["staff-order", scope?.orgId, scope?.branchId, selected.id] : null, () => getStaffOrder(selected!.id));
  const order = detail.data ?? selected;
  const provinces = useSWR(order?.province_code ? "/api/locations/provinces" : null, getLocations);
  const communes = useSWR(order?.province_code ? `/api/locations/provinces/${encodeURIComponent(order.province_code)}/communes` : null, getLocations);
  const drivers = useSWR(pending?.action === "ship" && scope?.branchId && can("org:membership:read")
    ? ["order-drivers", scope.orgId, scope.branchId] : null, () => loadDrivers(scope!.branchId));
  const form = useForm<{ value: string }>({
    resolver: zodResolver(pending ? actionSchema(pending.action, pending.order) : z.object({ value: z.string() })), defaultValues: { value: "" },
  });
  useEffect(() => {
    if (pending?.action !== "ship" || form.getValues("value") || form.getFieldState("value").isDirty) return;
    if (drivers.data?.some(member => member.user_id === scope?.userId)) form.setValue("value", scope!.userId);
  }, [drivers.data, pending, scope?.userId, form]);
  const run = async (target: StaffOrder, action: OrderAction, input: Record<string, string>) => {
    if (lock.current || !availableActions(target, can, scope?.userId).some(item => item.path === action)) return false;
    lock.current = true; setBusy(true); setError("");
    const signature = JSON.stringify([target.id, action, input]);
    const key = attempts.current.get(signature) ?? crypto.randomUUID();
    attempts.current.set(signature, key);
    try {
      const result = await mutateStaffOrder(target.id, action, input, key);
      const updated = { ...target, ...result, payment_method: result.payment_method ?? target.payment_method, payment_status: result.payment_status ?? target.payment_status };
      list.setItems(current => current.map(item => item.id === target.id ? { ...item, ...updated } : item));
      if (selected?.id === target.id) {
        setSelected(current => current ? { ...current, ...updated } : updated);
        await detail.mutate(current => current ? { ...current, ...updated } : updated, { revalidate: false });
      }
      toast.success(`Đã xử lý: ${orderActions[action].label.toLocaleLowerCase("vi")}`);
      return true;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Không thể xử lý đơn hàng";
      setError(message); toast.error("Không thể xử lý đơn hàng", { description: message });
      return false;
    } finally { lock.current = false; setBusy(false); }
  };
  const act = (target: StaffOrder, action: OrderAction) => {
    if (lock.current || !availableActions(target, can, scope?.userId).some(item => item.path === action)) return;
    if (["confirm", "pack", "deliver"].includes(action)) { void run(target, action, {}); return; }
    form.reset({ value: "" }); setError(""); setPending({ order: target, action });
  };
  const changeDialogOpen = (open: boolean) => { if (!open && !lock.current) setPending(null); };
  const submit = form.handleSubmit(async ({ value }) => {
    if (!pending) return;
    const { order: target, action } = pending;
    if (action === "ship" && (!can("org:membership:read") || !drivers.data?.some(driver => driver.user_id === value) || drivers.error)) {
      form.setError("value", { message: "Chọn người giao đang hoạt động trong chi nhánh" }); return;
    }
    const input: Record<string, string> = action === "ship" ? { driver_ref: value } : action === "payments/confirm" ? { bank_transaction_ref: value } : { reason: value };
    if (await run(target, action, input)) setPending(null);
  });
  return { list, orders: list.items.filter(item => filter === "ALL" || item.status === filter), filter, setFilter,
    order, setSelected, detail, provinces, communes, pending, busy, error, drivers, form, submit, changeDialogOpen, act, can, userId: scope?.userId };
}
