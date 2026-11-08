import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { groupPermissions, missingLabels, permissionLabel, roleName, toggleGroup } from "./permission-labels";

const templates = new URL("./contracts/org.role-templates.yaml", import.meta.url);

describe("nhãn quyền", () => {
  it("mọi khoá trong role-templates.yaml đều có nhãn", () => {
    const keys = [...new Set(readFileSync(templates, "utf8").match(/[a-z_]+:[a-z_]+:[a-z]+/g))];
    expect(keys.length).toBeGreaterThan(60);
    expect(missingLabels(keys)).toEqual([]);
  });
  it("thiếu nhãn thì hiện khoá", () => {
    expect(permissionLabel("x:y:read")).toBe("x:y:read");
    expect(roleName("ADMIN")).toBe("Quản trị hệ thống");
    expect(roleName("admin")).toBe("Quản trị hệ thống");
    expect(roleName("custom-role")).toBe("custom-role");
    expect(missingLabels(["inventory:goods_receipt:create", "x:y:read"])).toEqual(["x:y:read"]);
  });
});

describe("gom nhóm quyền", () => {
  const catalog = ["inventory:goods_receipt:create", "inventory:stock:read", "sales:order:read"];
  it("đếm đã cấp, 3 trạng thái và bỏ khu vực trống", () => {
    const groups = groupPermissions(catalog, ["inventory:stock:read"]);
    expect(groups.map((group) => [group.area, group.granted, group.total, group.state])).toEqual([["Kho", 1, 2, "indeterminate"], ["Bán hàng", 0, 1, false]]);
  });
  it("tìm không dấu theo nhãn", () => {
    const groups = groupPermissions(catalog, [], "phieu nhap");
    expect(groups).toHaveLength(1);
    expect(groups[0].items.map((item) => item.key)).toEqual(["inventory:goods_receipt:create"]);
    expect(groups[0].total).toBe(2);
  });
  it("chọn cả nhóm bật hoặc tắt đúng khoá của nhóm", () => {
    const keys = ["inventory:goods_receipt:create", "inventory:stock:read"];
    expect(toggleGroup(["sales:order:read"], keys, true).sort()).toEqual([...keys, "sales:order:read"].sort());
    expect(toggleGroup([...keys, "sales:order:read"], keys, false)).toEqual(["sales:order:read"]);
  });
});
