import { expect, it } from "vitest";

type Rule = { source: string; destination: string };

it.each([
  ["/company/account", "/account"], ["/platform/account", "/account"], ["/platform/audit", "/audit"],
  ["/company", "/roles"], ["/platform", "/roles"], ["/platform/role-matrix", "/roles"],
])("old workspace path %s redirects to %s", async (from, to) => {
  const config = (await import("./next.config.mjs" as string)) as { default: { redirects: () => Promise<Rule[]> } };
  const rules = await config.default.redirects();
  const hit = rules.find(rule => rule.source === from || (rule.source.endsWith("/:path*") && from.startsWith(`${rule.source.slice(0, -7)}/`)));
  expect(hit?.destination).toBe(to);
});
