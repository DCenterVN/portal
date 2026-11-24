"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatVND } from "@/lib/format";
import type { CartItem } from "@/lib/api/sales";

interface CartItemRowProps {
  item: CartItem;
  busy: boolean;
  onQuantity: (item: CartItem, quantity: number) => void;
  onRemove: (item: CartItem) => void;
}

export function CartItemRow({ item, busy, onQuantity, onRemove }: CartItemRowProps) {
  const editable = !!item.item_id;
  return (
    <TableRow className="border-b border-border">
      <TableCell>
        <div className="flex items-center gap-3">
          <img src={item.image_url || "/images/mon-mac-dinh.svg"} alt="" className="size-10 shrink-0 rounded-sm object-cover" />
          <span className="font-semibold text-xs text-foreground">{item.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-right font-serif font-semibold text-xs text-foreground">{formatVND(item.price_snapshot_vnd)}</TableCell>
      <TableCell className="text-center">
        <Input
          key={`${item.product_id}:${item.quantity}`}
          type="number" inputMode="numeric" min={1} step={1}
          aria-label={`Số lượng ${item.name}`}
          defaultValue={item.quantity}
          disabled={busy || !editable}
          className="mx-auto h-8 w-20 text-center text-xs"
          onBlur={(event) => onQuantity(item, Number(event.target.value))}
          onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
        />
      </TableCell>
      <TableCell className="text-right font-serif font-semibold text-xs text-foreground">{formatVND(item.quantity * item.price_snapshot_vnd)}</TableCell>
      <TableCell className="text-right">
        <Button type="button" variant="ghost" size="icon" aria-label={`Xoá ${item.name} khỏi giỏ`} disabled={busy || !editable} onClick={() => onRemove(item)}>
          <Trash2 aria-hidden="true" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
