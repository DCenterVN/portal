"use client";

import { NextIntlClientProvider } from "next-intl";
import viMessages from "@/messages/vi.json";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogProductCard } from "./catalog-product-card";
import { useRelatedProducts } from "./use-related-products";

export function RelatedProducts({ productId, branchId }: { productId: string; branchId?: string }) {
  const { products, loading, error, retry } = useRelatedProducts(productId, branchId);
  return <section aria-labelledby="related-meals" className="mt-12 space-y-5">
    <h2 id="related-meals" className="text-2xl font-semibold tracking-tight">Có thể bạn cũng thích</h2>
    {loading ? <div aria-busy="true" aria-label="Đang tải món liên quan" className="grid grid-cols-2 gap-6 lg:grid-cols-4">{[0, 1, 2, 3].map(key => <Skeleton key={key} className="aspect-[3/4] rounded-lg" />)}</div> : error ? <div role="alert" className="text-sm text-muted-foreground">Chưa tải được món liên quan. <Button variant="ghost" onClick={retry}>Thử lại</Button></div> : products.length ? <NextIntlClientProvider locale="vi" timeZone="Asia/Ho_Chi_Minh" messages={{ Catalog: viMessages.Catalog }}><div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">{products.map(product => <CatalogProductCard key={product.id} product={product} branchId={branchId} />)}</div></NextIntlClientProvider> : <p className="text-sm text-muted-foreground">Chưa có món liên quan tại cửa hàng này.</p>}
  </section>;
}
