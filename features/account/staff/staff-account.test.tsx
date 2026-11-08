import * as React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import AccountPage from "@/app/(console)/account/page";
import ConsoleLayout from "@/app/(console)/layout";

vi.mock("next/navigation", () => ({ redirect: vi.fn(() => { throw Error("account left console"); }) }));
vi.mock("@/features/account/staff/staff-account", () => ({ StaffAccount: () => <h1>Tài khoản của tôi</h1> }));
vi.mock("@/features/console/console-frame", () => ({ ConsoleFrame: ({ children }: { children: React.ReactNode }) => <><aside>Sidebar</aside><main>{children}</main></> }));

it("account renders inside ConsoleFrame without redirect", () => {
  const html = renderToStaticMarkup(<ConsoleLayout><AccountPage /></ConsoleLayout>);
  expect(html).toContain("<aside>Sidebar</aside>");
  expect(html).toContain("Tài khoản của tôi");
  expect(readFileSync("components/layout/console-sidebar.tsx", "utf8")).toContain('accountHref = "/account"');
});
