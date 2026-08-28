"use client";

import {
  Activity,
  Building2,
  FlaskConical,
  KeyRound,
  MapPinned,
  ShieldCheck,
  UsersRound,
  Search,
  Plus
} from "lucide-react";
import {useMemo, useState} from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import {fetcher, mutationFetcher} from "@/lib/fetcher";
import type {ConsoleData, OperationResult} from "@/lib/types";
import {Button} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {PageShell} from "@/components/ui/page";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

type Tab = "dashboard" | "users" | "branches" | "rbac" | "locations" | "lab";

const tabs: Array<{id: Tab; label: string; icon: React.ElementType}> = [
  {id: "dashboard", label: "Tổng quan", icon: Activity},
  {id: "users", label: "Users", icon: UsersRound},
  {id: "branches", label: "Chi nhánh", icon: Building2},
  {id: "rbac", label: "RBAC", icon: ShieldCheck},
  {id: "locations", label: "Locations", icon: MapPinned},
  {id: "lab", label: "API Lab", icon: FlaskConical}
];

const operationOptions = [
  {id: "auth.operator.users.list", label: "Auth: list operator users"},
  {id: "auth.operator.user.security-action", label: "Auth: suspend user"},
  {id: "org.operator.branches.list", label: "Org: list branches"},
  {id: "org.operator.branch.onboard", label: "Org: onboard branch"},
  {id: "integration.locations.vn.provinces", label: "Integration: VN provinces"}
];

export function BranchConsole({initialData}: {initialData: ConsoleData}) {
  const {data: consoleData = initialData} = useSWR<ConsoleData>(
    "/api/console",
    fetcher,
    {
      fallbackData: initialData,
      revalidateOnFocus: false,
      errorRetryCount: 3
    }
  );

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [operationId, setOperationId] = useState(
    operationOptions[0]?.id ?? ""
  );
  const [reason, setReason] = useState("Local smoke test");
  const [result, setResult] = useState<OperationResult | null>(null);
  const [query, setQuery] = useState("");

  const {trigger, isMutating} = useSWRMutation(
    `/api/operations/${operationId}`,
    mutationFetcher<OperationResult, {reason: string; environment: string}>
  );

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const users = consoleData?.users ?? initialData.users;
    if (!keyword) return users;
    return users.filter((user) =>
      [user.displayName, user.email, user.status].some((value) =>
        value.toLowerCase().includes(keyword)
      )
    );
  }, [consoleData, initialData.users, query]);

  async function runOperation() {
    setResult(null);
    try {
      const payload = await trigger({reason, environment: "dev"});
      setResult(payload);
    } catch (error) {
      setResult({
        ok: false,
        operationId,
        status: 0,
        requestId: "local-fetch-error",
        durationMs: 0,
        data: {message: error instanceof Error ? error.message : "Unknown error"}
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--background)] text-[var(--foreground)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:shrink-0 border-r border-[var(--border)] bg-[var(--card)] p-5 justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0284C7] to-emerald-500 text-white font-extrabold shadow-md">
              DC
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">DCenter Portal</h1>
              <p className="text-xs text-[var(--muted-foreground)] font-medium">
                Branch IAM Console
              </p>
            </div>
          </div>

          <nav className="space-y-1" aria-label="Portal sections">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  type="button"
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-2.5 h-10 text-xs font-semibold rounded-xl transition-colors ${
                    isActive
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-xs"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span>{tab.label}</span>
                </Button>
              );
            })}
          </nav>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/40 text-[11px] text-[var(--muted-foreground)] space-y-1">
          <p className="font-bold text-[var(--foreground)]">Dev environment</p>
          <p className="leading-relaxed">Internal APIs are routed through portal BFF.</p>
        </div>
      </aside>

      {/* Mobile / Tablet Horizontal Navigation */}
      <div className="lg:hidden border-b border-[var(--border)] bg-[var(--card)] px-4 py-2.5 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                type="button"
                size="sm"
                variant={isActive ? "default" : "ghost"}
                className={`h-8 px-3 text-xs font-semibold rounded-lg gap-1.5 ${
                  isActive
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "text-[var(--muted-foreground)]"
                }`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                <span>{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <PageShell className="py-6 sm:py-8 space-y-6">
          {/* Topbar / Operator Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary)]">
                Platform operator
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
                Quản trị Branch IAM
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
                Kiểm soát user, chi nhánh, membership, role và API contract trong một console gọn
                gàng để test nhanh trước khi nối business handler thật.
              </p>
            </div>

            <div
              className="flex items-center gap-3 p-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] shrink-0 self-start sm:self-auto shadow-xs"
              aria-label="Current operator"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-xs shadow-xs">
                DD
              </div>
              <div className="text-xs">
                <p className="font-bold text-[var(--foreground)]">dawnmorality</p>
                <Badge variant="secondary" dot={false} className="text-[10px] px-1.5 py-0 mt-0.5">
                  platform-operators
                </Badge>
              </div>
            </div>
          </div>

          {/* Active Tab Panel */}
          {activeTab === "dashboard" && <Dashboard data={consoleData} />}
          {activeTab === "users" && (
            <UsersPanel query={query} setQuery={setQuery} users={filteredUsers} />
          )}
          {activeTab === "branches" && <BranchesPanel data={consoleData} />}
          {activeTab === "rbac" && <RbacPanel data={consoleData} />}
          {activeTab === "locations" && <LocationsPanel data={consoleData} />}
          {activeTab === "lab" && (
            <ApiLab
              operationId={operationId}
              setOperationId={setOperationId}
              reason={reason}
              setReason={setReason}
              result={result}
              isRunning={isMutating}
              runOperation={runOperation}
            />
          )}
        </PageShell>
      </div>
    </div>
  );
}

