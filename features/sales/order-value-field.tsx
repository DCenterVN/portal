import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/patterns/form-field";

export function OrderValueField({ label, register, busy, error }: { label: string; register: UseFormRegisterReturn; busy: boolean; error?: string }) {
  return <Field label={label} htmlFor="order-action-value" error={error}>
    <Input id="order-action-value" disabled={busy} {...register} />
  </Field>;
}
