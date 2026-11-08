"use client";

import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useId } from "react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/patterns/inline-alert";
import type { Product } from "@/lib/api/sales";
import { safeMessage } from "@/lib/api/dishes";
import { useActivateProduct } from "./use-activate-product";

export function ProductActivateDialog({ product, allowed, onActivated }: {
  product: Product; allowed: boolean; onActivated: () => Promise<void>;
}) {
  const servingId = useId();
  const action = useActivateProduct(product, allowed, onActivated);
  if (!action.canActivate) return null;
  return <AlertDialog open={action.open} onOpenChange={action.changeOpen}>
    <AlertDialogTrigger asChild><Button variant="outline" size="sm">Mở bán</Button></AlertDialogTrigger>
    <AlertDialogContent aria-busy={action.submitting}>
      <AlertDialogHeader>
        <AlertDialogTitle>Mở bán sản phẩm?</AlertDialogTitle>
        <AlertDialogDescription>
          Xác nhận mở bán {safeMessage(product.name)}. Sản phẩm cần đủ cấu hình và giá bán đã duyệt để xuất hiện trong danh mục khách hàng.
        </AlertDialogDescription>
      </AlertDialogHeader>
      {action.loading && <Skeleton className="h-10 w-full" />}
      {!action.loading && action.variants.length > 0 && <div className="space-y-2">
        <Label htmlFor={servingId}>Suất bán</Label>
        <Select value={action.variantRef} onValueChange={action.selectVariant} disabled={action.selectionLocked}>
          <SelectTrigger id={servingId}><SelectValue placeholder="Chọn suất bán" /></SelectTrigger>
          <SelectContent>{action.variants.map((variant, index) => <SelectItem key={variant.id} value={variant.id}>
            {safeMessage(variant.variant_label || variant.name) || `Suất bán ${index + 1}`}
          </SelectItem>)}</SelectContent>
        </Select>
      </div>}
      {!action.loading && !action.error && action.variants.length === 0 && <InlineAlert>Chưa có suất bán. Hoàn tất món để chuẩn bị định giá.</InlineAlert>}
      {action.needsPrice && <InlineAlert>Chưa có giá bán đã duyệt</InlineAlert>}
      {action.error && <InlineAlert tone="error">{action.error}</InlineAlert>}
      <AlertDialogFooter>
        <AlertDialogCancel disabled={action.submitting}>Để sau</AlertDialogCancel>
        {action.needsPrice || action.error === "Chưa có giá bán đã duyệt" ? <Button asChild><Link href="/sales/pricing">Thiết lập giá bán</Link></Button> : <AlertDialogAction disabled={action.submitting || !action.canSubmit} onClick={event => { event.preventDefault(); void action.activate(); }}>
          {action.submitting ? "Đang mở bán…" : "Xác nhận mở bán"}
        </AlertDialogAction>}
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
