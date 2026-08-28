import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)] shadow",
        secondary:
          "border-transparent bg-[var(--secondary)] text-[var(--secondary-foreground)]",
        destructive:
          "border-transparent bg-[var(--destructive)] text-[var(--destructive-foreground)] shadow",
        outline: "text-[var(--foreground)] border border-[var(--border)]",
        active:
          "bg-[var(--badge-active-bg)] text-[var(--badge-active-text)] border border-emerald-200/40 dark:border-emerald-800/40",
        suspended:
          "bg-[var(--badge-suspended-bg)] text-[var(--badge-suspended-text)] border border-amber-200/40 dark:border-amber-800/40",
        revoked:
          "bg-[var(--badge-revoked-bg)] text-[var(--badge-revoked-text)] border border-rose-200/40 dark:border-rose-800/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot = true, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn("size-1.5 rounded-full", {
            "bg-[var(--badge-active-dot)]": variant === "active",
            "bg-[var(--badge-suspended-dot)]": variant === "suspended",
            "bg-[var(--badge-revoked-dot)]": variant === "revoked",
            "bg-current": variant !== "active" && variant !== "suspended" && variant !== "revoked",
          })}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
