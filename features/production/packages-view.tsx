"use client";

import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState } from "@/components/patterns/empty-state";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { PackageList } from "./package-list";
import { PackageDetail } from "./package-detail";
import { PackageForm } from "./package-form";
import { PackageRecipeForm } from "./package-recipe-form";
import { RawLabelsForm } from "./raw-labels-form";
import { usePackages } from "./use-packages";

export function PackagesView() {
  const s = usePackages();
  return <section aria-label="Gói và công thức" className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Gói + công thức</h2><p className="text-sm text-muted-foreground">Mỗi công thức tạo một gói EA. Lịch sử phiên bản giữ lại cho thực đơn đã chốt.</p></div>{s.can("sales:variant:create") && <Button disabled={s.detailBusy} onClick={() => void s.begin(true)}>Tạo gói</Button>}</div>
    <PackageList s={s} />
    {s.detailBusy && <LoadingState title="Đang tải hoặc lưu gói…" />}
    {s.detailError && <ErrorState title="Không tải được công thức gói" description={s.detailError} onRetry={() => { if (s.selected) void s.open(s.selected); }} />}
    <PackageDetail s={s} />
    <PackageForm s={s} />
    <PackageRecipeForm s={s} />
    <RawLabelsForm s={s} />
    <ConfirmDialog open={s.confirm === "package"} onOpenChange={open => !open && s.setConfirm("")} danger title={`Ngừng gói ${s.selected?.name ?? ""}?`} confirmLabel="Ngừng gói" onConfirm={() => void s.retire()} />
    <ConfirmDialog open={s.confirm === "recipe"} onOpenChange={open => !open && s.setConfirm("")} danger title="Ngừng công thức đang dùng?" confirmLabel="Ngừng công thức" onConfirm={() => void s.retireRecipe()} />
  </section>;
}
