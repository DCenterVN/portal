import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { cookies } from "next/headers";
import NotFound from "./not-found";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/features/console/console-frame", () => ({
  ConsoleFrame: ({ children }: { children: React.ReactNode }) => <div data-testid="console-frame">{children}</div>,
}));
vi.mock("@/features/store/store-frame", () => ({
  StoreFrame: ({ children }: { children: React.ReactNode }) => <div data-testid="store-frame">{children}</div>,
}));
vi.mock("@/features/customer-auth/auth-popup", () => ({ AuthPopup: () => null }));
vi.mock("@/components/layout/customer-auth-shell", () => ({ CustomerAuthPopupBody: () => null }));

function setCookies(values: Record<string, string>) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name in values ? { name, value: values[name] } : undefined),
    has: (name: string) => name in values,
  } as unknown as Awaited<ReturnType<typeof cookies>>);
}

async function render() {
  return renderToStaticMarkup(await NotFound());
}

describe("not-found frame", () => {
  beforeEach(() => {
    vi.mocked(cookies).mockReset();
  });

  it.each(["access_token", "refresh_token", "__Host-refresh_token"])(
    "renders the console frame for an employee session with %s",
    async (name) => {
      setCookies({ portal_plane: "employee", [name]: "token" });
      const html = await render();
      expect(html).toContain('data-testid="console-frame"');
      expect(html).not.toContain('data-testid="store-frame"');
      expect(html).toContain('href="/console"');
      expect(html).toContain("Về trang quản trị");
    }
  );

  it("renders the store frame for an employee plane without a session cookie", async () => {
    setCookies({ portal_plane: "employee" });
    const html = await render();
    expect(html).toContain('data-testid="store-frame"');
    expect(html).not.toContain('data-testid="console-frame"');
    expect(html).toContain('href="/"');
    expect(html).toContain("Về trang chủ");
  });

  it("renders the store frame for a customer session", async () => {
    setCookies({ portal_plane: "customer", access_token: "token" });
    const html = await render();
    expect(html).toContain('data-testid="store-frame"');
    expect(html).toContain('href="/"');
    expect(html).toContain("Về trang chủ");
  });

  it("renders the store frame for a guest", async () => {
    setCookies({});
    const html = await render();
    expect(html).toContain('data-testid="store-frame"');
    expect(html).toContain('href="/"');
    expect(html).toContain("Về trang chủ");
  });
});
