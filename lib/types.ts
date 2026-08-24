export type ConsoleData = {
  stats: {
    activeResorts: number;
    users: number;
    pendingInvites: number;
    apiChecks: number;
  };
  services: Array<{
    name: string;
    status: "READY" | "DEGRADED";
    latencyMs: number;
    version: string;
  }>;
  users: Array<{
    id: string;
    displayName: string;
    email: string;
    status: "ACTIVE" | "PENDING" | "SUSPENDED";
    securityVersion: number;
    lastLogin: string;
  }>;
  resorts: Array<{
    id: string;
    code: string;
    name: string;
    type: "MAIN" | "BRANCH";
    status: "ACTIVE" | "PENDING";
    members: number;
  }>;
  roles: Array<{
    code: string;
    name: string;
    permissions: string[];
  }>;
  provinces: Array<{
    code: string;
    name: string;
    type: string;
    communes: number;
  }>;
  audit: Array<{
    id: string;
    actor: string;
    operation: string;
    outcome: "ALLOW" | "DENY";
    at: string;
  }>;
};

export type OperationResult = {
  ok: boolean;
  operationId: string;
  status: number;
  requestId: string;
  durationMs: number;
  data: unknown;
};
