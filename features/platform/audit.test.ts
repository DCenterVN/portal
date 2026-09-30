import { describe, expect, it } from "vitest";
import { readAuditFilters } from "./use-audit";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("audit filters", () => {
  it("empty form sends no filter keys", () => {
    expect(readAuditFilters(form({ root_branch_id: "", action: "", since: "", until: "" }), true).filters).toEqual({});
  });
  it("converts datetime-local to RFC3339 and rejects since after until", () => {
    const ok = readAuditFilters(form({ since: "2026-09-01T00:00", until: "2026-09-02T00:00" }), true).filters;
    expect(ok?.since).toMatch(/^2026-0[89]-\d\dT\d\d:00:00\.000Z$/);
    expect(readAuditFilters(form({ since: "2026-09-03T00:00", until: "2026-09-02T00:00" }), true).error).toBeTruthy();
  });
  it("company source never sends root_branch_id, even if the form has one", () => {
    const root = "01960000-0000-7000-8000-000000000001";
    expect(readAuditFilters(form({ root_branch_id: root }), false).filters).toEqual({});
    expect(readAuditFilters(form({ root_branch_id: root }), true).filters).toEqual({ root_branch_id: root });
    expect(readAuditFilters(form({ root_branch_id: "nope" }), true).error).toBeTruthy();
  });
});
