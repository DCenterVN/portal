import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { dishServices } from "./service";
import { completeDish, type DishDraft } from "./complete-dish";

// S15c: service BFF thật + fetch giả lập. Bắt lỗi service bỏ trường kể cả khi CompleteDeps fake đầy đủ.
const T0 = "2026-10-20T00:00:00Z";
const T1 = "2026-10-22T00:00:00Z";
const TAGS = ["xao", "thit-trau", "rau-muong"];
const slot = (name: string, sku_ref: string, over: Record<string, unknown> = {}) => ({ slot: name, swappable: false, removable: false, options: [{ sku_ref, quantity: 1, is_default: true }], ...over });
const SLOTS = [slot("DAM", "pkg-dam", { swappable: true }), slot("RAU", "pkg-rau", { removable: true }), slot("GIA_VI_THEM", "pkg-gv")];
const content = { schema_version: 1 as const, name: "M", category_ref: "c", tags: ["noi-dung-cu"], servings: 2, ingredients: [], seasonings: [], reason: null, base: null };
const request = () => new NextRequest("http://portal.test/api/dishes/drafts/x/complete", { method: "POST", headers: { cookie: "access_token=tok" } });

type Hit = { method: string; path: string; body: unknown };
function stubFetch(handler: (hit: Hit) => { status: number; body: unknown }) {
  const hits: Hit[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: { method: string; body?: string }) => {
    const hit = { method: init.method, path: new URL(url).pathname, body: init.body ? JSON.parse(init.body) : undefined };
    hits.push(hit);
    const res = handler(hit);
    return new Response(res.status === 204 ? null : JSON.stringify(res.body), { status: res.status, headers: { "content-type": "application/json" } });
  }));
  return hits;
}
afterEach(() => vi.unstubAllGlobals());

const deps = (tags = content.tags) => dishServices(request()).complete([], {}, { ...content, tags });

describe("dishServices.complete (BFF thật, fetch giả)", () => {
  it("replaceSlots: PUT gửi đủ slots/tags từ input và mốc cố định, không GET set lấy timestamp mới", async () => {
    const hits = stubFetch(hit => hit.method === "PUT" ? { status: 200, body: {} } : { status: 200, body: { data: { id: "set-1", updated_at: T1, slots: [], tags: [] } } });
    await deps().replaceSlots("set-1", { slots: SLOTS, tags: TAGS, expected_updated_at: T0 } as never, "k1");
    const puts = hits.filter(hit => hit.method === "PUT");
    expect(puts).toHaveLength(1);
    expect(puts[0].path).toBe("/sales/sets/set-1");
    expect(puts[0].body).toEqual({ slots: SLOTS, tags: TAGS, expected_updated_at: T0 });
    expect(hits.filter(hit => hit.method === "GET")).toHaveLength(0);
  });

  it("readSet: GET set giữ nguyên quantity/swappable/removable/tags", async () => {
    const setBody = { id: "set-1", updated_at: T1, slots: [slot("DAM", "pkg-dam", { swappable: true, options: [{ sku_ref: "pkg-dam", quantity: 3, is_default: true }] })], tags: TAGS };
    stubFetch(() => ({ status: 200, body: { data: setBody } }));
    const read = await (deps() as unknown as { readSet(ref: string): Promise<unknown> }).readSet("set-1");
    expect(read).toEqual({ slots: setBody.slots, tags: TAGS });
  });

  describe("completeDish qua service thật: PUT 409 rồi đối soát bằng GET", () => {
    const draft = (): DishDraft => ({
      id: "01960000-0000-7000-8000-00000000abcd", kind: "REVISION", revision: 3, progress: { claim: "r3" }, status: "OPEN",
      content: { ...content, tags: TAGS, name: "M", category_ref: "c", reason: "r", seasonings: [{ row: "g1", slot: "GIA_VI_THEM", package_ref: "pkg-gv", removable: false }], base: { product_ref: "p", set_ref: "set-1", set_updated_at: T0, slots: {} } },
    } as DishDraft);
    const run = async (readBack: { slots: unknown[]; tags?: string[] }, closureTags = TAGS) => {
      const hits = stubFetch(hit => {
        if (hit.method === "PUT") return { status: 409, body: { message: "stale" } };
        if (hit.path.endsWith("/progress")) return { status: 204, body: {} };
        return { status: 200, body: { data: { id: "set-1", updated_at: T1, ...readBack } } };
      });
      const r = await completeDish(draft(), deps(closureTags));
      return { r, hits };
    };
    const target = [slot("GIA_VI_THEM", "pkg-gv")];
    it("PUT gửi tags của target (không phải tags đóng kín trong closure) và mốc t0 của nháp", async () => {
      const { hits } = await run({ slots: target, tags: TAGS }, ["tags-cu-trong-closure"]);
      const put = hits.find(hit => hit.method === "PUT");
      expect(put?.body).toMatchObject({ tags: TAGS, expected_updated_at: T0, slots: target });
    });
    it("read-back khớp đủ (quantity/swappable/tags) -> phục hồi", async () => {
      const { r } = await run({ slots: target, tags: TAGS });
      expect(r).toMatchObject({ ok: true });
    });
    it("read-back chỉ khác quantity -> giữ 409", async () => {
      const { r, hits } = await run({ slots: [slot("GIA_VI_THEM", "pkg-gv", { options: [{ sku_ref: "pkg-gv", quantity: 2, is_default: true }] })], tags: TAGS });
      expect(r).toMatchObject({ ok: false, error: { status: 409 } });
      expect(hits.some(hit => hit.path.endsWith("/complete"))).toBe(false);
    });
    it("read-back chỉ khác swappable -> giữ 409", async () => {
      const { r } = await run({ slots: [slot("GIA_VI_THEM", "pkg-gv", { swappable: true })], tags: TAGS });
      expect(r).toMatchObject({ ok: false, error: { status: 409 } });
    });
    it("read-back chỉ khác tags -> giữ 409", async () => {
      const { r } = await run({ slots: target, tags: ["xao"] });
      expect(r).toMatchObject({ ok: false, error: { status: 409 } });
    });
    it("GET thiếu tags -> dừng an toàn, giữ 409", async () => {
      const { r } = await run({ slots: target });
      expect(r).toMatchObject({ ok: false, error: { status: 409 } });
    });
  });
});
