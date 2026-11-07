"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { useAccess } from "@/lib/access-boundary";
import { getTransfers } from "@/lib/api/stock-transfers";
import { TRANSFER_STATUS_LABEL, type TransferStatus } from "@/lib/stock-transfer";

export type TransferTab = "arrive" | "sent";
const isStatus = (value: string | null): value is TransferStatus => value !== null && value in TRANSFER_STATUS_LABEL;

export function useTransferList() {
  const { scope } = useAccess();
  const params = useSearchParams();
  const tab: TransferTab = params.get("tab") === "sent" ? "sent" : "arrive";
  const status = isStatus(params.get("status")) ? params.get("status") as TransferStatus : "";
  const branch = scope?.branchId ?? "";
  const swr = useSWR(branch ? ["stock-transfers", branch, status] : null, () => getTransfers(status), { revalidateOnFocus: false });
  const rows = useMemo(() => (swr.data ?? []).filter(item => (tab === "arrive" ? item.to_branch_ref : item.from_branch_ref) === branch), [swr.data, tab, branch]);
  const counts = useMemo(() => ({
    arrive: (swr.data ?? []).filter(item => item.to_branch_ref === branch).length,
    sent: (swr.data ?? []).filter(item => item.from_branch_ref === branch).length,
  }), [swr.data, branch]);
  const update = useCallback((changes: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    window.history.replaceState(null, "", next.size ? `?${next}` : window.location.pathname);
  }, [params]);
  return {
    tab, status, rows, counts, loading: !swr.data && !swr.error, error: Boolean(swr.error), retry: () => void swr.mutate(),
    setTab: (value: TransferTab) => update({ tab: value === "sent" ? "sent" : "" }),
    setStatus: (value: string) => update({ status: value }),
  };
}
