"use client";

import { useRef, useState, type CSSProperties } from "react";
import { toast } from "@/components/ui/toast";
import { addToCart, getOrCreateCartId, recordCartResponse, type Product } from "@/lib/api/sales";

import { nutrientFields, nutritionNumber, type CatalogNutrition } from "@/lib/nutrition";
import { FOOD_SLOTS } from "@/features/production/pack-shared";

export function productComponents(nutrition: CatalogNutrition | null | undefined, productName: string) {
  return (nutrition?.components ?? []).map((component, index, components) => {
    const cleaned = component.name.replace(/\s+\d+(?:[.,]\d+)?\s*(?:kg|mg|g|ml|l)\s*$/i, "");
    const [ingredient, group] = cleaned.split(" · ");
    const groupName = FOOD_SLOTS.find(slot => slot.id === group)?.name;
    const name = groupName ? ingredient === productName ? groupName : `${ingredient} · ${groupName}` : cleaned;
    const angle = (-90 + index * 360 / components.length) * Math.PI / 180;
    const totalKcal = nutrition?.per_serving.kcal;
    return {
      name, grams: nutritionNumber(component.grams),
      share: component.kcal !== null && totalKcal != null && Number(totalKcal) > 0
        ? `${Math.round(Number(component.kcal) / Number(totalKcal) * 100).toLocaleString("vi-VN")}% kcal của món` : "Chưa có tỉ lệ kcal",
      position: { left: `${50 + Math.cos(angle) * 29}%`, top: `${50 + Math.sin(angle) * 29}%` },
      arrival: { animationDelay: `${index * 40}ms`, "--from": `${-Math.cos(angle) * 100}px ${-Math.sin(angle) * 100}px` } satisfies CSSProperties & { "--from": string },
      nutrients: [nutrientFields[0], nutrientFields[1], nutrientFields[2], nutrientFields[3]].map(([key, label, unit]) => ({
        key, label, value: component[key] == null ? "Chưa có" : `${nutritionNumber(component[key])} ${unit}`,
      })),
    };
  });
}

export function useProductDetail(initialProduct: Product) {
  const variants = initialProduct.variants?.filter(variant => variant.sellable === true) ?? [];
  const [selectedSku, setSelectedSku] = useState("");
  const variant = variants.find(item => item.id === selectedSku) ?? variants[0];
  const product = variant ? { ...initialProduct, ...variant, id: initialProduct.id, name: initialProduct.name,
    sku_ref: variant.id, uom: variant.uom_code, base_price_vnd: variant.unit_price_vnd ?? variant.base_price_vnd,
    available_quantity: variant.available_quantity ?? undefined, nutrition: variant.nutrition ?? initialProduct.nutrition,
    allergen_summary: variant.allergen_summary,
  } : initialProduct;
  const [selectedComponent, setSelectedComponent] = useState<number | null>(null);
  const dishRef = useRef<HTMLButtonElement>(null);
  const [failedImage, setFailedImage] = useState("");
  const image = product.image_urls?.[0];
  const cover = image && image !== failedImage ? image : undefined;
  const components = productComponents(product.nutrition, product.name);
  const selected = selectedComponent === null ? undefined : components[selectedComponent];
  function resetComponent() { setSelectedComponent(null); }
  function onDrawerOpenChange(open: boolean) { if (!open) resetComponent(); }
  const componentTriggerRef = useRef<HTMLButtonElement | null>(null);
  function selectComponent(index: number, trigger: HTMLButtonElement) {
    componentTriggerRef.current = trigger;
    setSelectedComponent(index);
  }
  function restoreComponentFocus(event: Event) {
    event.preventDefault();
    componentTriggerRef.current?.focus();
  }
  const summary = [
    product.portion_count ? `Cho ${product.portion_count.toLocaleString("vi-VN")} người` : null,
    product.net_weight_g ? `${product.net_weight_g.toLocaleString("vi-VN")} g` : null,
    product.nutrition?.per_serving.kcal != null ? `${nutritionNumber(product.nutrition.per_serving.kcal)} kcal/người` : null,
    product.nutrition?.per_serving.protein_g != null ? `${nutritionNumber(product.nutrition.per_serving.protein_g)} g đạm/người` : null,
  ].filter(Boolean).join(" · ");
  const variantOptions = variants.map(item => ({ value: item.id, label: [item.variant_label || "Gói", item.net_weight_g ? `${item.net_weight_g.toLocaleString("vi-VN")} g` : null].filter(Boolean).join(" · ") }));
  const variantLabel = variantOptions.find(item => item.value === product.sku_ref)?.label ?? "Chưa có quy cách";
  const pricePerPerson = product.portion_count && product.base_price_vnd !== undefined
    ? Math.round(product.base_price_vnd / product.portion_count / 100) * 100 : undefined;
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  function selectVariant(sku: string) {
    setSelectedSku(sku);
    resetComponent();
    setQuantity(1);
  }
  const canBuy = (initialProduct.variants === undefined || variants.length > 0) && product.status === "ACTIVE" && !!product.sku_ref && !!product.branch_ref && product.base_price_vnd !== undefined && product.available_quantity !== undefined && product.available_quantity >= quantity;
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
  return { product, variantOptions, variantLabel, summary, pricePerPerson, components, selected, selectedComponent, selectComponent, resetComponent, onDrawerOpenChange, restoreComponentFocus, dishRef, cover, onImageError: () => setFailedImage(image ?? ""), variants, selectVariant, addingToCart, quantity, setQuantity, canBuy, handleAddToCart };
}
