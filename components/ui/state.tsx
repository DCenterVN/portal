import * as React from "react";
import { AlertTriangle, CheckCircle2, Inbox, Info, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

type StateKind = "loading" | "empty" | "error" | "denied";
const stateIcons = { loading: Loader2, empty: Inbox, error: AlertTriangle, denied: Lock };

interface StateViewProps {
  kind: StateKind;
  title: string;
  description?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
  className?: string;
}

function StateView({ kind, title, description, onRetry, action, className }: StateViewProps) {
  const Icon = stateIcons[kind];
  const alert = kind === "error" || kind === "denied";
  return (
    <div
      role={alert ? "alert" : "status"}
      aria-busy={kind === "loading" || undefined}
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] px-6 py-10 text-center",
        className
      )}
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-full",
          alert ? "bg-[var(--destructive)]/10 text-[var(--destructive)]" : "bg-[var(--secondary)] text-[var(--primary)]"
        )}
      >
        <Icon className={cn("size-5", kind === "loading" && "animate-spin")} aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
      {description && <p className="max-w-md text-xs leading-relaxed text-[var(--muted-foreground)]">{description}</p>}
      {(onRetry || action) && (
        <div className="flex flex-wrap justify-center gap-2">
          {onRetry && (
            <Button variant="outline" size="touch" onClick={onRetry}>
              Thử lại
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}

type StateProps = Omit<StateViewProps, "kind">;

export function Skeleton({ title = "Đang tải…", ...props }: Partial<StateProps>) {
  return <StateView kind="loading" title={title} {...props} />;
}

export function EmptyState(props: StateProps) {
  return <StateView kind="empty" {...props} />;
}

export function ErrorState({ denied, ...props }: StateProps & { denied?: boolean }) {
  return <StateView kind={denied ? "denied" : "error"} {...props} />;
}

type AlertTone = "error" | "warning" | "success" | "info";
const alertStyles: Record<AlertTone, { box: string; icon: typeof Info }> = {
  error: { box: "border-[var(--destructive)]/40 bg-[var(--destructive)]/5 text-[var(--destructive)]", icon: AlertTriangle },
  warning: { box: "border-[var(--color-sun)] bg-[var(--color-sun)]/10 text-[var(--color-warn-ink)]", icon: AlertTriangle },
  success: { box: "border-[var(--primary)]/40 bg-[var(--primary)]/5 text-[var(--primary)]", icon: CheckCircle2 },
  info: { box: "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]", icon: Info },
};

export function InlineAlert({ tone = "error", children, className }: { tone?: AlertTone; children: React.ReactNode; className?: string }) {
  const style = alertStyles[tone];
  const Icon = style.icon;
  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={cn("flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm", style.box, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
