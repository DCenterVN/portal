"use client";

export { replaceRole } from "@/lib/api/platform-client";
import useSWR from "swr";
import { companyRoleMatrix, getRoleMatrix } from "@/lib/api/platform-client";
import type { Source } from "./use-company";

export function useRoleMatrix(source: Source, root: string) {
  return useSWR(root ? ["role-matrix", source, root] : null, () => (source === "platform" ? getRoleMatrix(root) : companyRoleMatrix(root)), { revalidateOnFocus: false });
}

// One action per line or comma; order kept, duplicates dropped.
export function parseActions(text: string): string[] {
  return [...new Set(text.split(/[\n,]/).map((item) => item.trim()).filter(Boolean))];
}

export function actionChanges(before: string[], after: string[]) {
  const was = new Set(before);
  const now = new Set(after);
  return { added: after.filter((item) => !was.has(item)), removed: before.filter((item) => !now.has(item)) };
}
