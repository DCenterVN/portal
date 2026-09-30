import { describe, expect, it } from "vitest";
import { actionChanges, parseActions } from "./use-role-matrix";

describe("role matrix draft", () => {
  it("splits on lines and commas, trims, drops blanks and duplicates", () => {
    expect(parseActions(" sales:order:read,\n\nsales:order:read\ninventory:lot:read , ")).toEqual(["sales:order:read", "inventory:lot:read"]);
  });
  it("an emptied draft means replace with no actions, not keep the old ones", () => {
    expect(parseActions("\n  \n")).toEqual([]);
    expect(actionChanges(["a", "b"], [])).toEqual({ added: [], removed: ["a", "b"] });
  });
  it("reports added and removed actions", () => {
    expect(actionChanges(["a", "b"], ["b", "c"])).toEqual({ added: ["c"], removed: ["a"] });
  });
});
