"use client";

import { useEffect, useState } from "react";
import { getProducts, type DataSource, type Product } from "@/lib/api/sales";
import { getProductionContext } from "@/lib/api/production";
import { ProductsView } from "./products-view";
import { PageShell } from "@/components/ui/page";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/state";

export function ProductsLoader() {
  const [products, setProducts] = useState<Product[]>([]);
  const [source, setSource] = useState<DataSource>("unavailable");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canCreate, setCanCreate] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const context = await getProductionContext();
        if (!context.permissions?.includes("sales:product:read")) throw new Error("Không có quyền truy cập");
        if (!active) return;
        setCanCreate(context.permissions.includes("sales:product:create"));
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
  }, []);
  if (loading) return <PageShell><Skeleton title="Đang tải sản phẩm…" /></PageShell>;
  if (error) return <PageShell><ErrorState title="Không thể tải sản phẩm" description={error} /></PageShell>;
  return <><ProductsView initialProducts={products} dataSource={source} canCreate={canCreate} />
    {products.length === 0 && <EmptyState title="Chưa có sản phẩm" description="Sản phẩm nháp sẽ xuất hiện sau khi được tạo." />}</>;
}
