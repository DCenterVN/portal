import {z} from "zod";

export type OperationRisk = "read" | "mutation" | "credential";

export type OperationExecuteContext = {
  params?: Record<string, string>;
  payload?: unknown;
};

export type OperationDefinition = {
  id: string;
  service: "auth" | "org" | "integration" | "notification";
  method: "GET" | "POST" | "PATCH" | "PUT";
  pathTemplate: string;
  audience: string;
  risk: OperationRisk;
  requiresReason: boolean;
  allowedInProduction: boolean;
  execute: (context?: OperationExecuteContext) => Promise<unknown> | unknown;
};

export const operationRequestSchema = z.object({
  environment: z.enum(["dev", "staging", "production"]).default("dev"),
  reason: z.string().max(500).default(""),
  params: z.record(z.string()).optional(),
  payload: z.unknown().optional()
});

export class BackendError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "BackendError";
    this.status = status;
    this.data = data;
  }
}

export function getServiceBaseUrl(
  service: "auth" | "org" | "integration" | "notification"
): string {
  switch (service) {
    case "auth":
      return (
        process.env.AUTH_INTERNAL_URL ||
        process.env.AUTH_SERVICE_URL ||
        "http://localhost:8080"
      );
    case "org":
      return (
        process.env.ORG_INTERNAL_URL ||
        process.env.ORG_SERVICE_URL ||
        "http://localhost:8081"
      );
    case "integration":
      return (
        process.env.INTEGRATION_INTERNAL_URL ||
        process.env.INTEGRATION_SERVICE_URL ||
        "http://localhost:8082"
      );
    case "notification":
      return (
        process.env.NOTIFICATION_INTERNAL_URL ||
        process.env.NOTIFICATION_SERVICE_URL ||
        "http://localhost:8083"
      );
    default:
      return "http://localhost:8080";
  }
}

export async function callBackend<T = unknown>(
  service: "auth" | "org" | "integration" | "notification",
  method: "GET" | "POST" | "PATCH" | "PUT",
  path: string,
  body?: unknown
): Promise<T> {
  const baseUrl = getServiceBaseUrl(service);
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "portal-bff/operator-console"
    },
    ...(body !== undefined ? {body: JSON.stringify(body)} : {})
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && (data.message || data.error)) ||
      (typeof data === "string" && data.length > 0
        ? data
        : `Backend call failed with status ${res.status}`);
    throw new BackendError(String(message), res.status, data);
  }

  return data as T;
}

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
    execute: () => callBackend("auth", "GET", "/internal/operator/users")
  },
  "auth.operator.user.security-action": {
    id: "auth.operator.user.security-action",
    service: "auth",
    method: "POST",
    pathTemplate: "/internal/users/{user_id}/security-action",
    audience: "auth",
    risk: "mutation",
    requiresReason: true,
    allowedInProduction: false,
    execute: (ctx) => {
      const userId = ctx?.params?.user_id || ctx?.params?.userId || "";
      const path = `/internal/users/${encodeURIComponent(userId)}/security-action`;
      return callBackend(
        "auth",
        "POST",
        path,
        ctx?.payload ?? {action: "SUSPEND"}
      );
    }
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
    execute: (ctx) =>
      callBackend("auth", "POST", "/auth/native/login", ctx?.payload)
  },
  "org.operator.branches.list": {
    id: "org.operator.branches.list",
    service: "org",
    method: "GET",
    pathTemplate: "/internal/operator/branches",
    audience: "org",
    risk: "read",
    requiresReason: false,
    allowedInProduction: true,
    execute: () => callBackend("org", "GET", "/internal/operator/branches")
  },
  "org.operator.branch.onboard": {
    id: "org.operator.branch.onboard",
    service: "org",
    method: "POST",
    pathTemplate: "/internal/branches/onboard",
    audience: "org",
    risk: "mutation",
    requiresReason: true,
    allowedInProduction: false,
    execute: (ctx) =>
      callBackend("org", "POST", "/internal/branches/onboard", ctx?.payload)
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
    execute: () =>
      callBackend("integration", "GET", "/locations/vn/provinces")
  }
};

export function getOperation(operationId: string) {
  return operations[operationId] ?? null;
}
