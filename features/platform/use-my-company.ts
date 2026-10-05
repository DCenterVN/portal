"use client";

import { putConsent } from "@/lib/api/platform-client";

// There is no GET for consent yet (plan AC-15): unknown stays unknown, never defaults to false.
export type Consent = boolean | null;

export function consentText(value: Consent): string {
  if (value === null) return "Chưa xác định";
  return value ? "Đang bật" : "Đang tắt";
}

export async function saveConsent(root: string, value: boolean): Promise<Consent> {
  const result = await putConsent(root, value);
  return result.standing_support_consent;
}
