import type { ReactNode } from "react";
import type { Material } from "@/lib/api/material-catalog";
import { allergenSummary } from "@/lib/dishes/allergens";
import { addIngredient } from "@/lib/dishes/ingredients";
import type { DishContent } from "@/lib/dishes/types";
import type { DishError } from "@/lib/dishes/validate-dish";
import { Button } from "@/components/ui/button";
import { DishIngredientsView } from "./dish-ingredients-view";
import { DishMaterialPicker } from "./dish-material-picker";
import type { useDishData } from "./use-dish-data";

type Data = ReturnType<typeof useDishData>;

export function DishDraftBody({ content, data, packNames, errors, readOnly, disabled = false, cost, imageBox, onChange }: {
  content: DishContent;
  data: Data;
  packNames: Record<string, string>;
  errors: DishError[];
  readOnly: boolean;
  disabled?: boolean;
  cost: ReactNode;
  imageBox?: ReactNode;
  onChange: (content: DishContent) => void;
}) {
  const selected = new Set(content.ingredients.flatMap(line => line.sku_ref ? [line.sku_ref] : []));
  const pick = (material: Material) => {
    if (readOnly || disabled) return;
    onChange(addIngredient(content, material));
  };
  const allergens = content.ingredients.flatMap(line => line.sku_ref ? [data.materials[line.sku_ref]?.allergens ?? null] : []);
  const missingLines = (data.cost?.lines ?? []).filter(line => Boolean(line.missing) || line.cost_vnd === null);
  const ingredientMissingLines = missingLines.filter(line => line.from !== "PACKAGE" && !line.package_ref);
  const missingCosts = Object.fromEntries(ingredientMissingLines.filter(line => line.sku_ref).map(line => [line.sku_ref, line.missing ?? "NO_PRICE"]));
  const missingPriceNames = [...new Set(missingLines.filter(line => line.missing !== "NO_RECIPE").map(line => line.name.trim()).filter(Boolean))];
  const noRecipeNames = [...new Set(missingLines.filter(line => line.missing === "NO_RECIPE").map(line => line.name.trim()).filter(Boolean))];
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm shadow-sm lg:hidden">
      <p className="min-w-0 text-muted-foreground">
        Đã chọn {selected.size} nguyên liệu{content.seasonings.length ? ` + ${content.seasonings.length} gói gia vị` : ""}
        {data.costLoading
          ? " · Đang tính giá vốn…"
          : data.costError
            ? ` · ${data.costError}`
            : missingPriceNames.length > 0 || noRecipeNames.length > 0
              ? <>
                {missingPriceNames.length > 0 && <span className="font-medium text-destructive"> · Thiếu giá vốn: {missingPriceNames.join(", ")}</span>}
                {noRecipeNames.length > 0 && <span className="font-medium text-destructive"> · Thiếu công thức gói: {noRecipeNames.join(", ")}</span>}
              </>
              : data.cost
                ? data.cost.complete
                  ? <span className="font-medium tabular-nums"> · {new Intl.NumberFormat("vi-VN").format(data.cost.total_vnd)} ₫/hộp</span>
                  : <span className="font-medium text-destructive"> · Chưa đủ giá vốn</span>
                : null}
      </p>
      <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("dish-draft-summary")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Xem định lượng & giá vốn</Button>
    </div>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <DishMaterialPicker catalog={data.catalog} selectedIds={selected} readOnly={readOnly} pickDisabled={readOnly || disabled} onPick={pick} />
      <div id="dish-draft-summary" className="min-w-0 space-y-4 lg:sticky lg:top-4">
        {imageBox}
        <fieldset disabled={disabled} className="min-w-0">
          <DishIngredientsView content={content} materials={data.materials} tree={data.tree} packNames={packNames} errors={errors} missingCosts={missingCosts} readOnly={readOnly} allergensText={allergenSummary(allergens)} onChange={onChange} />
        </fieldset>
        {cost}
      </div>
    </div>
  </div>;
}
