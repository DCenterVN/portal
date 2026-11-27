"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { useAccess } from "@/lib/access-boundary";
import { getMaterialNames } from "@/lib/api/material-names";
import { getCatalog } from "@/lib/api/sales";
import { productNames } from "./product-names";
import { resolveName } from "./name-lookup";
import { getBranchLots, getStockRows, type LotRow } from "@/lib/api/stock-transfers";
import { transferEnds } from "@/lib/stock-transfer";
import { useStoreBranches } from "@/features/products/store-branch-picker";
import { transferTargets } from "./transfer-targets";

export const useBranchLabels = () => ({ ends: transferEnds });

export function useTransferTargets() {
  const { scope } = useAccess();
  const branches = useStoreBranches();
  const status = branches.error ? "error" as const : branches.data ? "ready" as const : "loading" as const;
  return { targets: transferTargets(branches.data, scope?.branchId ?? ""), status, retry: () => void branches.mutate() };
}

async function catalogNames(branch: string) {
  const products = [];
  let cursor: string | undefined;
  do {
    const page = await getCatalog({ branch_id: branch, cursor });
    if (page.source === "unavailable") break;
    products.push(...page.data);
    cursor = page.next_cursor;
  } while (cursor);
  return productNames(products);
}

export function useMaterialNames(branches: string[] = [], refs: string[] = [], unknown = "Nguyên liệu chưa rõ tên") {
  const refKey = [...new Set(refs.filter(Boolean))].sort().join(",");
  const { data, error, mutate } = useSWR(refKey ? ["material-names", refKey] : null, () => getMaterialNames(refKey.split(",")), { revalidateOnFocus: false });
  const key = branches.filter(Boolean).sort().join(",");
  const sold = useSWR(key ? ["product-names", key] : null, async () => {
    const maps = await Promise.all(key.split(",").map(branch => catalogNames(branch).catch(() => new Map<string, string>())));
    return new Map(maps.flatMap(map => [...map]));
  }, { revalidateOnFocus: false });
  const names = useMemo(() => new Map([...(sold.data ?? []), ...[...(data ?? [])].map(([id, item]) => [id, item.name] as const)]), [data, sold.data]);
  const failed = Boolean(error) && !data;
  return Object.assign((sku: string, position?: number) => resolveName(names, failed, sku, position, unknown), { failed, retry: () => void mutate(), status: (sku: string) => data?.get(sku)?.status });
}

export function useStockRows(branch: string) {
  return useSWR(branch ? ["stock-rows", branch] : null, () => getStockRows(branch), { revalidateOnFocus: false });
}

export function useBranchLots(branch: string) {
  const { data, error, mutate } = useSWR(branch ? ["branch-lots", branch] : null, () => getBranchLots(branch), { revalidateOnFocus: false });
  const byId = useMemo(() => new Map((data ?? []).map(lot => [lot.id, lot])), [data]);
  return { lots: data ?? [], lot: (id?: string | null): LotRow | undefined => (id ? byId.get(id) : undefined), failed: Boolean(error), reload: () => mutate() };
}
