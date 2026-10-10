import { describe, expect, it } from "vitest";
// @ts-expect-error plain node script, no .d.ts on purpose (FR-13 runs it with bare `node`)
import { drift, frameHashes, readLock } from "../scripts/frame-lock.mjs";

type Hashes = Record<string, string>;
const lockDrift = drift as (locked: Hashes, current: Hashes) => string[];

describe("FR-13 frame lock", () => {
  it("frame files match frame.lock.json", () => {
    const lines = lockDrift(readLock() as Hashes, frameHashes() as Hashes);
    expect(lines, `Khung lệch khỏi frame.lock.json, đổi khung phải qua slice khung của Claude:\n${lines.join("\n")}`).toEqual([]);
  });

  it("reports changed, added and removed files", () => {
    expect(lockDrift({ a: "1", b: "2", c: "3" }, { a: "1", b: "9", d: "4" })).toEqual(["đổi: b", "xoá: c", "thêm: d"]);
  });

  it("locks frame files but not screen baselines", () => {
    const files = Object.keys(frameHashes() as Hashes);
    for (const file of ["app/globals.css", "components/ui/button.tsx", "components/layout/console-header.tsx", "app/frame-lock.test.ts", "package-lock.json"]) {
      expect(files).toContain(file);
    }
    expect(files.some((file) => file.startsWith("e2e/visual/baseline/screens/"))).toBe(false);
  });
});
