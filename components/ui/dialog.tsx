"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import motion from "./console-motion.module.css";

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
  titleId: string;
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
  const titleId = React.useId();

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
    <DialogContext.Provider value={{ open, setOpen, titleId }}>
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
// L4 = standard modals, L5 = fail-closed (no Esc, no backdrop click), L6 = session lock. Order: --z-* in globals.css.
export type DialogLayer = "standard" | "critical" | "session";

const LAYER_CONFIG: Record<DialogLayer, { container: string; preventDismiss: boolean }> = {
  standard: { container: "z-(--z-modal)", preventDismiss: false },
  critical: { container: "z-(--z-modal-critical)", preventDismiss: true },
  session: { container: "z-(--z-modal-session)", preventDismiss: true },
};

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Open dialogs in opening order; only the top one (highest layer, then latest opened) handles Tab and Escape.
type OpenSurface<T = HTMLElement> = { surface: T; rank: number };
const openSurfaces: OpenSurface[] = [];
const LAYER_RANK: Record<string, number> = { standard: 0, critical: 1, session: 2 };

export function isTopLayer<T>(stack: readonly OpenSurface<T>[], surface: T): boolean {
  const top = stack.reduce<OpenSurface<T> | null>((best, item) => (!best || item.rank >= best.rank ? item : best), null);
  return top?.surface === surface;
}

// Tab from the last focusable wraps to the first (Shift+Tab the reverse); null = let the browser move focus.
export function wrapFocus<T>(items: T[], active: unknown, backwards: boolean): T | null {
  if (items.length === 0) return null;
  const first = items[0];
  const last = items[items.length - 1];
  const inside = items.includes(active as T);
  if (backwards) return !inside || active === first ? last : null;
  return !inside || active === last ? first : null;
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  showClose?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  layer?: DialogLayer;
  /** sheet: bottom sheet below md, centered modal from md up. */
  variant?: "modal" | "sheet";
}

export function DialogContent({
  children,
  className,
  showClose = true,
  size = "md",
  layer = "standard",
  variant = "modal",
  ...props
}: DialogContentProps) {
  const { open, setOpen, titleId } = useDialog();
  const sheet = variant === "sheet";
  const [mounted, setMounted] = React.useState(false);
  const config = LAYER_CONFIG[layer];
  const surfaceRef = React.useRef<HTMLDivElement>(null);
  const [opener, setOpener] = React.useState<HTMLElement | null>(null);
  const dismiss = React.useRef({ setOpen, preventDismiss: config.preventDismiss });
  const openerRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    dismiss.current = { setOpen, preventDismiss: config.preventDismiss };
    openerRef.current = opener;
  });

  // Runs before children mount, so a child's autoFocus has not moved focus away from the opener yet.
  if (open && !opener && typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
    setOpener(document.activeElement);
  }

  // Only open/close transitions: re-running per render would steal focus from inputs on every keystroke.
  React.useEffect(() => {
    const surface = surfaceRef.current;
    if (!open || !mounted || !surface) return;
    const entry = { surface, rank: LAYER_RANK[layer] ?? 0 };
    openSurfaces.push(entry);
    if (isTopLayer(openSurfaces, surface) && !surface.contains(document.activeElement)) surface.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTopLayer(openSurfaces, surface)) return;
      if (e.key === "Tab") {
        const items = Array.from(surface.querySelectorAll<HTMLElement>(FOCUSABLE));
        const target = wrapFocus(items, document.activeElement, e.shiftKey);
        if (target || items.length === 0) e.preventDefault();
        target?.focus();
        return;
      }
      if (e.key !== "Escape") return;
      if (dismiss.current.preventDismiss) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      dismiss.current.setOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    lockScroll();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      unlockScroll();
      openSurfaces.splice(openSurfaces.indexOf(entry), 1);
      // Close or unmount: give focus back to the opener, unless another dialog still owns the keyboard.
      const back = openerRef.current;
      if (openSurfaces.length === 0 && back?.isConnected) back.focus();
      setOpener(null);
    };
  }, [open, mounted, layer]);

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
      className={cn("fixed inset-0 flex items-center justify-center overflow-y-auto p-4 sm:p-6", sheet && "max-md:items-end max-md:p-0", config.container)}
    >
      <div className={cn("fixed inset-0 bg-scrim", motion.backdrop)} onClick={handleBackdropClick} aria-hidden="true" />

      {/* Modal Surface */}
      <div
        ref={surfaceRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative w-full rounded-xl border border-line bg-l1 p-6 text-fg shadow-l3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
          sizeClasses[size],
          sheet && "max-md:max-w-none max-md:rounded-b-none max-md:animate-sheet-in motion-reduce:animate-none",
          motion.dialog,
          sheet && motion.sheet,
          className
        )}
        {...props}
      >
        {children}

        {showClose && !config.preventDismiss && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-2 top-2 inline-flex size-11 items-center justify-center rounded-xl bg-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none after:absolute after:left-1/2 after:top-1/2 after:size-5 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-sm after:content-[''] focus-visible:after:outline focus-visible:after:outline-1 focus-visible:after:outline-[var(--color-focus)]"
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
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 mt-6 border-t border-[var(--color-line)] gap-2 sm:gap-0",
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
  const titleId = React.useContext(DialogContext)?.titleId;
  return (
    <h2
      id={titleId}
      className={cn(
        "font-serif text-lg sm:text-xl font-bold tracking-tight text-[var(--color-ink)]",
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
      className={cn("text-xs text-[var(--color-muted)] leading-relaxed", className)}
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

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  children?: React.ReactNode;
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, danger, busy, confirmDisabled, onConfirm, children }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(value) => !busy && onOpenChange(value)}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <DialogFooter>
          {/* A destructive confirm never takes first focus: Enter on open must not delete. */}
          <Button variant="outline" size="touch" disabled={busy} onClick={() => onOpenChange(false)} autoFocus={danger}>
            Huỷ
          </Button>
          <Button variant={danger ? "destructive" : "default"} size="touch" disabled={busy || confirmDisabled} onClick={onConfirm} autoFocus={!danger}>
            {busy ? "Đang xử lý…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
