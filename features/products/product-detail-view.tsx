"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  PackageCheck,
  Tag,
  Barcode,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShoppingCart,
  Sparkles,
  Layers,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Product, activateProduct, addToCart, formatVND, getOrCreateCartId, recordCartResponse } from "@/lib/api/sales";
import { PageShell, PageHeader } from "@/components/ui/page";

interface ProductDetailViewProps {
  initialProduct: Product;
}

export function ProductDetailView({ initialProduct }: ProductDetailViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product>(initialProduct);
  const [activating, setActivating] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleActivate = async () => {
    setActivating(true);
    try {
      const updated = await activateProduct(product.id);
      setProduct(updated);
      toast.success(
        "Kích hoạt mở bán thành công",
        `Sản phẩm ${updated.name} đã chuyển sang trạng thái mở bán (ACTIVE).`
      );
      router.refresh();
    } catch (err: unknown) {
      toast.error("Kích hoạt thất bại", err instanceof Error ? err.message : String(err));
    } finally {
      setActivating(false);
    }
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      const cart = await addToCart(getOrCreateCartId(), {
        product_id: product.id,
        quantity,
      });
      recordCartResponse(cart, product);
      toast.success(
        "Đã thêm vào giỏ hàng",
        `Đã thêm ${quantity} ${product.uom} ${product.name} vào giỏ hàng.`
      );
    } catch (err: unknown) {
      toast.error("Không thể thêm vào giỏ", err instanceof Error ? err.message : String(err));
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <PageShell>
      <div className="mb-4">
        <Link
          href={"/products" as Route}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Quay lại Danh mục Sản phẩm
        </Link>
      </div>

      <PageHeader
        icon={<PackageCheck />}
        title={product.name}
        badge={
          product.status === "ACTIVE" ? (
            <Badge variant="active" dot className="text-xs font-bold">
              Đang mở bán
            </Badge>
          ) : product.status === "DRAFT" ? (
            <Badge variant="secondary" dot className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20">
              Bản nháp (DRAFT)
            </Badge>
          ) : (
            <Badge variant="revoked" dot className="text-xs font-bold">
              Tạm ngưng bán
            </Badge>
          )
        }
        description={`Mã SKU: ${product.sku_code} · Đơn vị tính: ${product.uom}`}
        actions={
          product.status === "DRAFT" ? (
            <Button
              type="button"
              onClick={handleActivate}
              disabled={activating}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              <CheckCircle2 className="size-4 mr-1.5" />
              {activating ? "Đang kích hoạt..." : "Kích hoạt mở bán (ACTIVE)"}
            </Button>
          ) : product.status === "ACTIVE" ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-[var(--border)] rounded-xl bg-[var(--card)] px-2 py-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2 py-0.5 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  -
                </button>
                <span className="px-2 text-xs font-bold text-[var(--foreground)]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-2 py-0.5 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  +
                </button>
              </div>

              <Button
                type="button"
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
              >
                <ShoppingCart className="size-4 mr-1.5" />
                {addingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
              </Button>
            </div>
          ) : null
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left Column: Product Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-[var(--border)] bg-[var(--card)] p-6">
            <CardHeader className="p-0 pb-4 border-b border-[var(--border)]">
              <CardTitle className="text-base font-bold text-[var(--foreground)]">
                Thông tin Chi tiết Sản phẩm
              </CardTitle>
              <CardDescription className="text-xs text-[var(--muted-foreground)]">
                Quy cách đóng gói, mã định danh và mô tả bảo quản thực phẩm
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 pt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]">
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)] font-semibold uppercase">
                    <Tag className="size-3.5 text-emerald-500" />
                    <span>Mã SKU</span>
                  </div>
                  <div className="text-sm font-mono font-bold text-[var(--foreground)] mt-1">
                    {product.sku_code}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]">
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)] font-semibold uppercase">
                    <Barcode className="size-3.5 text-emerald-500" />
                    <span>Mã vạch Barcode</span>
                  </div>
                  <div className="text-sm font-mono font-bold text-[var(--foreground)] mt-1">
                    {product.barcode || "Chưa gán mã"}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]">
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)] font-semibold uppercase">
                    <Layers className="size-3.5 text-emerald-500" />
                    <span>Đơn vị tính</span>
                  </div>
                  <div className="text-sm font-bold text-[var(--foreground)] mt-1">
                    {product.uom}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]">
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)] font-semibold uppercase">
                    <Calendar className="size-3.5 text-emerald-500" />
                    <span>Ngày tạo SKU</span>
                  </div>
                  <div className="text-xs font-semibold text-[var(--foreground)] mt-1">
                    {new Date(product.created_at).toLocaleString("vi-VN")}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/20">
                <h4 className="text-xs font-bold text-[var(--foreground)] mb-1">Mô tả mặt hàng:</h4>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                  {product.description || "Chưa có mô tả chi tiết cho mặt hàng này."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Pricing & Quick Actions */}
        <div className="space-y-6">
          <Card className="rounded-2xl border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent p-6">
            <CardHeader className="p-0 pb-4 border-b border-[var(--border)]">
              <CardTitle className="text-base font-bold text-[var(--foreground)] flex items-center justify-between">
                <span>Giá Niêm Yết</span>
                <Sparkles className="size-4 text-emerald-500" />
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 pt-5 space-y-4">
              <div>
                <div className="text-xs text-[var(--muted-foreground)]">Đơn giá chuẩn / {product.uom}</div>
                <div className="font-serif text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatVND(product.base_price_vnd)}
                </div>
              </div>

              {product.status === "DRAFT" && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    Sản phẩm chưa mở bán. Cần bấm <strong>Kích hoạt mở bán</strong> phía trên để cho phép nhân viên và khách hàng thêm vào giỏ.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
