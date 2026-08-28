import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as operationsHandler } from "./[operationId]/route";

describe("Portal BFF Operations & Operator Console", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("1. Unregistered operation returns 404", async () => {
    const req = new NextRequest("http://localhost:3000/api/operations/unknown.op", {
      method: "POST",
      body: JSON.stringify({ environment: "dev", reason: "" }),
    });

    const res = await operationsHandler(req, { params: Promise.resolve({ operationId: "unknown.op" }) });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.data.message).toBe("Operation is not registered");
  });

  it("2. Guard policy denies mutation in production when allowedInProduction is false", async () => {
    const req = new NextRequest("http://localhost:3000/api/operations/auth.operator.user.security-action", {
      method: "POST",
      body: JSON.stringify({
        environment: "production",
        reason: "Valid reason for audit log",
      }),
    });

    const res = await operationsHandler(req, {
      params: Promise.resolve({ operationId: "auth.operator.user.security-action" }),
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.data.message).toBe("Operation denied by portal guard policy");
  });

  it("3. Guard policy denies operation requiring reason when reason is too short", async () => {
    const req = new NextRequest("http://localhost:3000/api/operations/org.operator.branch.onboard", {
      method: "POST",
      body: JSON.stringify({
        environment: "dev",
        reason: "short",
      }),
    });

    const res = await operationsHandler(req, {
      params: Promise.resolve({ operationId: "org.operator.branch.onboard" }),
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.data.message).toBe("Operation denied by portal guard policy");
  });

  it("4. GET operation (auth.operator.users.list) calls backend and returns data", async () => {
    const mockUsers = [
      { id: "u-1", email: "user1@example.com", status: "ACTIVE" },
      { id: "u-2", email: "user2@example.com", status: "PENDING" },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ users: mockUsers }),
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/operations/auth.operator.users.list", {
      method: "POST",
      body: JSON.stringify({ environment: "dev" }),
    });

    const res = await operationsHandler(req, {
      params: Promise.resolve({ operationId: "auth.operator.users.list" }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.response).toEqual({ users: mockUsers });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/internal/operator/users"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "User-Agent": "portal-bff/operator-console",
        }),
      })
    );
  });

  it("5. POST operation (org.operator.branch.onboard) forwards payload and returns real backend response", async () => {
    const mockBranchResponse = {
      id: "branch-uuid-123",
      code: "COLD-MAIN",
      name: "Kho Lạnh Tân Tạo",
      status: "ACTIVE",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => mockBranchResponse,
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/operations/org.operator.branch.onboard", {
      method: "POST",
      body: JSON.stringify({
        environment: "dev",
        reason: "Onboarding new test branch",
        payload: {
          code: "COLD-MAIN",
          name: "Kho Lạnh Tân Tạo",
        },
      }),
    });

    const res = await operationsHandler(req, {
      params: Promise.resolve({ operationId: "org.operator.branch.onboard" }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.response).toEqual(mockBranchResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/internal/branches/onboard"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ code: "COLD-MAIN", name: "Kho Lạnh Tân Tạo" }),
      })
    );
  });

  it("6. Backend error is forwarded with exact status and message", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ error: "branch_code_already_exists", message: "Code COLD-MAIN already exists" }),
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/operations/org.operator.branch.onboard", {
      method: "POST",
      body: JSON.stringify({
        environment: "dev",
        reason: "Duplicate code onboarding test",
        payload: { code: "COLD-MAIN" },
      }),
    });

    const res = await operationsHandler(req, {
      params: Promise.resolve({ operationId: "org.operator.branch.onboard" }),
    });

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.data.message).toBe("Code COLD-MAIN already exists");
  });

  it("7. Security action path substitution and execution", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ accepted: true, action: "SUSPEND" }),
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/operations/auth.operator.user.security-action", {
      method: "POST",
      body: JSON.stringify({
        environment: "dev",
        reason: "Suspicious activity reported",
        params: { user_id: "user-target-123" },
        payload: { action: "SUSPEND" },
      }),
    });

    const res = await operationsHandler(req, {
      params: Promise.resolve({ operationId: "auth.operator.user.security-action" }),
    });

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/internal/users/user-target-123/security-action"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "SUSPEND" }),
      })
    );
  });
});
