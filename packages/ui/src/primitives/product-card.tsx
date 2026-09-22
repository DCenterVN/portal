"use client";

import React from "react";

export interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  unit?: string;
  origin?: string;
  imageUrl?: string;
  badgeText?: string;
  temperature?: string;
  lotCode?: string;
  harvestDate?: string;
  freshnessScore?: string;
  isOutOfStock?: boolean;
  onAddToCart?: (id: string) => void;
  className?: string;
}

export function ProductCard({
  id,
  title,
  price,
  unit = "kg",
  origin,
  imageUrl,
  badgeText = "VietGAP",
  temperature,
  lotCode = "LOT-DL-26",
  harvestDate = "05:00 Hôm nay",
  freshnessScore,
  isOutOfStock = false,
  onAddToCart,
  className = "",
}: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-[var(--color-fresh)]/40 ${className}`}
    >
      <div>
        {/* Image & Cold-Chain Badges */}
        <div className="relative mb-3 aspect-[16/10] w-full overflow-hidden rounded-lg bg-[var(--color-panel-strong)] flex items-center justify-center">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-[var(--color-muted)]">
              <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Top Metadata Badges (Sharp rounded-md, thin border, no shadow) */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
            {badgeText && (
              <span className="inline-flex items-center rounded-md border border-emerald-500/40 bg-emerald-950/80 backdrop-blur-md px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                {badgeText}
              </span>
            )}
            {temperature && (
              <span className="inline-flex items-center rounded-md border border-sky-500/40 bg-sky-950/80 backdrop-blur-md px-2 py-0.5 text-[11px] font-semibold text-sky-200 ml-auto">
                {temperature}
              </span>
            )}
          </div>
        </div>

        {/* Cold-Chain Traceability Data Strip */}
        <div className="mb-2.5 rounded-md border border-[var(--color-line)] bg-[var(--color-panel-strong)]/60 px-2.5 py-1.5 text-[11px] text-[var(--color-muted)] flex items-center justify-between font-mono">
          <span>Lô {lotCode}</span>
          <span>Thu hoạch {harvestDate}</span>
          {freshnessScore && (
            <span className="text-[var(--color-fresh)] font-semibold">
              Tươi {freshnessScore}
            </span>
          )}
        </div>

        {/* Origin */}
        {origin && (
          <div className="text-xs text-[var(--color-muted)]">
            {origin}
          </div>
        )}

        {/* Title */}
        <h3 className="mt-1 font-serif text-base font-bold text-[var(--color-ink)] line-clamp-2 leading-snug group-hover:text-[var(--color-fresh)] transition-colors">
          {title}
        </h3>
      </div>

      {/* Price & Action */}
      <div className="mt-4 pt-3 border-t border-[var(--color-line)] flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="font-sans text-xl font-bold text-[var(--color-fresh)] tracking-tight tabular-nums">
            {formattedPrice}
          </span>
          <span className="text-[11px] text-[var(--color-muted)]">Đơn vị: {unit}</span>
        </div>

        <button
          type="button"
          disabled={isOutOfStock}
          onClick={() => onAddToCart?.(id)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-fresh)] hover:opacity-90 active:scale-95 px-3.5 py-2 text-xs font-semibold text-white shadow-none transition-all disabled:pointer-events-none disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>{isOutOfStock ? "Hết hàng" : "Chọn lô"}</span>
        </button>
      </div>
    </div>
  );
}
