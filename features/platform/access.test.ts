import { describe, expect, it } from "vitest";
import { companyAccess, hasAction, platformAccess } from "./access";
const me = { code: 200, status: "success", message: "OK", data: { user_id: "01960000-0000-7000-8000-000000000001", role: "PLATFORM_ADMIN", actions: ["platform:org:read"] } };
describe("authorization access", () => {
  it("allows only explicit action keys from platform response", () => {
    const access = platformAccess(200, me);
    expect(hasAction(access, "platform:org:read")).toBe(true);
    expect(hasAction(access, "platform:staff:read")).toBe(false);
  });
  it("treats platform 404 as no membership and upstream errors as blocked", () => {
    expect(platformAccess(404, null).status).toBe("denied");
    for (const status of [0, 401, 403, 500, 502, 503]) expect(platformAccess(status, me).status).toBe("blocked");
  });
  it("fails closed for malformed or missing actions", () => {
    expect(platformAccess(200, { ...me, data: { ...me.data, actions: "*" } }).status).toBe("blocked");
    expect(hasAction({ status: "blocked" }, "platform:org:read")).toBe(false);
  });
  it("reads employee action_keys separately from platform actions", () => {
    const access = companyAccess(200, { action_keys: ["org:company:read"] });
    expect(hasAction(access, "org:company:read")).toBe(true);
    expect(companyAccess(200, { actions: ["org:company:read"] }).status).toBe("blocked");
  });
  it("blocks company authorization failures and malformed bodies", () => {
    expect(companyAccess(503, { action_keys: ["*"] }).status).toBe("blocked");
    expect(companyAccess(200, null).status).toBe("blocked");
  });
});

import { errorText } from "./access";
import { companyChoices, navFor } from "./workspace";

describe("workspace navigation", () => {
  it("shows only menu items whose action org returned, company links keep org_id", () => {
    expect(navFor("platform", new Set(["platform:org:read", "platform:audit:read"]), "").map((item) => item.href)).toEqual(["/platform/companies", "/platform/audit"]);
    expect(navFor("platform", new Set(["org:company:read"]), "")).toEqual([]);
    expect(navFor("company", new Set(["org:company:read"]), "R1").map((item) => item.href)).toEqual(["/company?org_id=R1", "/company/support-access?org_id=R1"]);
  });
  it("company picker lists each employee company once and ignores customer memberships", () => {
    expect(companyChoices([
      { org_id: "A", org_name: "Alpha", member_type: "EMPLOYEE" },
      { org_id: "A", org_name: "Alpha", member_type: "EMPLOYEE" },
      { org_id: "B", org_name: "Beta", member_type: "CUSTOMER" },
    ])).toEqual([{ id: "A", name: "Alpha" }]);
  });
});

describe("error text", () => {
  const failure = (status: number) => Object.assign(new Error("m"), { status });
  it("treats network failure, 502 and 503 as blocked, not as allowed", () => {
    for (const status of [0, 502, 503]) expect(errorText(failure(status))).toContain("không khả dụng");
  });
  it("per-operation overrides win only for their status", () => {
    expect(errorText(failure(409), { 409: "X" })).toBe("X");
    expect(errorText(failure(403), { 409: "X" })).toContain("không có quyền");
  });
});
