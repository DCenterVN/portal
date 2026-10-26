import { afterEach, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MembershipsView } from "./memberships-view";

import { companyMemberships } from "@/lib/api/platform-client";
import * as swr from "swr";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/vi.json";
import { ToastProvider } from "@/components/ui/toast";

vi.mock("swr", () => ({ default: vi.fn() }));
vi.mock("@/lib/access-boundary", () => ({ useAccess: () => ({ can: () => true }) }));
afterEach(() => vi.unstubAllGlobals());

it("memberships_no_uuid", async () => {
  const uuid = "0192f3a4-5b6c-7d8e-9f00-112233445566";
  vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(Response.json({ code: 200, status: "success", message: "Success", data: {
    items: [{ id: uuid, user_id: uuid, branch_id: uuid, role_codes: ["SALES"], status: "ACTIVE" }], page: 1, limit: 20,
  } })));
  const data = await companyMemberships(1);
  vi.mocked(swr.default).mockReturnValue({ data, error: undefined, isLoading: false, isValidating: false, mutate: vi.fn() });
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" timeZone="Asia/Ho_Chi_Minh" messages={messages}><ToastProvider><MembershipsView /></ToastProvider></NextIntlClientProvider>);
  expect(html).toContain(messages.memberships.roleLabels.SALES);
  expect(html).toContain(messages.memberships.ACTIVE);
  expect(userFacingContent(html)).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
});

function userFacingContent(html: string): string {
  const text = html.replace(/<[^>]*>/g, " ");
  const labels = html.match(/\s(?:label|placeholder|title|aria-[\w-]+)="[^"]*"/g) ?? [];
  const values = (html.match(/<input\b[^>]*>/g) ?? [])
    .filter((input) => !input.includes('type="hidden"'))
    .flatMap((input) => input.match(/\svalue="[^"]*"/g) ?? []);
  return [text, ...labels, ...values].join(" ");
}
