"use client";

import {
  Activity,
  Building2,
  FlaskConical,
  KeyRound,
  MapPinned,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import {useMemo, useState} from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import {fetcher, mutationFetcher} from "@/lib/fetcher";
import type {ConsoleData, OperationResult} from "@/lib/types";

type Tab = "dashboard" | "users" | "resorts" | "rbac" | "locations" | "lab";

const tabs: Array<{id: Tab; label: string; icon: React.ElementType}> = [
  {id: "dashboard", label: "Tong quan", icon: Activity},
  {id: "users", label: "Users", icon: UsersRound},
  {id: "resorts", label: "Resorts", icon: Building2},
  {id: "rbac", label: "RBAC", icon: ShieldCheck},
  {id: "locations", label: "Locations", icon: MapPinned},
  {id: "lab", label: "API Lab", icon: FlaskConical}
];

const operationOptions = [
  {id: "auth.operator.users.list", label: "Auth: list operator users"},
  {id: "auth.operator.user.security-action", label: "Auth: suspend user"},
  {id: "org.operator.resorts.list", label: "Org: list resorts"},
  {id: "org.operator.resort.onboard", label: "Org: onboard resort"},
  {id: "integration.locations.vn.provinces", label: "Integration: VN provinces"}
];

export function ResortConsole({initialData}: {initialData: ConsoleData}) {
  const {data: consoleData = initialData} = useSWR<ConsoleData>("/api/console", fetcher, {
    fallbackData: initialData,
    revalidateOnFocus: false,
    errorRetryCount: 3
  });

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [operationId, setOperationId] = useState(operationOptions[0]?.id ?? "");
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
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">DC</div>
          <div>
            <h1 className="brand-title">DCenter Portal</h1>
            <p className="brand-subtitle">Resort IAM console</p>
          </div>
        </div>
        <nav className="nav" aria-label="Portal sections">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                aria-current={activeTab === tab.id ? "page" : undefined}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <strong>Dev environment</strong>
          <br />
          Internal APIs are routed through the portal BFF.
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <p className="eyebrow">Platform operator</p>
            <h2 className="page-title">Quan tri resort IAM</h2>
            <p className="page-copy">
              Kiem soat user, resort, membership, role va API contract trong mot console gon
              gang de test nhanh truoc khi noi business handler that.
            </p>
          </div>
          <div className="operator" aria-label="Current operator">
            <div className="avatar">DD</div>
            <div>
              <strong>dawnmorality</strong>
              <br />
              <span className="badge gold">platform-operators</span>
            </div>
          </div>
        </div>

        {activeTab === "dashboard" && <Dashboard data={consoleData} />}
        {activeTab === "users" && (
          <UsersPanel query={query} setQuery={setQuery} users={filteredUsers} />
        )}
        {activeTab === "resorts" && <ResortsPanel data={consoleData} />}
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
      </main>

      <nav className="mobile-tabs" aria-label="Mobile portal sections">
        {tabs.slice(0, 5).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={activeTab === tab.id ? "page" : undefined}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
            >
              <Icon size={18} aria-hidden="true" />
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function Dashboard({data}: {data: ConsoleData}) {
  return (
    <>
      <section className="grid stats" aria-label="Platform statistics">
        <Stat label="Active resorts" value={data.stats.activeResorts} />
        <Stat label="Users" value={data.stats.users} />
        <Stat label="Open invites" value={data.stats.pendingInvites} />
        <Stat label="API checks today" value={data.stats.apiChecks} />
      </section>
      <section className="content-grid">
        <div className="card section">
          <div className="section-head">
            <h3 className="section-title">Service health</h3>
            <span className="badge">dev</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Latency</th>
                  <th>Version</th>
                </tr>
              </thead>
              <tbody>
                {data.services.map((service) => (
                  <tr key={service.name}>
                    <td>{service.name}</td>
                    <td>
                      <span className="badge">{service.status}</span>
                    </td>
                    <td>{service.latencyMs} ms</td>
                    <td>{service.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card section">
          <div className="section-head">
            <h3 className="section-title">Recent audit</h3>
            <KeyRound size={18} aria-hidden="true" />
          </div>
          <div className="grid">
            {data.audit.map((item) => (
              <div className="card section" key={item.id}>
                <strong>{item.operation}</strong>
                <p className="stat-label">{item.actor} - {item.outcome} - {item.at}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({label, value}: {label: string; value: number | string}) {
  return (
    <div className="card stat">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
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
    <section className="card section">
      <div className="section-head">
        <h3 className="section-title">Users</h3>
        <input
          className="input"
          style={{maxWidth: 320}}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tim theo ten, email, status"
          aria-label="Search users"
        />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Security</th>
              <th>Last login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.displayName}</td>
                <td>{user.email}</td>
                <td><span className="badge">{user.status}</span></td>
                <td>v{user.securityVersion}</td>
                <td>{user.lastLogin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ResortsPanel({data}: {data: ConsoleData}) {
  return (
    <section className="card section">
      <div className="section-head">
        <h3 className="section-title">Resorts</h3>
        <button className="button primary" type="button">Onboard resort</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Members</th>
            </tr>
          </thead>
          <tbody>
            {data.resorts.map((resort) => (
              <tr key={resort.id}>
                <td>{resort.code}</td>
                <td>{resort.name}</td>
                <td>{resort.type}</td>
                <td><span className="badge">{resort.status}</span></td>
                <td>{resort.members}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RbacPanel({data}: {data: ConsoleData}) {
  return (
    <section className="content-grid">
      <div className="card section">
        <div className="section-head">
          <h3 className="section-title">Roles</h3>
          <button className="button" type="button">Create role</button>
        </div>
        <div className="grid">
          {data.roles.map((role) => (
            <div className="card section" key={role.code}>
              <strong>{role.name}</strong>
              <p className="stat-label">{role.permissions.join(", ")}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="card section">
        <h3 className="section-title">Authorization notes</h3>
        <p className="page-copy">
          Permission cuoi cung thuoc org. JWT chi giu subject, session, resort scope va
          authorization version de UI/context dung, khong tin permission claim.
        </p>
      </div>
    </section>
  );
}

function LocationsPanel({data}: {data: ConsoleData}) {
  return (
    <section className="card section">
      <div className="section-head">
        <h3 className="section-title">Vietnam locations</h3>
        <span className="badge">34 provinces - no district</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th>Communes</th>
            </tr>
          </thead>
          <tbody>
            {data.provinces.map((province) => (
              <tr key={province.code}>
                <td>{province.code}</td>
                <td>{province.name}</td>
                <td>{province.type}</td>
                <td>{province.communes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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
    <section className="card section api-lab">
      <div className="section-head">
        <h3 className="section-title">API Lab</h3>
        <span className="badge gold">BFF guarded</span>
      </div>
      <label>
        <span className="stat-label">Operation</span>
        <select
          className="select"
          value={operationId}
          onChange={(event) => setOperationId(event.target.value)}
        >
          {operationOptions.map((operation) => (
            <option key={operation.id} value={operation.id}>
              {operation.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="stat-label">Reason</span>
        <textarea
          className="textarea"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </label>
      <div className="toolbar">
        <button className="button primary" type="button" onClick={runOperation} disabled={isRunning}>
          <FlaskConical size={17} aria-hidden="true" />
          {isRunning ? "Dang goi..." : "Run operation"}
        </button>
        <button className="button warn" type="button" onClick={() => setReason("")}>Clear reason</button>
      </div>
      <pre className="result">
        {result ? JSON.stringify(result, null, 2) : "Chua co ket qua. Chon operation va bam Run."}
      </pre>
    </section>
  );
}
