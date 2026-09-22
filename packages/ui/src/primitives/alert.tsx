import type { HTMLAttributes } from "react";

export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
}

const alertStyles: Record<AlertVariant, { container: string; title: string }> = {
  info: {
    container: "bg-[var(--color-teal)]/10 border-[var(--color-teal)]/30 text-[var(--color-teal)]",
    title: "text-[var(--color-teal)]",
  },
  success: {
    container: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    title: "text-emerald-700 dark:text-emerald-300",
  },
  warning: {
    container: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
    title: "text-amber-700 dark:text-amber-300",
  },
  error: {
    container: "bg-[var(--color-danger)]/10 border-[var(--color-danger)]/30 text-[var(--color-danger)]",
    title: "text-[var(--color-danger)]",
  },
};

export function Alert({ variant = "info", title, className = "", children, ...props }: AlertProps) {
  const styles = alertStyles[variant];

  return (
    <div
      role="alert"
      className={`rounded-lg border p-4 text-sm ${styles.container} ${className}`}
      {...props}
    >
      {title && <h5 className={`mb-1 font-semibold leading-none tracking-tight ${styles.title}`}>{title}</h5>}
      <div className="text-sm opacity-90">{children}</div>
    </div>
  );
}
