"use client";

import type { Route } from "next";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product } from "@/lib/api/sales";
import { formatVND } from "@/lib/format";
import { useProductDetail } from "./use-product-detail";
import { PageShell } from "@/components/ui/page";
import { ProductCompartmentDrawer } from "./product-compartment-drawer";
import { ProductOrbit } from "./product-orbit";
import styles from "./product-orbit.module.css";
import { ProductDetailInfo } from "./product-detail-info";
import { RelatedProducts } from "./related-products";

export function ProductDetailView({ initialProduct, branchId }: { initialProduct: Product; branchId?: string }) {
  const detail = useProductDetail(initialProduct);
  const { product, variantOptions, variantLabel, summary, pricePerPerson, selectVariant, addingToCart, quantity, setQuantity, canBuy, handleAddToCart } = detail;
  return <PageShell className="catalog product-detail bg-background">
    <nav aria-label="Đường dẫn" className="mb-6 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
      <Link href={(branchId ? `/products?branch_id=${encodeURIComponent(branchId)}` : "/products") as Route} className="inline-flex min-h-11 shrink-0 items-center hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">Sản phẩm</Link>
      <ChevronRight aria-hidden="true" className="size-4 shrink-0" /><span aria-current="page" className="truncate text-foreground">{product.name}</span>
    </nav>
    <div className={styles.layout}>
      <ProductOrbit detail={detail} />
      <div className="min-w-0 py-1">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{product.name}</h1>
        {summary && <p className="mt-4 text-sm text-muted-foreground">{summary}</p>}
        {product.description && <p className="mt-5 text-base leading-7 text-muted-foreground">{product.description}</p>}
        <p className="mt-6 text-3xl font-semibold tabular-nums text-primary">{product.base_price_vnd === undefined ? "Chưa có giá" : <>{formatVND(product.base_price_vnd)}<span className="ml-2 text-sm font-normal text-muted-foreground">/ gói{product.portion_count ? ` ${product.portion_count.toLocaleString("vi-VN")} người` : ""}</span></>}</p>
        {pricePerPerson !== undefined && <p className="mt-2 text-sm text-muted-foreground">≈ {formatVND(pricePerPerson)}/người</p>}
        <div className="mt-6 max-w-xs space-y-2">
          <label htmlFor="meal-serving" className="text-sm font-medium">Quy cách</label>
          <Select value={product.sku_ref ?? ""} disabled={addingToCart || !variantOptions.length} onValueChange={selectVariant}>
            <SelectTrigger id="meal-serving" aria-label="Quy cách" className="h-11 w-full rounded-sm border-0 bg-muted/50 shadow-none data-[size=default]:h-11"><SelectValue placeholder={variantLabel}>{variantLabel}</SelectValue></SelectTrigger>
            <SelectContent position="popper">{variantOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="mt-6 space-y-2">
          {product.available_quantity !== undefined && <p className="text-sm text-muted-foreground">Còn {product.available_quantity.toLocaleString("vi-VN")} gói</p>}
          <p className="text-sm font-medium">Số lượng</p>
          <div className="flex flex-wrap gap-3">
            <div aria-label="Số lượng" className="flex items-center rounded-[var(--r-6)] bg-muted/60">
              <Button variant="ghost" className="size-11" disabled={addingToCart || quantity <= 1} onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Giảm số lượng"><Minus aria-hidden="true" className="size-5" /></Button>
              <span aria-live="polite" className="min-w-10 text-center font-medium tabular-nums">{quantity}</span>
              <Button variant="ghost" className="size-11" disabled={addingToCart || product.available_quantity === undefined || quantity >= product.available_quantity} onClick={() => setQuantity(quantity + 1)} aria-label="Tăng số lượng"><Plus aria-hidden="true" className="size-5" /></Button>
            </div>
            <Button size="touch" className="min-w-44 flex-1" disabled={addingToCart || !canBuy} onClick={() => void handleAddToCart()}><ShoppingBag aria-hidden="true" className="size-5" />{addingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}</Button>
          </div>
          {!canBuy && <p className="pt-2 text-sm text-muted-foreground">{product.available_quantity === undefined ? "Chưa có thông tin tồn kho để đặt món." : product.available_quantity < quantity ? "Không đủ số lượng để đặt món." : "Món chưa sẵn sàng để đặt."}</p>}
        </div>
        <ProductDetailInfo product={product} />
      </div>
    </div>
    <ProductCompartmentDrawer detail={detail} />
    <RelatedProducts productId={product.id} branchId={branchId ?? product.branch_ref} />
  </PageShell>;
}
