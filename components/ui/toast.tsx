"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

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

export function ToastProvider({ children }: { children: React.ReactNode }) {
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
      const duration = opts.duration ?? 4000;
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
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
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
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (toasts.length === 0 || !mounted || typeof document === "undefined") return null;

  const content = (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
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
    bg: string;
    border: string;
    iconColor: string;
    icon: typeof CheckCircle2;
  }
> = {
  success: {
    bg: "bg-[var(--card)]/95 dark:bg-[#15231c]/95",
    border: "border-emerald-500/30",
    iconColor: "text-emerald-500",
    icon: CheckCircle2,
  },
  error: {
    bg: "bg-[var(--card)]/95 dark:bg-[#251518]/95",
    border: "border-rose-500/30",
    iconColor: "text-rose-500",
    icon: AlertCircle,
  },
  warning: {
    bg: "bg-[var(--card)]/95 dark:bg-[#252015]/95",
    border: "border-amber-500/30",
    iconColor: "text-amber-500",
    icon: AlertTriangle,
  },
  info: {
    bg: "bg-[var(--card)]/95 dark:bg-[#151e28]/95",
    border: "border-sky-500/30",
    iconColor: "text-sky-500",
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
      role="alert"
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-3 fade-in-0",
        style.bg,
        style.border
      )}
    >
      <Icon className={cn("size-5 shrink-0 mt-0.5", style.iconColor)} />
      <div className="flex-1 space-y-0.5 text-left">
        <h4 className="text-xs font-bold text-[var(--foreground)] leading-tight">
          {toast.title}
        </h4>
        {toast.description && (
          <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-lg p-1 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors"
        aria-label="Đóng thông báo"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
