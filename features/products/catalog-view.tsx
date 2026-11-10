"use client";

import { useState } from "react";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import viMessages from "@/messages/vi.json";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { PageShell } from "@/components/ui/page";
import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import type { Product } from "@/lib/api/sales";
import { useCatalog } from "./use-catalog";
import { applyCatalogFilters, CatalogFilters, CatalogQuickFilters, type CatalogFilterValues } from "./catalog-filters";

import { CatalogProductCard } from "./catalog-product-card";

interface CatalogViewProps {
  branchId?: string;
  filters?: CatalogFilterValues;
  onFiltersChange?: (filters: CatalogFilterValues) => void;
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

export function CatalogView({ products, loading, error, nextCursor, onLoadMore, loadingMore, onRetry, filters: externalFilters, onFiltersChange, branchId }: CatalogViewProps) {
  const t = useTranslations("Catalog");
  const [localFilters, setLocalFilters] = useState<CatalogFilterValues>({});
  const filters = externalFilters ?? localFilters;
  const setFilters = onFiltersChange ?? setLocalFilters;
  const [filterOpen, setFilterOpen] = useState(false);
  const visible = applyCatalogFilters(products, filters);
  const hasFilters = !!filters.query || filters.minPrice !== undefined || filters.maxPrice !== undefined || filters.kcal_max !== undefined || filters.protein_min !== undefined || !!filters.label?.length;
  return <PageShell className="catalog">
    <header className="catalog-banner rounded-lg px-6 py-8 sm:px-8 sm:py-10">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Món ngon, vừa ý bạn</h1>
      <p className="mt-3 text-base text-muted-foreground">Món dân dã, sạch, hợp túi tiền.</p>
    </header>
    {loading ? <LoadingState title={t("loading")} /> : error ? <ErrorState title={t("loadError")} description={error} onRetry={onRetry} /> :
      <div className="mt-8 min-w-0">
        <section aria-label={t("list")} className="min-w-0 flex-1 space-y-6">
          <div className="flex items-start gap-3">
            <CatalogQuickFilters value={filters} onChange={setFilters} />
            <Button variant="outline" size="md" className="shrink-0" aria-haspopup="dialog" aria-expanded={filterOpen} onClick={() => setFilterOpen(true)}><SlidersHorizontal className="size-4 text-muted-foreground" />{t("filters")}</Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{t("loaded", { count: visible.length })}</p>
            <label className="ml-auto flex min-w-0 flex-wrap items-center gap-3 text-sm">
              <span className="text-muted-foreground">{t("sort")}</span>
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
          {visible.length === 0 ? <EmptyState title={hasFilters ? t("noMatch") : t("empty")} description={hasFilters ? t("tryFilters") : t("emptyDescription")} action={<Button variant="outline" size="md" onClick={() => setFilters({})}>Xoá lọc</Button>} /> :
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {visible.map(product => <CatalogProductCard key={product.id} product={product} branchId={branchId} />)}
            </div>}
          {nextCursor && <div className="text-center"><Button variant="outline" size="md" disabled={loadingMore} onClick={onLoadMore}>{loadingMore ? t("loading") : t("more")}</Button></div>}
        </section>
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetContent side="right" className="catalog w-full overflow-y-auto sm:max-w-sm">
            <SheetHeader><SheetTitle>{t("filters")}</SheetTitle><SheetDescription>Chọn món theo nhu cầu và ngân sách của bạn.</SheetDescription></SheetHeader>
            <div className="px-4"><CatalogFilters value={filters} onChange={setFilters} /></div>
            <div className="p-4 pt-0"><Button size="md" className="w-full" onClick={() => setFilterOpen(false)}>{t("showResults")}</Button></div>
          </SheetContent>
        </Sheet>
      </div>}
  </PageShell>;
}
