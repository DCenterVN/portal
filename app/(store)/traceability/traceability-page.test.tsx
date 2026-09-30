import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPublicTraceability } = vi.hoisted(() => ({
  getPublicTraceability: vi.fn(),
}));

vi.mock("@/lib/api/production", () => ({ getPublicTraceability }));

import TraceabilityPage from "./[code]/page";

describe("TraceabilityPage", () => {
  beforeEach(() => getPublicTraceability.mockReset());

  it("awaits Next.js dynamic params before loading the public trace", async () => {
    getPublicTraceability.mockResolvedValue({ trace_code: "TRC-1" });

    const element = await TraceabilityPage({
      params: Promise.resolve({ code: "TRC-1" }),
    });

    expect(getPublicTraceability).toHaveBeenCalledWith("TRC-1");
    expect(element.props.trace).toEqual({ trace_code: "TRC-1" });
  });
});
