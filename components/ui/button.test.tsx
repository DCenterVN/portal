// @vitest-environment node
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

const variants = [
  "default",
  "destructive",
  "outline",
  "secondary",
  "ghost",
  "link",
] as const;

describe("Button", () => {
  it("uses the base and small heights", () => {
    const base = renderToStaticMarkup(<Button>Base</Button>);
    const small = renderToStaticMarkup(<Button size="sm">Small</Button>);

    expect(base).toContain("h-9");
    expect(small).toContain("h-8");
  });

  it("styles secondary as the filled secondary role", () => {
    const secondary = renderToStaticMarkup(
      <Button variant="secondary">Secondary</Button>,
    );

    const classes = secondary.match(/class="([^"]+)"/)?.[1].split(" ") ?? [];
    expect(classes).toEqual(expect.arrayContaining(["bg-secondary", "text-secondary-foreground"]));
  });

  it("renders the child element instead of a button with asChild", () => {
    const markup = renderToStaticMarkup(
      <Button asChild><a href="/x">Link</a></Button>,
    );

    expect(markup).toMatch(/^<a\b[^>]*href="\/x"/);
    expect(markup).not.toContain("<button");
  });

  it.each(variants)("renders the %s variant", (variant) => {
    const markup = renderToStaticMarkup(<Button variant={variant}>Action</Button>);

    expect(markup).toContain("<button");
    expect(markup).toContain("Action");
  });
});
