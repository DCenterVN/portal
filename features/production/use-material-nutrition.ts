"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/toast";
import { getMaterialNutrition, materialNutritionRequest, nutritionErrorMessage } from "@/lib/api/material-nutrition";
import { materialNutritionFormSchema, nutritionDefaults, type MaterialNutritionInput, type MaterialNutrition } from "@/lib/nutrition";

export function useMaterialNutrition(id: string, name: string, canEdit: boolean) {
  const { data, error, isLoading, mutate } = useSWR(["material-nutrition", id, name], () => getMaterialNutrition(id, name), { revalidateOnFocus: false });
  const form = useForm<MaterialNutritionInput, unknown, MaterialNutrition>({ resolver: zodResolver(materialNutritionFormSchema), defaultValues: nutritionDefaults(), mode: "onBlur" });
  const { reset, formState: { isDirty } } = form;
  useEffect(() => { if (data !== undefined) reset(nutritionDefaults(data)); }, [data, reset]);
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);
  const save = form.handleSubmit(async input => {
    if (!canEdit || error || data === undefined) return;
    try {
      const saved = await materialNutritionRequest(id, input);
      reset(nutritionDefaults(saved));
      await mutate(saved, false);
      toast.success("Đã lưu dinh dưỡng nguyên liệu");
    } catch (cause) { toast.error("Không lưu được dinh dưỡng", { description: nutritionErrorMessage(cause) }); }
  });
  return { form, save, isLoading, error: error ? nutritionErrorMessage(error) : "", reload: () => mutate() };
}
