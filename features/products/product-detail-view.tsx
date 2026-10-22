"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { type Product, addToCart, formatVND, getOrCreateCartId, recordCartResponse } from "@/lib/api/sales";
import { PageShell, PageHeader } from "@/components/ui/page";

export function ProductDetailView({ initialProduct: product }: { initialProduct: Product }) {
  const { toast } = useToast();
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const canBuy = product.status === "ACTIVE" && !!product.sku_ref && !!product.branch_ref &&
    product.base_price_vnd !== undefined && product.available_quantity !== undefined && product.available_quantity >= quantity;
  async function handleAddToCart() {
    if (!canBuy || !product.sku_ref || !product.branch_ref || addingToCart) return;
    setAddingToCart(true);
    try {
      const cart = await addToCart(getOrCreateCartId(), { sku_ref: product.sku_ref, branch_id: product.branch_ref, quantity });
      recordCartResponse(cart, product);
      toast.success("Đã thêm vào giỏ hàng", `Đã thêm ${quantity} ${product.uom} ${product.name} vào giỏ hàng.`);
    } catch (error) {
      toast.error("Không thể thêm vào giỏ", error instanceof Error ? error.message : "Vui lòng thử lại.");
    } finally {
      setAddingToCart(false);
    }
  }
  return <PageShell>
    <Link href="/products" className="mb-4 inline-flex min-h-11 items-center text-sm">Quay lại danh mục món</Link>
    <PageHeader title={product.name} description={product.description || "Thông tin món và quy cách phục vụ"} />
    <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-2">
      <Card className="overflow-hidden border-[var(--color-line)] bg-[var(--color-surface)] p-0">
        {product.image_urls?.[0] ?
          <img src={product.image_urls[0]} alt={product.name} className="aspect-[4/3] w-full object-cover" /> :
          <div className="flex aspect-[4/3] items-center justify-center bg-[var(--color-tint)] text-sm text-[var(--color-muted)]">Chưa có ảnh</div>}
        {product.description && <CardContent className="p-5"><p className="text-sm text-[var(--color-ink)]">{product.description}</p></CardContent>}
      </Card>
      <Card className="border-[var(--color-line)] bg-[var(--color-surface)]">
        <CardHeader><CardTitle className="text-[var(--color-ink)]">Giá và quy cách</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {product.uom && <p className="text-sm text-[var(--color-ink)]">Đơn vị tính: {product.uom}</p>}
          <p className="text-2xl font-bold text-[var(--color-ink)]">{formatVND(product.base_price_vnd)}</p>
          <div aria-label="Số lượng" className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="min-h-11 min-w-11" disabled={addingToCart || quantity <= 1} onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Giảm số lượng">−</Button>
            <span aria-live="polite">{quantity}</span>
            <Button variant="outline" className="min-h-11 min-w-11" disabled={addingToCart || product.available_quantity === undefined || quantity >= product.available_quantity} onClick={() => setQuantity(quantity + 1)} aria-label="Tăng số lượng">+</Button>
          </div>
          {!canBuy && <p className="text-sm text-[var(--color-muted)]">
            {product.available_quantity === undefined ? "Chưa có thông tin tồn kho để đặt món." : product.available_quantity < quantity ? "Không đủ số lượng để đặt món." : "Món chưa sẵn sàng để đặt."}
          </p>}
          <Button className="min-h-11 w-full" disabled={addingToCart || !canBuy} onClick={() => void handleAddToCart()}>
            {addingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
          </Button>
        </CardContent>
      </Card>
    </div>
  </PageShell>;
}
