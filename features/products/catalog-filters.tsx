"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { nutritionLabels } from "@/lib/nutrition";
import type { NutritionFilters } from "@/lib/api/catalog-query";

export interface CatalogFilterValues extends NutritionFilters {
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
  return <div className="space-y-6">
    <label htmlFor={id} className="block space-y-2 text-xs font-medium">
      <span>{t("search")}</span>
      <Input id={id} type="text" value={value.query ?? ""} onChange={e => onChange({ ...value, query: e.target.value })} placeholder={t("searchPlaceholder")} />
    </label>
    <fieldset className="min-w-0 space-y-2">
      <legend className="text-xs font-medium">{t("price")}</legend>
      <div className="flex gap-2">
        {(["minPrice", "maxPrice"] as const).map((key, index) => <label key={key} className="min-w-0 flex-1 space-y-2 text-xs text-muted-foreground">
          <span>{t(index === 0 ? "from" : "to")}</span>
          <Input type="number" min="0" inputMode="numeric" value={value[key] ?? ""} onChange={e => onChange({ ...value, [key]: e.target.value === "" ? undefined : Number(e.target.value) })} />
        </label>)}
      </div>
    </fieldset>
    {(["kcal_max", "protein_min"] as const).map(key => <label key={key} className="block space-y-2 text-xs font-medium">
      <span>{key === "kcal_max" ? "Tối đa kcal/suất" : "Từ g đạm/suất"}</span>
      <Input type="number" min="0" step={key === "kcal_max" ? "1" : "any"} inputMode="decimal" value={value[key] ?? ""} onChange={event => onChange({ ...value, [key]: event.target.value === "" ? undefined : Number(event.target.value) })} />
    </label>)}
    <fieldset className="space-y-3"><legend className="text-xs font-medium">Nhãn dinh dưỡng</legend>
      <ToggleGroup type="multiple" aria-label="Nhãn dinh dưỡng" value={value.label ?? []} onValueChange={label => onChange({ ...value, label })}>
        {Object.entries(nutritionLabels).map(([key, label]) => <ToggleGroupItem key={key} value={key} className="border-border px-3 text-xs data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary">{label}</ToggleGroupItem>)}
      </ToggleGroup>
    </fieldset>
    <Button variant="outline" className="h-10 w-full" onClick={() => onChange({})}>{t("clear")}</Button>
  </div>;
}

export function CatalogQuickFilters({ value, onChange }: { value: CatalogFilterValues; onChange: (value: CatalogFilterValues) => void }) {
  const toggleLabel = (key: string) => onChange({ ...value, label: value.label?.includes(key) ? value.label.filter(label => label !== key) : [...(value.label ?? []), key] });
  const priceSelected = value.minPrice === undefined && value.maxPrice === 80000;
  return <div role="group" aria-label="Lọc nhanh món" className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-2">
    {Object.entries(nutritionLabels).map(([key, label]) => <Button key={key} variant="outline" aria-pressed={value.label?.includes(key) ?? false} className="catalog-chip h-10 shrink-0 px-3 text-xs" onClick={() => toggleLabel(key)}>{label}</Button>)}
    <Button variant="outline" aria-pressed={value.kcal_max === 500} className="catalog-chip h-10 shrink-0 px-3 text-xs" onClick={() => onChange({ ...value, kcal_max: value.kcal_max === 500 ? undefined : 500 })}>≤500 kcal</Button>
    <Button variant="outline" aria-pressed={value.protein_min === 30} className="catalog-chip h-10 shrink-0 px-3 text-xs" onClick={() => onChange({ ...value, protein_min: value.protein_min === 30 ? undefined : 30 })}>≥30 g đạm</Button>
    <Button variant="outline" aria-pressed={priceSelected} className="catalog-chip h-10 shrink-0 px-3 text-xs" onClick={() => onChange({ ...value, minPrice: undefined, maxPrice: priceSelected ? undefined : 80000 })}>Giá ≤80.000 đ</Button>
  </div>;
}
