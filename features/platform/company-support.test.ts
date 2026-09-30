import { afterEach, describe, expect, it, vi } from "vitest";
import * as fetcher from "@/lib/fetcher";
import { companyAudit, companySupport, decideCompanyGrant } from "@/lib/api/platform-client";
import { decisionsFor } from "./use-company-support";

afterEach(() => vi.restoreAllMocks());

const root = "01960000-0000-7000-8000-00000000000a";
const now = new Date("2026-09-28T12:00:00Z");
const grant = (over: object) => ({
  id: "01960000-0000-7000-8000-000000000010", root_branch_id: root, platform_user_id: "01960000-0000-7000-8000-000000000012",
  reason: "r", mode: "OWNER_APPROVED", created_at: "2026-09-28T10:00:00Z", ...over,
});
const page = { code: 200, status: "success", message: "OK", data: { items: null, page: 2, limit: 20 } };

describe("company support decisions", () => {
  it("pending can be approved or revoked, active only revoked, finished ones nothing", () => {
    expect(decisionsFor(grant({}), now)).toEqual(["approve", "revoke"]);
    expect(decisionsFor(grant({ starts_at: "2026-09-28T11:00:00Z", expires_at: "2026-09-29T11:00:00Z" }), now)).toEqual(["revoke"]);
    expect(decisionsFor(grant({ starts_at: "2026-09-27T11:00:00Z", expires_at: "2026-09-28T11:00:00Z" }), now)).toEqual([]);
    expect(decisionsFor(grant({ revoked_at: "2026-09-28T11:00:00Z" }), now)).toEqual([]);
  });
});

describe("company calls always carry the selected MAIN", () => {
  it("lists, audits and decides with org_id of the current company", async () => {
    const spy = vi.spyOn(fetcher, "fetcher")
      .mockResolvedValueOnce(page)
      .mockResolvedValueOnce(page)
      .mockResolvedValueOnce({ code: 200, status: "success", message: "OK", data: grant({ starts_at: "2026-09-28T11:00:00Z" }) });
    expect((await companySupport(root, 2)).items).toEqual([]);
    await companyAudit(root, { action: "break_glass" }, 2);
    await decideCompanyGrant(root, "01960000-0000-7000-8000-000000000010", "approve");
    expect(spy.mock.calls[0][0]).toBe(`/api/org/company/support-access?page=2&limit=20&org_id=${root}`);
    expect(spy.mock.calls[1][0]).toBe(`/api/org/company/audit-logs?action=break_glass&page=2&limit=20&org_id=${root}`);
    expect(spy.mock.calls[2][0]).toBe(`/api/org/support-access/01960000-0000-7000-8000-000000000010/approve?org_id=${root}`);
    expect(spy.mock.calls[2][1]).toMatchObject({ method: "POST" });
  });
});
