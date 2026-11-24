"use client";

import { supplierHref } from "./supplier-routes";
import Link from "next/link";
import type { Route } from "next";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { formatDate } from "@/lib/format-date";
import type React from "react";
import type { useSupplierOverview } from "./use-supplier-overview";

export const SUPPLIER_ATTENTION_ID = "supplier-attention";
type OverviewViewProps = Pick<ReturnType<typeof useSupplierOverview>, "overview" | "loading" | "error" | "onRetry">;
const detailHref = (id: string): Route => supplierHref.tab(id, "agreements");

function Figure({ label, value, href }: { label: string; value: number; href?: Route }) {
  const body = <><span className="text-2xl font-semibold text-foreground">{value}</span> <span className="text-sm text-muted-foreground">{label}</span></>;
  if (!href || !value) return <div className="rounded-lg border px-4 py-3">{body}</div>;
  return <Link href={href} className="rounded-lg border px-4 py-3 hover:bg-accent">{body}</Link>;
}

function AttentionList({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-border px-4 py-2"><h2 className="py-1 text-sm font-semibold">{title}</h2><ul className="divide-y divide-border">{children}</ul></section>;
}

export function SupplierOverviewView({ overview, loading, error, onRetry }: OverviewViewProps) {
  const t = useTranslations("supplierOverview");
  if (!overview) return error ? <ErrorState title={error} onRetry={onRetry} /> : loading ? <LoadingState title={t("loading")} /> : null;
  const { suppliers, price_coverage: coverage, agreements, attention } = overview;
  const more = (count: number) => count > 0 && <li className="py-2 text-sm text-muted-foreground">{t("more", { count })}</li>;
  return <div className="grid gap-4">
    <div className="flex flex-wrap gap-3">
      <Figure label={t("activeLabel")} value={suppliers.active} href={supplierHref.filtered("ACTIVE")} />
      <Figure label={t("suspendedLabel")} value={suppliers.suspended} href={supplierHref.filtered("SUSPENDED")} />
      <Figure label={t("noPriceLabel")} value={coverage.suppliers_without_active_price} />
      <Figure label={t("expiringLabel")} value={agreements.expiring_within_14_days} />
    </div>
    {attention.without_price.length > 0 && <AttentionList title={t("noPriceLabel")}>
      {attention.without_price.map(row => <li key={row.supplier_id} className="flex items-center justify-between gap-3 py-2 text-sm"><Link className="min-w-0 font-medium underline-offset-4 hover:underline" href={detailHref(row.supplier_id)}>{row.supplier_name}</Link><Button asChild variant="outline" size="sm" className="shrink-0"><Link href={supplierHref.newPrice(row.supplier_id)} aria-label={t("addPriceFor", { name: row.supplier_name })}>{t("addPrice")}</Link></Button></li>)}
      {more(coverage.suppliers_without_active_price - attention.without_price.length)}
    </AttentionList>}
    {attention.expiring.length > 0 && <AttentionList title={t("expiringLabel")}>
      {attention.expiring.map(row => <li key={`${row.supplier_id}-${row.agreement_code}`} className="py-2 text-sm"><Link className="font-medium underline-offset-4 hover:underline" href={detailHref(row.supplier_id)}>{row.supplier_name}</Link><p className="text-xs text-muted-foreground">{t("expiringRow", { date: formatDate(row.valid_to) })}</p></li>)}
      {more(agreements.expiring_within_14_days - attention.expiring.length)}
    </AttentionList>}
    {error && <ErrorState title={error} onRetry={onRetry} />}
  </div>;
}
