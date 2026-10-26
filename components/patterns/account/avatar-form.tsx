"use client";
import React from "react";
import {useTranslations} from "next-intl";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Field} from "@/components/ui/field";
export interface AvatarFormProps {
 current?: string|null;preview:string;pending:boolean;error?:string;
 onSelect(file?:File):void;onSave():void;onCancel():void;onDelete():void;
}
export function AvatarForm({current,preview,pending,error,onSelect,onSave,onCancel,onDelete}:AvatarFormProps){
 const t=useTranslations("accountEdit");
 return <form className="space-y-4" aria-busy={pending} onSubmit={event=>{event.preventDefault();onSave();}}>
  {(preview || current) && <img src={preview || current || undefined} alt={t("avatar")} className="size-20 rounded-lg object-cover"/>}
  <Field label={t("avatar")} htmlFor="account-avatar" hint={t("avatarHint")} error={error}>
   <Input id="account-avatar" type="file" accept="image/jpeg,image/png,image/webp" disabled={pending} onChange={event=>{onSelect(event.target.files?.[0]);event.target.value="";}}/>
  </Field>
  <div className="flex flex-wrap gap-3">
   {preview && <><Button type="submit" disabled={pending}>{pending ? t("saving") : t("saveAvatar")}</Button><Button type="button" variant="outline" disabled={pending} onClick={onCancel}>{t("cancel")}</Button></>}
   {current && <Button type="button" variant="outline" disabled={pending} onClick={onDelete}>{t("deleteAvatar")}</Button>}
  </div>
 </form>;
}
