import { Suspense } from "react";
import { SuppliersContainer } from "@/features/inventory/suppliers-container";
import { supplierListKey, supplierListQuery, supplierTableState } from "@/features/inventory/suppliers-table";
import { inventoryServerGet } from "@/lib/api/inventory-server";
import { supplierListParams, supplierPageSchema } from "@/lib/api/suppliers";
import { treeSchema } from "@/lib/api/material-categories";

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) for (const item of [value ?? []].flat()) params.append(key, item);
  const state = supplierTableState(params);
  const [page, tree] = await Promise.all([
    inventoryServerGet(`/inventory/suppliers?${supplierListParams(supplierListQuery(state))}`, supplierPageSchema),
    inventoryServerGet("/inventory/material-categories", treeSchema),
  ]);
  const initial = page ? { page, key: supplierListKey(state), categories: tree?.items ?? [] } : undefined;
  return <Suspense><SuppliersContainer initial={initial} /></Suspense>;
}
