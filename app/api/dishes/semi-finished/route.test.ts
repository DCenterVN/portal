import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

const SKU_CAI = "11111111-1111-4111-8111-111111111111";
const SKU_OT = "22222222-2222-4222-8222-222222222222";
const PKG_KIMCHI = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const PKG_COT = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const PKG_DISH = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const T = "2026-11-26T00:00:00Z";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

afterEach(() => vi.unstubAllGlobals());

describe("/api/dishes/semi-finished", () => {
  it("GET lọc gói BTP-*/VN-PACK-* ACTIVE, tải công thức và gộp dị ứng", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const path = new URL(url).pathname + new URL(url).search;
      if (path.startsWith("/sales/packages?")) {
        return json(200, {
          items: [
            { id: PKG_KIMCHI, code: "BTP-CHUA-KC01", name: "Kim chi cải thảo", variant_label: "1 túi · 60 g", net_weight_g: 60, status: "ACTIVE", updated_at: T },
            { id: PKG_COT, code: "VN-PACK-COT-BO", name: "Cốt bò", variant_label: "1 túi · 350 g", net_weight_g: 350, status: "ACTIVE", updated_at: T },
            { id: PKG_DISH, code: "D-DAM-1", name: "Gói thịt món", variant_label: "1 suất", net_weight_g: 150, status: "ACTIVE", updated_at: T },
          ],
          next_cursor: null,
        });
      }
      if (path === `/production/packages/${PKG_KIMCHI}/recipes`) {
        return json(200, {
          current: {
            components: [
              { sku_ref: SKU_CAI, name: "Cải thảo", quantity: "55", uom: "G", yield_pct: "85", prep_note: "cắt khúc" },
              { sku_ref: SKU_OT, name: "Ớt bột", quantity: "5", uom: "G", yield_pct: "100" },
            ],
            prep_steps: [{ instruction: "Ủ 24 giờ", duration_seconds: 0 }],
          },
        });
      }
      if (path === `/production/packages/${PKG_COT}/recipes`) {
        return json(200, { current: { components: [{ sku_ref: SKU_OT, name: "Ớt", quantity: "10", uom: "G", yield_pct: "100" }], prep_steps: [] } });
      }
      if (path === `/sales/skus/${SKU_CAI}/labels`) return json(200, { allergen_summary: { known: true, contains: ["FISH"] } });
      if (path === `/sales/skus/${SKU_OT}/labels`) return json(200, { allergen_summary: { known: true, contains: [] } });
      return json(404, {});
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(new NextRequest("http://localhost:3002/api/dishes/semi-finished", { headers: { cookie: "access_token=jwt" } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(2);
    expect(body.items[0]).toMatchObject({ id: PKG_COT, slot: "COT", allergens: [] });
    expect(body.items[1]).toMatchObject({
      id: PKG_KIMCHI,
      slot: "DO_CHUA",
      instruction: "Ủ 24 giờ",
      allergens: ["FISH"],
      components: [
        { sku_ref: SKU_CAI, prep_note: "cắt khúc", yield_pct: "85" },
        { sku_ref: SKU_OT },
      ],
    });
  });

  it("POST tự tạo product btp-bep-trung-tam, tạo gói + công thức kèm Idempotency-Key và prep_note", async () => {
    const calls: { path: string; method: string; key: string | null; body: unknown }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      const path = new URL(url).pathname;
      const method = init?.method ?? "GET";
      const headers = new Headers(init?.headers);
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
      calls.push({ path, method, key: headers.get("Idempotency-Key"), body });
      if (path === "/sales/products" && method === "GET") return json(200, { items: [], next_cursor: null });
      if (path === "/sales/products" && method === "POST") return json(201, { product: { id: "prod-btp" } });
      if (path === "/sales/packages" && method === "POST") {
        return json(201, { id: PKG_KIMCHI, code: body.code, name: body.name, variant_label: body.variant_label, net_weight_g: body.net_weight_g, updated_at: T });
      }
      if (path === `/production/packages/${PKG_KIMCHI}/recipes` && method === "POST") {
        return json(201, { components: [{ sku_ref: SKU_CAI, name: "Cải thảo", quantity: "60", uom: "G", yield_pct: "85", prep_note: "cắt khúc" }] });
      }
      if (path === `/sales/skus/${SKU_CAI}/labels`) return json(200, { allergen_summary: { known: true, contains: [] } });
      return json(404, {});
    }));

    const req = new NextRequest("http://localhost:3002/api/dishes/semi-finished", {
      method: "POST",
      headers: { cookie: "access_token=jwt", "content-type": "application/json", "Idempotency-Key": "client-key-1" },
      body: JSON.stringify({
        slot: "DO_CHUA",
        name: "  Kim   chi  cải thảo  ",
        net_weight_g: 60,
        components: [{ sku_ref: SKU_CAI, quantity: "60", uom: "G", yield_pct: "85", prep_note: "  cắt  khúc " }],
        instruction: "  Ủ   24 giờ ",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const created = await res.json();
    expect(created.item).toMatchObject({ id: PKG_KIMCHI, slot: "DO_CHUA", name: "Kim chi cải thảo", instruction: "Ủ 24 giờ", allergens: [] });

    const pkgCall = calls.find(c => c.path === "/sales/packages" && c.method === "POST");
    const recCall = calls.find(c => c.path === `/production/packages/${PKG_KIMCHI}/recipes` && c.method === "POST");
    expect(pkgCall?.key).toBe("client-key-1:pkg");
    expect(recCall?.key).toBe("client-key-1:rec");
    expect(recCall?.body).toEqual({
      components: [{ sku_ref: SKU_CAI, quantity: "60", uom: "G", yield_pct: "85", prep_note: "cắt khúc" }],
      prep_steps: [{ instruction: "Ủ 24 giờ", duration_seconds: 0 }],
    });
  });

  it("POST rollback DELETE package nếu tạo công thức lỗi", async () => {
    const calls: { path: string; method: string; key: string | null }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      const path = new URL(url).pathname;
      const method = init?.method ?? "GET";
      const headers = new Headers(init?.headers);
      calls.push({ path, method, key: headers.get("Idempotency-Key") });
      if (path === "/sales/products" && method === "GET") return json(200, { items: [{ id: "prod-btp", slug: "btp-bep-trung-tam" }], next_cursor: null });
      if (path === "/sales/packages" && method === "POST") {
        return json(201, { id: PKG_KIMCHI, code: "BTP-CHUA-1", name: "Kim chi", variant_label: "1 túi · 60 g", net_weight_g: 60, updated_at: T });
      }
      if (path === `/production/packages/${PKG_KIMCHI}/recipes` && method === "POST") return json(422, { message: "bad component" });
      if (path === `/sales/packages/${PKG_KIMCHI}` && method === "DELETE") return new Response(null, { status: 204 });
      return json(404, {});
    }));

    const req = new NextRequest("http://localhost:3002/api/dishes/semi-finished", {
      method: "POST",
      headers: { cookie: "access_token=jwt", "content-type": "application/json" },
      body: JSON.stringify({
        slot: "DO_CHUA",
        name: "Kim chi",
        net_weight_g: 60,
        components: [{ sku_ref: SKU_CAI, quantity: "60", uom: "G", yield_pct: "85" }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
    const delCall = calls.find(c => c.path === `/sales/packages/${PKG_KIMCHI}` && c.method === "DELETE");
    expect(delCall).toBeTruthy();
    expect(delCall?.key).toBeTruthy();
  });
});
