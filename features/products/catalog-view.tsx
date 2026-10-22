"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import viMessages from "@/messages/vi.json";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageShell, PageHeader } from "@/components/ui/page";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/state";
import { useToast } from "@/components/ui/toast";
import { addToCart, formatVND, getCatalog, getOrCreateCartId, recordCartResponse, type Product } from "@/lib/api/sales";
import { applyCatalogFilters, CatalogFilters, type CatalogFilterValues } from "./catalog-filters";

interface CatalogViewProps {
  products: Product[];
  loading?: boolean;
  error?: string;
  nextCursor?: string;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

export function CatalogLoader() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void getCatalog().then(result => {
      if (!active) return;
      setProducts(result.data);
      setCursor(result.next_cursor);
      setError(result.error ?? "");
      setLoading(false);
    });
    return () => { active = false; };
  }, []);
  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    const result = await getCatalog({ cursor });
    if (result.source === "api") {
      setProducts(previous => Array.from(new Map([...previous, ...result.data].map(product => [product.id, product])).values()));
      setCursor(result.next_cursor);
    }
    setError(result.error ?? "");
    setLoadingMore(false);
  }
  return <NextIntlClientProvider locale="vi" messages={{ Catalog: viMessages.Catalog }} timeZone="Asia/Ho_Chi_Minh"><CatalogView products={products} loading={loading} error={error} nextCursor={cursor} loadingMore={loadingMore} onLoadMore={() => void loadMore()} /></NextIntlClientProvider>;
}

export function CatalogView({ products, loading, error, nextCursor, onLoadMore, loadingMore }: CatalogViewProps) {
  const t = useTranslations("Catalog");
  const { toast } = useToast();
  const [filters, setFilters] = useState<CatalogFilterValues>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const visible = applyCatalogFilters(products, filters);
  async function add(product: Product) {
    if (!product.sku_ref || !product.branch_ref || adding) return;
    setAdding(product.id);
    try {
      const result = await addToCart(getOrCreateCartId(), { sku_ref: product.sku_ref, branch_id: product.branch_ref, quantity: 1 });
      recordCartResponse(result, product);
      toast.success(t("added"), product.name);
    } catch (error) {
      toast.error(t("addError"), error instanceof Error ? error.message : t("addError"));
    } finally {
      setAdding(null);
    }
  }
  return <PageShell>
    <PageHeader title={t("title")} description={t("loaded", { count: products.length })} />
    {loading ? <Skeleton title={t("loading")} /> : error ? <ErrorState title={t("loadError")} description={error} /> :
      <div className="mt-6 flex min-w-0 gap-6">
        <aside aria-label={t("filters")} className="hidden w-56 shrink-0 lg:block">
          <CatalogFilters value={filters} onChange={setFilters} />
        </aside>
        <section aria-label={t("list")} className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" className="min-h-11 lg:hidden" aria-haspopup="dialog" aria-expanded={filterOpen} onClick={() => setFilterOpen(true)}>{t("filters")}</Button>
            <label className="ml-auto flex min-w-0 flex-wrap items-center gap-2 text-sm">
              <span>{t("sort")}</span>
              <select className="min-h-11 max-w-full rounded-md border border-line bg-l1 px-3 text-fg" value={filters.sort ?? ""} onChange={e => {
                const sort = e.target.value;
                setFilters({ ...filters, sort: sort === "price-asc" || sort === "price-desc" ? sort : undefined });
              }}>
                <option value="">{t("defaultSort")}</option>
                <option value="price-asc">{t("priceAsc")}</option>
                <option value="price-desc">{t("priceDesc")}</option>
              </select>
            </label>
          </div>
          {visible.length === 0 ? <EmptyState title={products.length ? t("noMatch") : t("empty")} description={products.length ? t("tryFilters") : t("emptyDescription")} /> :
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {visible.map(product => <Card key={product.id} className="flex min-w-0 flex-col overflow-hidden p-0">
                <Link href={`/products/${product.id}` as Route} className="block aspect-[4/3] overflow-hidden bg-[var(--color-tint)]">
                  {product.image_urls?.[0] ?
                    <img src={product.image_urls[0]} alt={product.name} className="size-full object-cover" /> :
                    <span className="flex size-full items-center justify-center p-3 text-center text-xs text-[var(--color-muted)]">{t("noImage")}</span>}
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <Link href={`/products/${product.id}` as Route} className="break-words text-sm font-bold">{product.name}</Link>
                  {product.uom && <p className="text-xs text-[var(--color-muted)]">{product.uom}</p>}
                  <p className="mt-auto text-sm font-bold">{product.base_price_vnd === undefined ? t("noPrice") : formatVND(product.base_price_vnd)}</p>
                  {product.sku_ref && product.branch_ref && product.base_price_vnd !== undefined && <Button
                    className="min-h-11 w-full whitespace-normal px-2 text-xs"
                    disabled={adding !== null || product.available_quantity === undefined || product.available_quantity <= 0}
                    onClick={() => void add(product)}
                  >{adding === product.id ? t("adding") : product.available_quantity === undefined ? t("unknownStock") : product.available_quantity <= 0 ? t("outOfStock") : t("add")}</Button>}
                </div>
              </Card>)}
            </div>}
          {nextCursor && <div className="text-center"><Button variant="outline" className="min-h-11" disabled={loadingMore} onClick={onLoadMore}>{loadingMore ? t("loading") : t("more")}</Button></div>}
        </section>
        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
          <DialogContent variant="sheet">
            <DialogTitle>{t("filters")}</DialogTitle>
            <div className="mt-5"><CatalogFilters value={filters} onChange={setFilters} /></div>
            <Button className="mt-5 min-h-11 w-full" onClick={() => setFilterOpen(false)}>{t("showResults")}</Button>
          </DialogContent>
        </Dialog>
      </div>}
  </PageShell>;
}
