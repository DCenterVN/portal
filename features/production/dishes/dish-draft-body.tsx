import type { ReactNode } from "react";
import type { Material } from "@/lib/api/material-catalog";
import { allergenSummary } from "@/lib/dishes/allergens";
import { addIngredient } from "@/lib/dishes/ingredients";
import type { DishContent } from "@/lib/dishes/types";
import type { DishError } from "@/lib/dishes/validate-dish";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DishIngredientsView } from "./dish-ingredients-view";
import { DishMaterialPicker } from "./dish-material-picker";
import { DishSemiPicker } from "./dish-semi-picker";
import type { SemiFinishedItem, SemiSlot } from "@/lib/api/semi-finished";
import type { useDishData } from "./use-dish-data";

type Data = ReturnType<typeof useDishData>;

export function DishDraftBody({ content, data, packNames, semiItems = [], semiLoading = false, semiError = "", errors, readOnly, disabled = false, canCreateSemi = false, cost, imageBox, onRetrySemi, onOpenCreateSemi, onChange }: {
  content: DishContent;
  data: Data;
  packNames: Record<string, string>;
  semiItems?: SemiFinishedItem[];
  semiLoading?: boolean;
  semiError?: string;
  errors: DishError[];
  readOnly: boolean;
  disabled?: boolean;
  canCreateSemi?: boolean;
  cost: ReactNode;
  imageBox?: ReactNode;
  onRetrySemi?: () => void;
  onOpenCreateSemi?: (defaultSlot: SemiSlot) => void;
  onChange: (content: DishContent) => void;
}) {
  const selected = new Set(content.ingredients.flatMap(line => line.sku_ref ? [line.sku_ref] : []));
  const semiById = Object.fromEntries(semiItems.map(item => [item.id, item]));
  const selectedSemiIds = new Set(content.seasonings.flatMap(line => line.package_ref ? [line.package_ref] : []));
  const pickSemi = (item: SemiFinishedItem) => {
    if (readOnly || disabled) return;
    const exists = content.seasonings.some(line => line.package_ref === item.id);
    if (exists) {
      onChange({ ...content, seasonings: content.seasonings.filter(line => line.package_ref !== item.id) });
      return;
    }
    const row = `${item.slot}-${item.id}`;
    const removable = item.slot === "DO_CHUA";
    onChange({
      ...content,
      seasonings: [...content.seasonings.filter(line => line.slot !== item.slot), { row, slot: item.slot, package_ref: item.id, removable }],
    });
  };
  const pick = (material: Material) => {
    if (readOnly || disabled) return;
    onChange(addIngredient(content, material));
  };
  const allergens = [
    ...content.ingredients.flatMap(line => line.sku_ref ? [data.materials[line.sku_ref]?.allergens ?? null] : []),
    ...content.seasonings.flatMap(line => line.package_ref && semiById[line.package_ref] ? [semiById[line.package_ref].allergens] : []),
  ];
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
      <Tabs defaultValue="materials" className="gap-3">
        <TabsList aria-label="Nguồn thêm thành phần vào món">
          <TabsTrigger value="materials">Nguyên liệu tươi</TabsTrigger>
          <TabsTrigger value="semi">Cốt · Nước chấm · Đồ chua{selectedSemiIds.size > 0 ? ` (${selectedSemiIds.size})` : ""}</TabsTrigger>
        </TabsList>
        <TabsContent value="materials" className="mt-0">
          <DishMaterialPicker catalog={data.catalog} selectedIds={selected} readOnly={readOnly} pickDisabled={readOnly || disabled} onPick={pick} />
        </TabsContent>
        <TabsContent value="semi" className="mt-0">
          <DishSemiPicker
            items={semiItems}
            selectedIds={selectedSemiIds}
            loading={semiLoading}
            error={semiError}
            readOnly={readOnly || disabled}
            canCreate={canCreateSemi}
            onPick={pickSemi}
            onCreateNew={onOpenCreateSemi}
            onRetry={onRetrySemi}
          />
        </TabsContent>
      </Tabs>
      <div id="dish-draft-summary" className="min-w-0 space-y-4 lg:sticky lg:top-4">
        {imageBox}
        <fieldset disabled={disabled} className="min-w-0">
          <DishIngredientsView content={content} materials={data.materials} tree={data.tree} packNames={packNames} semiById={semiById} errors={errors} missingCosts={missingCosts} readOnly={readOnly} allergensText={allergenSummary(allergens)} onChange={onChange} />
        </fieldset>
        {cost}
      </div>
    </div>
  </div>;
}
