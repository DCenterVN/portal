"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { nextTab } from "./tabs";
import motion from "./console-motion.module.css";

// Esc closes and hands focus back to the trigger; a press outside closes and leaves focus where the user put it.
export function popoverDismiss(root: { contains(node: unknown): boolean }, trigger: { focus(): void } | null, close: () => void) {
  return {
    keydown(event: { key: string }) {
      if (event.key !== "Escape") return;
      close();
      trigger?.focus();
    },
    pointerdown(event: { target: unknown }) {
      if (!root.contains(event.target)) close();
    },
  };
}

// Vertical menu: Up/Down reuse the tab roving logic (wraps), Home/End jump.
const MENU_KEYS: Record<string, string> = { ArrowDown: "ArrowRight", ArrowUp: "ArrowLeft", Home: "Home", End: "End" };
const ITEM = '[role="menuitem"]';

const PopoverClose = React.createContext<() => void>(() => {});

export interface PopoverProps {
  trigger: React.ReactNode;
  /** Accessible name when the trigger is icon-only. */
  label?: string;
  triggerClassName?: string;
  align?: "start" | "end";
  menu?: boolean;
  defaultOpen?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// L3 layer: glass, no scrim, the page stays usable. Positioned under the trigger, no collision handling.
export function Popover({ trigger, label, triggerClassName, align = "start", menu = false, defaultOpen = false, className, children }: PopoverProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const panelId = React.useId();

  React.useEffect(() => {
    const root = rootRef.current;
    if (!open || !root) return;
    if (menu) panelRef.current?.querySelector<HTMLElement>(ITEM)?.focus();
    const dismiss = popoverDismiss(root, triggerRef.current, () => setOpen(false));
    document.addEventListener("keydown", dismiss.keydown);
    document.addEventListener("pointerdown", dismiss.pointerdown);
    return () => {
      document.removeEventListener("keydown", dismiss.keydown);
      document.removeEventListener("pointerdown", dismiss.pointerdown);
    };
  }, [open, menu]);

  const close = React.useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const key = MENU_KEYS[event.key];
    if (!menu || !key) return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(ITEM));
    const next = nextTab(items, document.activeElement as HTMLElement, key);
    if (!next) return;
    event.preventDefault();
    next.focus();
  };

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup={menu ? "menu" : undefined}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={triggerClassName}
        onClick={() => setOpen(!open)}
      >
        {trigger}
      </button>
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role={menu ? "menu" : undefined}
          onKeyDown={onKeyDown}
          className={cn(
            "absolute top-full z-(--z-popover) mt-2 min-w-48 rounded-lg border border-glass-edge bg-glass-l3 p-1 text-fg shadow-l3 glass-blur-l3",
            align === "end" ? "right-0" : "left-0",
            motion.popover,
            className,
          )}
        >
          <PopoverClose.Provider value={close}>{children}</PopoverClose.Provider>
        </div>
      )}
    </div>
  );
}

export function MenuItem({ className, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const close = React.useContext(PopoverClose);
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      className={cn(
        "flex min-h-11 w-full items-center gap-2 rounded-sm px-3 text-left text-sm text-fg hover:bg-l1-2 focus-visible:bg-l1-2 focus-visible:outline-none md:min-h-8",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) close();
      }}
      {...props}
    />
  );
}
