"use client";

import { useState } from "react";
import { usePagedList } from "@/hooks/use-paged-list";
import { useAccess } from "@/lib/access-boundary";
import { toast } from "@/components/ui/toast";
import { type ProductionOrder, decideQC, getOrdersPage } from "@/lib/api/production";

export const qcStatuses = ["COMPLETED", "QC_PASSED", "QC_FAILED"];

export function useQcDecision(completedOrders?: ProductionOrder[]) {
  const { scope } = useAccess();
  const list = usePagedList((cursor, status) => getOrdersPage({ cursor, status }), `${scope?.orgId}:${scope?.branchId}`, completedOrders, qcStatuses[0]);
  const { filter: status, setFilter: setStatus, items: orders, setItems: setOrders, loading: listLoading, error: listError, reload } = list;
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [temperature, setTemperature] = useState(-18.5);
  const [packagePassed, setPackagePassed] = useState(true);
  const [sensoryNotes, setSensoryNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDecision = async (decision: "PASS" | "FAIL") => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      const res = await decideQC(selectedOrder.id, {
        decision,
        core_temperature_celsius: temperature,
        package_check_passed: packagePassed,
        sensory_result: { notes: sensoryNotes.trim() },
        failure_reason: decision === "FAIL" ? "Không đạt nhiệt độ tâm hoặc bao bì lỗi" : undefined,
      });
      setOrders((current) => current.map((o) => (o.id === selectedOrder.id ? res.production_order : o)));
      setSelectedOrder(null);
      toast.success(decision === "PASS" ? "Nghiệm thu QC ĐẠT (PASS)" : "Nghiệm thu QC KHÔNG ĐẠT (FAIL)", { description: `Lệnh ${res.production_order.order_code} đã hoàn tất kiểm định chất lượng (SoD Verified)` });
    } catch (err: unknown) {
      toast.error("Lỗi kiểm định QC", { description: err instanceof Error ? err.message : "Lỗi không xác định" });
    } finally {
      setLoading(false);
    }
  };
  return { list, status, setStatus, orders, listLoading, listError, reload, selectedOrder, setSelectedOrder, temperature, setTemperature, packagePassed, setPackagePassed, sensoryNotes, setSensoryNotes, loading, handleDecision };
}
