"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------- Global scroll lock ref counter ----------
// Prevents race condition when multiple modals are open simultaneously.
// Only resets body overflow when ALL modals have closed.
let scrollLockCount = 0;
let savedPaddingRight = "";

function lockScroll() {
  if (scrollLockCount === 0 && typeof document !== "undefined") {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    savedPaddingRight = document.body.style.paddingRight;
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflow = "hidden";
  }
  scrollLockCount++;
}

function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0 && typeof document !== "undefined") {
    document.body.style.paddingRight = savedPaddingRight;
    document.body.style.overflow = "";
  }
}

// ---------- Dialog Context ----------
interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined);

export function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a <Dialog />");
  }
  return context;
}

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({
  asChild,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { setOpen } = useDialog();

  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as { onClick?: (e: React.MouseEvent) => void };
    return React.cloneElement(children, {
      ...childProps,
      onClick: (e: React.MouseEvent) => {
        childProps.onClick?.(e);
        setOpen(true);
      },
    } as React.Attributes);
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  );
}

// ---------- Layer definitions ----------
// L4 = standard modals (z-70), L5 = fail-closed (z-80), L6 = session lock (z-90)
export type DialogLayer = "standard" | "critical" | "session";

const LAYER_CONFIG: Record<DialogLayer, { container: string; surface: string; backdrop: string; preventDismiss: boolean }> = {
  standard: {
    container: "z-[70]",
    surface: "z-[71]",
    backdrop: "bg-black/60 backdrop-blur-md",
    preventDismiss: false,
  },
  critical: {
    container: "z-[80]",
    surface: "z-[81]",
    backdrop: "bg-black/75 backdrop-blur-lg",
    preventDismiss: true, // No Esc, no backdrop click
  },
  session: {
    container: "z-[90]",
    surface: "z-[91]",
    backdrop: "bg-black/85 backdrop-blur-2xl",
    preventDismiss: true, // Full app lock
  },
};

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  showClose?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  layer?: DialogLayer;
}

export function DialogContent({
  children,
  className,
  showClose = true,
  size = "md",
  layer = "standard",
  ...props
}: DialogContentProps) {
  const { open, setOpen } = useDialog();
  const [mounted, setMounted] = React.useState(false);
  const config = LAYER_CONFIG[layer];

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (config.preventDismiss) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    lockScroll();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      unlockScroll();
    };
  }, [open, setOpen, config.preventDismiss]);

  if (!open || !mounted) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-6xl",
  };

  const handleBackdropClick = () => {
    if (!config.preventDismiss) {
      setOpen(false);
    }
  };

  const content = (
    <div
      className={cn("fixed inset-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto", config.container)}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 transition-opacity animate-in fade-in-0 duration-200",
          config.backdrop
        )}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        className={cn(
          "relative w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-[var(--card-foreground)] shadow-2xl transition-all animate-in fade-in-0 zoom-in-95 duration-200 will-change-transform",
          config.surface,
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}

        {showClose && !config.preventDismiss && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-xl p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            aria-label="Đóng hộp thoại"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-left mb-4", className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 mt-6 border-t border-[var(--border)] gap-2 sm:gap-0",
        className
      )}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "font-serif text-lg sm:text-xl font-bold tracking-tight text-[var(--foreground)]",
        className
      )}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs text-[var(--muted-foreground)] leading-relaxed", className)}
      {...props}
    />
  );
}

export function DialogClose({
  asChild,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { setOpen } = useDialog();

  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as { onClick?: (e: React.MouseEvent) => void };
    return React.cloneElement(children, {
      ...childProps,
      onClick: (e: React.MouseEvent) => {
        childProps.onClick?.(e);
        setOpen(false);
      },
    } as React.Attributes);
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => setOpen(false)}
      {...props}
    >
      {children}
    </button>
  );
}
