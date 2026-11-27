"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePagedList } from "@/hooks/use-paged-list";
import { useAccess } from "@/lib/access-boundary";
import { codedErrorMessage, shortageSku } from "@/lib/error-message";
import { getMaterialNames } from "@/lib/api/material-names";
import { toast } from "@/components/ui/toast";
import { type ProductionOrder, getOrdersPage, acceptOrder, allocateOrderLots, startOrder, completeOrder, failOrder } from "@/lib/api/production";

const completionSchema = z.object({
  actualQuantity: z.string().trim().min(1, "Nhập sản lượng thực tế.").pipe(
    z.coerce.number().int("Nhập số nguyên từ 1 trở lên.").min(1, "Nhập số nguyên từ 1 trở lên.")
  ),
});

const failureSchema = z.object({ reason: z.string().trim().min(1, "Nhập lý do hỏng mẻ.").max(500, "Lý do tối đa 500 ký tự.") });

async function failureText(err: unknown, fallback: string) {
  const sku = shortageSku(err);
  const names = sku ? await getMaterialNames([sku]).catch(() => undefined) : undefined;
  return codedErrorMessage(err, { materialName: sku ? names?.get(sku)?.name : undefined }) ?? (err instanceof Error ? err.message : fallback);
}

type Outcome = { title: string; description: string };

export function useProductionOrders(initialOrders?: ProductionOrder[]) {
  const { scope, can } = useAccess();
  const list = usePagedList(cursor => getOrdersPage({ cursor }), `${scope?.orgId}:${scope?.branchId}`, initialOrders);
  const { items: orders, setItems: setOrders, loading: listLoading, error: listError, reload } = list;
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [completionOrder, setCompletionOrder] = useState<ProductionOrder | null>(null);
  const completionForm = useForm<z.input<typeof completionSchema>, unknown, z.output<typeof completionSchema>>({
    resolver: zodResolver(completionSchema), defaultValues: { actualQuantity: "" },
  });
  const canUpdate = can("production:order:update");
  const [failingOrder, setFailingOrder] = useState<ProductionOrder | null>(null);
  const failureForm = useForm<z.input<typeof failureSchema>, unknown, z.output<typeof failureSchema>>({
    resolver: zodResolver(failureSchema), defaultValues: { reason: "" },
  });

  const run = async (orderId: string, action: () => Promise<ProductionOrder>, success: (order: ProductionOrder) => Outcome, failure: Outcome) => {
    setLoadingId(orderId);
    try {
      const updated = await action();
      setOrders((current) => current.map((o) => (o.id === orderId ? updated : o)));
      const { title, description } = success(updated);
      toast.success(title, { description });
      return true;
    } catch (err: unknown) {
      toast.error(failure.title, { description: await failureText(err, failure.description) });
      return false;
    } finally {
      setLoadingId(null);
    }
  };

  const handleAccept = (orderId: string) => run(orderId, () => acceptOrder(orderId),
    (o) => ({ title: "Đã tiếp nhận lệnh sản xuất", description: `Lệnh ${o.order_code} đã được bếp nhận` }),
    { title: "Lỗi tiếp nhận lệnh", description: "Không thể tiếp nhận lệnh" });
  const handleAllocate = (orderId: string) => run(orderId, () => allocateOrderLots(orderId),
    (o) => ({ title: "Đã cấp nguyên liệu từ kho", description: `Lệnh ${o.order_code} đã đủ nguyên liệu` }),
    { title: "Lỗi phân bổ kho", description: "Không thể phân bổ kho" });
  const handleStart = (orderId: string) => run(orderId, () => startOrder(orderId, "cooking"),
    (o) => ({ title: "Đã bắt đầu nấu", description: `Đã trừ tồn kho nguyên liệu, lệnh ${o.order_code} đang nấu` }),
    { title: "Lỗi bắt đầu chế biến", description: "Không thể bắt đầu chế biến" });
  const handleComplete = (orderId: string, actualQuantity: number) => run(orderId, () => completeOrder(orderId, actualQuantity, [], "VT-12"),
    () => ({ title: "Đóng gói hoàn tất", description: "Đã tạo lô thành phẩm, đang chờ kiểm chất lượng" }),
    { title: "Lỗi hoàn tất lệnh", description: "Không thể hoàn tất lệnh" });

  const openCompletion = (order: ProductionOrder) => {
    if (!canUpdate) return;
    completionForm.reset({ actualQuantity: "" });
    setCompletionOrder(order);
  };
  const changeCompletionOpen = (open: boolean) => {
    if (!open && !completionForm.formState.isSubmitting) setCompletionOrder(null);
  };
  const submitCompletion = completionForm.handleSubmit(async ({ actualQuantity }) => {
    if (!completionOrder || !canUpdate) return;
    if (await handleComplete(completionOrder.id, actualQuantity)) setCompletionOrder(null);
  });

  const openFailure = (order: ProductionOrder) => {
    if (!canUpdate) return;
    failureForm.reset({ reason: "" });
    setFailingOrder(order);
  };
  const changeFailureOpen = (open: boolean) => {
    if (!open && !failureForm.formState.isSubmitting) setFailingOrder(null);
  };
  const submitFailure = failureForm.handleSubmit(async ({ reason }) => {
    if (!failingOrder || !canUpdate) return;
    const done = await run(failingOrder.id, () => failOrder(failingOrder.id, reason),
      (o) => ({ title: "Đã báo hỏng mẻ", description: `Lệnh ${o.order_code} đã chuyển sang hỏng mẻ` }),
      { title: "Lỗi báo hỏng mẻ", description: "Không thể báo hỏng mẻ" });
    if (done) setFailingOrder(null);
  });

  const primaryOrderId = orders.find((order) =>
    (order.status === "HANDED_OFF" && canUpdate) ||
    (order.status === "ACCEPTED" && canUpdate) ||
    (order.status === "ALLOCATED" && canUpdate) ||
    (order.status === "IN_PROGRESS" && canUpdate)
  )?.id;

  return { list, orders, listLoading, listError, reload, loadingId, canUpdate, primaryOrderId, completionOrder, completionForm, openCompletion, changeCompletionOpen, failingOrder, failureForm, openFailure, changeFailureOpen, submitFailure, submitCompletion, handleAccept, handleAllocate, handleStart, handleComplete };
}
