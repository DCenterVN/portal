// @vitest-environment node
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

const variants = [
  "default",
  "accent",
  "destructive",
  "outline",
  "secondary",
  "ghost",
  "link",
] as const;

describe("Button", () => {
  it("uses the base and small minimum heights", () => {
    const base = renderToStaticMarkup(<Button>Base</Button>);
    const small = renderToStaticMarkup(<Button size="sm">Small</Button>);

    expect(base).toContain("min-h-11");
    expect(small).toContain("h-8");
    expect(small).toContain("max-md:h-11");
  });

  it("styles secondary as an unfilled outlined button", () => {
    const secondary = renderToStaticMarkup(
      <Button variant="secondary">Secondary</Button>,
    );

    expect(secondary).toContain("border");
    expect(secondary).toContain("bg-transparent");
    expect(secondary).toContain("text-[var(--primary)]");
    const classes = secondary.match(/class="([^"]+)"/)?.[1].split(" ") ?? [];
    expect(
      classes.filter((className) => className.startsWith("bg-") || className.startsWith("hover:bg-")),
    ).toEqual(["bg-transparent"]);
  });

  it.each(variants)("renders the %s variant", (variant) => {
    const markup = renderToStaticMarkup(<Button variant={variant}>Action</Button>);

    expect(markup).toContain("<button");
    expect(markup).toContain("Action");
  });
});
