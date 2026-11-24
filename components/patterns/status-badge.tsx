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

const groups: Record<Exclude<StatusTone, "info">, string[]> = {
  neutral: ["DRAFT", "PLANNED", "NEW", "CANCELLED", "RETIRED", "ARCHIVED", "CLOSED", "BOM_RETIRED", "PLACED", "RELEASED", "DISPOSED"],
  warning: [
    "PENDING", "CONFIRMED", "IN_PROGRESS", "IN_TRANSIT", "DELIVERING", "PACKED", "AWAITING_PAYMENT", "WAITING_PRICE_APPROVAL", "SUSPENDED",
    "IN_PLANNING", "IN_PRODUCTION", "PUBLISHING", "READY_FOR_HANDOFF", "REVIEWED", "HANDED_OFF", "ACCEPTED", "SCHEDULED", "ALLOCATED",
    "UNDER_QC", "SELLING", "PENDING_COD", "INITIATED", "REFUND_PENDING",
  ],
  success: [
    "COMPLETED", "RECEIVED", "DELIVERED", "PUBLISHED", "QC_PASSED", "PASS", "PASSED", "CONSUMED", "ACTIVE", "BOM_ACTIVE", "APPROVED", "HELD", "SUCCESS",
  ],
  danger: ["FAILED", "FAIL", "QC_FAILED", "REJECTED", "DELIVERY_FAILED", "REVOKED", "EXPIRED", "QUARANTINED"],
};

const statusTones: Record<string, StatusTone> = Object.fromEntries(
  Object.entries(groups).flatMap(([tone, codes]) => codes.map((code) => [code, tone as StatusTone])),
);

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
