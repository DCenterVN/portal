"use client";

import Link from "next/link";
import type { Route } from "next";
import { ShoppingBag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type CartPreviewItem = { id: string; name: string; quantity: number; priceVnd: number };

// ponytail: same output as formatVND in lib/api/sales.ts, which components/ may not import (archcheck FE-08).
// Move both to lib/format.ts when a third caller appears.
const vnd = new Intl.NumberFormat("vi-VN");
const money = (amount: number) => `${vnd.format(amount)} ₫`;

/** Header cart button. `items` arrive in add order (oldest first); the panel shows the newest three. */
export function MiniCart({ items, cartHref }: { items: CartPreviewItem[]; cartHref: string }) {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.quantity * item.priceVnd, 0);
  const shown = items.slice(-3).reverse();
  const more = items.length - shown.length;

  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Giỏ hàng, ${count} món`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon", className: "size-11" }), "relative")}
      >
        <ShoppingBag className="size-5" aria-hidden="true" />
        {count > 0 && (
          <span className="absolute right-0 top-0 min-w-5 rounded-full bg-primary px-1.5 text-xs font-bold leading-5 text-primary-foreground tabular-nums">
            {count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-2rem)] p-0 sm:w-80">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <ShoppingBag className="size-6 text-muted-foreground" aria-hidden="true" />
            <p className="font-bold">Giỏ hàng trống</p>
            <Link href="/products" className="flex min-h-11 items-center text-sm font-bold text-accent-foreground hover:underline">
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-3 p-3">
              {shown.map((item) => (
                <li key={item.id} className="flex items-baseline gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate font-bold">{item.name}</span>
                  <span className="text-muted-foreground tabular-nums">×{item.quantity}</span>
                  <span className="font-extrabold tabular-nums">{money(item.quantity * item.priceVnd)}</span>
                </li>
              ))}
            </ul>
            {more > 0 && <p className="px-3 text-sm text-muted-foreground">{`+${more} món khác`}</p>}
            <div className="mt-3 flex flex-col gap-3 border-t border-border p-3">
              <p className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="text-base font-extrabold tabular-nums">{money(total)}</span>
              </p>
              <div className="flex gap-2">
                <Link href={cartHref as Route} className={buttonVariants({ variant: "outline", className: "flex-1" })}>Xem giỏ</Link>
                <Link href={cartHref as Route} className={buttonVariants({ variant: "default", className: "flex-1" })}>Thanh toán</Link>
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
