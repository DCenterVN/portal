"use client";

import { useEffect, useState } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { getProducts, type DataSource, type Product } from "@/lib/api/sales";
import { ProductsView } from "./products-view";
import { PageShell } from "@/components/ui/page";

export function ProductsLoader() {
  const [products, setProducts] = useState<Product[]>([]);
  const [source, setSource] = useState<DataSource>("unavailable");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { void getProducts().then((result) => { setProducts(result.data); setSource(result.source); setError(result.error || ""); }).finally(() => setLoading(false)); }, []);
  if (loading) return <PageShell><div className="flex min-h-64 items-center justify-center gap-2"><LoaderCircle className="size-5 animate-spin" /> Đang tải sản phẩm…</div></PageShell>;
  if (error && products.length === 0) return <PageShell><div role="alert" className="mt-12 border border-rose-500/40 bg-rose-500/10 p-5"><AlertCircle className="mb-2 size-5" /><strong>Không thể tải danh mục</strong><p className="mt-1 text-sm">{error}</p></div></PageShell>;
  return <ProductsView initialProducts={products} dataSource={source} />;
}
