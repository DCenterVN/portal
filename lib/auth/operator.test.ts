import { afterEach, describe, expect, it, vi } from "vitest";

import { requireOperator } from "./operator";

describe("requireOperator", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails closed when production auth mode is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PORTAL_AUTH_MODE", undefined);

    await expect(requireOperator()).rejects.toThrow("GitHub SSO is not wired yet");
  });

  it("rejects explicit dev bypass in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PORTAL_AUTH_MODE", "dev");

    await expect(requireOperator()).rejects.toThrow(
      "PORTAL_AUTH_MODE=dev is not allowed when NODE_ENV=production",
    );
  });

  it("keeps the dev operator default outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("PORTAL_AUTH_MODE", undefined);

    await expect(requireOperator()).resolves.toMatchObject({
      id: "dev-operator",
      teams: ["platform-operators"],
    });
  });
});
