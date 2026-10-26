import { existsSync, globSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AccessProvider, RequireAction, useAccess } from "./access-boundary";
import type { PlaneAccess } from "./access-context";

const action = "inventory:supplier:update";
const value = (actions: string[], role = "WAREHOUSE"): PlaneAccess => ({ plane: "company", root: "/employee", actions: new Set(actions), role });
function Probe() {
  const access = useAccess();
  return <span>{access.can(action) ? `allow:${access.root}` : "deny"}</span>;
}

describe("Shared access boundary", () => {
  it("denies without a verified provider", () => {
    expect(renderToStaticMarkup(<Probe />)).toContain("deny");
    expect(renderToStaticMarkup(<RequireAction action={action}>secret</RequireAction>)).not.toContain("secret");
  });
  it("checks granted actions independently of role labels", () => {
    expect(renderToStaticMarkup(<AccessProvider value={value([], "ADMIN")}><Probe /></AccessProvider>)).toContain("deny");
    expect(renderToStaticMarkup(<AccessProvider value={value([action], "CUSTOM")}><Probe /></AccessProvider>)).toContain("allow:/employee");
  });
  it("removes the protected content after revocation", () => {
    const render = (actions: string[]) => renderToStaticMarkup(<AccessProvider value={value(actions)}><RequireAction action={action}>protected-content</RequireAction></AccessProvider>);
    expect(render([action])).toContain("protected-content");
    expect(render([])).not.toContain("protected-content");
  });
  it("uses the shared provider and consumer context", () => {
    expect(renderToStaticMarkup(<AccessProvider value={value([action])}><Probe /></AccessProvider>)).toContain("allow:/employee");
  });
});

it("removes the legacy module and every importer or mock target", () => {
  expect(existsSync("features/platform/access-boundary.tsx")).toBe(false);
  for (const file of globSync(["app/**/*.{ts,tsx}", "features/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"])) {
    if (file === "lib/access-boundary.test.tsx") continue;
    expect(readFileSync(file, "utf8"), file).not.toMatch(/features\/platform\/access-boundary|["']\.\/access-boundary["']/);
  }
});
