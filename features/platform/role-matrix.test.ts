import { describe, expect, it } from "vitest";
import { actionChanges, resourcesOf } from "./use-role-matrix";

describe("role matrix draft", () => {
  it("lists resources from CRUDIE keys across roles, ignoring other verbs", () => {
    expect(resourcesOf({ OWNER: ["sales:order:read", "sales:order:update", "org:role:export", "x:y:approve"], SALES: ["inventory:lot:read"] })).toEqual(["inventory:lot", "org:role", "sales:order"]);
  });
  it("an emptied draft means replace with no actions, not keep the old ones", () => {
    expect(actionChanges(["a", "b"], [])).toEqual({ added: [], removed: ["a", "b"] });
  });
  it("reports added and removed actions", () => {
    expect(actionChanges(["a", "b"], ["b", "c"])).toEqual({ added: ["c"], removed: ["a"] });
  });
});
