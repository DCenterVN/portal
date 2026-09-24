import { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "cold" | "danger" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-fresh)] text-white hover:opacity-95 active:scale-[0.98] font-semibold border border-transparent shadow-none focus-visible:ring-[var(--color-fresh)]",
  secondary:
    "bg-[var(--color-panel-strong)] text-[var(--color-ink)] border border-[var(--color-line)] hover:bg-[var(--color-panel)] active:scale-[0.98] font-medium shadow-none focus-visible:ring-[var(--color-line)]",
  cold:
    "bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.98] font-semibold border border-transparent shadow-none focus-visible:ring-sky-500",
  danger:
    "bg-[var(--color-danger)] text-white hover:opacity-90 active:scale-[0.98] font-semibold border border-transparent shadow-none focus-visible:ring-[var(--color-danger)]",
  outline:
    "bg-transparent text-[var(--color-ink)] border border-[var(--color-line)] hover:bg-[var(--color-panel-strong)] hover:border-[var(--color-ink)]/20 active:scale-[0.98] shadow-none focus-visible:ring-[var(--color-line)]",
  ghost:
    "bg-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-panel-strong)] active:scale-[0.98] shadow-none focus-visible:ring-[var(--color-line)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-[36px] px-3 py-1.5 text-xs rounded-md",
  md: "min-h-[44px] px-4 py-2 text-sm rounded-lg",
  lg: "min-h-[50px] px-6 py-3 text-base rounded-xl font-semibold",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center font-medium transition-all duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
