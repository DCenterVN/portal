"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { z } from "zod";
import { FormActions } from "./form-actions";
import { TextField } from "./text-field";
import { accountErrorMessage } from "@/lib/api/account-client";
import { phoneSchema } from "@/lib/api/account-validation";
import { FetchError } from "@/lib/fetcher";
import { useAccountPhone } from "./use-account-forms";

type Values = z.infer<typeof phoneSchema>;
type PhoneSettingProps = { phone: string; refresh: () => Promise<void> };

function phoneField(code: string | undefined) {
  if (code === "CONFLICT" || code === "VALIDATION_ERROR") return "phone";
  return code === "invalid_current_password" || code === "UNAUTHORIZED" ? "current_password" : "root";
}

function PhoneForm({ phone, refresh }: PhoneSettingProps) {
  const t = useTranslations("account");
  const account = useAccountPhone(refresh);
  const form = useForm<Values>({ resolver: zodResolver(phoneSchema), mode: "onTouched", defaultValues: { phone, current_password: "" } });
  const { isValid, isSubmitting } = form.formState;
  const changed = form.watch("phone") !== form.formState.defaultValues?.phone;
  async function submit(values: Values) {
    try { await account.save(values); form.reset({ phone: values.phone, current_password: "" }); }
    catch (error) {
      const code = error instanceof FetchError ? error.code : undefined;
      form.setError(phoneField(code), { type: "server", message: accountErrorMessage(error, t) });
    }
  }
  return <form onSubmit={form.handleSubmit(submit)} className="max-w-md space-y-3" noValidate>
    <TextField control={form.control} name="phone" label={t("phone")} placeholder={phone ? undefined : t("none")} type="tel" autoComplete="tel" disabled={isSubmitting} />
    {changed && <TextField control={form.control} name="current_password" label={t("currentPassword")} type="password" autoComplete="current-password" disabled={isSubmitting} />}
    {form.formState.errors.root && <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>}
    <FormActions dirty={changed} valid={isValid} busy={isSubmitting} onCancel={() => form.reset()} />
  </form>;
}

export function PhoneSetting({ phone, refresh }: PhoneSettingProps) {
  return <PhoneForm phone={phone} refresh={refresh} />;
}
