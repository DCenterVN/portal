import { describe, expect, it } from "vitest";
import { matchesName } from "./materials-catalog";

describe("tìm theo tên", () => {
  it.each([
    ["thịt lợn xay", "Thịt xay lợn", true],
    ["THIT XAY", "Thịt xay lợn", true],
    ["lon thit", "Thịt xay lợn", true],
    ["thịt bò", "Thịt xay lợn", false],
    ["tiêu", "Hủ tiếu", false],
    ["tiêu", "Tiêu đen xay", true],
    ["tieu", "Tiêu đen", true],
    ["hành", "Đậu thanh truyền thống", false],
    ["hành", "Hành khô", true],
    ["thịt".normalize("NFD"), "Thịt xay lợn", true],
    ["thịt", "Thịt xay lợn".normalize("NFD"), true],
    ["", "Thịt xay lợn", true],
  ])("%j khớp %j: %s", (text, name, expected) => expect(matchesName(name, text)).toBe(expected));
});
