"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Route } from "next";
import useSWR from "swr";
import { cursorPagesStart, currentCursor, goNext, goPrevious, hasPrevious, pageNumber } from "@/lib/cursor-pages";
import { buildCatalogQuery, readNutritionFilters } from "@/lib/api/catalog-query";
import type { CatalogFilterValues } from "./catalog-filters";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/toast";
import { addToCart, getCatalog, getOrCreateCartId, recordCartResponse, type Product } from "@/lib/api/sales";

export function useCatalog() {
  const search = useSearchParams();
  const router = useRouter();
  const filters: CatalogFilterValues = {
    ...readNutritionFilters(new URLSearchParams(search.toString())),
    query: search.get("q") ?? undefined,
    minPrice: search.has("minPrice") ? Number(search.get("minPrice")) : undefined,
    maxPrice: search.has("maxPrice") ? Number(search.get("maxPrice")) : undefined,
    sort: search.get("sort") === "price-asc" ? "price-asc" : search.get("sort") === "price-desc" ? "price-desc" : undefined,
  };
  const branchId = search.get("branch_id") ?? undefined;
  const requestedQuery = buildCatalogQuery({ ...filters, branch_id: branchId }).toString();
  const [query, setQuery] = useState(requestedQuery);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(requestedQuery), 250);
    return () => clearTimeout(timer);
  }, [requestedQuery]);
  const [paging, setPaging] = useState({ query, pages: cursorPagesStart });
  const pages = paging.query === query ? paging.pages : cursorPagesStart;
  const cursor = currentCursor(pages) || undefined;
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    [query, cursor],
    ([requestQuery, requestCursor]: [string, string | undefined]) => getCatalog({ ...readNutritionFilters(new URLSearchParams(requestQuery)), branch_id: new URLSearchParams(requestQuery).get("branch_id") ?? undefined, cursor: requestCursor }),
    { keepPreviousData: true },
  );
  const nextCursor = data?.next_cursor;
  const onFiltersChange = (value: CatalogFilterValues) => {
    const next = new URLSearchParams(search.toString());
    for (const key of ["kcal_max", "protein_min", "label", "q", "minPrice", "maxPrice", "sort", "cursor"]) next.delete(key);
    const nutrition = buildCatalogQuery(value); nutrition.delete("page_size");
    nutrition.forEach((value, key) => next.append(key, value));
    for (const key of ["query", "minPrice", "maxPrice", "sort"] as const) {
      if (value[key] !== undefined && value[key] !== "") next.set(key === "query" ? "q" : key, String(value[key]));
    }
    router.replace(`/products${next.size ? `?${next}` : ""}` as Route, { scroll: false });
  };
  return {
    products: data?.data ?? [], loading: isLoading && !data,
    error: error instanceof Error ? error.message : data?.error,
    nextCursor, loadingMore: isValidating, page: pageNumber(pages), hasPrevious: hasPrevious(pages),
    loadMore: () => setPaging({ query, pages: goNext(pages, nextCursor ?? "") }), loadPrevious: () => setPaging({ query, pages: goPrevious(pages) }), reload: () => mutate(), filters, onFiltersChange, branchId,
  };
}

export function useCatalogCart(product: Product, branchId?: string) {
  const t = useTranslations("Catalog");
  const [adding, setAdding] = useState(false);
  const add = useCallback(async () => {
    if (!product.sku_ref || !product.branch_ref || adding) return;
    setAdding(true);
    try {
      const result = await addToCart(getOrCreateCartId(), { sku_ref: product.sku_ref, branch_id: branchId ?? product.branch_ref, quantity: 1 });
      recordCartResponse(result, product); toast.success(t("added"), { description: product.name });
    } catch (cause) { toast.error(t("addError"), { description: cause instanceof Error ? cause.message : t("addError") }); }
    finally { setAdding(false); }
  }, [product, branchId, adding, t]);
  return { adding, add };
}
