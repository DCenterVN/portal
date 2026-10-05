import { afterEach, describe, expect, it, vi } from "vitest";
import * as client from "@/lib/api/platform-client";
import { consentText, saveConsent } from "./use-my-company";

afterEach(() => vi.restoreAllMocks());

describe("standing consent", () => {
  it("unknown is shown as unknown, not as off", () => {
    expect(consentText(null)).toBe("Chưa xác định");
    expect(consentText(false)).toBe("Đang tắt");
  });
  it("shows only what the backend confirmed", async () => {
    vi.spyOn(client, "putConsent").mockResolvedValue({ standing_support_consent: true });
    expect(await saveConsent("root", true)).toBe(true);
  });
  it("a failed save throws, so the caller keeps the old value", async () => {
    vi.spyOn(client, "putConsent").mockRejectedValue(Object.assign(new Error("x"), { status: 403 }));
    await expect(saveConsent("root", true)).rejects.toMatchObject({ status: 403 });
  });
});
