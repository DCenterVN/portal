"use client";

import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/patterns/empty-state";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { FoodSetFilters, FoodSetTable } from "./food-set-list";
import { FoodSetDetail } from "./food-set-detail";
import { FoodSetForm } from "./food-set-form";
import { useFoodSets } from "./use-food-sets";

export function FoodSetsView() {
  const s = useFoodSets();
  return <section aria-label="Set" className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Set món ăn</h2><p className="text-sm text-muted-foreground">Ghép gói theo từng ô, xem nhãn trên đúng lựa chọn dùng cho bữa ăn.</p></div>{s.canCreate && <Button disabled={s.detailBusy} onClick={() => void s.begin(true)}>Tạo set món</Button>}</div>
    <FoodSetFilters s={s} />
    <FoodSetTable s={s} />
    {s.detailBusy && <LoadingState title="Đang tải hoặc lưu set…" />}
    <FoodSetDetail s={s} />
    <FoodSetForm s={s} />
    <ConfirmDialog open={s.confirmRetire} onOpenChange={s.setConfirmRetire} danger title={`Ngừng set ${s.selected?.name ?? ""}?`} confirmLabel="Ngừng set" onConfirm={() => void s.retire()} />
  </section>;
}
