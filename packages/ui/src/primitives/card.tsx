import { forwardRef, type HTMLAttributes } from "react";

export type CardVariant = "default" | "elevated" | "bordered" | "forest" | "cold" | "amber" | "glass";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", className = "", children, ...props }, ref) => {
    const variantClasses = {
      default: "bg-[var(--color-panel)] border border-[var(--color-line)] shadow-sm",
      elevated: "bg-[var(--color-panel)] shadow-[var(--elevation-shadow)] border border-[var(--color-line)]/60",
      bordered: "bg-transparent border border-[var(--color-line)]",
      forest: "bg-[var(--color-forest)] text-white border border-[var(--color-forest)]/30 shadow-md",
      cold: "bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 shadow-sm backdrop-blur-md",
      amber: "bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 shadow-sm backdrop-blur-md",
      glass: "bg-[var(--color-panel)]/75 backdrop-blur-xl border border-[var(--color-line)] shadow-xl",
    }[variant];

    return (
      <div
        ref={ref}
        className={`rounded-2xl p-6 transition-all duration-200 ${variantClasses} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
