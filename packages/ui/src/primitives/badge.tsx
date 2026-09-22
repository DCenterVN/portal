import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant =
  | "fresh"
  | "cold"
  | "alert"
  | "danger"
  | "neutral"
  | "default"
  | "primary"
  | "secondary"
  | "forest"
  | "amber"
  | "success"
  | "warning"
  | "info"
  | "glass";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  pulse?: boolean;
  icon?: ReactNode;
}

const badgeVariants: Record<BadgeVariant, string> = {
  // 4-5 Core Semantic Tones
  fresh: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 border-emerald-500/30",
  cold: "bg-sky-500/10 text-sky-900 dark:text-sky-300 border-sky-500/30",
  alert: "bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-500/30",
  danger: "bg-rose-500/10 text-rose-900 dark:text-rose-300 border-rose-500/30",
  neutral: "bg-[var(--color-panel-strong)] text-[var(--color-muted)] border-[var(--color-line)]",

  // Semantic Aliases & Compatibility
  primary: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 border-emerald-500/30",
  forest: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 border-emerald-500/30",
  success: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 border-emerald-500/30",
  secondary: "bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-500/30",
  amber: "bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-500/30",
  warning: "bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-500/30",
  info: "bg-sky-500/10 text-sky-900 dark:text-sky-300 border-sky-500/30",
  default: "bg-[var(--color-panel-strong)] text-[var(--color-ink)] border-[var(--color-line)]",
  glass: "bg-black/60 dark:bg-black/70 backdrop-blur-md text-white border-white/20",
};

export function Badge({
  variant = "default",
  pulse = false,
  icon,
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium tracking-wide shadow-none transition-colors ${badgeVariants[variant]} ${className}`}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {icon && <span className="inline-flex shrink-0 items-center">{icon}</span>}
      {children}
    </span>
  );
}
