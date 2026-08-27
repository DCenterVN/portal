import * as React from "react";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("mx-auto max-w-7xl px-4 py-8 sm:px-6", className)}>
      {children}
    </main>
  );
}

export interface PageHeaderProps {
  icon?: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  icon,
  title,
  badge,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[var(--border)]",
        className
      )}
    >
      <div>
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="flex size-9 items-center justify-center rounded-xl bg-sky-500/10 text-[var(--primary)] shrink-0 [&_svg]:size-5">
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5 font-medium">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
