import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.ComponentProps<"button">, "onChange"> {
  checked: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({ checked, onCheckedChange, onClick, onKeyDown, className, children, ...props }: CheckboxProps) {
  const Icon = checked === "indeterminate" ? Minus : Check;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked === "indeterminate" ? "mixed" : checked}
      className={cn(
        "inline-flex min-h-6 min-w-6 items-center gap-2.5 text-left text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50 max-md:min-h-11",
        className,
      )}
      onClick={(event) => { onClick?.(event); onCheckedChange?.(checked !== true); }}
      onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); onKeyDown?.(event); }}
      {...props}
    >
      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-[var(--r-2)] border transition-colors duration-100",
          checked ? "border-p bg-p text-on-p" : "border-line-strong bg-l1",
        )}
      >
        {checked && <Icon aria-hidden="true" className="size-3" strokeWidth={3.5} />}
      </span>
      {children}
    </button>
  );
}
