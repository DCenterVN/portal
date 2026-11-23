import type { ReactNode } from "react";
import { toast } from "@/components/ui/toast";
import type { Material } from "@/lib/api/material-catalog";
import { allergenSummary } from "@/lib/dishes/allergens";
import { addIngredient, isSeasoningCategory } from "@/lib/dishes/ingredients";
import type { DishContent } from "@/lib/dishes/types";
import type { DishError } from "@/lib/dishes/validate-dish";
import { DishIngredientsView } from "./dish-ingredients-view";
import { DishMaterialPicker } from "./dish-material-picker";
import { DishSeasoningsView } from "./dish-seasonings-view";
import type { useDishData } from "./use-dish-data";

type Data = ReturnType<typeof useDishData>;

export function DishDraftBody({ content, data, errors, readOnly, cost, onChange }: { content: DishContent; data: Data; errors: DishError[]; readOnly: boolean; cost: ReactNode; onChange: (content: DishContent) => void }) {
  const selected = new Set(content.ingredients.flatMap(line => line.sku_ref ? [line.sku_ref] : []));
  const pick = (material: Material) => {
    if (readOnly) return;
    if (isSeasoningCategory(material.category)) {
      toast.info("Gia vị và cốt đi vào gói gia vị");
      document.getElementById("dish-seasonings")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    onChange(addIngredient(content, material));
  };
  const allergens = content.ingredients.flatMap(line => line.sku_ref ? [data.materials[line.sku_ref]?.allergens ?? null] : []);
  return <div className="grid items-start gap-6 lg:grid-cols-2">
    <DishMaterialPicker catalog={data.catalog} selectedIds={selected} onPick={pick} />
    <div className="min-w-0 space-y-6">
      <DishIngredientsView content={content} materials={data.materials} tree={data.tree} errors={errors} readOnly={readOnly} onChange={onChange} />
      <DishSeasoningsView content={content} packs={data.packs} recipes={data.recipes} loading={data.packLoading} error={data.packError} next={data.packNext} errors={errors} readOnly={readOnly} onChange={onChange} onQuery={data.setPackQuery} onRetry={data.retryPacks} onNext={() => void data.loadPacks(data.packNext ?? "")} />
      <p>Dị ứng: {allergenSummary(allergens)}</p>
      {cost}
    </div>
  </div>;
}
