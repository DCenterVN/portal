"use client";

import { useEffect, useState } from "react";
import { getCatalogProduct, type Product } from "@/lib/api/sales";
import { ProductDetailView } from "./product-detail-view";
import { PageShell } from "@/components/ui/page";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";

export function ProductDetailLoader({ id, branchId }: { id: string; branchId?: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { void getCatalogProduct(id, branchId).then((result) => { setProduct(result.data); setError(result.error || ""); }).finally(() => setLoading(false)); }, [id, branchId]);
  if (loading) return <PageShell><LoadingState title="Đang tải sản phẩm…" className="min-h-64 border-0" /></PageShell>;
  if (error) return <PageShell><ErrorState title="Không thể tải sản phẩm" description={error} onRetry={() => { setLoading(true); void getCatalogProduct(id, branchId).then(result => { setProduct(result.data); setError(result.error || ""); }).finally(() => setLoading(false)); }} /></PageShell>;
  if (!product) return <PageShell><EmptyState title="Không tìm thấy sản phẩm" /></PageShell>;
  return <ProductDetailView initialProduct={product} branchId={branchId} />;
}
