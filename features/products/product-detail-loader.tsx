"use client";

import { useEffect, useState } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { getCatalogProduct, type Product } from "@/lib/api/sales";
import { ProductDetailView } from "./product-detail-view";
import { PageShell } from "@/components/ui/page";

export function ProductDetailLoader({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { void getCatalogProduct(id).then((result) => { setProduct(result.data); setError(result.error || (result.data ? "" : "Không tìm thấy sản phẩm")); }).finally(() => setLoading(false)); }, [id]);
  if (loading) return <PageShell><div className="flex min-h-64 items-center justify-center gap-2"><LoaderCircle className="size-5 animate-spin" /> Đang tải sản phẩm…</div></PageShell>;
  if (error || !product) return <PageShell><div role="alert" className="mt-12 border border-rose-500/40 bg-rose-500/10 p-5"><AlertCircle className="mb-2 size-5" />{error || "Không tìm thấy sản phẩm"}</div></PageShell>;
  return <ProductDetailView initialProduct={product} />;
}
