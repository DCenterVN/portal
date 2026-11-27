import { expect, it, vi } from "vitest";
import { loadProductSets } from "./product-sets";

const set = (id: string, product_ref: string, status = "ACTIVE") => ({ id, product_ref, status }) as never;

it("asks the server for each product's sets and follows cursors, keeping active ones", async () => {
  const list = vi.fn(async (filter: { product_ref?: string; cursor?: string; limit?: number }) => {
    if (filter.product_ref === "a" && !filter.cursor) return { items: [set("a1", "a")], next_cursor: "next" };
    if (filter.product_ref === "a") return { items: [set("a2", "a", "RETIRED"), set("a3", "a")], next_cursor: null };
    return { items: [set("b1", "b")], next_cursor: null };
  });
  const sets = await loadProductSets(["a", "b", "a"], list as never);
  expect(sets.map(item => item.id)).toEqual(["a1", "a3", "b1"]);
  expect(list.mock.calls.map(([filter]) => [filter.product_ref, filter.cursor, filter.limit])).toEqual([["a", undefined, 100], ["a", "next", 100], ["b", undefined, 100]]);
});
it("makes no call without products", async () => {
  const list = vi.fn();
  expect(await loadProductSets([], list as never)).toEqual([]);
  expect(list).not.toHaveBeenCalled();
});
