import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_16px_rgba(16,185,129,0.3)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_22px_rgba(16,185,129,0.45)] hover:brightness-105 border border-emerald-400/30",
        amber:
          "bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_16px_rgba(245,158,11,0.3)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_22px_rgba(245,158,11,0.45)] hover:brightness-105 border border-amber-400/30",
        destructive:
          "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/25 hover:brightness-105 border border-rose-400/30",
        outline:
          "border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-md text-emerald-300 hover:bg-emerald-500/15 hover:border-emerald-400/50 shadow-sm",
        secondary:
          "bg-white/[0.06] dark:bg-white/[0.04] text-[var(--foreground)] border border-white/10 hover:bg-white/[0.12] hover:border-emerald-500/30 backdrop-blur-md shadow-sm",
        ghost: "hover:bg-white/[0.08] text-[var(--foreground)]",
        link: "text-emerald-500 hover:text-emerald-400 underline-offset-4 hover:underline p-0 h-auto font-medium",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-2xl px-6 text-sm tracking-wide font-bold",
        icon: "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
