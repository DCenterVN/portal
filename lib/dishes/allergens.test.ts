import { describe, expect, it } from "vitest";
import { allergenSummary } from "./allergens";

describe("dị ứng tiếng Việt", () => {
  it("không hiện mã tiếng Anh", () => expect(allergenSummary([["FISH", "TREE_NUTS"], ["FISH", "SESAME"]])).toBe("Cá, Hạt có vỏ cứng, Mè"));
  it("nguyên liệu chưa khai báo được nói rõ", () => {
    expect(allergenSummary([["EGGS"], null])).toBe("Trứng (còn nguyên liệu chưa khai báo)");
    expect(allergenSummary([null])).toBe("Chưa khai báo");
    expect(allergenSummary([[]])).toBe("Không có");
  });
});
