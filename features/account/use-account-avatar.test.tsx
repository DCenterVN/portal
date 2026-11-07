import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, expect, it, vi } from "vitest";
import messages from "@/messages/vi.json";
import { useAccountAvatar } from "./use-account-avatar";

let avatar: ReturnType<typeof useAccountAvatar>;
function Probe() {
  avatar = useAccountAvatar(saved);
  return null;
}
const saved = vi.fn().mockResolvedValue(undefined);
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it.each(["success", "presign", "upload", "finalize"])("selection completes the upload before refreshing, outcome: %s", async (outcome) => {
  saved.mockClear();
  const envelope = (data: unknown) => Response.json({ code: 200, status: "success", message: "", data });
  const failed = () => Response.json({ error: "service_busy" }, { status: 503 });
  const grant = { upload_id: "upload-fixture", upload_url: "https://storage.example.test/avatar", upload_method: "POST", form_fields: {}, expires_in: 300 };
  const fetch = vi.fn()
    .mockResolvedValueOnce(outcome === "presign" ? failed() : envelope(grant))
    .mockResolvedValueOnce(outcome === "upload" ? failed() : new Response(null, { status: 204 }))
    .mockResolvedValueOnce(outcome === "finalize" ? failed() : envelope({ avatar_key: "avatar-fixture", avatar_url: "https://storage.example.test/avatar.png" }));
  const close = vi.fn();
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 100, height: 100, close }));
  vi.stubEnv("NEXT_PUBLIC_STORAGE_ORIGIN", "https://storage.example.test");
  renderToStaticMarkup(<NextIntlClientProvider locale="vi" timeZone="Asia/Ho_Chi_Minh" messages={messages}><Probe /></NextIntlClientProvider>);
  const file = new File(["image"], "avatar.png", { type: "image/png" });
  await avatar.selectFile(file);
  expect(createImageBitmap).toHaveBeenCalledOnce();
  expect(close).toHaveBeenCalledOnce();
  const expectedCalls = outcome === "presign" ? 1 : outcome === "upload" ? 2 : 3;
  expect(fetch).toHaveBeenCalledTimes(expectedCalls);
  expect(new URL(String(fetch.mock.calls[0][0])).pathname).toBe("/api/auth/profile/avatar/presign");
  if (expectedCalls >= 2) {
    expect(fetch.mock.calls[1][0]).toBe(grant.upload_url);
    expect(fetch.mock.calls[1][1].credentials).toBe("omit");
    expect(fetch.mock.calls[1][1].body.get("file")).toBe(file);
  }
  if (expectedCalls === 3) {
    expect(new URL(String(fetch.mock.calls[2][0])).pathname).toBe("/api/auth/profile/avatar/finalize");
    expect(JSON.parse(fetch.mock.calls[2][1].body)).toEqual({ upload_id: grant.upload_id });
  }
  expect(saved).toHaveBeenCalledTimes(outcome === "success" ? 1 : 0);
});
it("invalid type and oversize files are rejected before decoding or networking", async () => {
  const fetch = vi.fn();
  const bitmap = vi.fn();
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("createImageBitmap", bitmap);
  renderToStaticMarkup(<NextIntlClientProvider locale="vi" timeZone="Asia/Ho_Chi_Minh" messages={messages}><Probe /></NextIntlClientProvider>);
  await avatar.selectFile(new File(["not-image"], "avatar.svg", { type: "image/svg+xml" }));
  await avatar.selectFile(new File([new Uint8Array(2097153)], "avatar.png", { type: "image/png" }));
  expect(bitmap).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});
