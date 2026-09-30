import { afterEach, describe, expect, it, vi } from "vitest";
import { getPlatformMe, listCompanies, onboardCompany, companyPermissions } from "./platform-client";
import * as fetcher from "@/lib/fetcher";
afterEach(() => vi.restoreAllMocks());
describe("platform typed client", () => {
  it("reads platform envelope and passes action list unchanged", async () => {
    vi.spyOn(fetcher, "fetcher").mockResolvedValue({ code: 200, status: "success", message: "OK", data: { user_id: "01960000-0000-7000-8000-000000000001", role: "PLATFORM_SUPPORT", actions: ["platform:org:read"] } });
    expect((await getPlatformMe()).actions).toEqual(["platform:org:read"]);
    expect(fetcher.fetcher).toHaveBeenCalledWith("/api/platform/me", undefined);
  });
  it("encodes query and company ids", async () => {
    vi.spyOn(fetcher, "fetcher").mockResolvedValue({ code: 200, status: "success", message: "OK", data: { items: [], page: 1, limit: 20 } });
    await listCompanies();
    expect(fetcher.fetcher).toHaveBeenCalledWith("/api/platform/companies?page=1&limit=20", undefined);
  });
  it("sends onboard idempotency key and MAIN scope for permission lookup", async () => {
    const spy = vi.spyOn(fetcher, "fetcher").mockResolvedValueOnce({ code: 201, status: "success", message: "Created", data: { branch_id: "01960000-0000-7000-8000-000000000001", code: "A", status: "ACTIVE", roles_count: 1, outbox_event_id: "01960000-0000-7000-8000-000000000002" } }).mockResolvedValueOnce({ action_keys: ["org:company:read"] });
    await onboardCompany({ name: "A", code: "A", contract_ref: "C", owner_email: "a@example.test", owner_display_name: "A", modules: [] }, "same-key");
    expect(spy.mock.calls[0][0]).toBe("/api/platform/companies");
    expect(spy.mock.calls[0][1]).toMatchObject({ method: "POST", headers: expect.objectContaining({ "Idempotency-Key": "same-key" }) });
    expect(await companyPermissions("01960000-0000-7000-8000-000000000001")).toEqual({ action_keys: ["org:company:read"] });
    expect(spy.mock.calls[1][0]).toContain("/api/org/permissions/me?org_id=");
  });
});
