"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useStaffLogin } from "./use-staff-login";
import { LoginFields } from "@/components/patterns/login-fields";

export function StaffLogin() {
  const f = useStaffLogin();
  const t = useTranslations("employeeAuth");
  return (
    <>
      <form noValidate onSubmit={f.onSubmit} aria-busy={f.busy} className="grid gap-4">
        <LoginFields
          id={f.id}
          busy={f.busy}
          locked={f.locked}
          error={f.error}
          forgotHref="/staff/forgot-password"
          errorAction={f.errorKey === "notStaff" && <Link href="/login" className="underline">{t("customerLogin")}</Link>}
          text={f.text}
        />
      </form>
      <p className="text-xs text-muted-foreground">
        {t("customerLead")}{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          {t("customerLink")}
        </Link>
      </p>
    </>
  );
}
