import { describe, expect, it } from "vitest";
import type { Material, MaterialCategory } from "@/lib/api/material-catalog";
import { filterMaterials, matchesName, sortCategories } from "./materials-catalog";

const makeMaterial = (id: string, name: string): Material => ({
  id,
  name,
  category: "GIA_VI",
  group: "GIA_VI_KHO",
  unit: "KG",
  status: "ACTIVE",
  imageUrl: null,
});

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

  it("xếp Muối lên trước Dưa muối khi tìm muối", () => {
    const items = [makeMaterial("1", "Dưa muối"), makeMaterial("2", "Muối hạt"), makeMaterial("3", "Muối")];
    expect(filterMaterials(items, "GIA_VI", "muối").map(item => item.name)).toEqual(["Muối", "Muối hạt", "Dưa muối"]);
  });
});

describe("thứ tự loại nguyên liệu", () => {
  it("xếp CA_LOAI ngay sau THIT", () => {
    const tree: MaterialCategory[] = ["COT_NUOC_DUNG", "CA_LOAI", "RAU_CU", "THIT"].map(code => ({
      code,
      label: code,
      active: true,
      groups: [],
    }));
    expect(sortCategories(tree).map(item => item.code)).toEqual(["THIT", "CA_LOAI", "RAU_CU", "COT_NUOC_DUNG"]);
  });
});
