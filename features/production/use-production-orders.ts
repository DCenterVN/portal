"use client";

import { useState } from "react";
import { useLoadedList } from "@/hooks/use-loaded-list";
import { useAccess } from "@/lib/access-boundary";
import { toast } from "@/components/ui/toast";
import { type ProductionOrder, getOrders, acceptOrder, allocateOrderLots, startOrder, completeOrder } from "@/lib/api/production";

type Outcome = { title: string; description: string };

export function useProductionOrders(initialOrders?: ProductionOrder[]) {
  const { items: orders, setItems: setOrders, loading: listLoading, error: listError, reload } = useLoadedList(initialOrders, getOrders);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { can, scope } = useAccess();
  const canUpdate = can("production:order:update");
  const startRole = scope?.roles.includes("VT-10") ? "VT-10" : "VT-11";

  const run = async (orderId: string, action: () => Promise<ProductionOrder>, success: (order: ProductionOrder) => Outcome, failure: Outcome) => {
    setLoadingId(orderId);
    try {
      const updated = await action();
      setOrders((current) => current.map((o) => (o.id === orderId ? updated : o)));
      const { title, description } = success(updated);
      toast.success(title, { description });
    } catch (err: unknown) {
      toast.error(failure.title, { description: err instanceof Error ? err.message : failure.description });
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
  const handleStart = (orderId: string) => run(orderId, () => startOrder(orderId, startRole),
    (o) => ({ title: "Bắt đầu sơ chế & chế biến (VT-10 / VT-11)", description: `Đã trừ tồn kho nguyên liệu, lệnh ${o.order_code} chuyển sang IN_PROGRESS` }),
    { title: "Lỗi bắt đầu chế biến", description: "Không thể bắt đầu chế biến" });
  const handleComplete = (orderId: string, plannedQty: number) => run(orderId, () => completeOrder(orderId, plannedQty, [], "VT-12"),
    () => ({ title: "Đóng gói & Cấp đông hoàn tất (VT-12)", description: "Đã tạo lô thành phẩm QUARANTINED, chuyển sang chờ QC (VT-13)" }),
    { title: "Lỗi hoàn tất lệnh", description: "Không thể hoàn tất lệnh" });

  // Visual emphasis only: retain every existing permission-gated row action.
  const primaryOrderId = orders.find((order) =>
    (order.status === "HANDED_OFF" && canUpdate) ||
    (order.status === "ACCEPTED" && canUpdate) ||
    (order.status === "ALLOCATED" && canUpdate) ||
    (order.status === "IN_PROGRESS" && canUpdate)
  )?.id;

  return { orders, listLoading, listError, reload, loadingId, canUpdate, primaryOrderId, handleAccept, handleAllocate, handleStart, handleComplete };
}
