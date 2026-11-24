import { listFoodSets, type FoodSet } from "@/lib/api/sales-pack";
import type { DraftProduct } from "@/lib/api/sales";

export type ProductChoice = DraftProduct & { hasSet: boolean; setNote: string };

export async function loadActiveSets(list: typeof listFoodSets = listFoodSets) {
  const sets: FoodSet[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ cursor, limit: 100 });
    sets.push(...page.items.filter(set => set.status === "ACTIVE"));
    cursor = page.next_cursor ?? undefined;
  } while (cursor);
  return sets;
}

export function withSetNotes(products: DraftProduct[], sets: FoodSet[] | null): ProductChoice[] {
  const labels = new Map<string, string[]>();
  for (const set of sets ?? []) labels.set(set.product_ref, [...(labels.get(set.product_ref) ?? []), set.variant_label]);
  const choices = products.map(product => {
    const found = labels.get(product.id);
    return { ...product, hasSet: !!found, setNote: !sets ? "" : found ? `có set ${found.join(", ")}` : "chưa có món" };
  });
  return [...choices.filter(choice => choice.hasSet), ...choices.filter(choice => !choice.hasSet)];
}
