"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/components/ui/toast";
import { RetryableError } from "@/lib/api/production-http";
import { planProductionFromSet } from "@/lib/api/production";
import type { FoodSet } from "@/lib/api/sales-pack";
import { loadProductSets } from "./product-sets";
import { servingCount } from "./food-plan-ratios";
import { formatServings } from "@/lib/stock-transfer";
import { packMessage } from "./pack-shared";

const whole = (message: string) => z.string().trim().regex(/^[1-9]\d*$/, message).pipe(z.coerce.number().int().max(1000000, "Tối đa 1.000.000."));
const schema = z.object({
  setId: z.string().min(1, "Chọn set."),
  portionCount: whole("Nhập số phần là số nguyên từ 1."),
  plannedQuantity: whole("Nhập số suất cần nấu là số nguyên từ 1."),
});

export function useProductionPlan(targetId: string, productRefs: string[], onCreated: () => void) {
  const [sets, setSets] = useState<FoodSet[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [retryable, setRetryable] = useState(false);
  const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema), defaultValues: { setId: "", portionCount: "", plannedQuantity: "" },
  });

  const loadSets = async () => {
    setStatus("loading");
    try {
      setSets(await loadProductSets(productRefs));
      setStatus("ready");
    } catch { setStatus("error"); }
  };
  useEffect(() => { void loadSets(); }, [targetId]);

  const pickSet = (id: string | null) => {
    form.setValue("setId", id ?? "", { shouldValidate: form.formState.isSubmitted });
    const set = sets.find(item => item.id === id);
    if (set) form.setValue("portionCount", servingCount(set.variant_label) ?? "");
  };

  const submit = form.handleSubmit(async ({ setId, portionCount, plannedQuantity }) => {
    const set = sets.find(item => item.id === setId);
    if (!set) return;
    setError(""); setRetryable(false);
    try {
      await planProductionFromSet(targetId, set, portionCount, plannedQuantity);
      toast.success(`Đã tạo kế hoạch sản xuất cho ${formatServings(plannedQuantity)} ${set.variant_label}`);
      form.reset();
      onCreated();
    } catch (e) { setError(packMessage(e, { variant: set.variant_label })); setRetryable(e instanceof RetryableError); }
  });

  return { form, sets, status, error, retryable, loadSets, pickSet, submit };
}
