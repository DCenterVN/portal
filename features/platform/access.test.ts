import { describe, expect, it } from "vitest";
import { companyAccess, hasAction, platformAccess } from "./access";
const me = { action_keys: ["org:role:update", "org:company:read"] };
describe("authorization access", () => {
  it("allows only explicit action keys from permissions response", () => {
    const access = platformAccess(200, me);
    expect(hasAction(access, "org:role:update")).toBe(true);
    expect(hasAction(access, "org:role:delete")).toBe(false);
  });
  it("denies missing permissions and blocks upstream errors", () => {
    expect(platformAccess(404, null).status).toBe("denied");
    for (const status of [401, 403, 404]) expect(platformAccess(status, me).status).toBe("denied");
    expect(platformAccess(200, { action_keys: [] }).status).toBe("denied");
    expect(platformAccess(200, { action_keys: ["org:company:read"] }).status).toBe("denied");
    for (const status of [0, 500, 502, 503]) expect(platformAccess(status, me).status).toBe("blocked");
  });
  it("fails closed for malformed or missing actions", () => {
    expect(platformAccess(200, { action_keys: "*" }).status).toBe("blocked");
    expect(hasAction({ status: "blocked" }, "org:role:update")).toBe(false);
  });
  it("uses the same action_keys contract for employee access", () => {
    const access = companyAccess(200, { action_keys: ["org:company:read"] });
    expect(hasAction(access, "org:company:read")).toBe(true);
    expect(companyAccess(200, { actions: ["org:company:read"] }).status).toBe("blocked");
  });
  it("blocks company authorization failures and malformed bodies", () => {
    expect(companyAccess(503, { action_keys: ["*"] }).status).toBe("blocked");
    expect(companyAccess(200, null).status).toBe("blocked");
  });
});
