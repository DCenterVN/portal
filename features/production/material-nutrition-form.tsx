"use client";

import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { nutrientFields, nutritionSources } from "@/lib/nutrition";
import { useMaterialNutrition } from "./use-material-nutrition";

type Props = { material: { id: string; name: string; uom_code?: string }; canEdit: boolean };
export function MaterialNutritionForm({ material, canEdit }: Props) {
  const { form, save, isLoading, error, reload } = useMaterialNutrition(material.id, material.name, canEdit);
  const { register, control, formState: { errors, isSubmitting } } = form;
  return <section className="space-y-4 border-t pt-4" aria-label="Dinh dưỡng nguyên liệu">
    <h3 className="text-base font-semibold">Dinh dưỡng / 100 g</h3>
    <p className="text-sm text-muted-foreground">{material.name}. Tính trên 100 g phần ăn được, nguyên liệu sống. Để trống khi chưa biết; mỗi số liệu cần chọn nguồn.</p>
    {!canEdit && <p className="text-sm text-muted-foreground">Bạn đang xem ở chế độ chỉ đọc.</p>}
    {isLoading ? <LoadingState title="Đang tải dinh dưỡng…" /> : error ? <ErrorState title="Không tải được dinh dưỡng" description={error} onRetry={() => void reload()} /> : <form onSubmit={save} className="space-y-4" aria-label="Dinh dưỡng / 100 g">
      <fieldset disabled={!canEdit || isSubmitting} className="space-y-4">
        {nutrientFields.map(([key, name, unit]) => {
          const valueError = errors.nutrients?.[key]?.value;
          const sourceError = errors.nutrients?.[key]?.source;
          const id = `nutrition-${key}`;
          return <div key={key} className="grid gap-3 sm:grid-cols-2">
            <Field data-invalid={!!valueError}><FieldLabel htmlFor={id}>{name} ({unit})</FieldLabel><Input id={id} inputMode="decimal" aria-invalid={!!valueError} aria-describedby={`${id}-error`} {...register(`nutrients.${key}.value`)} /><FieldError id={`${id}-error`}>{valueError && "Nhập số không âm hoặc để trống khi chưa biết."}</FieldError></Field>
            <Controller control={control} name={`nutrients.${key}.source`} render={({ field }) => <Field data-invalid={!!sourceError}><FieldLabel htmlFor={`${id}-source`}>Nguồn {name.toLocaleLowerCase()}</FieldLabel><NativeSelect id={`${id}-source`} name={field.name} ref={field.ref} onBlur={field.onBlur} value={field.value?.dataset ?? ""} aria-invalid={!!sourceError} aria-describedby={`${id}-source-error`} onChange={event => { const dataset = event.target.value as keyof typeof nutritionSources; field.onChange(dataset ? { ...field.value, dataset } : null); }}><NativeSelectOption value="">Chưa chọn nguồn</NativeSelectOption>{Object.entries(nutritionSources).map(([code, label]) => <NativeSelectOption key={code} value={code}>{label}</NativeSelectOption>)}</NativeSelect><FieldError id={`${id}-source-error`}>{sourceError && "Chọn nguồn cho số liệu đã nhập."}</FieldError></Field>} />
          </div>;
        })}
        {material.uom_code === "L" && <Field data-invalid={!!errors.grams_per_ml}><FieldLabel htmlFor="nutrition-density">Khối lượng mỗi ml (g/ml)</FieldLabel><Input id="nutrition-density" inputMode="decimal" aria-invalid={!!errors.grams_per_ml} aria-describedby="nutrition-density-error" {...register("grams_per_ml")} /><FieldError id="nutrition-density-error">{errors.grams_per_ml?.message}</FieldError></Field>}
        {material.uom_code === "EA" && <Field data-invalid={!!errors.edible_grams_per_ea}><FieldLabel htmlFor="nutrition-edible">Khối lượng ăn được mỗi cái/gói (g)</FieldLabel><Input id="nutrition-edible" inputMode="decimal" aria-invalid={!!errors.edible_grams_per_ea} aria-describedby="nutrition-edible-error" {...register("edible_grams_per_ea")} /><FieldError id="nutrition-edible-error">{errors.edible_grams_per_ea?.message}</FieldError></Field>}
      </fieldset>
      {canEdit && <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang lưu…" : "Lưu dinh dưỡng nguyên liệu"}</Button>}
    </form>}
  </section>;
}
