"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { useAccess } from "@/lib/access-boundary";
import { getContractMaterials } from "@/lib/api/supplier-agreements";
import { getBranchLots, getStockRows, type LotRow } from "@/lib/api/stock-transfers";
import { transferEnds } from "@/lib/stock-transfer";
import { useBranches } from "@/features/branches/use-branches";

export function useBranchLabels() {
  const { can, scope } = useAccess();
  const allowed = can("org:branch:read");
  const branches = useBranches(allowed);
  const list = useMemo(() => branches.data ?? [], [branches.data]);
  const targets = list.filter(branch => branch.status === "ACTIVE" && branch.id !== scope?.branchId);
  const status = !allowed || branches.error ? "error" as const : branches.data ? "ready" as const : "loading" as const;
  return { ends: transferEnds, targets, status, retry: () => void branches.mutate() };
}

export function useMaterialNames() {
  const { data } = useSWR("raw-materials", getContractMaterials, { revalidateOnFocus: false });
  const names = useMemo(() => new Map((data ?? []).map(item => [item.id, item.name])), [data]);
  return (sku: string, position?: number) => names.get(sku) ?? (position ? `Nguyên liệu dòng ${position}` : "Nguyên liệu chưa rõ tên");
}

export function useStockRows(branch: string) {
  return useSWR(branch ? ["stock-rows", branch] : null, () => getStockRows(branch), { revalidateOnFocus: false });
}

export function useBranchLots(branch: string) {
  const { data, error } = useSWR(branch ? ["branch-lots", branch] : null, () => getBranchLots(branch), { revalidateOnFocus: false });
  const byId = useMemo(() => new Map((data ?? []).map(lot => [lot.id, lot])), [data]);
  return { lots: data ?? [], lot: (id?: string | null): LotRow | undefined => (id ? byId.get(id) : undefined), failed: Boolean(error) };
}
