"use client";

import { ProductsView } from "./products-view";
import { useProducts } from "./use-products";
import { PageShell } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/patterns/empty-state";

export function ProductsLoader() {
  const state = useProducts();
  if (state.loading) return <PageShell><LoadingState title="Đang tải sản phẩm…" /></PageShell>;
  if (state.error) return <PageShell>
    <ErrorState title="Không thể tải sản phẩm" description={state.error} />
    <Button variant="outline" onClick={() => { void state.reload(); }}>Tải lại</Button>
  </PageShell>;
  return <ProductsView initialProducts={state.products} dataSource={state.dataSource}
    canCreate={state.canCreate} canActivate={state.canActivate}
    onActivated={state.reload} onProductCreated={state.created} />;
}
