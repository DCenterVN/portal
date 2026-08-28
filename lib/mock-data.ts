import type {ConsoleData} from "@/lib/types";

export function getInitialConsoleData(): ConsoleData {
  return {
    stats: {
      activeBranches: 3,
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
        lastLogin: "10 phút trước"
      },
      {
        id: "0198fd55-3f46-7a01-9e52-f4c0de000002",
        displayName: "Tran Bao Long",
        email: "baolong@example.com",
        status: "PENDING",
        securityVersion: 1,
        lastLogin: "Chưa login"
      },
      {
        id: "0198fd55-3f46-7a01-9e52-f4c0de000003",
        displayName: "Le Ha Vy",
        email: "havy@example.com",
        status: "ACTIVE",
        securityVersion: 7,
        lastLogin: "Hôm qua"
      }
    ],
    branches: [
      {
        id: "0198fd55-3f46-7a01-9e52-f4c0de100001",
        code: "COLD-MAIN",
        name: "Kho Tổng Tân Tạo",
        type: "MAIN",
        status: "ACTIVE",
        members: 412
      },
      {
        id: "0198fd55-3f46-7a01-9e52-f4c0de100002",
        code: "COLD-Q7",
        name: "Chi nhánh Kho Lạnh Quận 7",
        type: "BRANCH",
        status: "ACTIVE",
        members: 86
      },
      {
        id: "0198fd55-3f46-7a01-9e52-f4c0de100003",
        code: "COLD-THUDUC",
        name: "Chi nhánh Phân Phối Thủ Đức",
        type: "MAIN",
        status: "PENDING",
        members: 12
      }
    ],
    roles: [
      {code: "OWNER", name: "Chủ sở hữu", permissions: ["branch.manage", "rbac.manage"]},
      {code: "OPERATOR", name: "Điều hành kho", permissions: ["inventory.manage", "branch.read"]},
      {code: "STAFF", name: "Nhân viên kho", permissions: ["inventory.read", "order.manage"]}
    ],
    provinces: [
      {code: "01", name: "Hà Nội", type: "Thành phố", communes: 126},
      {code: "79", name: "TP. Hồ Chí Minh", type: "Thành phố", communes: 168},
      {code: "48", name: "Đà Nẵng", type: "Thành phố", communes: 94}
    ],
    audit: [
      {
        id: "0198fd55-3f46-7a01-9e52-f4c0de200001",
        actor: "dawnmorality",
        operation: "org.operator.branches.list",
        outcome: "ALLOW",
        at: "2 phút trước"
      },
      {
        id: "0198fd55-3f46-7a01-9e52-f4c0de200002",
        actor: "dawnmorality",
        operation: "auth.operator.users.list",
        outcome: "ALLOW",
        at: "9 phút trước"
      }
    ]
  };
}
