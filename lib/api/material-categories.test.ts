import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { envelope } from "@/mocks/supplier-contract";
import { getMaterialCategories } from "./material-categories";
import { GET } from "@/app/api/inventory/material-categories/route";

afterEach(() => vi.unstubAllGlobals());
const tree = [{ code: "THIT", name: "Thịt", children: [{ code: "GA", name: "Gà", children: [] }] }];
it("đọc cây inventory qua envelope, không dùng nhóm bán hàng", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json(envelope({ items: tree })));
  vi.stubGlobal("fetch", fetch);
  expect(await getMaterialCategories()).toEqual(tree);
  expect(new URL(String(fetch.mock.calls[0][0])).pathname).toBe("/api/inventory/material-categories");
});
it.each([
  tree,
  { items: [{ ...tree[0], children: [{ code: "GA", name: "Gà", children: [{ code: "SUB", name: "Cấp ba" }] }] }] },
  { items: [{ ...tree[0], children: [...tree[0].children, ...tree[0].children] }] },
  { items: [{ ...tree[0], children: [{ code: "THIT", name: "Trùng cha", children: [] }] }] },
  { items: [{ code: "sales category", name: "Sai mã", children: [] }] },
  { items: [{ ...tree[0], children: Array.from({ length: 101 }, (_, i) => ({ code: `LEAF_${i}`, name: "Quá giới hạn", children: [] })) }] },
])("từ chối body phẳng hoặc cây sai cấu trúc %j", async body => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body === tree ? body : envelope(body))));
  await expect(getMaterialCategories()).rejects.toThrow();
});
it("dependency/403 không được biến thành cây rỗng", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ errors: { error_code: "FORBIDDEN", message: "Không có quyền" } }, { status: 403 })));
  await expect(getMaterialCategories()).rejects.toMatchObject({ status: 403 });
});
it("BFF giữ quyền/no-store và không forward query thay nguồn", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json(envelope({ items: tree })));
  vi.stubGlobal("fetch", fetch);
  const result = await GET(new NextRequest("http://portal.test/api/inventory/material-categories?url=http://attacker&branch_ref=forged", { headers: { cookie: "access_token=test-only" } }));
  expect(new URL(String(fetch.mock.calls[0][0])).pathname).toBe("/inventory/material-categories");
  expect(new URL(String(fetch.mock.calls[0][0])).search).toBe("");
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe("Bearer test-only");
  expect(result.headers.get("cache-control")).toBe("no-store");
});
