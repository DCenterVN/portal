import { afterEach, describe, expect, it, vi } from "vitest";
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

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuditLog } from "./audit-view";
import * as useAuditModule from "./use-audit";
import { companyAudit } from "@/lib/api/platform-client";

vi.mock("./use-audit", async (original) => ({
  ...await original<typeof import("./use-audit")>(),
  useAudit: vi.fn(),
}));
afterEach(() => vi.unstubAllGlobals());

it("audit_no_uuid", async () => {
  const uuid = "0192f3a4-5b6c-7d8e-9f00-112233445566";
  const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => Response.json({ code: 200, status: "success", message: "Success", data: {
    items: [{ id: uuid, actor_user_id: uuid, target_id: uuid, contract_ref: uuid, root_branch_id: uuid,
      occurred_at: "2026-10-21T07:05:00Z", plane: "platform", action: "update", target_type: "Chi nhánh",
      reason: "Cập nhật thông tin", before: { id: uuid, branch_ref: uuid, name: "Bếp cũ" }, after: { id: uuid, nested: { parent_id: uuid }, name: "Bếp mới", memo: `Nội bộ ${uuid}` },
    }], page: 1, limit: 20,
  } }));
  vi.stubGlobal("fetch", fetchMock);
  for (const source of ["company"] as const) {
    const data = await companyAudit(uuid, {}, 1);
    vi.mocked(useAuditModule.useAudit).mockReturnValue({ data, error: undefined, isLoading: false, isValidating: false, mutate: vi.fn() } as unknown as ReturnType<typeof useAuditModule.useAudit>);
    const html = renderToStaticMarkup(React.createElement(AuditLog, { source, root: uuid }));
    expect(html).toContain("Cập nhật thông tin");
    expect(html).toContain("Chi nhánh");
    if (source === "company") expect(html).toContain("Bếp mới");
    expect(userFacingContent(html)).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
  }
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

function userFacingContent(html: string): string {
  const text = html.replace(/<[^>]*>/g, " ");
  const labels = html.match(/\s(?:label|placeholder|title|aria-[\w-]+)="[^"]*"/g) ?? [];
  const values = (html.match(/<input\b[^>]*>/g) ?? [])
    .filter((input) => !input.includes('type="hidden"'))
    .flatMap((input) => input.match(/\svalue="[^"]*"/g) ?? []);
  return [text, ...labels, ...values].join(" ");
}