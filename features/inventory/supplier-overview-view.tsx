"use client";

import type { Route } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SupplierOverview } from "@/lib/api/supplier-overview";
import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { supplierHref } from "./supplier-routes";

export const SUPPLIER_ATTENTION_ID = "supplier-attention";
export type SupplierAttention = "without_price" | "expiring" | "";

type StripProps = {
  overview?: SupplierOverview;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  pricedToday: boolean;
  pricedHref: Route;
  withoutPriceHref: Route;
  expiringHref: Route;
  closeAttentionHref: Route;
  attention: SupplierAttention;
};

const detailHref = (id: string): Route => supplierHref.tab(id, "agreements");

const cardClass = (active: boolean) => cn(
  "flex flex-col rounded-lg border bg-card px-3.5 py-2.5 transition-colors hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
  active && "border-t-[3px] border-t-primary"
);

export function SupplierOverviewStrip({
  overview,
  loading,
  error,
  onRetry,
  pricedToday,
  pricedHref,
  withoutPriceHref,
  expiringHref,
  closeAttentionHref,
  attention,
}: StripProps) {
  if (loading && !overview) {
    return (
      <div className="mb-4 grid grid-cols-3 gap-2.5" aria-busy="true">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="rounded-lg border bg-card px-3.5 py-2.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1.5 h-7 w-10" />
          </div>
        ))}
      </div>
    );
  }
  if (error && !overview) {
    return (
      <InlineAlert tone="warning" className="mb-4 flex items-center justify-between gap-3">
        <span>{error}</span>
        {onRetry && (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Thử lại
          </Button>
        )}
      </InlineAlert>
    );
  }
  if (!overview) return null;

  const { price_coverage: coverage, agreements, attention: list } = overview;
  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-2.5">
        <Link href={pricedHref} scroll={false} aria-current={pricedToday ? "true" : undefined} className={cardClass(pricedToday)}>
          <span className="text-xs font-medium text-muted-foreground">Có giá hiệu lực</span>
          <span className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">{coverage.suppliers_with_active_price}</span>
        </Link>
        <Link href={withoutPriceHref} scroll={false} aria-current={attention === "without_price" ? "true" : undefined} className={cardClass(attention === "without_price")}>
          <span className="text-xs font-medium text-muted-foreground">Chưa có giá</span>
          <span className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">{coverage.suppliers_without_active_price}</span>
        </Link>
        <Link href={expiringHref} scroll={false} aria-current={attention === "expiring" ? "true" : undefined} className={cardClass(attention === "expiring")}>
          <span className="text-xs font-medium text-muted-foreground">Giá sắp hết hạn</span>
          <span className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">{agreements.expiring_within_14_days}</span>
        </Link>
      </div>

      {attention === "without_price" && (
        <section aria-label="Nhà cung cấp chưa có giá" className="mb-4 rounded-lg border bg-card px-4 py-2.5">
          <div className="flex items-center justify-between gap-2 pb-1">
            <h2 className="text-sm font-semibold">Chưa có giá</h2>
            <Button asChild variant="ghost" size="icon-xs">
              <Link href={closeAttentionHref} scroll={false} aria-label="Đóng danh sách chưa có giá">
                <X aria-hidden="true" />
              </Link>
            </Button>
          </div>
          {list.without_price.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">Không có nhà cung cấp nào trong mục này.</p>
          ) : (
            <ul className="divide-y divide-border">
              {list.without_price.map(row => (
                <li key={row.supplier_id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link className="min-w-0 truncate font-medium underline-offset-4 hover:underline" href={detailHref(row.supplier_id)}>
                    {row.supplier_name}
                  </Link>
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link href={supplierHref.newPrice(row.supplier_id)}>Thêm giá nguyên liệu</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {attention === "expiring" && (
        <section aria-label="Nhà cung cấp có giá sắp hết hạn" className="mb-4 rounded-lg border bg-card px-4 py-2.5">
          <div className="flex items-center justify-between gap-2 pb-1">
            <h2 className="text-sm font-semibold">Giá sắp hết hạn</h2>
            <Button asChild variant="ghost" size="icon-xs">
              <Link href={closeAttentionHref} scroll={false} aria-label="Đóng danh sách giá sắp hết hạn">
                <X aria-hidden="true" />
              </Link>
            </Button>
          </div>
          {list.expiring.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">Không có nhà cung cấp nào trong mục này.</p>
          ) : (
            <ul className="divide-y divide-border">
              {list.expiring.map(row => (
                <li key={`${row.supplier_id}-${row.agreement_code}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link className="min-w-0 truncate font-medium underline-offset-4 hover:underline" href={detailHref(row.supplier_id)}>
                    {row.supplier_name}
                  </Link>
                  <span className="shrink-0 text-xs text-muted-foreground">Hết hạn {formatDate(row.valid_to)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
