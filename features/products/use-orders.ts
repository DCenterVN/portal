"use client";

import { getOrdersPage } from "@/lib/api/sales";
import { usePagedList } from "@/hooks/use-paged-list";

export function useOrders(branch: string) {
  const list = usePagedList(getOrdersPage, branch);
  return { list, orders: list.items, loading: list.loading, error: list.error, load: list.reload };
}
