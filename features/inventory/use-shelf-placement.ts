"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLoadedList } from "@/hooks/use-loaded-list";
import { useAccess } from "@/lib/access-boundary";
import { toast } from "@/components/ui/toast";
import { type ShelfPlacement, type ProductionOrder, getOrders, getShelfPlacements, placeOnShelf } from "@/lib/api/production";

export function useShelfPlacement(initialPlacements?: ShelfPlacement[]) {
  const { items: placements, setItems: setPlacements, loading: listLoading, error: listError, reload } = useLoadedList(initialPlacements, getShelfPlacements);
  const [showCreate, setShowCreate] = useState(false);
  const [shelfCode, setShelfCode] = useState("KE-MAT-01");
  const [finishedLotRef, setFinishedLotRef] = useState("");
  const { can, scope } = useAccess();
  const branchRef = scope?.branchId ?? "";
  const [placedQty, setPlacedQty] = useState(20);
  const [loading, setLoading] = useState(false);

  const [lots, setLots] = useState<ProductionOrder[]>([]);
  const [lotStatus, setLotStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    getOrders({ forPicker: true }).then((orders) => {
      if (!active) return;
      const eligible = orders.filter((order) => order.status === "QC_PASSED" && order.finished_lot_ref).slice(0, 100);
      setLots(eligible);
      if (eligible.length === 1) setFinishedLotRef(eligible[0].finished_lot_ref ?? "");
      setLotStatus("ready");
    }).catch(() => { if (active) setLotStatus("error"); });
    return () => { active = false; };
  }, []);

  const canPlace = can("inventory:shelf_placement:create");

  const handlePlace = async (e: FormEvent) => {
    e.preventDefault();
    if (!canPlace || !branchRef || lotStatus !== "ready" || !lots.some((lot) => lot.finished_lot_ref === finishedLotRef)) return;
    setLoading(true);
    try {
      const created = await placeOnShelf({
        finished_lot_ref: finishedLotRef.trim(),
        branch_ref: branchRef,
        shelf_code: shelfCode,
        placed_quantity: placedQty,
        uom: "EA",
      });
      setPlacements([created, ...placements]);
      setShowCreate(false);
      setFinishedLotRef("");
      toast.success("Đã đưa hàng lên kệ tại chi nhánh", { description: `Mã truy vết QR: ${created.trace_code}` });
    } catch (err: unknown) {
      toast.error("Lỗi đưa hàng lên kệ", { description: err instanceof Error ? err.message : "Không thể đưa hàng lên kệ" });
    } finally {
      setLoading(false);
    }
  };
  return { placements, listLoading, listError, reload, showCreate, setShowCreate, shelfCode, setShelfCode, finishedLotRef, setFinishedLotRef, branchRef, placedQty, setPlacedQty, loading, lots, lotStatus, canPlace, handlePlace };
}
