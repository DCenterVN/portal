"use client";
import React from "react";
import {useTranslations} from "next-intl";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Field} from "@/components/ui/field";
import {PasswordInput} from "@/components/patterns/password-input";
export interface EmailFormProps {
 current:string;email:string;password:string;pending:boolean;sent:boolean;error:string;
 onEmail(value:string):void;onPassword(value:string):void;onSubmit():void;
}
export function EmailForm({current,email,password,pending,sent,error,onEmail,onPassword,onSubmit}:EmailFormProps){
 const t=useTranslations("accountEdit");
 return <form className="space-y-4" aria-busy={pending} onSubmit={event=>{event.preventDefault();onSubmit();}}>
  <p>{current}</p>
  <Field label={t("newEmail")} htmlFor="account-email" error={error}>
   <Input id="account-email" type="email" autoComplete="email" value={email} required disabled={pending} onChange={event=>onEmail(event.target.value)}/>
  </Field>
  <Field label={t("currentPassword")} htmlFor="account-email-password">
   <PasswordInput id="account-email-password" autoComplete="current-password" value={password} required disabled={pending} onChange={event=>onPassword(event.target.value)}/>
  </Field>
  <Button type="submit" disabled={pending || !email || !password}>{pending ? t("saving") : t("requestEmail")}</Button>
  {sent && <p role="status">{t("emailPending")}</p>}
 </form>;
}
