"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info" | "cold";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
}

export interface ToastProps {
  id?: string;
  variant?: ToastVariant;
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  switch (variant) {
    case "success":
      return (
        <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-500/20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case "cold":
      return (
        <div className="h-9 w-9 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-300 flex items-center justify-center flex-shrink-0 shadow-sm border border-sky-500/20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v18m-6-15l12 12m0-12L6 18M3 12h18" />
          </svg>
        </div>
      );
    case "warning":
      return (
        <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm border border-amber-500/20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
    case "error":
      return (
        <div className="h-9 w-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 shadow-sm border border-rose-500/20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    case "info":
    default:
      return (
        <div className="h-9 w-9 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 shadow-sm border border-teal-500/20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
  }
}

export function Toast({
  variant = "info",
  title,
  message,
  onClose,
  className = "",
}: ToastProps) {
  const borderAccents = {
    success: "border-emerald-500/30",
    cold: "border-sky-500/30",
    warning: "border-amber-500/30",
    error: "border-rose-500/30",
    info: "border-teal-500/30",
  }[variant];

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3.5 rounded-2xl border bg-[var(--color-panel)]/92 backdrop-blur-xl p-4 shadow-2xl transition-all duration-200 hover:-translate-y-0.5 ${borderAccents} ${className}`}
    >
      <ToastIcon variant={variant} />

      <div className="flex-1 pt-0.5">
        <h4 className="font-serif text-sm font-bold tracking-tight text-[var(--color-ink)]">
          {title}
        </h4>
        {message && (
          <p className="mt-1 text-xs text-[var(--color-muted)] leading-relaxed">
            {message}
          </p>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thông báo"
          className="rounded-lg p-1 text-[var(--color-muted)] hover:bg-[var(--color-panel-strong)] hover:text-[var(--color-ink)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, "id">) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ variant, title, message, duration = 4500 }: Omit<ToastItem, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, variant, title, message, duration }]);
      return id;
    },
    [],
  );

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) => {
      const ms = t.duration ?? 4500;
      return setTimeout(() => dismissToast(t.id), ms);
    });
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismissToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none px-4 sm:px-0">
      {toasts.map((item) => (
        <Toast
          key={item.id}
          variant={item.variant}
          title={item.title}
          message={item.message}
          onClose={() => onDismiss(item.id)}
          className="animate-in slide-in-from-top-3 fade-in duration-300"
        />
      ))}
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
