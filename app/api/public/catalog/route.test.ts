import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

afterEach(() => vi.unstubAllGlobals());
it("forwards nutrition numbers, repeated labels and branch without requiring login", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ data: { items: [] } }));
  vi.stubGlobal("fetch", fetch);
  const response = await GET(new NextRequest("http://portal.test/api/public/catalog?branch_id=seed&kcal_max=420&protein_min=30.5&label=HIGH_PROTEIN&label=LOW_FAT&unexpected=ignored"));
  expect(response.status).toBe(200);
  const query = new URL(String(fetch.mock.calls[0][0])).searchParams;
  expect(query.get("kcal_max")).toBe("420"); expect(query.get("protein_min")).toBe("30.5");
  expect(query.getAll("label")).toEqual(["HIGH_PROTEIN", "LOW_FAT"]);
  expect(query.get("branch_id")).toBe("seed"); expect(query.has("unexpected")).toBe(false);
});
