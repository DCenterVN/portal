"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/toast";
import { addToCart, getCatalog, getOrCreateCartId, recordCartResponse, type Product } from "@/lib/api/sales";

export function useCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [nextCursor, setNextCursor] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    const result = await getCatalog();
    setProducts(result.data); setNextCursor(result.next_cursor); setError(result.error ?? ""); setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const result = await getCatalog({ cursor: nextCursor });
    if (result.source === "api") {
      setProducts(previous => Array.from(new Map([...previous, ...result.data].map(item => [item.id, item])).values()));
      setNextCursor(result.next_cursor);
    }
    setError(result.error ?? ""); setLoadingMore(false);
  }, [nextCursor, loadingMore]);
  return { products, loading, error, nextCursor, loadingMore, loadMore, reload: load };
}

export function useCatalogCart(product: Product) {
  const t = useTranslations("Catalog");
  const [adding, setAdding] = useState(false);
  const add = useCallback(async () => {
    if (!product.sku_ref || !product.branch_ref || adding) return;
    setAdding(true);
    try {
      const result = await addToCart(getOrCreateCartId(), { sku_ref: product.sku_ref, branch_id: product.branch_ref, quantity: 1 });
      recordCartResponse(result, product); toast.success(t("added"), { description: product.name });
    } catch (cause) { toast.error(t("addError"), { description: cause instanceof Error ? cause.message : t("addError") }); }
    finally { setAdding(false); }
  }, [product, adding, t]);
  return { adding, add };
}
