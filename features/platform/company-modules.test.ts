import { describe, expect, it } from "vitest";
import { canToggle, moduleView, nextModuleStatus, readModuleChange } from "./use-company";

const now = new Date("2026-09-28T00:00:00Z");
const mod = (over: object) => ({ code: "SALES", name: "Bán hàng", always_on: false, ...over });

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("module view", () => {
  it("never offers to switch CORE off, even if the flag is missing", () => {
    expect(canToggle(mod({ code: "CORE", always_on: true }))).toBe(false);
    expect(canToggle(mod({ code: "CORE" }))).toBe(false);
    expect(canToggle(mod({}))).toBe(true);
  });
  it("shows not purchased, scheduled, expired and active from backend data", () => {
    expect(moduleView(mod({}), now)).toBe("not_purchased");
    expect(moduleView(mod({ status: "INACTIVE" }), now)).toBe("inactive");
    expect(moduleView(mod({ status: "ACTIVE", starts_at: "2026-10-01T00:00:00Z" }), now)).toBe("scheduled");
    expect(moduleView(mod({ status: "ACTIVE", ends_at: "2026-09-27T00:00:00Z" }), now)).toBe("expired");
    expect(moduleView(mod({ status: "ACTIVE", ends_at: "2026-09-29T00:00:00Z" }), now)).toBe("active");
  });
});

describe("module change", () => {
  it("requires contract_ref", () => {
    expect(readModuleChange(form({ contract_ref: " " }), "ACTIVE").error).toBeTruthy();
  });
  it("sends ends_at as RFC3339 only when given", () => {
    expect(readModuleChange(form({ contract_ref: "HD-2" }), "INACTIVE").change).toEqual({ status: "INACTIVE", contract_ref: "HD-2" });
    const change = readModuleChange(form({ contract_ref: "HD-2", ends_at: "2026-12-31T10:00" }), "ACTIVE").change;
    expect(change?.ends_at).toMatch(/^2026-12-31T\d\d:00:00\.000Z$/);
    expect(change?.starts_at).toBeUndefined();
  });
  it("schedules starts_at and rejects an interval that ends before it starts", () => {
    const change = readModuleChange(form({ contract_ref: "HD-3", starts_at: "2026-10-01T08:00", ends_at: "2026-12-31T10:00" }), "ACTIVE").change;
    expect(change?.starts_at).toMatch(/^2026-(09-30|10-01)T\d\d:00:00\.000Z$/);
    expect(readModuleChange(form({ contract_ref: "HD-3", starts_at: "2026-12-31T10:00", ends_at: "2026-10-01T08:00" }), "ACTIVE").error).toBe("Ngày kết thúc phải sau ngày bắt đầu.");
    expect(readModuleChange(form({ contract_ref: "HD-3", starts_at: "2026-10-01T08:00", ends_at: "2026-10-01T08:00" }), "ACTIVE").error).toBeTruthy();
    expect(readModuleChange(form({ contract_ref: "HD-3", starts_at: "không-phải-ngày" }), "ACTIVE").error).toBe("Ngày bắt đầu không hợp lệ.");
  });
});

describe("module toggle direction", () => {
  it("switches off active and scheduled modules, switches on the rest", () => {
    expect(nextModuleStatus("active")).toBe("INACTIVE");
    expect(nextModuleStatus("scheduled")).toBe("INACTIVE");
    expect(nextModuleStatus("inactive")).toBe("ACTIVE");
    expect(nextModuleStatus("expired")).toBe("ACTIVE");
    expect(nextModuleStatus("not_purchased")).toBe("ACTIVE");
  });
});
