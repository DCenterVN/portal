import type { ReactNode } from "react";
import type { Material } from "@/lib/api/material-catalog";
import { allergenSummary } from "@/lib/dishes/allergens";
import { addIngredient } from "@/lib/dishes/ingredients";
import type { DishContent } from "@/lib/dishes/types";
import type { DishError } from "@/lib/dishes/validate-dish";
import { DishIngredientsView } from "./dish-ingredients-view";
import { DishMaterialPicker } from "./dish-material-picker";
import type { useDishData } from "./use-dish-data";

type Data = ReturnType<typeof useDishData>;

export function DishDraftBody({ content, data, packNames, errors, readOnly, cost, onChange }: { content: DishContent; data: Data; packNames: Record<string, string>; errors: DishError[]; readOnly: boolean; cost: ReactNode; onChange: (content: DishContent) => void }) {
  const selected = new Set(content.ingredients.flatMap(line => line.sku_ref ? [line.sku_ref] : []));
  const pick = (material: Material) => {
    if (readOnly) return;
    onChange(addIngredient(content, material));
  };
  const allergens = content.ingredients.flatMap(line => line.sku_ref ? [data.materials[line.sku_ref]?.allergens ?? null] : []);
  return <div className="grid items-start gap-6 lg:grid-cols-2">
    <DishMaterialPicker catalog={data.catalog} selectedIds={selected} onPick={pick} />
    <div className="min-w-0 space-y-6">
      <DishIngredientsView content={content} materials={data.materials} tree={data.tree} packNames={packNames} errors={errors} readOnly={readOnly} onChange={onChange} />
      <p>Dị ứng: {allergenSummary(allergens)}</p>
      {cost}
    </div>
  </div>;
}
