import { beforeAll, describe, expect, it } from "vitest";

// Live OWNER plane. Fixtures: .aidlc/runs/PORTAL-PLATFORM-001/evidence/seed-fixtures.sh (ui-owner, ui-owner2 pre-activated, D-095).
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

async function login(email: string): Promise<Call> {
  const response = await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  expect(response.status, `login ${email}`).toBe(200);
  const cookie = response.headers.getSetCookie().map((item) => item.split(";")[0]).join("; ");
  return async (path, init = {}) => {
    const reply = await fetch(`${base}${path}`, { ...init, headers: { "content-type": "application/json", cookie, ...init.headers } });
    const text = await reply.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = null; }
    return { status: reply.status, body };
  };
}
const post = (value?: unknown, headers: Record<string, string> = {}) => ({ method: "POST", headers, ...(value === undefined ? {} : { body: JSON.stringify(value) }) });

let admin: Call, owner: Call, owner2: Call;
let rootA = "", rootB = "";

async function onboard(code: string, ownerEmail: string) {
  const reply = await admin("/api/platform/companies", post({ name: `UI Owner ${code}`, code, contract_ref: `HD-${code}`, owner_email: ownerEmail, owner_display_name: "UI Owner", modules: [] }, { "Idempotency-Key": `it-${code}` }));
  expect(reply.status, `onboard ${code}`).toBe(201);
  return reply.body.data.branch_id as string;
}

beforeAll(async () => {
  [admin, owner, owner2] = await Promise.all([login("ui-admin@test.local"), login("ui-owner@test.local"), login("ui-owner2@test.local")]);
  rootA = await onboard(`UIA-${stamp}`, "ui-owner@test.local");
  rootB = await onboard(`UIB-${stamp}`, "ui-owner2@test.local");
});

describe("OWNER on MAIN", () => {
  it("reads own company permissions, modules and matrix through MAIN", async () => {
    const perms = await owner(`/api/org/permissions/me?org_id=${rootA}&branch_id=${rootA}`);
    expect(perms.status).toBe(200);
    expect(perms.body.action_keys).toEqual(expect.arrayContaining(["org:company:read", "org:support_access:approve"]));
    for (const path of ["company/modules", "company/role-matrix", "company/support-access?page=1&limit=20", "company/audit-logs?page=1&limit=20"]) {
      const reply = await owner(`/api/org/${path}${path.includes("?") ? "&" : "?"}org_id=${rootA}`);
      expect(reply.status, path).toBe(200);
    }
  });

  it("cannot read or act on another company, even by editing org_id", async () => {
    expect((await owner(`/api/org/company/modules?org_id=${rootB}`)).status).toBe(403);
    expect((await owner(`/api/org/company/support-access?org_id=${rootB}`)).status).toBe(403);
    expect((await owner("/api/org/company/modules?org_id=not-a-uuid")).status).toBe(400);
  });

  it("approve gives 24h, revoke ends it, deciding a revoked grant is 409, and B cannot decide A's grant", async () => {
    const grant = await admin("/api/platform/support-access", post({ root_branch_id: rootA, reason: "owner approval it", ticket_ref: `T-${stamp}` }));
    expect(grant.status).toBe(201);
    const id = grant.body.data.id as string;
    const foreign = await owner2(`/api/org/support-access/${id}/approve?org_id=${rootB}`, post());
    expect(foreign.status).toBe(404);
    expect(foreign.body.errors.error_code).toBe("NOT_FOUND");
    const list = await owner(`/api/org/company/support-access?org_id=${rootA}&page=1&limit=100`);
    const still = (list.body.data.items as { id: string; starts_at?: string; approved_by_user_id?: string }[]).find((item) => item.id === id);
    expect(still).toBeDefined();
    expect(still?.starts_at ?? null).toBeNull();
    expect(still?.approved_by_user_id ?? null).toBeNull();
    const approved = await owner(`/api/org/support-access/${id}/approve?org_id=${rootA}`, post());
    expect(approved.status).toBe(200);
    const hours = (Date.parse(approved.body.data.expires_at) - Date.parse(approved.body.data.starts_at)) / 36e5;
    expect(hours).toBeCloseTo(24, 1);
    const revoked = await owner(`/api/org/support-access/${id}/revoke?org_id=${rootA}`, post());
    expect(revoked.status).toBe(200);
    expect(revoked.body.data.revoked_at).toBeTruthy();
    expect((await owner(`/api/org/support-access/${id}/approve?org_id=${rootA}`, post())).status).toBe(409);
  });

  it("standing consent makes the next request active immediately", async () => {
    const consent = await owner(`/api/org/company/settings?org_id=${rootA}`, { method: "PUT", body: JSON.stringify({ standing_support_consent: true }) });
    expect(consent.status).toBe(200);
    expect(consent.body.data.standing_support_consent).toBe(true);
    const grant = await admin("/api/platform/support-access", post({ root_branch_id: rootA, reason: "standing it" }));
    expect(grant.status).toBe(201);
    expect(grant.body.data.starts_at).toBeTruthy();
    const audit = await owner(`/api/org/company/audit-logs?org_id=${rootA}&page=1&limit=50`);
    expect(audit.body.data.items.length).toBeGreaterThan(0);
  });
});
