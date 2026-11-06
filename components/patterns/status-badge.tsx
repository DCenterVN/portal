import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "border-border text-foreground",
  success: "border-border text-foreground",
  warning: "border-warning-border bg-warning-soft text-warning",
  danger: "border-destructive-border bg-destructive-soft text-destructive",
} as const;

export type StatusTone = keyof typeof tones;

const statusTones: Record<string, StatusTone> = {
  ACTIVE: "success",
  APPROVED: "success",
  PLACED: "success",
  QC_PASSED: "success",
  SUSPENDED: "warning",
  PENDING: "warning",
  REVOKED: "danger",
  REJECTED: "danger",
  CANCELLED: "danger",
  QC_FAILED: "danger",
};

export function statusTone(status: string): StatusTone {
  return statusTones[status] ?? "neutral";
}

export function StatusBadge({ tone, children, className }: { tone: StatusTone; children: ReactNode; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", tones[tone], className)}>
      {children}
    </Badge>
  );
}
