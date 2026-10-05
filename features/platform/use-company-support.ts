"use client";

export { decideCompanyGrant } from "@/lib/api/platform-client";
export type { SupportGrant } from "@/lib/api/platform-contract";
import useSWR from "swr";
import { companySupport } from "@/lib/api/platform-client";
import type { SupportGrant } from "@/lib/api/platform-contract";
import { grantState } from "./use-support";

export const DECIDE_CONFLICT = "Grant đã hết hạn hoặc đã bị thu hồi. Hãy tải lại danh sách.";

export function useCompanySupport(root: string, page: number) {
  return useSWR(root ? ["company-support", root, page] : null, () => companySupport(root, page), { revalidateOnFocus: true });
}

export function decisionsFor(grant: SupportGrant, now = new Date()): Array<"approve" | "revoke"> {
  const state = grantState(grant, now);
  if (state === "pending") return ["approve", "revoke"];
  if (state === "active") return ["revoke"];
  return [];
}
