import { describe, expect, it } from "vitest";
import { decodePlatform, platformMeSchema, permissionsSchema, pageSchema, companySchema, moduleSchema, supportGrantSchema, roleMatrixSchema, onboardResultSchema } from "./platform-contract";

const id = "01960000-0000-7000-8000-000000000001";
const identity = { user_id: id, role: "PLATFORM_ADMIN", actions: ["platform:org:read"] };
const ok = (data: unknown, code = 200) => ({ code, status: "success", message: "OK", data });

describe("org platform contract", () => {
  it("decodes platform actions without deriving permissions from role", () => {
    expect(decodePlatform(ok({ user_id: id, role: "PLATFORM_ADMIN", actions: [] }), platformMeSchema).actions).toEqual([]);
  });
  it.each([undefined, null, {}, { role: "PLATFORM_ADMIN" }, { user_id: id, role: "PLATFORM_ADMIN", actions: "*" }])("rejects invalid platform identity %j", (data) => {
    expect(() => decodePlatform(ok(data), platformMeSchema)).toThrow();
  });
  it.each([{}, { code: 503, status: "success", message: "OK", data: identity }, { code: 200, status: "error", message: "OK", data: identity }])("rejects invalid success envelope %j", (data) => {
    expect(() => decodePlatform(data, platformMeSchema)).toThrow();
  });
  it("permissions endpoint is bare action_keys, never platform actions", () => {
    expect(permissionsSchema.parse({ action_keys: [] }).action_keys).toEqual([]);
    expect(() => permissionsSchema.parse({ actions: ["org:company:read"] })).toThrow();
    expect(() => permissionsSchema.parse(ok({ action_keys: [] }))).toThrow();
  });
  it("accepts Go nil lists as empty, without inventing total", () => {
    const page = decodePlatform(ok({ items: null, page: 1, limit: 20 }), pageSchema(companySchema));
    expect(page).toEqual({ items: [], page: 1, limit: 20 });
    expect(() => decodePlatform(ok({ items: [], page: 0, limit: 20 }), pageSchema(companySchema))).toThrow();
    expect(() => decodePlatform(ok({ page: 1, limit: 20 }), pageSchema(companySchema))).toThrow();
  });
  it("validates individual company rows", () => {
    expect(() => decodePlatform(ok({ items: [{ root_branch_id: "bad" }], page: 1, limit: 20 }), pageSchema(companySchema))).toThrow();
  });
  it("accepts never-enabled module with omitted optional fields", () => {
    expect(moduleSchema.parse({ code: "SALES", name: "Sales", always_on: false })).toEqual({ code: "SALES", name: "Sales", always_on: false });
  });
  it("keeps pending support dates absent", () => {
    const grant = supportGrantSchema.parse({ id, root_branch_id: id, platform_user_id: id, reason: "Help", mode: "OWNER_APPROVED", created_at: "2026-09-28T00:00:00Z" });
    expect(grant.starts_at).toBeUndefined();
    expect(grant.expires_at).toBeUndefined();
  });
  it("decodes 201 Created onboarding result without inventing optional owner data", () => {
    const result = { branch_id: id, code: "MAIN-A", status: "ACTIVE", roles_count: 5, outbox_event_id: id };
    expect(decodePlatform(ok(result, 201), onboardResultSchema)).toEqual(result);
  });
  it("role matrix does not accept non-action values", () => {
    expect(roleMatrixSchema.parse({ OWNER: ["org:company:read"] })).toEqual({ OWNER: ["org:company:read"] });
    expect(() => roleMatrixSchema.parse({ OWNER: [true] })).toThrow();
  });
});
