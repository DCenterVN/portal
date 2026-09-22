"use client";

import React from "react";

export interface QuantityPickerProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export function QuantityPicker({
  value,
  onChange,
  min = 1,
  max = 99,
  step = 1,
  disabled = false,
  className = "",
}: QuantityPickerProps) {
  const handleDecrement = () => {
    if (disabled || value <= min) return;
    onChange(Math.max(min, value - step));
  };

  const handleIncrement = () => {
    if (disabled || value >= max) return;
    onChange(Math.min(max, value + step));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.max(min, Math.min(max, parsed));
    onChange(clamped);
  };

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-1 ${className}`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="Giảm số lượng"
        className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-[var(--color-ink)] transition-colors hover:bg-[var(--color-panel)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        </svg>
      </button>

      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="h-10 w-12 bg-transparent text-center font-sans text-sm font-semibold text-[var(--color-ink)] focus:outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label="Tăng số lượng"
        className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-[var(--color-ink)] transition-colors hover:bg-[var(--color-panel)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  );
}
