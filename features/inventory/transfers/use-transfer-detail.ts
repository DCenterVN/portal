"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { useAccess } from "@/lib/access-boundary";
import { cancelTransfer, getTransfer, transferEvidenceUrl } from "@/lib/api/stock-transfers";
import { transferError } from "@/lib/stock-transfer";

const refresh = () => mutate(key => Array.isArray(key) && ["stock-transfers", "stock-rows", "branch-lots"].includes(String(key[0])));

export function useTransferDetail(id: string) {
  const { scope, can } = useAccess();
  const swr = useSWR(["stock-transfers", "detail", id], () => getTransfer(id), { revalidateOnFocus: false });
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const transfer = swr.data;
  const branch = scope?.branchId ?? "";
  const open = transfer?.status === "IN_TRANSIT";
  async function cancel(): Promise<boolean> {
    setCancelling(true);
    setCancelError("");
    try {
      await cancelTransfer(id);
      await refresh();
      return true;
    } catch (failed) {
      setCancelError(transferError(failed));
      return false;
    } finally {
      setCancelling(false);
    }
  }
  return {
    transfer, error: swr.error, loading: !transfer && !swr.error, reload: () => void swr.mutate(),
    canCancel: Boolean(open && transfer?.from_branch_ref === branch && can("inventory:transfer:create")),
    canReceive: Boolean(open && transfer?.to_branch_ref === branch && can("inventory:transfer_receipt:create")),
    needsReceiverBranch: Boolean(open && transfer?.to_branch_ref !== branch && can("inventory:transfer_receipt:create")),
    cancel, cancelling, cancelError,
  };
}

export function useEvidenceUrl(transfer: string, media: string) {
  return useSWR(["stock-transfers", "evidence", transfer, media], () => transferEvidenceUrl(transfer, media), { revalidateOnFocus: false, dedupingInterval: 240_000 });
}
