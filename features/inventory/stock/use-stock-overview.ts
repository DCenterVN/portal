"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { useAccess } from "@/lib/access-boundary";
import { getCatalog } from "@/lib/api/sales";
import { getSkuMetadata, listBranchInventoryLots, listBranchStockLevels, type SkuMeta } from "@/lib/api/stock-overview";
import { productNames } from "../transfers/product-names";
import { buildStockRows, summarizeStockRows, type StockItemGroup, type StockIssueStatus, type StockRowModel } from "./stock-model";

export type StockGroupFilter = "ALL" | StockItemGroup;
export type StockHealthFilter = "ALL" | "ATTENTION" | StockIssueStatus;

async function fetchCatalogFallbackNames(branchId: string): Promise<Map<string, string>> {
  const products = [];
  let cursor: string | undefined;
  do {
    const page = await getCatalog({ branch_id: branchId, cursor });
    if (page.source === "unavailable") break;
    products.push(...page.data);
    cursor = page.next_cursor;
  } while (cursor);
  return productNames(products);
}

export function useStockOverview() {
  const { can, scope } = useAccess();
  const canReadStock = can("inventory:stock:read");
  const canReadLots = can("inventory:lot:read");
  const canUpdateLots = can("inventory:lot:update");
  const canReadSkus = can("sales:product:read");
  const canReadQc = can("inventory:qc:update");
  const branchId = scope?.branchId ?? "";

  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<StockGroupFilter>("ALL");
  const [healthFilter, setHealthFilter] = useState<StockHealthFilter>("ALL");
  const [selectedSkuRef, setSelectedSkuRef] = useState<string | null>(null);

  const stocksSwr = useSWR(
    canReadStock && branchId ? ["stock-overview-levels", branchId] : null,
    () => listBranchStockLevels(branchId),
    { revalidateOnFocus: false },
  );

  const lotsSwr = useSWR(
    canReadStock && canReadLots && branchId ? ["stock-overview-lots", branchId] : null,
    () => listBranchInventoryLots(branchId),
    { revalidateOnFocus: false },
  );

  const skuRefs = useMemo(() => {
    const ids = new Set<string>();
    for (const item of stocksSwr.data ?? []) ids.add(item.sku_ref);
    for (const lot of lotsSwr.data ?? []) ids.add(lot.sku_ref);
    return [...ids].sort();
  }, [stocksSwr.data, lotsSwr.data]);

  const skuKey = useMemo(() => skuRefs.join(","), [skuRefs]);

  const skuMetaSwr = useSWR(
    canReadStock && canReadSkus && skuKey ? ["stock-overview-skus", skuKey] : null,
    () => getSkuMetadata(skuRefs),
    { revalidateOnFocus: false },
  );

  const catalogSwr = useSWR(
    canReadStock && branchId && skuKey ? ["stock-overview-catalog", branchId] : null,
    () => fetchCatalogFallbackNames(branchId).catch(() => new Map<string, string>()),
    { revalidateOnFocus: false },
  );

  const allRows = useMemo<StockRowModel[]>(() => {
    if (!stocksSwr.data && !lotsSwr.data) return [];
    return buildStockRows({
      stocks: stocksSwr.data ?? [],
      lots: lotsSwr.data ?? [],
      skuMeta: skuMetaSwr.data ?? new Map<string, SkuMeta>(),
      fallbackNames: catalogSwr.data ?? new Map<string, string>(),
    });
  }, [stocksSwr.data, lotsSwr.data, skuMetaSwr.data, catalogSwr.data]);

  const summary = useMemo(() => summarizeStockRows(allRows), [allRows]);

  const filteredRows = useMemo(() => {
    const clean = query.trim().toLocaleLowerCase("vi");
    return allRows.filter(row => {
      if (healthFilter === "ALL" && !row.hasStock && !clean) return false;
      if (healthFilter === "ATTENTION" && row.unusable <= 0 && row.pendingQcQty <= 0) return false;
      if (healthFilter !== "ALL" && healthFilter !== "ATTENTION" && row.issueStatus !== healthFilter) return false;
      if (groupFilter !== "ALL" && row.group !== groupFilter) return false;
      if (!clean) return true;
      return (
        row.name.toLocaleLowerCase("vi").includes(clean) ||
        row.skuCode.toLocaleLowerCase("vi").includes(clean) ||
        row.lots.some(lot => lot.supplier_lot_code.toLocaleLowerCase("vi").includes(clean))
      );
    });
  }, [allRows, groupFilter, healthFilter, query]);

  const selectedRow = useMemo(
    () => (selectedSkuRef ? allRows.find(row => row.skuRef === selectedSkuRef) ?? null : null),
    [allRows, selectedSkuRef],
  );

  const reload = useCallback(() => {
    void stocksSwr.mutate();
    if (canReadLots) void lotsSwr.mutate();
    if (canReadSkus) void skuMetaSwr.mutate();
  }, [stocksSwr, lotsSwr, skuMetaSwr, canReadLots, canReadSkus]);

  return {
    canReadStock,
    canReadLots,
    canUpdateLots,
    canReadQc,
    branchId,
    loading: stocksSwr.isLoading || (canReadLots && lotsSwr.isLoading && !stocksSwr.data),
    refreshing: stocksSwr.isValidating || lotsSwr.isValidating,
    error: stocksSwr.error instanceof Error ? stocksSwr.error.message : "",
    lotsError: lotsSwr.error instanceof Error ? lotsSwr.error.message : "",
    rows: filteredRows,
    allRows,
    summary,
    query,
    setQuery,
    groupFilter,
    setGroupFilter,
    healthFilter,
    setHealthFilter,
    clearFilters: () => {
      setQuery("");
      setGroupFilter("ALL");
      setHealthFilter("ALL");
    },
    selectedRow,
    selectSku: setSelectedSkuRef,
    reload,
  };
}
