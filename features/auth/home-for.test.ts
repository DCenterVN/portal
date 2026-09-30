import { describe, expect, it } from "vitest";
import { homeFor, platformHome, staffBranchCount } from "./home-for";

describe("homeFor", () => {
  it("sends a customer home or to a safe customer redirect", () => {
    expect(homeFor(0, null)).toBe("/");
    expect(homeFor(0, "/cart")).toBe("/cart");
    expect(homeFor(0, "/products/abc")).toBe("/products/abc");
  });

  it("never sends a customer into the console", () => {
    expect(homeFor(0, "/console")).toBe("/");
    expect(homeFor(0, "/roles")).toBe("/");
    expect(homeFor(0, "/productsx")).toBe("/");
  });

  it("sends staff to the console or the branch picker", () => {
    expect(homeFor(1, null)).toBe("/console");
    expect(homeFor(2, null)).toBe("/switch-branch");
    expect(homeFor(1, "/roles")).toBe("/roles");
    expect(homeFor(1, "/cart")).toBe("/cart");
  });

  it("drops open redirects", () => {
    expect(homeFor(0, "//evil.com")).toBe("/");
    expect(homeFor(1, "https://evil.com")).toBe("/console");
  });
});

describe("staffBranchCount", () => {
  it("counts distinct EMPLOYEE branches only", () => {
    expect(staffBranchCount(undefined)).toBe(0);
    expect(staffBranchCount([{ branch_id: "b1", member_type: "CUSTOMER" }])).toBe(0);
    expect(staffBranchCount([
      { branch_id: "b1", member_type: "EMPLOYEE" },
      { branch_id: "b1", member_type: "EMPLOYEE" },
      { branch_id: "b2", member_type: "EMPLOYEE" },
    ])).toBe(2);
  });
});


describe("platformHome", () => {
  it("routes explicit platform actions to platform workspace and respects safe redirects", () => {
    expect(platformHome(200, { code: 200, status: "success", message: "OK", data: { user_id: "01960000-0000-7000-8000-000000000001", role: "PLATFORM_SUPPORT", actions: ["platform:org:read"] } }, null)).toBe("/platform/companies");
    expect(platformHome(200, { code: 200, status: "success", message: "OK", data: { user_id: "01960000-0000-7000-8000-000000000001", role: "PLATFORM_SUPPORT", actions: [] } }, "/cart")).toBe("/cart");
  });
  it("fails closed on non-404 lookup failures and malformed payloads", () => {
    expect(platformHome(503, null, null)).toBe("/");
    expect(platformHome(200, { status: "success" }, null)).toBe("/");
    expect(platformHome(404, null, null)).toBeNull();
  });
});
