"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { variantLabel } from "./food-plan-ratios";
import { useProductionPlan } from "./use-production-plan";

export function ProductionPlanForm({ targetId, productRefs, onCreated, onClose }: { targetId: string; productRefs: string[]; onCreated: () => void; onClose: () => void }) {
  const { form, sets, status, error, retryable, loadSets, pickSet, submit } = useProductionPlan(targetId, productRefs, onCreated);
  const { register, watch, formState: { errors, isSubmitting } } = form;
  return <Card className="mb-6"><CardContent className="pt-6">
    <form onSubmit={submit} noValidate aria-label="Tạo kế hoạch sản xuất" className="space-y-4">
      <EntityPicker name="production-set" label="Set cần nấu" required items={sets} status={status} value={watch("setId") || null} onChange={pickSet}
        getId={set => set.id} getLabel={set => set.name} getMeta={set => [variantLabel(set.code), set.variant_label].filter(part => part !== "—").join(" · ")} onRetry={() => void loadSets()}
        emptyText="Chưa có set đang dùng cho sản phẩm trong chỉ tiêu này." error={errors.setId?.message} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field data-invalid={!!errors.portionCount}>
          <FieldLabel htmlFor="production-portion-count">Số phần mỗi set</FieldLabel>
          <Input id="production-portion-count" inputMode="numeric" disabled={isSubmitting} aria-invalid={!!errors.portionCount} {...register("portionCount")} />
          <FieldError>{errors.portionCount?.message}</FieldError>
        </Field>
        <Field data-invalid={!!errors.plannedQuantity}>
          <FieldLabel htmlFor="production-planned-quantity">Số suất cần nấu</FieldLabel>
          <Input id="production-planned-quantity" inputMode="numeric" disabled={isSubmitting} aria-invalid={!!errors.plannedQuantity} {...register("plannedQuantity")} />
          <FieldError>{errors.plannedQuantity?.message}</FieldError>
        </Field>
      </div>
      {error && <InlineAlert>{error}{retryable && <> <Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={() => void submit()}>Thử lại</Button></>}</InlineAlert>}
      <div className="flex gap-3"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang tạo…" : "Tạo kế hoạch"}</Button><Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>Hủy</Button></div>
    </form>
  </CardContent></Card>;
}
