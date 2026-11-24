export type RequirementFilter = { month: string; includeUnknown: boolean; priceMin: string; priceMax: string };
export function requirementQuery(filter: RequirementFilter, showPrice: boolean) {
  const params = new URLSearchParams();
  if (filter.month) params.set("month", filter.month);
  params.set("include_unknown", String(filter.includeUnknown));
  if (showPrice && filter.priceMin) params.set("price_min", filter.priceMin);
  if (showPrice && filter.priceMax) params.set("price_max", filter.priceMax);
  if (showPrice && (filter.priceMin || filter.priceMax)) params.set("price_uom", "KG");
  return params.toString();
}
