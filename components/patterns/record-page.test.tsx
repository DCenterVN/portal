import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import { RecordTabs } from "./record-page";

const nav = vi.hoisted(() => ({ query: "org_id=company&tab=security", replace: vi.fn(), change: (_value: string) => {} }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(nav.query), usePathname: () => "/account", useRouter: () => ({ replace: nav.replace }) }));
vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: React.ReactNode }) => { nav.change = onValueChange; return <div data-selected={value}>{children}</div>; },
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
const items = [{ value: "info", label: "Thông tin", content: "Hồ sơ" }, { value: "security", label: "Bảo mật", content: "Mật khẩu" }];
beforeEach(() => { nav.replace.mockClear(); nav.query = "org_id=company&tab=security"; });

it("RecordTabs reads the selected tab from URL", () => {
  expect(renderToStaticMarkup(<RecordTabs tabs={items} />)).toContain('data-selected="security"');
});
it("RecordTabs writes tab while preserving other query parameters", () => {
  renderToStaticMarkup(<RecordTabs tabs={items} />);
  nav.change("info");
  expect(nav.replace).toHaveBeenCalledWith("/account?org_id=company&tab=info", { scroll: false });
});
it("RecordTabs falls back for an unknown tab", () => {
  nav.query = "tab=unknown";
  expect(renderToStaticMarkup(<RecordTabs tabs={items} />)).toContain('data-selected="info"');
});
