import { describe, expect, it } from "vitest";
import { consoleNavFor, consoleRouteAllowed } from "./console-nav";

const route = "/production/material-requirements";
const visible = (permissions: string[]) => consoleNavFor(new Set(permissions)).flatMap(group => group.items).some(item => item.href === route);
describe("requirements permission", () => {
  it("shows the menu and permits the page with material_requirement:read", () => {
    expect(visible(["production:material_requirement:read"])).toBe(true);
    expect(consoleRouteAllowed(route, new Set(["production:material_requirement:read"]))).toBe(true);
  });
  it.each([[], ["WAREHOUSE"], ["FOOD_DEV"], ["ADMIN"], ["production:food_plan:read"], ["production:target:create"]].map(permissions => ({ permissions })))("hides without the exact permission: %j", ({ permissions }) => {
    expect(visible(permissions)).toBe(false);
    expect(consoleRouteAllowed(route, new Set(permissions))).toBe(false);
  });
});
