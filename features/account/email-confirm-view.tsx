"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { useEmailConfirm } from "./use-email-confirm";

export function EmailConfirmView() {
  const confirm = useEmailConfirm();
  const t = confirm.t;
  return <Card className="mx-auto w-full max-w-md">
    <CardHeader><CardTitle>{t("confirmEmail")}</CardTitle><CardDescription>{t("confirmEmailHint")}</CardDescription></CardHeader>
    <CardContent className="space-y-4">
      {confirm.done ? <InlineAlert tone="success">{t("emailConfirmed")}</InlineAlert> : <>
        {confirm.ready && !confirm.token && <InlineAlert>{t("missingToken")}</InlineAlert>}
        {confirm.error && <InlineAlert>{confirm.error}</InlineAlert>}
        <Button onClick={confirm.submit} disabled={!confirm.token || confirm.busy}>{t(confirm.busy ? "saving" : "confirm")}</Button>
      </>}
      <div className="flex flex-wrap gap-3"><Button asChild variant="outline"><Link href="/login">{t("customerLogin")}</Link></Button><Button asChild variant="outline"><Link href="/staff/login">{t("staffLogin")}</Link></Button></div>
    </CardContent>
  </Card>;
}
