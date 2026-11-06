"use client";

import { useState } from "react";
import { useLoadedList } from "@/hooks/use-loaded-list";
import { toast } from "@/components/ui/toast";
import { type ProductionOrder, decideQC, getOrders } from "@/lib/api/production";

const loadQcOrders = () => getOrders().then((all) => all.filter((o) => o.status === "COMPLETED" || o.status === "QC_PASSED" || o.status === "QC_FAILED"));

export function useQcDecision(completedOrders?: ProductionOrder[]) {
  const { items: orders, setItems: setOrders, loading: listLoading, error: listError } = useLoadedList(completedOrders, loadQcOrders);
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
  return { orders, listLoading, listError, selectedOrder, setSelectedOrder, temperature, setTemperature, packagePassed, setPackagePassed, sensoryNotes, setSensoryNotes, loading, handleDecision };
}
