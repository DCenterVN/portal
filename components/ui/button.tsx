import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[var(--elevation-shadow-card)] hover:bg-[var(--color-primary-hover)]",
        accent:
          "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[var(--elevation-shadow-card)] hover:bg-[var(--color-primary-hover)]",
        primary: "rounded-sm bg-p text-on-p duration-100 hover:bg-p-hover",
        danger: "rounded-sm border border-err bg-transparent text-err duration-100 hover:bg-err-soft",
        destructive: "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-90",
        outline:
          "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--input)]",
        secondary:
          "border border-[var(--border)] bg-transparent text-[var(--primary)]",
        ghost: "text-[var(--foreground)] hover:bg-[var(--secondary)]",
        link: "text-[var(--primary)] underline-offset-4 hover:underline p-0 h-auto font-medium",
      },
      size: {
        default: "min-h-11 px-5",
        sm: "h-8 px-3 text-sm max-md:h-11",
        md: "h-10 px-4 max-md:h-11",
        lg: "h-12 px-5",
        icon: "size-11 p-0",
        touch: "min-h-11 px-5",
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
