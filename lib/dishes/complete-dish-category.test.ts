import { describe, expect, it } from "vitest";
import { completeDish } from "./complete-dish";
import { content, draft, fake } from "./complete-dish.fixtures";

describe("danh mục món không bắt buộc", () => {
  it.each([null, ""])("category_ref %j không gửi lên", async value => {
    const f = fake();
    await completeDish(draft({ content: content({ category_ref: value }) as never }), f.deps);
    expect(f.arg("createProduct")[0]).not.toHaveProperty("category_ref");
  });
  it("món đã có danh mục giữ nguyên", async () => {
    const f = fake();
    await completeDish(draft(), f.deps);
    expect(f.arg("createProduct")[0]).toMatchObject({ category_ref: "cat-1" });
  });
});
