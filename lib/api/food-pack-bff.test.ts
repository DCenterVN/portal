import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, PUT, PATCH, DELETE } from "@/app/api/food-packs/[...path]/route";
import { OPERATIONS } from "@/lib/contracts/operations.generated";
import * as sales from "./sales";
import * as production from "./production";

const id = "01960000-0000-7000-8000-000000000001";
const time = "2026-10-21T00:00:00Z";
const handlers = { GET, POST, PUT, PATCH, DELETE };
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; vi.restoreAllMocks(); vi.unstubAllEnvs(); });
function envelope(data: unknown, code = 200) { return { code, status: "success", message: "OK", data }; }
function reply(data: unknown) { return new Response(JSON.stringify(envelope(data))); }
function forward(path: string, method: keyof typeof handlers = "GET", token = "caller", body?: unknown) {
  const request = new NextRequest(`http://localhost/api/food-packs${path}`, {
    method, headers: token ? { cookie: `access_token=${token}` } : {},
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return handlers[method](request, { params: Promise.resolve({ path: path.split("?")[0].slice(1).split("/") }) });
}
const pack = {
  id, org_ref: id, branch_ref: id, product_ref: id, code: "bun", name: "Bún", variant_label: "100g",
  net_weight_g: 100, uom_code: "EA", temperature_regime: "CHILLED", kind: "PRODUCED_VARIANT",
  sellable: false, status: "ACTIVE", updated_at: time,
};
const set = { ...pack, kind: "COMMERCIAL_SET", sku_type: "SET", tags: ["bun", "mua-he", "bua-trua"], system_hashtags: [], slots: [] };
const labels = { sku_ref: id, allergen_summary: { known: false, contains: [] }, avoidance_flags: [], diet_flags: null, updated_at: time };
const recipeInput = { components: [{ sku_ref: id, quantity: "0.125", uom: "KG", yield_pct: "75" }], prep_steps: [{ instruction: "Trộn", duration_seconds: 30 }] } satisfies production.CreatePackageRecipeRequest;
const recipe = { id, output_sku_ref: id, output_quantity: 1, uom: "EA", version: 1, status: "BOM_ACTIVE", bom_code: "bun-v1", ...recipeInput };
const evaluated = {
  set_ref: id, selections: [{ slot: "DAM", sku_ref: id }, { slot: "RAU", sku_ref: null }],
  allergen_summary: { known: false, contains: ["SOYBEANS"] }, avoidance_flags: ["NGU_VI_TAN"], diet_flags: [],
  unknown: [{ sku_ref: id, fields: ["allergen_summary", "diet_flags"] }],
  manual_hashtags: ["bun", "mua-he", "bua-trua"], system_hashtags: ["bun"], derived_hashtags: ["spicy"],
  set_updated_at: time, recipe_versions: [{ sku_ref: id, bom_ref: id, version: 1 }], computed_at: time,
};

describe("food PACK boundary", () => {
  it("allowlist_from_operations", async () => {
    const operations = Object.values(OPERATIONS);
    const expected = operations.filter(op =>
      (op.service === "sales" && /^\/sales\/(packages(?:\/|$)|sets(?:\/|$)|skus\/[^/]+\/labels$)/.test(op.path)) ||
      (op.service === "production" && /^\/production\/(packages\/[^/]+\/recipes(?:\/|$)|sets\/[^/]+\/evaluate$)/.test(op.path)));
    expect(expected).toHaveLength(18);
    const materialize = (path: string) => path.replace(/\{version\}/g, "1").replace(/\{[^}]+\}/g, id);
    const expectedSet = expected.map(op => `${op.method} ${materialize(op.path)}`).sort();
    const candidates = new Set([...operations.map(op => materialize(op.path)), "/sales/pack-outside-registry"]);
    const accepted: string[] = [];
    global.fetch = vi.fn(async () => reply({}));
    for (const path of candidates) {
      for (const method of Object.keys(handlers)) {
        const verb = method === "GET" ? "GET" : method === "POST" ? "POST" : method === "PUT" ? "PUT" : method === "PATCH" ? "PATCH" : "DELETE";
        if ((await forward(path, verb, "caller", verb === "GET" ? undefined : {})).status !== 404) accepted.push(`${verb} ${path}`);
      }
    }
    expect(accepted.sort()).toEqual(expectedSet);
  });
  it("unknown_path_404", async () => {
    global.fetch = vi.fn();
    for (const path of ["/sales/orders", "/internal/sales/sets/x", "/sales/sets/not-a-uuid", `/sales/sets/${id}/extra`, `/production/packages/${id}/recipes/0`, `/production/packages/${id}/recipes/1.5`]) {
      expect((await forward(path)).status).toBe(404);
    }
    expect((await forward(`/sales/sets/${id}`, "PATCH", "caller", {})).status).toBe(404);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it("no_cookie_401", async () => {
    global.fetch = vi.fn();
    expect((await forward("/sales/sets", "GET", "")).status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it("forwards_bearer_query", async () => {
    vi.stubEnv("SALES_INTERNAL_URL", "http://sales.test");
    global.fetch = vi.fn(async () => reply({ items: [], next_cursor: null }));
    expect((await forward("/sales/sets?q=bun&limit=20")).status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith("http://sales.test/sales/sets?q=bun&limit=20", expect.objectContaining({ method: "GET", headers: { Accept: "application/json", Authorization: "Bearer caller" } }));
    expect(vi.mocked(global.fetch).mock.calls[0][1]).not.toHaveProperty("body");
  });
  it("delete_204", async () => {
    vi.stubEnv("PRODUCTION_INTERNAL_URL", "http://production.test");
    global.fetch = vi.fn(async () => new Response(null, { status: 204 }));
    const response = await forward(`/sales/sets/${id}`, "DELETE");
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(vi.mocked(global.fetch).mock.calls[0][1]).not.toHaveProperty("body");
    const retired = await forward(`/production/packages/${id}/recipes/1`, "DELETE", "caller", { expected_version: 1 });
    expect(retired.status).toBe(204);
    expect(await retired.text()).toBe("");
    expect(global.fetch).toHaveBeenLastCalledWith(`http://production.test/production/packages/${id}/recipes/1`, expect.objectContaining({ method: "DELETE", body: '{"expected_version":1}' }));
  });
  it("upstream_error_passthrough", async () => {
    const body = { code: 409, status: "error", message: "Stale version", data: null };
    global.fetch = vi.fn(async () => new Response(JSON.stringify(body), { status: 409, headers: { "x-request-id": "trace-1" } }));
    const response = await forward(`/sales/sets/${id}`, "PUT", "caller", {});
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(body);
    expect(response.headers.get("x-request-id")).toBe("trace-1");
  });
  it("zod_strict_extra_field", async () => {
    global.fetch = vi.fn(async () => reply({ ...set, surprise: true }));
    await expect(sales.getFoodSet(id)).rejects.toThrow();
  });
  it("zod_diet_null_vs_empty", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(reply(labels)).mockResolvedValueOnce(reply({ ...labels, diet_flags: [] }));
    expect((await sales.getRawLabels(id)).diet_flags).toBeNull();
    expect((await sales.getRawLabels(id)).diet_flags).toEqual([]);
  });
  it("evaluate_shape", async () => {
    global.fetch = vi.fn(async () => reply(evaluated));
    expect(await production.evaluateFoodSet(id, { expected_updated_at: time, selections: [] })).toEqual(evaluated);
    expect(global.fetch).toHaveBeenCalledWith(expect.objectContaining({ pathname: `/api/food-packs/production/sets/${id}/evaluate` }), expect.objectContaining({ method: "POST", body: JSON.stringify({ expected_updated_at: time, selections: [] }) }));
  });
  it("rejects invalid and nested extra response data without partial lists", async () => {
    const badResponses = [
      { ...set, net_weight_g: "100" }, { ...set, tags: null },
      { ...set, slots: [{ slot: "DAM", swappable: false, removable: false, options: [{ sku_ref: id, quantity: 1, is_default: true, extra: true }] }] },
    ];
    for (const data of badResponses) {
      global.fetch = vi.fn(async () => reply(data));
      await expect(sales.getFoodSet(id)).rejects.toThrow();
    }
    global.fetch = vi.fn(async () => reply({ items: [set, { ...set, kind: "INVALID" }], next_cursor: null }));
    await expect(sales.listFoodSets()).rejects.toThrow();
    global.fetch = vi.fn(async () => reply({ ...recipe, components: [{ ...recipeInput.components[0], yield_pct: "101" }] }));
    await expect(production.getPackageRecipe(id, 1)).rejects.toThrow();
    global.fetch = vi.fn(async () => reply({ ...evaluated, recipe_versions: [{ sku_ref: id, bom_ref: id, version: 1, extra: 1 }] }));
    await expect(production.evaluateFoodSet(id, { expected_updated_at: time, selections: [] })).rejects.toThrow();
  });
  it("forwards malformed JSON and unavailable upstream as errors", async () => {
    global.fetch = vi.fn();
    const request = new NextRequest("http://localhost/api/food-packs/sales/sets", { method: "POST", headers: { cookie: "access_token=caller" }, body: "bad" });
    expect((await POST(request, { params: Promise.resolve({ path: ["sales", "sets"] }) })).status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
    global.fetch = vi.fn().mockRejectedValue(new Error("offline"));
    expect((await forward("/sales/sets")).status).toBe(502);
  });
  it("typed clients cover all 18 operations with envelope responses", async () => {
    const { product_ref, code, name, variant_label, net_weight_g, temperature_regime } = pack;
    const input = { product_ref, code, name, variant_label, net_weight_g, uom_code: "EA", temperature_regime } satisfies sales.CreatePackageRequest;
    const fetchMock = vi.fn();
    global.fetch = fetchMock;
    const results = [pack, { items: [pack], next_cursor: id }, pack, pack, null, set, { items: [set], next_cursor: null }, set, set, null, labels, labels, recipe, { current: null, history: [recipe] }, recipe, recipe, null, evaluated];
    for (const data of results) fetchMock.mockResolvedValueOnce(data === null ? new Response(null, { status: 204 }) : reply(data));
    expect(await sales.createPackage(input)).toEqual(pack);
    expect((await sales.listPackages({ product_ref: id, limit: 20 })).next_cursor).toBe(id);
    await sales.getPackage(id); await sales.updatePackage(id, { ...input, expected_updated_at: time }); await sales.retirePackage(id);
    await sales.createFoodSet({ ...input, tags: set.tags });
    expect((await sales.listFoodSets({ q: "bún", tags: ["bun", "mua-he"], month: 10, limit: 20 })).items).toEqual([set]);
    await sales.getFoodSet(id);
    const slots = [{ slot: "TINH_BOT", swappable: false, removable: false, options: [{ sku_ref: id, quantity: 1, is_default: true }] }, { slot: "DAM", swappable: false, removable: false, options: [{ sku_ref: id, quantity: 1, is_default: true }] }] satisfies sales.SetSlot[];
    await sales.updateFoodSet(id, { tags: set.tags, slots, expected_updated_at: time }); await sales.retireFoodSet(id);
    await sales.getRawLabels(id);
    await sales.updateRawLabels(id, { allergen_summary: { known: false, contains: [] }, avoidance_flags: [], diet_flags: null, expected_updated_at: time });
    await production.createPackageRecipe(id, recipeInput);
    expect((await production.listPackageRecipes(id)).current).toBeNull();
    await production.getPackageRecipe(id, 1); await production.updatePackageRecipe(id, 1, { ...recipeInput, expected_version: 1 });
    await production.retirePackageRecipe(id, 1, { expected_version: 1 });
    await production.evaluateFoodSet(id, { expected_updated_at: time, selections: [] });
    const calls = fetchMock.mock.calls.map(([url, init]) => `${init?.method} ${new URL(String(url)).pathname}`);
    const expected = Object.entries(OPERATIONS).filter(([operationId]) => /^(create|list|get|update|retire)(Package|PackageRecipe|FoodSet|RawLabels)s?$|^evaluateFoodSet$/.test(operationId)).map(([, operation]) => operation);
    expect(calls.sort()).toEqual(expected.map(op => `${op.method} /api/food-packs${op.path.replace(/\{version\}/g, "1").replace(/\{[^}]+\}/g, id)}`).sort());
    expect(new URL(String(fetchMock.mock.calls[6][0])).searchParams.getAll("tags")).toEqual(["bun", "mua-he"]);
  });
});
