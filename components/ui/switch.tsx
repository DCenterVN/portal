import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.ComponentProps<"button">, "onChange"> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

/** Only for settings that take effect immediately; inside a form with a Save button use Checkbox. */
export function Switch({ checked, onCheckedChange, onClick, className, children, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(
        "inline-flex min-h-6 items-center justify-between gap-3 text-left text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50 max-md:min-h-11",
        className,
      )}
      onClick={(event) => { onClick?.(event); onCheckedChange?.(!checked); }}
      {...props}
    >
      {children}
      <span
        className={cn(
          "flex h-6 w-12 shrink-0 rounded-full border p-px transition-colors duration-150",
          checked ? "justify-end border-ok bg-ok" : "justify-start border-line-strong bg-l1",
        )}
      >
        <span className={cn("size-5 rounded-full", checked ? "bg-on-p" : "bg-line-strong")} />
      </span>
    </button>
  );
}
