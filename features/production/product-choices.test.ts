import { expect, it } from "vitest";
import { withSetNotes } from "./product-choices";

const product = (id: string) => ({ id, name: "Ba chỉ chiên giòn", status: "DRAFT" });
const set = (product_ref: string, variant_label: string) => ({ product_ref, variant_label }) as never;

it("labels products by active set and puts products with a set first", () => {
  const choices = withSetNotes([product("empty"), product("full")], [set("full", "4 người")]);
  expect(choices.map(choice => [choice.id, choice.setNote])).toEqual([["full", "có set 4 người"], ["empty", "chưa có món"]]);
});
it("adds no note when sets could not be loaded", () => {
  expect(withSetNotes([product("a")], null)[0].setNote).toBe("");
});
