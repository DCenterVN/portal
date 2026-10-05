import { describe, expect, it } from "vitest";
import { isTopLayer, wrapFocus } from "./dialog";
import { nextTab } from "./tabs";

describe("dialog focus trap", () => {
  const items = ["close", "cancel", "confirm"];
  it("wraps Tab from the last item and Shift+Tab from the first", () => {
    expect(wrapFocus(items, "confirm", false)).toBe("close");
    expect(wrapFocus(items, "close", true)).toBe("confirm");
  });
  it("lets the browser move focus between inner items", () => {
    expect(wrapFocus(items, "cancel", false)).toBeNull();
    expect(wrapFocus(items, "cancel", true)).toBeNull();
  });
  it("pulls focus back in when it sits outside the dialog", () => {
    expect(wrapFocus(items, "page-button", false)).toBe("close");
    expect(wrapFocus(items, "page-button", true)).toBe("confirm");
    expect(wrapFocus([], "x", false)).toBeNull();
  });
});

describe("tabs keyboard", () => {
  const ids = ["requests", "audit"] as const;
  it("arrows wrap, Home/End jump, other keys are ignored", () => {
    expect(nextTab(ids, "requests", "ArrowRight")).toBe("audit");
    expect(nextTab(ids, "audit", "ArrowRight")).toBe("requests");
    expect(nextTab(ids, "requests", "ArrowLeft")).toBe("audit");
    expect(nextTab(ids, "audit", "Home")).toBe("requests");
    expect(nextTab(ids, "requests", "End")).toBe("audit");
    expect(nextTab(ids, "requests", "Enter")).toBeNull();
  });
});

describe("stacked dialogs", () => {
  const standard = { surface: "standard", rank: 0 };
  const critical = { surface: "critical", rank: 1 };
  const standard2 = { surface: "standard-2", rank: 0 };
  it("the highest layer owns the keyboard whatever the opening order", () => {
    expect(isTopLayer([standard, critical], "critical")).toBe(true);
    expect(isTopLayer([critical, standard], "critical")).toBe(true);
    expect(isTopLayer([critical, standard], "standard")).toBe(false);
    expect(isTopLayer([], "standard")).toBe(false);
  });
  it("within one layer the latest opened owns the keyboard", () => {
    expect(isTopLayer([standard, standard2], "standard-2")).toBe(true);
    expect(isTopLayer([standard, standard2], "standard")).toBe(false);
  });
});
