"use client";
import React from "react";
import {useTranslations} from "next-intl";
import {Button} from "@/components/ui/button";
import {Field} from "@/components/ui/field";
import {PasswordInput} from "@/components/patterns/password-input";
export interface PasswordFormProps {
 current: string; next: string; confirmation: string;
 onChange(field: "current" | "next" | "confirmation", value: string): void;
 onSubmit(): void; pending: boolean; error?: string; success?: string;
}
export function PasswordForm({current,next,confirmation,onChange,onSubmit,pending,error,success}: PasswordFormProps) {
 const t=useTranslations("accountEdit");
 return <form className="space-y-4 rounded-lg" aria-busy={pending} onSubmit={event=>{event.preventDefault();onSubmit();}}>
  <Field label={t("currentPassword")} htmlFor="account-current" error={error}>
   <PasswordInput id="account-current" autoComplete="current-password" value={current} onChange={event=>onChange("current",event.target.value)} disabled={pending} className="rounded-lg" required/>
  </Field>
  <Field label={t("newPassword")} htmlFor="account-next" hint={t("passwordHint")}>
   <PasswordInput id="account-next" autoComplete="new-password" value={next} onChange={event=>onChange("next",event.target.value)} disabled={pending} className="rounded-lg" required/>
  </Field>
  <Field label={t("confirmPassword")} htmlFor="account-confirmation">
   <PasswordInput id="account-confirmation" autoComplete="new-password" value={confirmation} onChange={event=>onChange("confirmation",event.target.value)} disabled={pending} className="rounded-lg" required/>
  </Field>
  <Button type="submit" disabled={pending || !current || !next || !confirmation}>{pending ? t("saving") : t("changePassword")}</Button>
  {success && <p role="status">{success}</p>}
 </form>;
}
