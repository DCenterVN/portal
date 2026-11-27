"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Field } from "@/components/patterns/form-field";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { FetchError } from "@/lib/fetcher";
import { normalizeLocationCode, ZONES, zoneLabel } from "@/lib/api/storage-locations";

export const duplicateCodeMessage = "Mã này đã có trong chi nhánh, hãy dùng mã khác.";

export const locationFormSchema = z.object({
  code: z.string().regex(/^[A-Z0-9-]{1,32}$/, "Nhập mã gồm chữ, số, gạch ngang, tối đa 32 ký tự."),
  name: z.string().trim().min(1, "Nhập tên vị trí.").max(120, "Tên tối đa 120 ký tự."),
  zone: z.enum(ZONES),
});
export type LocationFormValues = z.infer<typeof locationFormSchema>;

export function submitFailure(cause: unknown): { field: boolean; message: string } {
  if (cause instanceof FetchError && cause.status === 409) return { field: true, message: duplicateCodeMessage };
  return { field: false, message: cause instanceof Error ? cause.message : "Không lưu được. Hãy thử lại." };
}

type Props = { initial?: LocationFormValues; submitLabel: string; onSubmit: (values: LocationFormValues) => Promise<void>; onCancel: () => void };

export function StorageLocationForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const editing = Boolean(initial);
  const [error, setError] = useState("");
  const form = useForm<LocationFormValues>({ resolver: zodResolver(locationFormSchema), mode: "onChange", defaultValues: initial ?? { code: "", name: "", zone: "COLD" } });
  const { errors, isValid, isSubmitting } = form.formState;
  const submit = form.handleSubmit(async values => {
    setError("");
    try { await onSubmit({ ...values, name: values.name.trim() }); } catch (cause) {
      const failure = submitFailure(cause);
      if (failure.field) form.setError("code", { message: failure.message });
      else setError(failure.message);
    }
  });
  const code = form.register("code", { onChange: event => { event.target.value = normalizeLocationCode(event.target.value); } });
  return <form className="grid gap-4" onSubmit={submit} noValidate>
    <Field label="Mã vị trí" htmlFor="location-code" hint={editing ? "Mã không sửa được." : "Chữ, số và gạch ngang, ví dụ KHO-LANH-1."} error={errors.code?.message}>
      <Input id="location-code" autoComplete="off" maxLength={32} readOnly={editing} {...code} />
    </Field>
    <Field label="Tên vị trí" htmlFor="location-name" error={errors.name?.message}><Input id="location-name" autoComplete="off" maxLength={120} {...form.register("name")} /></Field>
    <Field label="Khu" htmlFor="location-zone">
      <NativeSelect id="location-zone" {...form.register("zone")}>{ZONES.map(zone => <NativeSelectOption key={zone} value={zone}>{zoneLabel[zone]}</NativeSelectOption>)}</NativeSelect>
    </Field>
    {error && <InlineAlert>{error}</InlineAlert>}
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Huỷ</Button>
      <Button type="submit" disabled={!isValid || isSubmitting}>{isSubmitting ? "Đang lưu…" : submitLabel}</Button>
    </div>
  </form>;
}
