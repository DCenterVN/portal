"use client";

import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { addToCart, getOrCreateCartId, recordCartResponse, type Product } from "@/lib/api/sales";

export function useProductDetail(product: Product) {
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const canBuy = product.status === "ACTIVE" && !!product.sku_ref && !!product.branch_ref && product.base_price_vnd !== undefined && product.available_quantity !== undefined && product.available_quantity >= quantity;
  async function handleAddToCart() {
    if (!canBuy || !product.sku_ref || !product.branch_ref || addingToCart) return;
    setAddingToCart(true);
    try {
      const cart = await addToCart(getOrCreateCartId(), { sku_ref: product.sku_ref, branch_id: product.branch_ref, quantity });
      recordCartResponse(cart, product);
      toast.success("Đã thêm vào giỏ hàng", { description: `Đã thêm ${quantity} ${product.uom} ${product.name} vào giỏ hàng.` });
    } catch (error) { toast.error("Không thể thêm vào giỏ", { description: error instanceof Error ? error.message : "Vui lòng thử lại." }); }
    finally { setAddingToCart(false); }
  }
  return { addingToCart, quantity, setQuantity, canBuy, handleAddToCart };
}
