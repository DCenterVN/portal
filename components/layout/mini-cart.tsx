"use client";

import Link from "next/link";
import type { Route } from "next";
import { ShoppingBag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type CartPreviewItem = { id: string; name: string; quantity: number; priceVnd: number };

// ponytail: same output as formatVND in lib/api/sales.ts, which components/ may not import (archcheck FE-08).
// Move both to lib/format.ts when a third caller appears.
const vnd = new Intl.NumberFormat("vi-VN");
const money = (amount: number) => `${vnd.format(amount)} ₫`;

// Popover has no collision handling; under md its panels span the viewport just below the 60px header instead.
export const MOBILE_PANEL = "max-md:fixed max-md:inset-x-4 max-md:top-15 max-md:w-auto";

/** Header cart button. `items` arrive in add order (oldest first); the panel shows the newest three. */
export function MiniCart({ items, cartHref }: { items: CartPreviewItem[]; cartHref: string }) {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.quantity * item.priceVnd, 0);
  const shown = items.slice(-3).reverse();
  const more = items.length - shown.length;

  return (
    <Popover
      align="end"
      label={`Giỏ hàng, ${count} món`}
      triggerClassName={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
      className={cn("w-80 p-0", MOBILE_PANEL)}
      trigger={
        <>
          <ShoppingBag className="size-5" aria-hidden="true" />
          {count > 0 && (
            <span className="absolute right-0 top-0 min-w-5 rounded-full bg-p px-1.5 text-xs font-bold leading-5 text-on-p tabular-nums">
              {count}
            </span>
          )}
        </>
      }
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <ShoppingBag className="size-6 text-fg-3" aria-hidden="true" />
          <p className="font-bold">Giỏ hàng trống</p>
          <Link href="/products" className="flex min-h-11 items-center text-sm font-bold text-p-text hover:underline">
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3 p-3">
            {shown.map((item) => (
              <li key={item.id} className="flex items-baseline gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate font-bold">{item.name}</span>
                <span className="text-fg-3 tabular-nums">×{item.quantity}</span>
                <span className="font-extrabold tabular-nums">{money(item.quantity * item.priceVnd)}</span>
              </li>
            ))}
          </ul>
          {more > 0 && <p className="px-3 text-sm text-fg-2">{`+${more} món khác`}</p>}
          <div className="mt-3 flex flex-col gap-3 border-t border-line p-3">
            <p className="flex items-baseline justify-between text-sm">
              <span className="text-fg-2">Tạm tính</span>
              <span className="text-base font-extrabold tabular-nums">{money(total)}</span>
            </p>
            <div className="flex gap-2">
              <Link href={cartHref as Route} className={buttonVariants({ variant: "outline", size: "md", className: "flex-1" })}>Xem giỏ</Link>
              <Link href={cartHref as Route} className={buttonVariants({ variant: "primary", size: "md", className: "flex-1" })}>Thanh toán</Link>
            </div>
          </div>
        </>
      )}
    </Popover>
  );
}
