"use client";

import { getCartBranch, getOrdersPage } from "@/lib/api/sales";
import { usePagedList } from "@/hooks/use-paged-list";

export function useOrders() {
  const list = usePagedList(getOrdersPage, getCartBranch());
  return { list, orders: list.items, loading: list.loading, error: list.error, load: list.reload };
}
