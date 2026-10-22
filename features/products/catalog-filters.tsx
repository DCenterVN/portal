"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface CatalogFilterValues {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price-asc" | "price-desc";
}

export function applyCatalogFilters<T extends { name: string; base_price_vnd?: number }>(products: T[], filters: CatalogFilterValues): T[] {
  const query = filters.query?.trim().toLocaleLowerCase() ?? "";
  const filtered = products.filter(product =>
    product.name.toLocaleLowerCase().includes(query) &&
    (filters.minPrice === undefined || (product.base_price_vnd !== undefined && product.base_price_vnd >= filters.minPrice)) &&
    (filters.maxPrice === undefined || (product.base_price_vnd !== undefined && product.base_price_vnd <= filters.maxPrice)),
  );
  if (filters.sort) filtered.sort((a, b) => {
    if (a.base_price_vnd === undefined) return b.base_price_vnd === undefined ? 0 : 1;
    if (b.base_price_vnd === undefined) return -1;
    return filters.sort === "price-asc" ? a.base_price_vnd - b.base_price_vnd : b.base_price_vnd - a.base_price_vnd;
  });
  return filtered;
}

export function CatalogFilters({ value, onChange }: { value: CatalogFilterValues; onChange: (value: CatalogFilterValues) => void }) {
  const t = useTranslations("Catalog");
  const id = useId();
  return <div className="space-y-5">
    <label htmlFor={id} className="block space-y-2 text-sm font-semibold">
      <span>{t("search")}</span>
      <Input id={id} type="text" value={value.query ?? ""} onChange={e => onChange({ ...value, query: e.target.value })} placeholder={t("searchPlaceholder")} />
    </label>
    <fieldset className="min-w-0 space-y-2">
      <legend className="text-sm font-semibold">{t("price")}</legend>
      <div className="flex gap-2">
        {(["minPrice", "maxPrice"] as const).map((key, index) => <label key={key} className="min-w-0 flex-1 space-y-1 text-xs">
          <span>{t(index === 0 ? "from" : "to")}</span>
          <Input type="number" min="0" inputMode="numeric" value={value[key] ?? ""} onChange={e => onChange({ ...value, [key]: e.target.value === "" ? undefined : Number(e.target.value) })} />
        </label>)}
      </div>
    </fieldset>
    <Button variant="outline" className="min-h-11 w-full" onClick={() => onChange({})}>{t("clear")}</Button>
  </div>;
}
