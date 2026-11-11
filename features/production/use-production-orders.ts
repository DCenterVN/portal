"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLoadedList } from "@/hooks/use-loaded-list";
import { useAccess } from "@/lib/access-boundary";
import { toast } from "@/components/ui/toast";
import { type ProductionOrder, getOrders, acceptOrder, allocateOrderLots, startOrder, completeOrder } from "@/lib/api/production";

const completionSchema = z.object({
  actualQuantity: z.string().trim().min(1, "Nhập sản lượng thực tế.").pipe(
    z.coerce.number().int("Nhập số nguyên từ 1 trở lên.").min(1, "Nhập số nguyên từ 1 trở lên.")
  ),
});

type Outcome = { title: string; description: string };

export function useProductionOrders(initialOrders?: ProductionOrder[]) {
  const { items: orders, setItems: setOrders, loading: listLoading, error: listError, reload } = useLoadedList(initialOrders, getOrders);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [completionOrder, setCompletionOrder] = useState<ProductionOrder | null>(null);
  const completionForm = useForm<z.input<typeof completionSchema>, unknown, z.output<typeof completionSchema>>({
    resolver: zodResolver(completionSchema), defaultValues: { actualQuantity: "" },
  });
  const { can } = useAccess();
  const canUpdate = can("production:order:update");

  const run = async (orderId: string, action: () => Promise<ProductionOrder>, success: (order: ProductionOrder) => Outcome, failure: Outcome) => {
    setLoadingId(orderId);
    try {
      const updated = await action();
      setOrders((current) => current.map((o) => (o.id === orderId ? updated : o)));
      const { title, description } = success(updated);
      toast.success(title, { description });
      return true;
    } catch (err: unknown) {
      toast.error(failure.title, { description: err instanceof Error ? err.message : failure.description });
      return false;
    } finally {
      setLoadingId(null);
    }
  };

  const handleAccept = (orderId: string) => run(orderId, () => acceptOrder(orderId),
    (o) => ({ title: "Tổ trưởng sơ chế đã tiếp nhận (VT-09)", description: `Lệnh ${o.order_code} chuyển sang ACCEPTED` }),
    { title: "Lỗi tiếp nhận lệnh", description: "Không thể tiếp nhận lệnh" });
  const handleAllocate = (orderId: string) => run(orderId, () => allocateOrderLots(orderId),
    (o) => ({ title: "Đã phân bổ FEFO nguyên liệu kho", description: `Lệnh ${o.order_code} chuyển sang ALLOCATED` }),
    { title: "Lỗi phân bổ kho", description: "Không thể phân bổ kho" });
  const handleStart = (orderId: string) => run(orderId, () => startOrder(orderId, "cooking"),
    (o) => ({ title: "Đã bắt đầu nấu", description: `Đã trừ tồn kho nguyên liệu, lệnh ${o.order_code} chuyển sang IN_PROGRESS` }),
    { title: "Lỗi bắt đầu chế biến", description: "Không thể bắt đầu chế biến" });
  const handleComplete = (orderId: string, actualQuantity: number) => run(orderId, () => completeOrder(orderId, actualQuantity, [], "VT-12"),
    () => ({ title: "Đóng gói hoàn tất", description: "Đã tạo lô thành phẩm QUARANTINED, chuyển sang chờ QC (VT-13)" }),
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

  const primaryOrderId = orders.find((order) =>
    (order.status === "HANDED_OFF" && canUpdate) ||
    (order.status === "ACCEPTED" && canUpdate) ||
    (order.status === "ALLOCATED" && canUpdate) ||
    (order.status === "IN_PROGRESS" && canUpdate)
  )?.id;

  return { orders, listLoading, listError, reload, loadingId, canUpdate, primaryOrderId, completionOrder, completionForm, openCompletion, changeCompletionOpen, submitCompletion, handleAccept, handleAllocate, handleStart, handleComplete };
}
