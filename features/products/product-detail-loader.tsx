"use client";

import { useEffect, useState } from "react";
import { getCatalogProduct, type Product } from "@/lib/api/sales";
import { ProductDetailView } from "./product-detail-view";
import { PageShell } from "@/components/ui/page";
import { EmptyState, LoadingState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";

export function ProductDetailLoader({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { void getCatalogProduct(id).then((result) => { setProduct(result.data); setError(result.error || ""); }).finally(() => setLoading(false)); }, [id]);
  if (loading) return <PageShell><LoadingState title="Đang tải sản phẩm…" className="min-h-64 border-0" /></PageShell>;
  if (error) return <PageShell><InlineAlert>{error}</InlineAlert></PageShell>;
  if (!product) return <PageShell><EmptyState title="Không tìm thấy sản phẩm" /></PageShell>;
  return <ProductDetailView initialProduct={product} />;
}
