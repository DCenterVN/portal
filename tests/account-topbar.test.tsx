import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { expect, it, vi } from "vitest";
import { ConsoleShell } from "@/components/layout/console-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { breadcrumbFor, consoleNavFor } from "@/lib/navigation";
import messages from "@/messages/vi.json";

const state = vi.hoisted(() => ({ pathname: "/account" }));
vi.mock("next/navigation", () => ({ usePathname: () => state.pathname, useRouter: () => ({ push: vi.fn() }) }));

function topbar(pathname: string, title = messages.account.title) {
  state.pathname = pathname;
  const html = renderToStaticMarkup(
    <ThemeProvider>
      <NextIntlClientProvider locale="vi" timeZone="Asia/Ho_Chi_Minh" messages={{ ...messages, account: { ...messages.account, title } }}>
        <ConsoleShell nav={[{ title: "Tổ chức", items: [{ href: "/memberships", match: "/memberships", label: "Nhân viên" }] }]} context={{ label: "Chi nhánh" }} user={{ name: "An" }}>
          <p>Nội dung</p>
        </ConsoleShell>
      </NextIntlClientProvider>
    </ThemeProvider>,
  );
  return html.slice(html.indexOf("<header"), html.indexOf("</header>"));
}

it("account breadcrumb resolves outside the menu", () => {
  expect(breadcrumbFor([], "/account")).toEqual([{ labelKey: "account.title" }]);
  expect(consoleNavFor(new Set()).flatMap(group => group.items).some(item => item.href === "/account")).toBe(false);
  expect(breadcrumbFor([], "/account-other")).toEqual([]);
});

it("account topbar uses the next-intl account title", () => {
  expect(topbar("/account")).toContain("Tài khoản của tôi");
  expect(topbar("/account", "Tên tài khoản từ provider")).toContain("Tên tài khoản từ provider");
  expect(topbar("/account", "Tên tài khoản từ provider")).not.toContain("Tài khoản của tôi");
});

it("employee detail keeps the organization and employee breadcrumbs", () => {
  const header = topbar("/memberships/employee-id");
  expect(header).toMatch(/>Tổ chức<\/li>[\s\S]*aria-current="page"[^>]*>Nhân viên<\/span>/);
  expect(header).not.toContain("employee-id");
});
