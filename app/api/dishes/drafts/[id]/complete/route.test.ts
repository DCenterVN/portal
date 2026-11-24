import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

const id = "123e4567-e89b-12d3-a456-426614174000";
const T = "2026-10-22T00:00:00Z";
const content = {
  schema_version: 1, name: "Món thử", category_ref: null, tags: ["xao", "thit", "rau"], servings: 2, reason: null, base: null,
  ingredients: [{ row: "r1", sku_ref: "sku-a", quantity: "100", uom: "G", yield_pct: "100" }],
  seasonings: [{ row: "g1", slot: "GIA_VI_THEM", package_ref: "pkg-1", removable: false }],
};
const target = JSON.stringify({
  set_ref: "set-1", expected_updated_at: T, tags: content.tags,
  slots: [
    { slot: "DAM", swappable: false, removable: false, options: [{ sku_ref: "pkg-dam", quantity: 1, is_default: true }] },
    { slot: "GIA_VI_THEM", swappable: false, removable: false, options: [{ sku_ref: "pkg-1", quantity: 1, is_default: true }] },
  ],
});
const locked = { claim: "r1", product: "prod-1", "package:DAM": "pkg-dam", "recipe:DAM": "pkg-dam", set: "set-1", "target:slots": target, slots: T };
const missingPrice = { complete: false, total_vnd: 0, per_serving_vnd: 0, lines: [{ sku_ref: "sku-a", name: "Thịt bò", quantity: "100", uom: "G", cost_vnd: null, missing: "NO_PRICE" }] };

type Preview = { status: number; body: unknown } | "network";
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function stubUpstream(progress: Record<string, string>, preview: Preview) {
  const calls: { path: string; method: string }[] = [];
  const respond = (path: string, method: string) => {
    if (path === `/sales/dish-drafts/${id}` && method === "GET") return json(200, { draft: { id, kind: "CREATE", revision: 1, status: "OPEN", content, progress } });
    if (path === "/inventory/material-categories") return json(200, { items: [{ code: "THIT", children: [] }, { code: "GIA_VI", children: [] }] });
    if (path.startsWith("/sales/skus")) return json(200, { items: [{ id: "sku-a", material_group_code: "THIT" }], next_cursor: null });
    if (path === "/production/packages/pkg-1/recipes" && method === "GET") return json(200, { current: { components: [] } });
    if (path === "/production/recipes/cost-preview") return preview === "network" ? null : json(preview.status, preview.body);
    if (path === "/sales/products") return json(200, { product: { id: "prod-1" } });
    if (path === "/sales/packages") return json(200, { id: "pkg-dam" });
    if (path.startsWith("/production/packages/")) return json(200, {});
    if (path === "/sales/sets" && method === "POST") return json(200, { id: "set-1", updated_at: T });
    if (path === "/sales/sets/set-1" && method === "PUT") return json(200, { updated_at: T });
    if (path.endsWith("/sellable-variant")) return json(200, { sku_ref: "serving-1" });
    return json(200, {});
  };
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: { method?: string }) => {
    const path = new URL(url).pathname;
    const method = init?.method ?? "GET";
    calls.push({ path, method });
    const res = respond(path, method);
    if (!res) throw new TypeError("fetch failed");
    return res;
  }));
  const hit = (part: string) => calls.some(call => call.path.includes(part));
  return { calls, hit };
}

const run = () => POST(
  new NextRequest(`http://localhost/api/dishes/drafts/${id}/complete`, { method: "POST", headers: { cookie: "access_token=token" } }),
  { params: Promise.resolve({ id }) },
);

afterEach(() => vi.unstubAllGlobals());

describe("POST /api/dishes/drafts/[id]/complete precheck giá vốn", () => {
  it("nháp chưa khoá + thiếu giá: 422 { message, errors } và không ghi gì", async () => {
    const up = stubUpstream({}, { status: 200, body: missingPrice });
    const res = await run();
    const body = await res.json();
    expect(res.status).toBe(422);
    expect(body.message).toBe("Chưa đủ giá vốn để hoàn tất món");
    expect(body.errors[0].field).toBe("cost");
    expect(body.errors.some((error: { row?: string; field: string }) => error.row === "r1" && error.field === "sku_ref")).toBe(true);
    expect(body.failed_step).toBeUndefined();
    expect(up.hit("/progress")).toBe(false);
    expect(up.hit("/sales/products")).toBe(false);
  });

  it.each([
    ["500", { status: 500, body: { message: "boom" } }],
    ["lỗi mạng", "network"],
  ] as [string, Preview][])("nháp chưa khoá + cost-preview %s: 503 fail-closed không khoá nháp", async (_name, preview) => {
    const up = stubUpstream({}, preview);
    const res = await run();
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.message).toBe("Không kiểm tra được giá vốn lúc này. Thử hoàn tất món lại sau ít phút.");
    expect(body.failed_step).toBeUndefined();
    expect(up.hit("/progress")).toBe(false);
    expect(up.hit("/sales/products")).toBe(false);
  });

  it.each([403, 422])("nháp chưa khoá + cost-preview %i: bỏ qua precheck và hoàn tất món", async status => {
    const up = stubUpstream({}, { status, body: { message: "không đủ quyền hoặc không xử lý được" } });
    const res = await run();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(up.hit("/sales/products")).toBe(true);
    expect(up.hit("/sellable-variant")).toBe(true);
  });

  it.each([400, 404])("nháp chưa khoá + cost-preview %i: giữ status, safeMessage, không ghi gì", async status => {
    const up = stubUpstream({}, { status, body: { message: "Không thấy 123e4567-e89b-12d3-a456-426614174999" } });
    const res = await run();
    const body = await res.json();
    expect(res.status).toBe(status);
    expect(body.message).toBe("Không thấy mục đã chọn");
    expect(body.failed_step).toBeUndefined();
    expect(up.hit("/progress")).toBe(false);
    expect(up.hit("/sales/products")).toBe(false);
  });

  it("nháp đã khoá: không gọi cost-preview, hoàn tất thẳng sellable-variant và complete", async () => {
    const up = stubUpstream(locked, { status: 200, body: missingPrice });
    const res = await run();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(up.hit("/cost-preview")).toBe(false);
    expect(up.hit("/production/sets/set-1/sellable-variant")).toBe(true);
    expect(up.calls.some(call => call.path === `/sales/dish-drafts/${id}/complete` && call.method === "POST")).toBe(true);
  });
});
