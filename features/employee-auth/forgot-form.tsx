"use client";
import {useTranslations} from "next-intl";
import Link from "next/link";
// D3: auth cannot deliver a trusted staff reset link yet. Do not issue a customer challenge here.
export function ForgotForm() {
 const t = useTranslations("employeeAuth");
 return <div role="status" className="space-y-4 text-sm"><p> {t("recoveryNotice")} </p><Link href="/staff/login" className="inline-flex min-h-11 items-center text-[var(--color-primary)] underline"> {t("login")} </Link></div>;
}
