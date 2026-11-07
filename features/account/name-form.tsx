"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { z } from "zod";
import { accountErrorMessage } from "@/lib/api/account-client";
import { nameSchema } from "@/lib/api/account-validation";
import type { UserProfile } from "@/lib/auth/client";
import { FormActions } from "./form-actions";
import { TextField } from "./text-field";
import { useAccountName } from "./use-account-forms";

type Values = z.infer<typeof nameSchema>;
type NameFormProps = { profile: UserProfile; refresh: () => Promise<void> };

export function NameForm({ profile, refresh }: NameFormProps) {
  const t = useTranslations("account");
  const account = useAccountName(refresh);
  const form = useForm<Values>({ resolver: zodResolver(nameSchema), mode: "onTouched", defaultValues: { display_name: profile.display_name } });
  const { isDirty, isValid, isSubmitting } = form.formState;
  function cancel() { form.reset(); }
  async function submit(values: Values) {
    try { await account.save(values); form.reset(values); }
    catch (error) { form.setError("display_name", { type: "server", message: accountErrorMessage(error, t) }); }
  }
  return <form onSubmit={form.handleSubmit(submit)} className="max-w-md space-y-3" noValidate>
    <TextField control={form.control} name="display_name" label={t("displayName")} hideLabel autoComplete="name" disabled={isSubmitting} />
    <FormActions dirty={isDirty} valid={isValid} busy={isSubmitting} onCancel={cancel} />
  </form>;
}
