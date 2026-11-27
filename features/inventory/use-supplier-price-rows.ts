"use client";

import { useMemo } from "react";
import { toISODate } from "@/lib/format-date";
import { panelState, priceRows } from "./supplier-price-rows";
import { useContractMaterials } from "./use-contract-materials";
import { useSupplierPriceLines } from "./use-supplier-price-lines";

export function useSupplierPriceRows(supplierId: string, read: boolean) {
  const lines = useSupplierPriceLines(supplierId, read);
  const { materials } = useContractMaterials(read);
  const { rows, drafts } = useMemo(() => priceRows(lines.data ?? [], materials ?? [], toISODate()), [lines.data, materials]);
  const state = materials === null && lines.data !== undefined ? "loading" as const : panelState(lines.data, lines.error);
  return { rows, drafts, state, reload: lines.reload };
}
