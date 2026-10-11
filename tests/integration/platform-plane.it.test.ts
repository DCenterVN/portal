import { beforeAll, describe, expect, it } from "vitest";

// Live: portal BFF → Kong → org/auth. Fixtures: .aidlc/runs/PORTAL-PLATFORM-001/evidence/seed-fixtures.sh
function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the live run (no silent skip)`);
  return value.replace(/\/$/, "");
}
const base = required("PORTAL_IT_BASE");
const password = required("PORTAL_IT_PASSWORD");
const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- live JSON is asserted field by field below
type Reply = { status: number; body: any };
type Call = (path: string, init?: RequestInit) => Promise<Reply>;

function session(cookie: string): Call {
  return async (path, init = {}) => {
    const response = await fetch(`${base}${path}`, { ...init, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}), ...init.headers } });
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = null; }
    return { status: response.status, body };
  };
}

async function login(email: string): Promise<Call> {
  const response = await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  expect(response.status, `login ${email}`).toBe(200);
  return session(response.headers.getSetCookie().map((cookie) => cookie.split(";")[0]).join("; "));
}

const json = (value: unknown, headers: Record<string, string> = {}) => ({ method: "POST", body: JSON.stringify(value), headers });
const put = (value: unknown) => ({ method: "PUT", body: JSON.stringify(value) });

let admin: Call, support: Call, customer: Call;
beforeAll(async () => {
  [admin, support, customer] = await Promise.all([login("ui-admin@test.local"), login("ui-support@test.local"), login("ui-customer@test.local")]);
});

describe("guard: platform context comes only from org", () => {
  it("no cookie → sent to /login (proxy), customer → 404 (not platform staff)", async () => {
    const anonymous = await fetch(`${base}/api/platform/me`, { redirect: "manual" });
    expect(anonymous.status).toBe(307);
    expect(anonymous.headers.get("location")).toContain("/login");
    expect((await customer("/api/platform/me")).status).toBe(404);
    expect((await customer("/api/platform/companies")).status).toBe(403);
  });
  it("PLATFORM_SUPPORT gets read actions only; admin-only calls are 403", async () => {
    const me = await support("/api/platform/me");
    expect(me.status).toBe(200);
    expect(me.body?.data.actions).toContain("platform:support_access:create");
    expect(me.body?.data.actions).not.toContain("platform:support_access_break_glass:create");
    expect((await support("/api/platform/staff")).status).toBe(403);
    expect((await support("/api/platform/support-access/break-glass", json({ root_branch_id: "01960000-0000-7000-8000-000000000001", reason: "x" }))).status).toBe(403);
  });
  it("BFF refuses paths outside the allow-list before reaching org", async () => {
    expect((await admin("/api/platform/internal/users")).status).toBe(404);
    expect((await admin("/api/platform/companies/..%2F..%2Finternal/modules")).status).toBe(404);
    expect((await admin("/api/platform/companies?page=1&evil=1")).status).toBe(400);
  });
});

describe("admin flow on a fresh company", () => {
  let root = "";
  const onboard = { name: `UI Live ${stamp}`, code: `UIL-${stamp}`, contract_ref: `HD-${stamp}`, owner_email: "ui-owner@test.local", owner_display_name: "UI Owner", modules: ["SALES"] };

  it("onboards once per Idempotency-Key", async () => {
    const key = `it-${stamp}`;
    const first = await admin("/api/platform/companies", json(onboard, { "Idempotency-Key": key }));
    expect(first.status).toBe(201);
    root = first.body?.data.branch_id;
    const again = await admin("/api/platform/companies", json(onboard, { "Idempotency-Key": key }));
    expect(again.body?.data.branch_id).toBe(root);
    const missing = await admin("/api/platform/companies", json({ ...onboard, code: `UIX-${stamp}`, contract_ref: "" }, { "Idempotency-Key": `${key}-x` }));
    expect(missing.status).toBe(400);
  });

  it("modules: CORE cannot be switched off, a new module reads back ACTIVE", async () => {
    const modules = await admin(`/api/platform/companies/${root}/modules`);
    expect(modules.status).toBe(200);
    const byCode = Object.fromEntries(modules.body?.data.map((item: { code: string }) => [item.code, item]));
    expect(byCode.CORE.always_on).toBe(true);
    expect(byCode.SALES.status).toBe("ACTIVE");
    expect((await admin(`/api/platform/companies/${root}/modules/CORE`, put({ status: "INACTIVE", contract_ref: onboard.contract_ref }))).status).toBe(400);
    const on = await admin(`/api/platform/companies/${root}/modules/INVENTORY`, put({ status: "ACTIVE", contract_ref: onboard.contract_ref }));
    expect(on.status).toBe(200);
    expect(on.body?.data.find((item: { code: string }) => item.code === "INVENTORY").status).toBe("ACTIVE");
  });

  it("role matrix: unknown role 404, action of an unpurchased module 400, valid replace reads back", async () => {
    const matrix = await admin(`/api/platform/companies/${root}/role-matrix`);
    expect(matrix.status).toBe(200);
    const [role, actions] = Object.entries(matrix.body?.data as Record<string, string[]>).find(([, list]) => list.length > 1)!;
    expect((await admin(`/api/platform/companies/${root}/role-matrix/roles/NO_SUCH_ROLE`, put({ actions }))).status).toBe(404);
    expect((await admin(`/api/platform/companies/${root}/role-matrix/roles/${role}`, put({ actions: [...actions, "production:order:read"] }))).status).toBe(400);
    const trimmed = await admin(`/api/platform/companies/${root}/role-matrix/roles/${role}`, put({ actions: actions.slice(1) }));
    expect(trimmed.status).toBe(200);
    expect(trimmed.body?.data[role]).toEqual(expect.not.arrayContaining([actions[0]]));
    expect((await admin(`/api/platform/companies/${root}/role-matrix/roles/${role}`, put({ actions }))).status).toBe(200);
  });

  it("support: request without consent stays pending; break-glass is ≤4h and a second one is 409", async () => {
    const request = await admin("/api/platform/support-access", json({ root_branch_id: root, reason: "it pending", ticket_ref: `T-${stamp}` }));
    expect(request.status).toBe(201);
    expect(request.body?.data.starts_at).toBeUndefined();
    const glass = await admin("/api/platform/support-access/break-glass", json({ root_branch_id: root, reason: "it break-glass" }));
    expect(glass.status).toBe(201);
    const hours = (Date.parse(glass.body?.data.expires_at) - Date.parse(glass.body?.data.starts_at)) / 36e5;
    expect(hours).toBeGreaterThan(0);
    expect(hours).toBeLessThanOrEqual(4);
    expect((await admin("/api/platform/support-access/break-glass", json({ root_branch_id: root, reason: "again" }))).status).toBe(409);
    const mine = await admin("/api/platform/support-access?page=1&limit=100");
    expect(mine.body?.data.items.map((grant: { id: string }) => grant.id)).toEqual(expect.arrayContaining([request.body?.data.id, glass.body?.data.id]));
  });

  it("staff: granting an existing staff member is 409", async () => {
    const staff = await admin("/api/platform/staff?page=1&limit=100");
    expect(staff.status).toBe(200);
    const member = staff.body?.data.items.find((item: { role: string; status: string }) => item.role === "PLATFORM_SUPPORT" && item.status === "ACTIVE");
    expect((await admin("/api/platform/staff", json({ user_id: member.user_id, role: "PLATFORM_SUPPORT" }))).status).toBe(409);
  });

  it("audit: filtered by company, never carries before/after", async () => {
    const audit = await admin(`/api/platform/audit-logs?root_branch_id=${root}&page=1&limit=50`);
    expect(audit.status).toBe(200);
    const items = audit.body?.data.items as Array<Record<string, unknown>>;
    expect(items.length).toBeGreaterThanOrEqual(3);
    for (const item of items) {
      expect(item.root_branch_id ?? item.on_behalf_of_root_branch_id).toBe(root);
      expect(item).not.toHaveProperty("before");
      expect(item).not.toHaveProperty("after");
    }
    expect(items.map((item) => item.action)).toEqual(expect.arrayContaining(["support_access.break_glass"]));
  });
});
