import * as React from "react";
import { mkdirSync, writeFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { ConsoleShell } from "@/components/layout/console-shell";
import { ThemeProvider } from "@/components/theme-provider";
import messages from "@/messages/vi.json";

export function recordRender(children: React.ReactNode, capture?: string) {
  const html = renderToStaticMarkup(<ThemeProvider><NextIntlClientProvider locale="vi" timeZone="Asia/Ho_Chi_Minh" messages={messages}>
    <ConsoleShell nav={[{ title: "Tổ chức", items: [{ href: "/memberships", match: "/memberships", label: "Nhân viên" }] }]} context={{ label: "Bếp Hà Nội", sublabel: "Cầu Giấy" }} user={{ name: "Nguyễn Minh An", detail: "an@example.test" }}>{children}</ConsoleShell>
  </NextIntlClientProvider></ThemeProvider>);
  if (capture && process.env.HOSO_CAPTURE === "1") {
    const folder = "/home/dawn/work/ticket/.cache/agent-logs/261108/hoso";
    mkdirSync(folder, { recursive: true });
    writeFileSync(`${folder}/${capture}.html`, html);
  }
  return html;
}
