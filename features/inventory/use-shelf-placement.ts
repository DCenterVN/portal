"use client";

import { FormEvent, useState } from "react";
import { usePagedList } from "@/hooks/use-paged-list";
import { useAccess } from "@/lib/access-boundary";
import { toast } from "@/components/ui/toast";
import { type ShelfPlacement, getShelfPlacementsPage, placeOnShelf } from "@/lib/api/production";
import { getShelfPendingPage, type ShelfPendingLot } from "@/lib/api/shelf-pending";
import { inspectionBlock } from "./shelf-pending-rules";
import { placementError } from "./shelf-placement-error";
import { FetchError } from "@/lib/fetcher";
import { useMaterialNames } from "./transfers/use-transfer-lookups";

export function useShelfPlacement(initialPlacements?: ShelfPlacement[]) {
  const { can, scope } = useAccess();
  const branchRef = scope?.branchId ?? "";
  const placementsList = usePagedList(getShelfPlacementsPage, `shelves:${scope?.orgId}:${branchRef}`, initialPlacements);
  const pending = usePagedList((cursor) => getShelfPendingPage(branchRef, cursor), `shelf-pending:${scope?.orgId}:${branchRef}`);
  const productName = useMaterialNames([branchRef], pending.items.map(lot => lot.sku_ref), "Món chưa rõ tên");
  const [selected, setSelected] = useState<ShelfPendingLot | null>(null);
  const [shelfCode, setShelfCode] = useState("KE-MAT-01");
  const [placedQty, setPlacedQty] = useState(1);
  const [inspected, setInspected] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const canPlace = can("inventory:shelf_placement:create");

  const choose = (lot: ShelfPendingLot | null) => { setSelected(lot); setPlacedQty(lot?.pending_quantity ?? 1); setInspected(false); setError(""); };
  const inspectionNeeded = selected ? inspectionBlock(selected, inspected) : "";

  const handlePlace = async (e: FormEvent) => {
    e.preventDefault();
    if (!canPlace || !branchRef || !selected || placedQty < 1 || placedQty > selected.pending_quantity || inspectionNeeded) return;
    setLoading(true);
    setError("");
    try {
      const created = await placeOnShelf({ finished_lot_ref: selected.lot_id, branch_ref: branchRef, shelf_code: shelfCode.trim(), placed_quantity: placedQty, uom: selected.uom });
      setSelected(null);
      pending.reload();
      placementsList.reload();
      toast.success("Đã đưa hàng lên kệ tại chi nhánh", { description: `Mã truy vết QR: ${created.trace_code}` });
    } catch (err: unknown) {
      setError(placementError(err));
      if (err instanceof FetchError && err.status === 409) pending.reload();
    } finally {
      setLoading(false);
    }
  };
  return { placementsList, pending, productName, branchRef, selected, choose, shelfCode, setShelfCode, placedQty, setPlacedQty, error, loading, canPlace, handlePlace, inspected, setInspected, inspectionNeeded };
}
