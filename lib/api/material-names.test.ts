import { afterEach, expect, it, vi } from "vitest";
import { getMaterialNames } from "./material-names";
import { FetchError } from "@/lib/fetcher";

afterEach(() => vi.unstubAllGlobals());
const envelope = (items: unknown[]) => Response.json({ code: 200, status: "success", message: "OK", data: { items } });
const refs = (count: number) => Array.from({ length: count }, (_, i) => `ref-${i}`);

it("looks names up by sku_refs, at most 100 per call, and merges the pages", async () => {
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://portal.test");
    return envelope(url.searchParams.get("sku_refs")!.split(",").map(id => ({ id, name: `Tên ${id}`, status: "SUSPENDED" })));
  });
  vi.stubGlobal("fetch", fetch);
  const names = await getMaterialNames([...refs(250), "ref-1", ""]);
  expect(fetch).toHaveBeenCalledTimes(3);
  const sizes = fetch.mock.calls.map(([url]) => new URL(String(url), "http://portal.test").searchParams);
  expect(sizes.map(p => p.get("sku_refs")!.split(",").length)).toEqual([100, 100, 50]);
  expect(fetch.mock.calls.map(([url]) => new URL(String(url), "http://portal.test").pathname)).toEqual(Array(3).fill("/api/sales/skus/names"));
  expect(names.size).toBe(250);
  expect(names.get("ref-249")).toEqual({ name: "Tên ref-249", status: "SUSPENDED" });
});
it("makes no call without refs", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  expect((await getMaterialNames([])).size).toBe(0);
  expect(fetch).not.toHaveBeenCalled();
});
it.each([403, 503])("lượt tra tên hỏng %s trả lỗi có mã trạng thái, không nuốt thành bảng rỗng", async status => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ code: status, status: "error", message: "raw" }, { status })));
  const error = await getMaterialNames(["ref-1"]).catch(cause => cause);
  expect(error).toBeInstanceOf(FetchError);
  expect(error.status).toBe(status);
});
