import { afterEach, expect, it, vi } from "vitest";
import { createMaterial, getMaterials, setRawUnit, type CreateMaterialInput } from "./sales";
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
it("đặt đơn vị: đọc nhãn hiện tại rồi gửi cùng uom_code và nhóm", async () => {
  const view = { sku_ref: "11111111-1111-4111-8111-111111111111", allergen_summary: { known: false, contains: [] }, avoidance_flags: [], diet_flags: null, updated_at: "2026-11-21T01:00:00Z" };
  const reply = () => Response.json({ code: 200, status: "success", message: "ok", data: view });
  const fetch = vi.fn().mockImplementation(() => Promise.resolve(reply())); vi.stubGlobal("fetch", fetch);
  await setRawUnit("abc", { uom_code: "KG", material_group_code: "RAU_LA" });
  expect(fetch.mock.calls[1][1].method).toBe("PATCH");
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ allergen_summary: view.allergen_summary, avoidance_flags: [], diet_flags: null, expected_updated_at: view.updated_at, uom_code: "KG", material_group_code: "RAU_LA" });
});
