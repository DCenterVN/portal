"use client";

import type { Route } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import useSWR from "swr";
import { EmptyState } from "@/components/patterns/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogArtwork } from "@/features/products/catalog-artwork";
import { getCatalog, type Product } from "@/lib/api/sales";
import { formatVND } from "@/lib/format";
import { StoreReveal } from "./store-reveal";
import styles from "./store-surface.module.css";

export type FallbackPreviewCard = {
  title: string;
  subtitle: string;
  image: string;
  alt: string;
  href: Route;
};

export function FeaturedDishesGrid({
  products,
  loading = false,
  limit = 4,
  fallbackCards,
}: {
  products: Product[];
  loading?: boolean;
  limit?: number;
  fallbackCards?: readonly FallbackPreviewCard[];
}) {
  if (loading) {
    return (
      <div aria-busy="true" className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {Array.from({ length: limit }, (_, index) => (
          <Card key={index} className="overflow-hidden rounded-xl border border-border/70 bg-card p-0 shadow-none">
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="space-y-2 p-3.5 sm:p-4">
              <Skeleton className="h-4 w-3/4 rounded-sm" />
              <Skeleton className="h-4 w-1/3 rounded-sm" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const shown = [
    ...products.filter((product) => Boolean(product.image_urls?.length)),
    ...products.filter((product) => !product.image_urls?.length),
  ].slice(0, limit);

  if (shown.length > 0) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {shown.map((product, index) => {
          const href = `/products/${product.id}${product.branch_ref ? `?branch_id=${encodeURIComponent(product.branch_ref)}` : ""}` as Route;
          const cover = product.image_urls?.[0];
          return (
            <StoreReveal key={product.id} delayMs={index * 55} className="flex min-w-0">
              <Link
                href={href}
                className={`group flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${styles.liftCard}`}
              >
                <div className={`aspect-[4/3] overflow-hidden bg-muted/40 ${styles.mediaOutline}`}>
                  {cover ? (
                    <img
                      src={cover}
                      alt={product.name}
                      loading="lazy"
                      className={`size-full object-cover ${styles.cardImg}`}
                    />
                  ) : (
                    <CatalogArtwork name={product.name} />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-4">
                  <p className="line-clamp-2 break-words text-sm font-semibold leading-5 text-foreground group-hover:text-primary sm:text-base">
                    {product.name}
                  </p>
                  {product.portion_count ? (
                    <p className="text-xs text-muted-foreground">{product.portion_count.toLocaleString("vi-VN")} người</p>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <p className="text-sm font-semibold tabular-nums text-foreground sm:text-base">
                      {product.base_price_vnd === undefined ? (
                        <span className="text-xs font-normal text-muted-foreground">Đang cập nhật giá</span>
                      ) : (
                        <>
                          {formatVND(product.base_price_vnd)}
                          <span className="text-xs font-normal text-muted-foreground">/gói</span>
                        </>
                      )}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      Xem món
                      <ArrowRight className={`size-3.5 ${styles.arrowCue}`} aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            </StoreReveal>
          );
        })}
      </div>
    );
  }

  if (fallbackCards && fallbackCards.length > 0) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {fallbackCards.map((item, index) => (
          <StoreReveal key={item.title} delayMs={index * 55} className="flex min-w-0">
            <Link
              href={item.href}
              className={`group flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${styles.liftCard}`}
            >
              <div className={`aspect-[4/3] overflow-hidden bg-muted/40 ${styles.mediaOutline}`}>
                <img
                  src={item.image}
                  alt={item.alt}
                  loading="lazy"
                  className={`size-full object-cover ${styles.cardImg}`}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3.5 sm:p-4">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary sm:text-base">{item.title}</p>
                <p className="text-xs text-muted-foreground sm:text-sm">{item.subtitle}</p>
              </div>
            </Link>
          </StoreReveal>
        ))}
      </div>
    );
  }

  return (
    <EmptyState
      title="Thực đơn đang được cập nhật"
      description="Danh mục sản phẩm đang được cập nhật. Bạn vẫn xem được toàn bộ thực đơn."
      action={<Link href="/products" className={buttonVariants({ variant: "outline" })}>Xem thực đơn</Link>}
    />
  );
}

export function FeaturedDishes({
  limit = 4,
  fallbackCards,
}: {
  limit?: number;
  fallbackCards?: readonly FallbackPreviewCard[];
}) {
  const { data, isLoading } = useSWR(
    "store-featured-dishes",
    () => getCatalog(),
    { revalidateOnFocus: false },
  );
  return (
    <FeaturedDishesGrid
      products={data?.data ?? []}
      loading={isLoading && !data}
      limit={limit}
      fallbackCards={fallbackCards}
    />
  );
}
