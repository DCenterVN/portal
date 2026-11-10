"use client";

import useSWR from "swr";
import { getCatalog } from "@/lib/api/sales";

export function useRelatedProducts(productId: string, branchId?: string) {
  const { data, error, isLoading, mutate } = useSWR(["related-products", branchId], () => getCatalog({ branch_id: branchId }));
  return { products: data?.data.filter(product => product.id !== productId).slice(0, 4) ?? [], loading: isLoading, error: error || data?.error, retry: () => void mutate() };
}
