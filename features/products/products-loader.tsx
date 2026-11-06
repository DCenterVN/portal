"use client";

import { useEffect, useState } from "react";
import { getProducts, type DataSource, type Product } from "@/lib/api/sales";
import { useAccess } from "@/lib/access-boundary";
import { ProductsView } from "./products-view";
import { PageShell } from "@/components/ui/page";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";

export function ProductsLoader() {
  const [products, setProducts] = useState<Product[]>([]);
  const [source, setSource] = useState<DataSource>("unavailable");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { can } = useAccess();
  const canRead = can("sales:product:read");
  const canCreate = can("sales:product:create");
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (!canRead) throw new Error("Không có quyền truy cập");
        const result = await getProducts();
        if (!active) return;
        setProducts(result.data);
        setSource(result.source);
        setError(result.error ?? "");
      } catch (error) {
        if (active) setError(error instanceof Error ? error.message : "Không tải được sản phẩm");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [canRead]);
  if (loading) return <PageShell><LoadingState title="Đang tải sản phẩm…" /></PageShell>;
  if (error) return <PageShell><ErrorState title="Không thể tải sản phẩm" description={error} /></PageShell>;
  return <><ProductsView initialProducts={products} dataSource={source} canCreate={canCreate} />
    {products.length === 0 && <EmptyState title="Chưa có sản phẩm" description="Sản phẩm nháp sẽ xuất hiện sau khi được tạo." />}</>;
}
