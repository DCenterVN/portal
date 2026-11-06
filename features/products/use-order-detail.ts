"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/ui/toast";
import { cancelOrder, getOrderDisplay } from "@/lib/api/sales";

export function useOrderDetail(id: string) {
  const [order, setOrder] = useState<Awaited<ReturnType<typeof getOrderDisplay>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setOrder(await getOrderDisplay(id)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tải đơn hàng"); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);
  async function handleCancel() {
    if (!reason.trim()) { toast.error("Thiếu lý do", { description: "Nhập lý do trước khi huỷ đơn." }); return; }
    setCancelling(true);
    try { await cancelOrder(id, reason.trim()); await load(); setReason(""); toast.success("Đã huỷ đơn", { description: "Đơn hàng đã được hủy." }); }
    catch (cause) { toast.error("Không thể huỷ đơn", { description: cause instanceof Error ? cause.message : String(cause) }); }
    finally { setCancelling(false); }
  }
  return { order, loading, cancelling, reason, setReason, error, load, handleCancel };
}
