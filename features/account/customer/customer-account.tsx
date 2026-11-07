"use client";

import Link from "next/link";
import type { Route } from "next";
import { useTranslations } from "next-intl";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { cn } from "@/lib/utils";
import { AccountGate } from "../account-gate";
import { ProfileTab } from "./profile-tab";
import { SecurityTab } from "./security-tab";

type CustomerAccountProps = { tab?: string };

export function CustomerAccount({ tab }: CustomerAccountProps) {
  const t = useTranslations("account");
  const active = tab === "security" ? "security" : "profile";
  const items: { key: string; href: Route; label: string }[] = [
    { key: "profile", href: "/me", label: t("tabProfile") },
    { key: "security", href: "/me?tab=security" as Route, label: t("tabSecurity") },
    { key: "orders", href: "/orders", label: t("tabOrders") },
  ];
  function item({ key, href, label }: (typeof items)[number]) {
    return <Link key={key} href={href} aria-current={key === active ? "page" : undefined} className={cn("rounded-lg px-3 py-2 text-sm hover:bg-muted", key === active && "bg-muted font-medium")}>{label}</Link>;
  }
  return <PageShell className="space-y-6">
    <PageHeading title={t("title")} />
    <div className="flex flex-col gap-6 md:flex-row">
      <nav aria-label={t("menu")} className="flex flex-wrap gap-1 md:w-56 md:shrink-0 md:flex-col">{items.map(item)}</nav>
      <div className="min-w-0 flex-1 max-w-180">
        <AccountGate>{(profile, refresh) => active === "security" ? <SecurityTab profile={profile} /> : <ProfileTab profile={profile} refresh={refresh} />}</AccountGate>
      </div>
    </div>
  </PageShell>;
}