function Dashboard({data}: {data: ConsoleData}) {
  return (
    <div className="space-y-6">
      {/* 4 Stats Grid */}
      <section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        aria-label="Platform statistics"
      >
        <Stat label="Active branches" value={data.stats.activeBranches} />
        <Stat label="Users" value={data.stats.users} />
        <Stat label="Open invites" value={data.stats.pendingInvites} />
        <Stat label="API checks today" value={data.stats.apiChecks} />
      </section>

      {/* Main Grid: Service Health (2 cols) & Audit Log (1 col) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-[var(--border)] bg-[var(--card)] rounded-2xl shadow-xs">
          <CardHeader className="p-4 sm:p-6 pb-4 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-bold">Service health</CardTitle>
              <CardDescription className="text-xs">Trạng thái kết nối microservices</CardDescription>
            </div>
            <Badge variant="secondary" dot={false} className="text-xs">
              dev
            </Badge>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Service</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Latency</TableHead>
                  <TableHead className="font-bold">Version</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.services.map((service) => (
                  <TableRow key={service.name}>
                    <TableCell className="font-semibold text-xs sm:text-sm">
                      {service.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={service.status === "READY" ? "active" : "suspended"}
                        className="text-xs"
                      >
                        {service.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                      {service.latencyMs} ms
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm font-mono text-[var(--muted-foreground)]">
                      {service.version}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-[var(--border)] bg-[var(--card)] rounded-2xl shadow-xs">
          <CardHeader className="p-4 sm:p-6 pb-4 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-bold">Recent audit</CardTitle>
              <CardDescription className="text-xs">Nhật ký hành động gần đây</CardDescription>
            </div>
            <KeyRound className="size-4 text-[var(--primary)] shrink-0" aria-hidden="true" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
            {data.audit.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/30 hover:bg-[var(--secondary)]/50 transition-colors space-y-1"
              >
                <p className="text-xs font-bold text-[var(--foreground)] break-all">
                  {item.operation}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-[var(--muted-foreground)]">
                  <span>{item.actor}</span>
                  <Badge
                    variant={item.outcome === "ALLOW" ? "active" : "revoked"}
                    dot={false}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {item.outcome}
                  </Badge>
                  <span>{item.at}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Stat({label, value}: {label: string; value: number | string}) {
  return (
    <Card className="border-[var(--border)] bg-[var(--card)] rounded-2xl shadow-xs p-4 sm:p-5">
      <p className="text-xs font-medium text-[var(--muted-foreground)]">{label}</p>
      <p className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] mt-1.5 tracking-tight">
        {value}
      </p>
    </Card>
  );
}

function UsersPanel({
  users,
  query,
  setQuery
}: {
  users: ConsoleData["users"];
  query: string;
  setQuery: (value: string) => void;
}) {
  return (
    <Card className="border-[var(--border)] bg-[var(--card)] rounded-2xl shadow-xs">
      <CardHeader className="p-4 sm:p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-lg font-bold">Danh sách Người dùng</CardTitle>
          <CardDescription className="text-xs">
            {users.length} tài khoản trong hệ thống IAM
          </CardDescription>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-3.5 text-[var(--muted-foreground)]" />
          <Input
            className="pl-8 text-xs h-9 rounded-xl bg-[var(--background)]"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tên, email, status..."
            aria-label="Search users"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Họ và tên</TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="font-bold">Trạng thái</TableHead>
              <TableHead className="font-bold">Bảo mật</TableHead>
              <TableHead className="font-bold">Đăng nhập cuối</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-semibold text-xs sm:text-sm text-[var(--foreground)]">
                  {user.displayName}
                </TableCell>
                <TableCell className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                  {user.email}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.status === "ACTIVE" ? "active" : "suspended"}
                    className="text-xs"
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-mono text-[var(--muted-foreground)]">
                  v{user.securityVersion}
                </TableCell>
                <TableCell className="text-xs text-[var(--muted-foreground)]">
                  {user.lastLogin}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function BranchesPanel({data}: {data: ConsoleData}) {
  return (
    <Card className="border-[var(--border)] bg-[var(--card)] rounded-2xl shadow-xs">
      <CardHeader className="p-4 sm:p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-lg font-bold">Danh sách chi nhánh</CardTitle>
          <CardDescription className="text-xs">
            {data.branches.length} chi nhánh đang hoạt động
          </CardDescription>
        </div>
        <Button type="button" size="sm" className="h-9 px-4 text-xs font-bold rounded-xl gap-1.5 self-start sm:self-auto">
          <Plus className="size-3.5" />
          <span>Onboard branch</span>
        </Button>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Mã Code</TableHead>
              <TableHead className="font-bold">Tên chi nhánh</TableHead>
              <TableHead className="font-bold">Phân loại</TableHead>
              <TableHead className="font-bold">Trạng thái</TableHead>
              <TableHead className="font-bold">Thành viên</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.branches.map((branch) => (
              <TableRow key={branch.id}>
                <TableCell className="font-mono font-bold text-xs sm:text-sm text-[var(--primary)]">
                  {branch.code}
                </TableCell>
                <TableCell className="font-semibold text-xs sm:text-sm text-[var(--foreground)]">
                  {branch.name}
                </TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline" dot={false} className="text-[11px]">
                    {branch.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={branch.status === "ACTIVE" ? "active" : "suspended"}
                    className="text-xs"
                  >
                    {branch.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                  {branch.members} thành viên
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RbacPanel({data}: {data: ConsoleData}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 border-[var(--border)] bg-[var(--card)] rounded-2xl shadow-xs">
        <CardHeader className="p-4 sm:p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-lg font-bold">Danh sách Vai trò (Roles)</CardTitle>
            <CardDescription className="text-xs">
              Cấu hình các quyền hạn RBAC cho từng nhóm người dùng
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" className="h-9 px-4 text-xs font-bold rounded-xl gap-1.5 self-start sm:self-auto">
            <Plus className="size-3.5" />
            <span>Create role</span>
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {data.roles.map((role) => (
              <div
                key={role.code}
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/30 hover:bg-[var(--secondary)]/50 transition-colors space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[var(--foreground)]">{role.name}</h4>
                  <span className="font-mono text-[11px] font-bold text-[var(--muted-foreground)] px-2 py-0.5 rounded-md bg-[var(--muted)]">
                    {role.code}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.map((p) => (
                    <Badge key={p} variant="secondary" dot={false} className="text-[10px] font-mono">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--border)] bg-[var(--card)] rounded-2xl shadow-xs">
        <CardHeader className="p-4 sm:p-6 pb-3">
          <CardTitle className="text-base font-bold">Authorization notes</CardTitle>
          <CardDescription className="text-xs">Nguyên tắc bảo mật phân quyền</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 text-xs sm:text-sm text-[var(--muted-foreground)] leading-relaxed space-y-3">
          <p>
            Permission cuối cùng thuộc về organization. JWT token chỉ lưu trữ subject,
            session, branch scope và authorization version để UI/context sử dụng, không tin tưởng
            trực tiếp permission claims từ client.
          </p>
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300 text-xs">
            Mọi mutation nhạy cảm đều yêu cầu thẩm tra membership và role thực tế tại tầng backend.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LocationsPanel({data}: {data: ConsoleData}) {
  return (
    <Card className="border-[var(--border)] bg-[var(--card)] rounded-2xl shadow-xs">
      <CardHeader className="p-4 sm:p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-lg font-bold">Vietnam Locations</CardTitle>
          <CardDescription className="text-xs">
            Danh mục đơn vị hành chính tỉnh / thành phố
          </CardDescription>
        </div>
        <Badge variant="secondary" dot={false} className="text-xs font-semibold self-start sm:self-auto">
          34 provinces — no district
        </Badge>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Mã tỉnh</TableHead>
              <TableHead className="font-bold">Tên tỉnh / thành phố</TableHead>
              <TableHead className="font-bold">Loại đơn vị</TableHead>
              <TableHead className="font-bold">Số lượng xã/phường</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.provinces.map((province) => (
              <TableRow key={province.code}>
                <TableCell className="font-mono font-bold text-xs sm:text-sm text-[var(--primary)]">
                  {province.code}
                </TableCell>
                <TableCell className="font-semibold text-xs sm:text-sm text-[var(--foreground)]">
                  {province.name}
                </TableCell>
                <TableCell className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                  {province.type}
                </TableCell>
                <TableCell className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                  {province.communes}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ApiLab({
  operationId,
  setOperationId,
  reason,
  setReason,
  result,
  isRunning,
  runOperation
}: {
  operationId: string;
  setOperationId: (value: string) => void;
  reason: string;
  setReason: (value: string) => void;
  result: OperationResult | null;
  isRunning: boolean;
  runOperation: () => Promise<void>;
}) {
  return (
    <Card className="border-[var(--border)] bg-[var(--card)] rounded-2xl shadow-xs">
      <CardHeader className="p-4 sm:p-6 pb-4 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg font-bold">API Lab</CardTitle>
          <CardDescription className="text-xs">
            Thử nghiệm gọi trực tiếp các BFF operations
          </CardDescription>
        </div>
        <Badge variant="suspended" dot={false} className="text-xs font-bold">
          BFF guarded
        </Badge>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="operation-select" className="text-xs font-bold text-[var(--foreground)]">
            Operation
          </Label>
          <select
            id="operation-select"
            className="w-full h-10 rounded-xl border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] px-3 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer"
            value={operationId}
            onChange={(event) => setOperationId(event.target.value)}
          >
            {operationOptions.map((operation) => (
              <option key={operation.id} value={operation.id}>
                {operation.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reason-input" className="text-xs font-bold text-[var(--foreground)]">
            Reason (Audit log)
          </Label>
          <textarea
            id="reason-input"
            rows={3}
            className="w-full rounded-xl border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] p-3 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] resize-y min-h-[80px]"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Nhập lý do thực hiện thao tác (tối thiểu 8 ký tự cho mutation)..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            type="button"
            onClick={runOperation}
            disabled={isRunning}
            className="h-10 px-5 text-xs font-bold rounded-xl gap-2 bg-[var(--primary)] text-white shadow-xs"
          >
            <FlaskConical className="size-4" aria-hidden="true" />
            <span>{isRunning ? "Đang gọi..." : "Run operation"}</span>
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => setReason("")}
            className="h-10 px-4 text-xs font-bold rounded-xl border-[var(--border)]"
          >
            Clear reason
          </Button>
        </div>

        <div className="space-y-1.5 pt-2">
          <Label className="text-xs font-bold text-[var(--muted-foreground)]">
            Response Output
          </Label>
          <pre className="overflow-x-auto max-h-96 p-4 rounded-xl font-mono text-xs bg-slate-950 text-emerald-400 dark:bg-slate-900 border border-[var(--border)] leading-relaxed">
            {result
              ? JSON.stringify(result, null, 2)
              : "Chưa có kết quả. Chọn operation và bấm Run operation."}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

