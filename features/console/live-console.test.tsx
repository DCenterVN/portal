import { afterEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import * as swr from "swr";
import { LiveConsole } from "./live-console";

vi.mock("swr", () => ({ default: vi.fn() }));
afterEach(() => vi.clearAllMocks());

const uuid = "0192f3a4-5b6c-7d8e-9f00-112233445566";
const data = {
  user: { id: uuid, display_name: "", email: "" },
  contexts: [
    { org_id: uuid, org_name: "Sunny", branch_id: uuid, branch_name: "Sunny", branch_type: "CENTRAL_KITCHEN", roles: ["ADMIN"] },
    { org_id: uuid, org_name: "Sunny", branch_id: "b", branch_name: "Cửa hàng Cầu Giấy", branch_type: "STORE", roles: ["ADMIN", "SALES"] },
  ],
  permissions: ["sales:product:read", "inventory:transfer_receipt:create", "org:branch:update"],
};

it("shows role names, no raw role code, no technical wording and no UUID", () => {
  vi.mocked(swr.default).mockReturnValue({ data, error: undefined, isLoading: false, mutate: vi.fn() } as never);
  const text = renderToStaticMarkup(<LiveConsole />).replace(/<[^>]*>/g, " ");
  expect(text).toContain("Quản trị hệ thống, Bán hàng");
  expect(text).toContain("Sunny · Bếp trung tâm");
  expect(text).toContain("Sunny · Cửa hàng Cầu Giấy");
  expect(text).not.toContain("Sunny · Sunny");
  expect(text).not.toMatch(/\bADMIN\b|action key|backend|Backend|phân giải|\b[a-z_]+:[a-z_]+:[a-z_]+\b/);
  expect(text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
});
