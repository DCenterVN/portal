import { describe, expect, it } from "vitest";
import { addTag, suggestTags, tagOf } from "./tags";

const pattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const valid = (tags: string[]) => tags.length >= 3 && tags.length <= 8 && new Set(tags).size === tags.length && tags.every(tag => pattern.test(tag) && !["vegan", "vegetarian"].includes(tag));

describe("hashtag tự sinh", () => {
  it("bỏ dấu, chữ thường, nối bằng gạch", () => expect(tagOf("  Bò Xào Rau Muống! ")).toBe("bo-xao-rau-muong"));
  it("tên đầy đủ thành nhãn đầu, bổ sung từ nguyên liệu", () => {
    const tags = suggestTags("Bò xào rau muống", ["Thịt bò", "Rau muống", "Tỏi"]);
    expect(tags[0]).toBe("bo-xao-rau-muong");
    expect(tags).toContain("thit-bo");
    expect(valid(tags)).toBe(true);
  });
  it("tên ngắn, chưa có nguyên liệu vẫn đủ 3 nhãn hợp lệ", () => expect(valid(suggestTags("Gà", []))).toBe(true));
  it("ký tự lạ vẫn qua luật", () => expect(valid(suggestTags("Đ!@# --- 1/2 ", ["", "Ớt  (cay)"]))).toBe(true));
  it("tên rỗng không sinh", () => expect(suggestTags("  ", ["Tỏi"])).toEqual([]));
  it("không quá 8 nhãn", () => expect(suggestTags("a b c d e f g h i j k", ["x1", "x2", "x3", "x4", "x5", "x6"]).length).toBeLessThanOrEqual(8));
});

describe("thêm nhãn tay", () => {
  it("chuẩn hoá và chặn trùng", () => {
    expect(addTag(["bun"], "Món Nước")).toEqual(["bun", "mon-nuoc"]);
    expect(addTag(["bun"], "BUN")).toEqual(["bun"]);
    expect(addTag(["bun"], "vegan")).toEqual(["bun"]);
    expect(addTag(["bun"], "!!!")).toEqual(["bun"]);
  });
  it("tối đa 8 nhãn", () => {
    const eight = ["a", "b", "c", "d", "e", "f", "g", "h"];
    expect(addTag(eight, "i")).toEqual(eight);
  });
});
