import { describe, expect, it } from "vitest";
import { errorText } from "./access";
import { BREAK_GLASS_CONFLICT, grantState, readSupport, usableCompanies } from "./use-support";

const now = new Date("2026-09-28T12:00:00Z");
const grant = (over: object) => ({
  id: "01960000-0000-7000-8000-000000000010", root_branch_id: "01960000-0000-7000-8000-000000000011",
  platform_user_id: "01960000-0000-7000-8000-000000000012", reason: "r", mode: "STANDING", created_at: "2026-09-28T10:00:00Z", ...over,
});

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("grant state", () => {
  it("a grant without starts_at is pending, never shown as having access", () => {
    expect(grantState(grant({}), now)).toBe("pending");
  });
  it("revoked wins over everything, expiry uses expires_at", () => {
    expect(grantState(grant({ starts_at: "2026-09-28T11:00:00Z", expires_at: "2026-09-29T11:00:00Z", revoked_at: "2026-09-28T11:30:00Z" }), now)).toBe("revoked");
    expect(grantState(grant({ starts_at: "2026-09-27T11:00:00Z", expires_at: "2026-09-28T11:00:00Z" }), now)).toBe("expired");
    expect(grantState(grant({ starts_at: "2026-09-28T11:00:00Z", expires_at: "2026-09-28T15:00:00Z" }), now)).toBe("active");
  });
});

describe("support request", () => {
  it("requires company and reason; ticket is optional", () => {
    expect(readSupport(form({ root_branch_id: "", reason: "x" })).field).toBe("root_branch_id");
    expect(readSupport(form({ root_branch_id: "id", reason: "  " })).field).toBe("reason");
    expect(readSupport(form({ root_branch_id: "id", reason: "x" })).input).toEqual({ root_branch_id: "id", reason: "x", ticket_ref: "" });
  });
  it("break-glass 409 shows the 24h message, other operations keep the generic one", () => {
    const conflict = Object.assign(new Error("conflict"), { status: 409 });
    expect(errorText(conflict, { 409: BREAK_GLASS_CONFLICT })).toBe(BREAK_GLASS_CONFLICT);
    expect(errorText(conflict)).not.toBe(BREAK_GLASS_CONFLICT);
  });
});

describe("company options", () => {
  it("drops the cached list once revalidation fails", () => {
    const data = { items: [{ root_branch_id: "a" }] };
    expect(usableCompanies({ data })).toEqual(data.items);
    expect(usableCompanies({ data, error: new Error("503") })).toEqual([]);
    expect(usableCompanies({})).toEqual([]);
  });
});
