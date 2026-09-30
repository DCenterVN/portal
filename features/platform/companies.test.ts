import { describe, expect, it } from "vitest";
import { pageParam, readOnboard } from "./use-companies";

function form(values: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) for (const item of [value].flat()) data.append(key, item);
  return data;
}

const valid = { name: "Công ty A", code: "CTA", contract_ref: "HD-01", owner_email: "owner@a.vn", owner_display_name: "Chủ A" };

describe("onboard form", () => {
  it("sends exactly the DTO fields, never owner_user_id or performed_by_user_id", () => {
    const { input, errors } = readOnboard(form({ ...valid, modules: ["SALES", "INVENTORY"], owner_user_id: "x", performed_by_user_id: "y" }));
    expect(errors).toEqual({});
    expect(Object.keys(input).sort()).toEqual(["code", "contract_ref", "modules", "name", "owner_display_name", "owner_email"]);
    expect(input.modules).toEqual(["SALES", "INVENTORY"]);
  });
  it("drops CORE and unknown modules: CORE is always on and not the client's to send", () => {
    expect(readOnboard(form({ ...valid, modules: ["CORE", "HACK", "SALES"] })).input.modules).toEqual(["SALES"]);
  });
  it("requires contract_ref and a valid owner email", () => {
    const { errors } = readOnboard(form({ ...valid, contract_ref: "  ", owner_email: "not-mail" }));
    expect(errors.contract_ref).toBeTruthy();
    expect(errors.owner_email).toBeTruthy();
  });
  it("caps the owner display name at 50 like auth", () => {
    expect(readOnboard(form({ ...valid, owner_display_name: "a".repeat(51) })).errors.owner_display_name).toBeTruthy();
    expect(readOnboard(form({ ...valid, owner_display_name: "a".repeat(50) })).errors.owner_display_name).toBeUndefined();
  });
});

describe("page param", () => {
  it("falls back to page 1 for junk", () => {
    for (const value of [null, "", "0", "-2", "1.5", "abc"]) expect(pageParam(value)).toBe(1);
    expect(pageParam("3")).toBe(3);
  });
});
