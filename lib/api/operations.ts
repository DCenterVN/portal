import {z} from "zod";
import {getInitialConsoleData} from "@/lib/mock-data";

export type OperationRisk = "read" | "mutation" | "credential";

export type OperationDefinition = {
  id: string;
  service: "auth" | "org" | "integration" | "notification";
  method: "GET" | "POST" | "PATCH" | "PUT";
  pathTemplate: string;
  audience: string;
  risk: OperationRisk;
  requiresReason: boolean;
  allowedInProduction: boolean;
  execute: () => unknown;
};

export const operationRequestSchema = z.object({
  environment: z.enum(["dev", "staging", "production"]).default("dev"),
  reason: z.string().max(500).default("")
});

export const operations: Record<string, OperationDefinition> = {
  "auth.operator.users.list": {
    id: "auth.operator.users.list",
    service: "auth",
    method: "GET",
    pathTemplate: "/internal/operator/users",
    audience: "auth",
    risk: "read",
    requiresReason: false,
    allowedInProduction: true,
    execute: () => ({users: getInitialConsoleData().users})
  },
  "auth.operator.user.security-action": {
    id: "auth.operator.user.security-action",
    service: "auth",
    method: "POST",
    pathTemplate: "/internal/users/{user_id}/security-action",
    audience: "auth",
    risk: "mutation",
    requiresReason: true,
    allowedInProduction: true,
    execute: () => ({
      accepted: true,
      action: "SUSPEND",
      targetUserId: "0198fd55-3f46-7a01-9e52-f4c0de000002"
    })
  },
  "auth.native.login": {
    id: "auth.native.login",
    service: "auth",
    method: "POST",
    pathTemplate: "/auth/native/login",
    audience: "auth",
    risk: "credential",
    requiresReason: true,
    allowedInProduction: false,
    execute: () => ({blocked: true})
  },
  "org.operator.resorts.list": {
    id: "org.operator.resorts.list",
    service: "org",
    method: "GET",
    pathTemplate: "/internal/operator/resorts",
    audience: "org",
    risk: "read",
    requiresReason: false,
    allowedInProduction: true,
    execute: () => ({resorts: getInitialConsoleData().resorts})
  },
  "org.operator.resort.onboard": {
    id: "org.operator.resort.onboard",
    service: "org",
    method: "POST",
    pathTemplate: "/internal/resorts/onboard",
    audience: "org",
    risk: "mutation",
    requiresReason: true,
    allowedInProduction: true,
    execute: () => ({
      resortId: "0198fd55-3f46-7a01-9e52-f4c0de100099",
      code: "SUNSET-MAIN",
      status: "PENDING"
    })
  },
  "integration.locations.vn.provinces": {
    id: "integration.locations.vn.provinces",
    service: "integration",
    method: "GET",
    pathTemplate: "/locations/vn/provinces",
    audience: "integration",
    risk: "read",
    requiresReason: false,
    allowedInProduction: true,
    execute: () => ({provinces: getInitialConsoleData().provinces})
  }
};

export function getOperation(operationId: string) {
  return operations[operationId] ?? null;
}
