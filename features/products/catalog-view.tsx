"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import viMessages from "@/messages/vi.json";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import type { Product } from "@/lib/api/sales";
import { formatVND } from "@/lib/format";
import { useCatalog, useCatalogCart } from "./use-catalog";
import { applyCatalogFilters, CatalogFilters, type CatalogFilterValues } from "./catalog-filters";

interface CatalogViewProps {
  products: Product[];
  loading?: boolean;
  error?: string;
  nextCursor?: string;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  onRetry?: () => void;
}

export function CatalogLoader() {
  const state = useCatalog();
  return <NextIntlClientProvider locale="vi" messages={{ Catalog: viMessages.Catalog }} timeZone="Asia/Ho_Chi_Minh"><CatalogView {...state} onLoadMore={() => void state.loadMore()} onRetry={() => void state.reload()} /></NextIntlClientProvider>;
}

export function CatalogView({ products, loading, error, nextCursor, onLoadMore, loadingMore, onRetry }: CatalogViewProps) {
  const t = useTranslations("Catalog");
  const [filters, setFilters] = useState<CatalogFilterValues>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const visible = applyCatalogFilters(products, filters);
  return <PageShell>
    <PageHeading title={t("title")} description={t("loaded", { count: products.length })} />
    {loading ? <LoadingState title={t("loading")} /> : error ? <ErrorState title={t("loadError")} description={error} onRetry={onRetry} /> :
      <div className="mt-6 flex min-w-0 gap-6">
        <aside aria-label={t("filters")} className="hidden w-56 shrink-0 lg:block">
          <CatalogFilters value={filters} onChange={setFilters} />
        </aside>
        <section aria-label={t("list")} className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" className="lg:hidden" aria-haspopup="dialog" aria-expanded={filterOpen} onClick={() => setFilterOpen(true)}>{t("filters")}</Button>
            <label className="ml-auto flex min-w-0 flex-wrap items-center gap-2 text-sm">
              <span>{t("sort")}</span>
              <span className="w-48"><NativeSelect value={filters.sort ?? ""} onChange={e => {
                const sort = e.target.value;
                setFilters({ ...filters, sort: sort === "price-asc" || sort === "price-desc" ? sort : undefined });
              }}>
                <NativeSelectOption value="">{t("defaultSort")}</NativeSelectOption>
                <NativeSelectOption value="price-asc">{t("priceAsc")}</NativeSelectOption>
                <NativeSelectOption value="price-desc">{t("priceDesc")}</NativeSelectOption>
              </NativeSelect></span>
            </label>
          </div>
          {visible.length === 0 ? <EmptyState title={products.length ? t("noMatch") : t("empty")} description={products.length ? t("tryFilters") : t("emptyDescription")} /> :
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {visible.map(product => <CatalogProductCard key={product.id} product={product} />)}
            </div>}
          {nextCursor && <div className="text-center"><Button variant="outline" disabled={loadingMore} onClick={onLoadMore}>{loadingMore ? t("loading") : t("more")}</Button></div>}
        </section>
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetContent side="bottom" className="max-h-dvh overflow-y-auto">
            <SheetHeader><SheetTitle>{t("filters")}</SheetTitle></SheetHeader>
            <div className="px-4"><CatalogFilters value={filters} onChange={setFilters} /></div>
            <div className="p-4 pt-0"><Button className="w-full" onClick={() => setFilterOpen(false)}>{t("showResults")}</Button></div>
          </SheetContent>
        </Sheet>
      </div>}
  </PageShell>;
}

function CatalogProductCard({ product }: { product: Product }) {
  const t = useTranslations("Catalog");
  const { adding, add } = useCatalogCart(product);
  return <Card className="flex min-w-0 flex-col overflow-hidden p-0">
                <Link href={`/products/${product.id}` as Route} className="block aspect-[4/3] overflow-hidden bg-[var(--color-tint)]">
                  <img src={product.image_urls?.[0] || "/images/mon-mac-dinh.svg"} alt={product.name} className="size-full object-cover" />
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <Link href={`/products/${product.id}` as Route} className="break-words text-sm font-bold">{product.name}</Link>
                  {product.uom && <p className="text-xs text-[var(--color-muted)]">{product.uom}</p>}
                  <p className="mt-auto text-sm font-bold">{product.base_price_vnd === undefined ? t("noPrice") : formatVND(product.base_price_vnd)}</p>
                  {product.sku_ref && product.branch_ref && product.base_price_vnd !== undefined && <Button
                    className="w-full whitespace-normal text-xs"
                    disabled={adding || product.available_quantity === undefined || product.available_quantity <= 0}
                    onClick={() => void add()}
                  >{adding ? t("adding") : product.available_quantity === undefined ? t("unknownStock") : product.available_quantity <= 0 ? t("outOfStock") : t("add")}</Button>}
                </div>
              </Card>;
}
