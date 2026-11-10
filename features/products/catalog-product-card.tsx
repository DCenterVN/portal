"use client";

import Link from "next/link";
import type { Route } from "next";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Product } from "@/lib/api/sales";
import { formatVND } from "@/lib/format";
import { useCatalogCart } from "./use-catalog";
import { NutritionChip } from "./nutrition-view";
import { CatalogArtwork } from "./catalog-artwork";

export function CatalogProductCard({ product, branchId }: { product: Product; branchId?: string }) {
  const t = useTranslations("Catalog");
  const { adding, add } = useCatalogCart(product);
  const href = `/products/${product.id}${branchId ? `?branch_id=${encodeURIComponent(branchId)}` : ""}` as Route;
  return <Card className="flex min-w-0 flex-col gap-0 overflow-hidden border-0 bg-muted/30 p-0 shadow-none">
                <Link href={href} aria-label={product.name} className="block aspect-[4/3] overflow-hidden bg-media focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                  {product.image_urls?.[0] ? <img src={product.image_urls[0]} alt={product.name} className="size-full object-cover" /> :
                    <CatalogArtwork name={product.name} />}
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
                  <Link href={href} className="line-clamp-2 break-words text-base font-semibold leading-6 hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{product.name}</Link>

                  {product.portion_count && <p className="text-xs text-muted-foreground">{product.portion_count.toLocaleString("vi-VN")} người</p>}
                  <div className="catalog-nutrition min-h-14 text-muted-foreground"><NutritionChip nutrition={product.nutrition} /></div>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                  <p className="text-base font-semibold tabular-nums">{product.base_price_vnd === undefined ? t("noPrice") : <>{formatVND(product.base_price_vnd)}<span className="text-xs font-normal text-muted-foreground">/gói</span></>}</p>
                  {product.sku_ref && product.branch_ref && product.base_price_vnd !== undefined && <Button
                    variant="secondary" size="compact" className="whitespace-normal text-xs"
                    disabled={adding || product.available_quantity === undefined || product.available_quantity <= 0}
                    onClick={() => void add()}
                  ><Plus aria-hidden="true" className="size-4 text-muted-foreground" />{adding ? t("adding") : product.available_quantity === undefined ? t("unknownStock") : product.available_quantity <= 0 ? t("outOfStock") : "Thêm giỏ"}</Button>}
                  </div>
                </div>
              </Card>;
}
