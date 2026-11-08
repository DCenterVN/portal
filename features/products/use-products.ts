"use client";

import useSWR from "swr";
import { getProducts, type Product } from "@/lib/api/sales";
import { useAccess } from "@/lib/access-boundary";

export function useProducts() {
  const { can, scope } = useAccess();
  const canRead = can("sales:product:read");
  const { data, error, isLoading, mutate } = useSWR(
    canRead ? ["/api/sales/products", scope?.userId, scope?.orgId, scope?.branchId] : null,
    async () => {
      const result = await getProducts();
      if (result.source === "unavailable") throw new Error("Không tải được sản phẩm. Vui lòng tải lại.");
      return result;
    },
  );
  const reload = async () => { await mutate(); };
  const created = async (product: Product) => {
    await mutate(current => ({ data: [product, ...(current?.data ?? [])], source: "api" }), { revalidate: false });
    await reload();
  };
  return {
    products: data?.data ?? [], dataSource: data?.source, loading: isLoading,
    error: !canRead ? "Không có quyền truy cập" : error ? "Không tải được sản phẩm. Vui lòng tải lại." : "",
    canCreate: can("sales:product:create"), canActivate: can("sales:product:lifecycle") && can("sales:product:activate") && can("sales:variant:lifecycle"),
    reload, created,
  };
}
