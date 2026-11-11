import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "border-border text-foreground before:bg-muted-foreground/50",
  info: "border-primary/25 bg-primary/10 text-primary before:bg-primary",
  success: "border-success/25 bg-success-soft text-success before:bg-success",
  warning: "border-warning-border bg-warning-soft text-warning before:bg-warning",
  danger: "border-destructive-border bg-destructive-soft text-destructive before:bg-destructive",
} as const;

export type StatusTone = keyof typeof tones;

const statusTones: Record<string, StatusTone> = {
  PUBLISHED: "success",
  QC_PASSED: "success",
  DELIVERED: "success",
  RECEIVED: "success",
  CONSUMED: "success",
  HELD: "success",
  PASS: "success",
  PASSED: "success",
  CONFIRMED: "info",
  PACKED: "info",
  DELIVERING: "info",
  IN_TRANSIT: "info",
  IN_PROGRESS: "info",
  IN_PLANNING: "info",
  HANDED_OFF: "info",
  ACCEPTED: "info",
  ALLOCATED: "info",
  PUBLISHING: "info",
  READY_FOR_HANDOFF: "info",
  REVIEWED: "info",
  COMPLETED: "info",
  AWAITING_PAYMENT: "warning",
  WAITING_PRICE_APPROVAL: "warning",
  SUSPENDED: "warning",
  PENDING: "warning",
  DELIVERY_FAILED: "danger",
  REVOKED: "danger",
  REJECTED: "danger",
  CANCELLED: "danger",
  QC_FAILED: "danger",
  FAILED: "danger",
  FAIL: "danger",
};

export function statusTone(status: string): StatusTone {
  return statusTones[status] ?? "neutral";
}

export function StatusBadge({ tone, children, className }: { tone: StatusTone; children: ReactNode; className?: string }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium before:size-1.5 before:shrink-0 before:rounded-full", tones[tone], className)}>
      {children}
    </Badge>
  );
}
