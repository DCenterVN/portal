import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPublicTraceability } = vi.hoisted(() => ({
  getPublicTraceability: vi.fn(),
}));

vi.mock("@/lib/api/production", () => ({ getPublicTraceability }));

import TraceabilityPage from "./[code]/page";

describe("TraceabilityPage", () => {
  beforeEach(() => getPublicTraceability.mockReset());

  it("awaits Next.js dynamic params before loading the public trace", async () => {
    const element = await TraceabilityPage({
      params: Promise.resolve({ code: "TRC-1" }),
    });

    expect(getPublicTraceability).not.toHaveBeenCalled();
    expect(element.props.code).toBe("TRC-1");
  });
});
