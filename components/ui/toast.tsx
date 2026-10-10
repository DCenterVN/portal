"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "warning" | "info";
/** store: bottom-center (mobile-first shop), crm: bottom-right (desktop console). */
export type ToastPlacement = "store" | "crm";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  /** e.g. { label: "Hoàn tác", onClick: restore } — keeps the toast up for UNDO_MS so the user can react. */
  action?: { label: string; onClick: () => void };
}

const DEFAULT_MS = 4000;
const UNDO_MS = 10_000;

interface ToastContextValue {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => string;
  removeToast: (id: string) => void;
  toast: {
    (opts: Omit<ToastMessage, "id">): string;
    success: (title: string, description?: string, duration?: number) => string;
    error: (title: string, description?: string, duration?: number) => string;
    warning: (title: string, description?: string, duration?: number) => string;
    info: (title: string, description?: string, duration?: number) => string;
  };
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children, placement = "crm" }: { children: React.ReactNode; placement?: ToastPlacement }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);
  const timersRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Cleanup all timers on unmount
  React.useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const removeToast = React.useCallback((id: string) => {
    // Clear the auto-dismiss timer if it exists
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    (opts: Omit<ToastMessage, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const duration = opts.duration ?? (opts.action ? UNDO_MS : DEFAULT_MS);
      const newToast: ToastMessage = {
        id,
        variant: "info",
        ...opts,
        duration,
      };

      // Deduplication: skip if same title+variant exists within recent toasts
      setToasts((prev) => {
        const isDuplicate = prev.some(
          (t) => t.title === newToast.title && t.variant === newToast.variant
        );
        if (isDuplicate) return prev;
        return [...prev, newToast];
      });

      if (duration > 0) {
        const timer = setTimeout(() => {
          timersRef.current.delete(id);
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    []
  );

  const toast = React.useMemo(() => {
    const fn = (opts: Omit<ToastMessage, "id">) => addToast(opts);
    fn.success = (title: string, description?: string, duration?: number) =>
      addToast({ title, description, variant: "success", duration });
    fn.error = (title: string, description?: string, duration?: number) =>
      addToast({ title, description, variant: "error", duration });
    fn.warning = (title: string, description?: string, duration?: number) =>
      addToast({ title, description, variant: "warning", duration });
    fn.info = (title: string, description?: string, duration?: number) =>
      addToast({ title, description, variant: "info", duration });
    return fn;
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} placement={placement} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a <ToastProvider />");
  }
  return context;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  placement?: ToastPlacement;
}

const PLACEMENT: Record<ToastPlacement, string> = {
  store: "inset-x-0 bottom-4 mx-auto",
  crm: "bottom-4 right-4 sm:px-0",
};

export function ToastContainer({ toasts, onDismiss, placement = "crm" }: ToastContainerProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (toasts.length === 0 || !mounted || typeof document === "undefined") return null;

  const content = (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={cn("fixed z-(--z-toast) flex w-full max-w-md flex-col gap-2.5 px-4 pointer-events-none", PLACEMENT[placement])}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );

  return createPortal(content, document.body);
}

const variantStyles: Record<
  ToastVariant,
  {
    border: string;
    iconColor: string;
    icon: typeof CheckCircle2;
  }
> = {
  success: {
    border: "border-[var(--color-leaf)]",
    iconColor: "text-[var(--color-leaf)]",
    icon: CheckCircle2,
  },
  error: {
    border: "border-[var(--color-danger)]",
    iconColor: "text-[var(--color-danger)]",
    icon: AlertCircle,
  },
  warning: {
    border: "border-[var(--color-sun)]",
    iconColor: "text-[var(--color-sun)]",
    icon: AlertTriangle,
  },
  info: {
    border: "border-[var(--color-info)]",
    iconColor: "text-[var(--color-info)]",
    icon: Info,
  },
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: () => void;
}) {
  const style = variantStyles[toast.variant || "info"];
  const Icon = style.icon;

  return (
    <div
      role={toast.variant === "error" ? "alert" : "status"}
      className={cn("pointer-events-auto flex items-start gap-3 rounded-lg border bg-l1 p-4 shadow-l3", style.border)}
    >
      <Icon className={cn("size-5 shrink-0 mt-0.5", style.iconColor)} />
      <div className="flex-1 space-y-0.5 text-left">
        <h4 className="text-xs font-bold text-[var(--color-ink)] leading-tight">
          {toast.title}
        </h4>
        {toast.description && (
          <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
            {toast.description}
          </p>
        )}
      </div>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            onDismiss();
          }}
          className="shrink-0 rounded-sm px-2 py-1 text-xs font-semibold text-p-text hover:bg-p-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-lg p-1 text-[var(--color-muted)] hover:bg-[var(--color-tint)] hover:text-[var(--color-ink)] transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
        aria-label="Đóng thông báo"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
