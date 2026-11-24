"use client";

import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/patterns/form-field";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { toast } from "@/components/ui/toast";
import { getLifecycleDetail, resumeVariant } from "@/lib/api/product-lifecycle";
import { safeMessage } from "@/lib/api/dishes";
import type { Product } from "@/lib/api/sales";

const schema = z.object({ reason: z.string().trim().min(1, "Nhập lý do mở bán lại").max(500, "Lý do tối đa 500 ký tự") });

export function ProductResumeVariantsDialog({ product, onClose, onDone }: { product: Product; onClose: () => void; onDone: () => Promise<void> }) {
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { reason: "" } });
  const detail = useSWR(["product-resume-variants", product.id], () => getLifecycleDetail(product.id));
  const stopped = detail.data?.variants.filter(variant => variant.status === "SUSPENDED") ?? [];
  const { errors, isSubmitting } = form.formState;
  const resume = (variantId: string) => form.handleSubmit(async ({ reason }) => {
    try {
      await resumeVariant(product.id, variantId, reason);
      toast.success("Đã mở bán lại suất bán.");
      await detail.mutate();
      await onDone();
    } catch (error) { form.setError("root", { message: error instanceof Error ? error.message : "Không mở bán lại được. Vui lòng thử lại." }); }
  })();
  return <Dialog open onOpenChange={open => !open && !isSubmitting && onClose()}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Mở bán lại suất bán</DialogTitle><DialogDescription>{safeMessage(product.name)}</DialogDescription></DialogHeader>
      {detail.error ? <ErrorState title="Không tải được suất bán" onRetry={() => void detail.mutate()} /> : !detail.data ? <LoadingState title="Đang tải suất bán…" /> : stopped.length === 0 ? <EmptyState title="Không có suất bán nào đang ngừng" /> : <div className="space-y-4">
        <Field label="Lý do" htmlFor="resume-variant-reason" error={errors.reason?.message}><Textarea id="resume-variant-reason" rows={3} disabled={isSubmitting} {...form.register("reason")} /></Field>
        <ul className="space-y-2">{stopped.map((variant, index) => <li key={variant.id} className="flex items-center justify-between gap-3 text-sm">
          <span>{safeMessage(variant.variant_label || variant.name) || `Suất bán ${index + 1}`}</span>
          <Button size="sm" variant="outline" disabled={isSubmitting} onClick={() => void resume(variant.id)}>Mở bán lại</Button>
        </li>)}</ul>
        {errors.root && <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>}
      </div>}
    </DialogContent>
  </Dialog>;
}
