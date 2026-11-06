"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCustomerLogin } from "./use-customer-login";
import { authTabHref } from "./form-feedback";
import { LoginFields } from "@/components/patterns/login-fields";

export function LoginForm() {
  const f = useCustomerLogin();
  const t = useTranslations("customerAuth");
  return (
    <>
      <div role="tablist" aria-label={t("login")} className="grid grid-cols-2 rounded-lg bg-muted p-[3px] text-sm font-medium">
        <span role="tab" aria-selected="true" className="flex min-h-9 items-center justify-center rounded-lg bg-background text-foreground shadow-sm">
          {t("login")}
        </span>
        <Link href={authTabHref("register", f.redirect)} role="tab" aria-selected="false" className="flex min-h-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground">
          {t("tabRegister")}
        </Link>
      </div>
      <form onSubmit={f.onSubmit} noValidate aria-busy={f.busy} className="grid gap-4">
        <LoginFields
          id={f.id}
          busy={f.busy}
          locked={f.locked}
          error={f.error}
          forgotHref="/forgot-password"
          errorAction={f.errorKey === "notActivated" && <Link href="/activate" className="underline">{t("resendActivation")}</Link>}
          text={f.text}
        />
      </form>
    </>
  );
}
