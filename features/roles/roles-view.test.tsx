import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { AccessProvider } from "@/lib/access-boundary";
import { RolesView } from "./roles-view";

vi.mock("@/features/platform/use-role-matrix", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/features/platform/use-role-matrix")>(),
  useRoleMatrix: () => ({ data: { ADMIN: [], CUSTOMER: [], SPECIAL: [] } }),
}));
vi.mock("./use-roles", () => ({
  useMemberships: () => ({ data: [] }),
  useRoleCatalog: () => ({ data: [
    { code: "ADMIN", name: "Quản trị hệ thống", description: "Toàn quyền", protected: true },
    { code: "SPECIAL", name: "Đặc biệt", description: "", protected: false },
  ] }),
}));

it("renders catalog roles in order with an accessible lock only beside protected roles and leaves missing descriptions blank", () => {
  const html = renderToStaticMarkup(
    <AccessProvider value={{ plane: "company", root: "", actions: new Set(["org:company:read", "org:role:read"]) }}>
      <RolesView />
    </AccessProvider>,
  );
  const labels = html.match(/<label\b[^>]*>[\s\S]*?<\/label>/g) ?? [];
  const admin = labels.find((label) => label.includes("Quản trị hệ thống"));
  expect(admin).toMatch(/<svg[^>]*class="[^"]*lucide-lock[^"]*"[^>]*aria-label="Vai trò được bảo vệ"/);
  expect(admin?.match(/<svg[^>]*lucide-lock[^>]*>/)?.[0]).not.toContain('aria-hidden="true"');
  expect(admin).toContain("Toàn quyền");
  expect(labels.filter((label) => label.includes('aria-label="Vai trò được bảo vệ"'))).toHaveLength(1);
  expect(labels).toHaveLength(2);
  expect(labels[0]).toContain("Quản trị hệ thống");
  expect(labels[1]).toContain("Đặc biệt");
  expect(labels[1]).toMatch(/text-muted-foreground"><\/span>/);
  expect(html).not.toContain("Khách hàng");
  expect(html).not.toContain("Vai trò tuỳ chỉnh");
});
