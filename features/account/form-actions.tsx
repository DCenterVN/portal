"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tip } from "@/components/patterns/tip";

type FormActionsProps = { dirty: boolean; valid: boolean; busy: boolean; onCancel: () => void };

export function FormActions({ dirty, valid, busy, onCancel }: FormActionsProps) {
  const t = useTranslations("account");
  const save = <Button type="submit" disabled={!dirty || !valid || busy}>{t(busy ? "saving" : "save")}</Button>;
  const blocked = !dirty || !valid;
  return <div className="flex justify-end gap-2">
    {dirty && <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>{t("cancel")}</Button>}
    {blocked && !busy ? <Tip label={t(dirty ? "saveIncomplete" : "saveUnchanged")}><span className="inline-flex">{save}</span></Tip> : save}
  </div>;
}
