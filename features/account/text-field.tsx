"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/patterns/password-input";
import { fieldErrorKeys } from "./use-account-forms";

type TextFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  hint?: string;
  placeholder?: string;
  hideLabel?: boolean;
  type?: "text" | "email" | "password" | "tel";
  autoComplete?: string;
  disabled?: boolean;
};

export function TextField<T extends FieldValues>({ control, name, label, hint, placeholder, hideLabel, type = "text", autoComplete, disabled }: TextFieldProps<T>) {
  const t = useTranslations("account");
  return <Controller control={control} name={name} render={({ field, fieldState }) => {
    const props = { ...field, id: `${name}-field`, autoComplete, disabled, placeholder, "aria-invalid": fieldState.invalid };
    return <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={props.id} className={hideLabel ? "sr-only" : undefined}>{label}</FieldLabel>
      {type === "password" ? <PasswordInput {...props} showLabel={t("showPassword")} hideLabel={t("hidePassword")} /> : <Input {...props} type={type} />}
      {hint && !fieldState.invalid && <FieldDescription>{hint}</FieldDescription>}
      {fieldState.error && <FieldError>{fieldState.error.type === "server" ? fieldState.error.message : t(fieldErrorKeys[name] ?? "fallback")}</FieldError>}
    </Field>;
  }} />;
}
