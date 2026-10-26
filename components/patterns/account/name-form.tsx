"use client";
import React from "react";
import {useTranslations} from "next-intl";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Field} from "@/components/ui/field";
export interface NameFormProps {
 value: string; onChange(value: string): void; onSubmit(): void;
 pending: boolean; error?: string; success?: string;
}
export function NameForm({value,onChange,onSubmit,pending,error,success}: NameFormProps) {
 const t=useTranslations("accountEdit");
 return <form className="space-y-4 rounded-lg" aria-busy={pending} onSubmit={event=>{event.preventDefault();onSubmit();}}>
  <Field label={t("name")} htmlFor="account-name" error={error} hint={t("nameHint")}>
   <Input id="account-name" name="display_name" autoComplete="name" value={value} onChange={event=>onChange(event.target.value)} disabled={pending} className="rounded-lg" required/>
  </Field>
  <Button type="submit" disabled={pending || !value.trim()}>{pending ? t("saving") : t("save")}</Button>
  {success && <p role="status">{success}</p>}
 </form>;
}
