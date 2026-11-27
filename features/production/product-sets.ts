import { listFoodSets, type FoodSet } from "@/lib/api/sales-pack";

export async function loadProductSets(productRefs: string[], list: typeof listFoodSets = listFoodSets) {
  const sets: FoodSet[] = [];
  for (const productRef of new Set(productRefs)) {
    let cursor: string | undefined;
    do {
      const page = await list({ product_ref: productRef, cursor, limit: 100 });
      sets.push(...page.items.filter(set => set.status === "ACTIVE"));
      cursor = page.next_cursor ?? undefined;
    } while (cursor);
  }
  return sets;
}
