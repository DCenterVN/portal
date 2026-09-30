import { describe, expect, it } from "vitest";
import { errorText } from "./access";
import { LAST_ADMIN_CONFLICT, readStaffGrant } from "./use-staff";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("staff grant form", () => {
  it("needs a UUID and a known platform role", () => {
    expect(readStaffGrant(form({ user_id: "abc", role: "PLATFORM_ADMIN" })).field).toBe("user_id");
    expect(readStaffGrant(form({ user_id: "01960000-0000-7000-8000-000000000001", role: "OWNER" })).field).toBe("role");
    expect(readStaffGrant(form({ user_id: " 01960000-0000-7000-8000-000000000001 ", role: "PLATFORM_ADMIN" })).input).toEqual({
      userId: "01960000-0000-7000-8000-000000000001",
      role: "PLATFORM_ADMIN",
    });
  });
});

describe("staff revoke", () => {
  it("409 on revoke says last admin, exactly", () => {
    expect(errorText(Object.assign(new Error("x"), { status: 409 }), { 409: LAST_ADMIN_CONFLICT })).toBe(LAST_ADMIN_CONFLICT);
  });
});
