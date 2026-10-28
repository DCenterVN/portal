import { afterEach, expect, it, vi } from "vitest";
import { createMaterial, getMaterials, type CreateMaterialInput } from "./sales";
afterEach(() => vi.unstubAllGlobals());
const input: CreateMaterialInput = { name: "Me chua", uom_code: "KG", material_group_code: "RAU", allergens: null, avoidance_flags: [], diet_flags: null, season_months: null };
it("keeps CSV groups and ungrouped filters compatible with string callers", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ data: { items: [], next_cursor: "" } })); vi.stubGlobal("fetch", fetch);
  await getMaterials("group_codes=RAU,BO&ungrouped=true");
  const url = new URL(String(fetch.mock.calls[0][0]));
  expect(url.searchParams.get("group_codes")).toBe("RAU,BO"); expect(url.searchParams.get("ungrouped")).toBe("true");
});
it("creates without price and reuses the caller key", async () => {
  const fetch = vi.fn().mockImplementation(() => Promise.resolve(Response.json({ data: { id: "new", name: input.name } }, { status: 201 }))); vi.stubGlobal("fetch", fetch);
  await createMaterial(input, "same-key"); await createMaterial(input, "same-key");
  for (const [, init] of fetch.mock.calls) { expect(init.headers["Idempotency-Key"]).toBe("same-key"); expect(JSON.parse(init.body)).toEqual(input); }
});
it("preserves the existing record on duplicate", async () => {
  const existing = { id: "old", code: "NL-123456", name: "Me chua" };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "duplicate_resource", existing }, { status: 409 })));
  await expect(createMaterial(input, "key")).rejects.toMatchObject({ status: 409, info: { existing } });
});
