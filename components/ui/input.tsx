import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-[var(--color-input-border)] bg-[var(--color-surface)] text-[var(--color-ink)] px-3 py-1 text-sm shadow-[var(--elevation-shadow-card)] transition-colors duration-150 ease-out motion-reduce:transition-none file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] disabled:cursor-not-allowed disabled:bg-[var(--color-tint)]",
          className
        )}
        ref={ref}
        style={{ borderWidth: 1.5, ...style }}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
