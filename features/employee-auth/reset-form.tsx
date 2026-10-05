"use client";
import {useTranslations} from "next-intl";
import Link from "next/link";
// D3: no trusted staff token provenance endpoint exists. Never consume a generic reset token.
export function ResetForm() {
 const t = useTranslations("employeeAuth");
 return <div role="status" className="space-y-4 text-sm"><p> {t("resetNotice")} </p><Link href="/staff/login" className="inline-flex min-h-11 items-center text-[var(--color-primary)] underline"> {t("login")} </Link></div>;
}
