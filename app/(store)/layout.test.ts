import React from "react";
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

it("escapes less-than in both JSON-LD scripts while preserving data", async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com/</script><script>alert(1)</script>");
  vi.resetModules();
  const { default: StoreLayout } = await import("./layout");
  const layout = StoreLayout({ children: null });
  const scripts = React.Children.toArray(layout.props.children).filter((child) => React.isValidElement(child) && child.type === "script") as React.ReactElement<{ dangerouslySetInnerHTML: { __html: string } }>[];
  expect(scripts).toHaveLength(2);
  for (const script of scripts) {
    const json = script.props.dangerouslySetInnerHTML.__html;
    expect(json).not.toContain("<");
    expect(JSON.parse(json).url).toBe("https://example.com/</script><script>alert(1)</script>");
  }
});
