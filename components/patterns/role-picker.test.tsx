import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { oneRole, thirtyRoles, twoRoles } from "@/mocks/role-catalog";
import { roleOptionsFor } from "@/lib/role-catalog";
import { RolePicker } from "./role-picker";

const render = (catalog: Parameters<typeof roleOptionsFor>[0], selected: string[] = []) =>
  renderToStaticMarkup(<RolePicker label="Vai trò ở Cầu Giấy" options={roleOptionsFor(catalog, "STORE")} selected={selected} onToggle={() => {}} />);

it("1 role: one button, no search box", () => {
  const html = render(oneRole);
  expect(html.match(/<button/g)).toHaveLength(1);
  expect(html).not.toContain("Tìm vai trò");
});

it("2 roles: two buttons and the selected one is pressed", () => {
  const html = render(twoRoles, ["WAREHOUSE"]);
  expect(html.match(/<button/g)).toHaveLength(2);
  expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
});

it("30 roles: search box and a scrolling frame", () => {
  const html = render(thirtyRoles);
  expect(html.match(/<button/g)).toHaveLength(30);
  expect(html).toContain("Tìm vai trò");
  expect(html).toContain("max-h-72");
});

it("no roles: says so instead of an empty group", () => {
  expect(renderToStaticMarkup(<RolePicker label="x" options={[]} selected={[]} onToggle={() => {}} emptyText="Chưa có vai trò." />)).toContain("Chưa có vai trò.");
});
