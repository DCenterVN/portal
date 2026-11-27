import { describe, expect, it } from "vitest";
import { completeDish } from "./complete-dish";
import { L, content, draft, fake, ing } from "./complete-dish.fixtures";

describe("gia vị và cốt đi thẳng vào ngăn như nguyên liệu thô", () => {
  const spiced = () => draft({ content: content({ seasonings: [], ingredients: [ing("r1", L("sku-trau", "150")), ing("r2", L("sku-tieu", "1")), ing("r3", L("sku-xuong", "300"))] }) as never });
  it("gia vị vào GIA_VI_THEM, cốt vào COT, không cho bỏ", async () => {
    const f = fake();
    const result = await completeDish(spiced(), f.deps);
    expect(result.ok).toBe(true);
    expect(f.arg("createRecipe", 1)[1]).toEqual({ components: [L("sku-xuong", "300")], prep_steps: [] });
    expect(f.arg("createRecipe", 2)[1]).toEqual({ components: [L("sku-tieu", "1")], prep_steps: [] });
    expect((f.arg("replaceSlots")[1] as { slots: unknown[] }).slots).toMatchObject([
      { slot: "DAM", removable: false },
      { slot: "COT", removable: false, options: [{ sku_ref: "pkg-new-COT" }] },
      { slot: "GIA_VI_THEM", removable: false, options: [{ sku_ref: "pkg-new-GIA_VI_THEM" }] },
    ]);
  });
});
