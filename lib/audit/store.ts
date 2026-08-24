import {newRequestId} from "@/lib/id";

export type AuditRecord = {
  id: string;
  actor: string;
  operationId: string;
  environment: string;
  outcome: "ALLOW" | "DENY";
  status: number;
  durationMs: number;
  reason: string;
  at: string;
};

const auditRecords: AuditRecord[] = [];

export function appendAudit(record: Omit<AuditRecord, "id" | "at">) {
  const saved: AuditRecord = {
    ...record,
    id: newRequestId(),
    at: new Date().toISOString()
  };
  auditRecords.unshift(saved);
  auditRecords.splice(100);
  return saved;
}

export function listAudit() {
  return auditRecords;
}
