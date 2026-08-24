import type {ConsoleData} from "@/lib/types";

export function getInitialConsoleData(): ConsoleData {
  return {
    stats: {
      activeResorts: 3,
      users: 1284,
      pendingInvites: 17,
      apiChecks: 42
    },
    services: [
      {name: "auth", status: "READY", latencyMs: 21, version: "v0.1.0"},
      {name: "org", status: "READY", latencyMs: 28, version: "v0.1.0"},
      {name: "integration", status: "READY", latencyMs: 12, version: "v0.1.0"},
      {name: "notification", status: "DEGRADED", latencyMs: 92, version: "v0.1.0"}
    ],
    users: [
      {
        id: "0198fd55-3f46-7a01-9e52-f4c0de000001",
        displayName: "Nguyen Minh Anh",
        email: "minhanh@example.com",
        status: "ACTIVE",
        securityVersion: 4,
        lastLogin: "10 phut truoc"
      },
      {
        id: "0198fd55-3f46-7a01-9e52-f4c0de000002",
        displayName: "Tran Bao Long",
        email: "baolong@example.com",
        status: "PENDING",
        securityVersion: 1,
        lastLogin: "Chua login"
      },
      {
        id: "0198fd55-3f46-7a01-9e52-f4c0de000003",
        displayName: "Le Ha Vy",
        email: "havy@example.com",
        status: "ACTIVE",
        securityVersion: 7,
        lastLogin: "Hom qua"
      }
    ],
    resorts: [
      {
        id: "0198fd55-3f46-7a01-9e52-f4c0de100001",
        code: "LOTUS-MAIN",
        name: "Lotus Bay Resort",
        type: "MAIN",
        status: "ACTIVE",
        members: 412
      },
      {
        id: "0198fd55-3f46-7a01-9e52-f4c0de100002",
        code: "LOTUS-SPA",
        name: "Lotus Spa Branch",
        type: "BRANCH",
        status: "ACTIVE",
        members: 86
      },
      {
        id: "0198fd55-3f46-7a01-9e52-f4c0de100003",
        code: "CORAL-MAIN",
        name: "Coral Cliff Retreat",
        type: "MAIN",
        status: "PENDING",
        members: 12
      }
    ],
    roles: [
      {code: "OWNER", name: "Owner", permissions: ["resort.manage", "rbac.manage"]},
      {code: "RECEPTION", name: "Reception", permissions: ["membership.read", "booking.read"]},
      {code: "SPA_MANAGER", name: "Spa Manager", permissions: ["membership.read", "service.manage"]}
    ],
    provinces: [
      {code: "01", name: "Ha Noi", type: "Thanh pho", communes: 126},
      {code: "79", name: "TP. Ho Chi Minh", type: "Thanh pho", communes: 168},
      {code: "48", name: "Da Nang", type: "Thanh pho", communes: 94}
    ],
    audit: [
      {
        id: "0198fd55-3f46-7a01-9e52-f4c0de200001",
        actor: "dawnmorality",
        operation: "org.operator.resorts.list",
        outcome: "ALLOW",
        at: "2 phut truoc"
      },
      {
        id: "0198fd55-3f46-7a01-9e52-f4c0de200002",
        actor: "dawnmorality",
        operation: "auth.operator.users.list",
        outcome: "ALLOW",
        at: "9 phut truoc"
      }
    ]
  };
}
