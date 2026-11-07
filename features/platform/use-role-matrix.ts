"use client";

export { replaceRole } from "@/lib/api/platform-client";
import useSWR from "swr";
import { companyRoleMatrix } from "@/lib/api/platform-client";

export function useRoleMatrix(root: string) {
  return useSWR(["role-matrix", root], () => companyRoleMatrix(root), { revalidateOnFocus: false });
}

export function actionChanges(before: string[], after: string[]) {
  const was = new Set(before);
  const now = new Set(after);
  return { added: after.filter((item) => !was.has(item)), removed: before.filter((item) => !now.has(item)) };
}

// Catalogue = every action any role holds in this response (ADMIN holds the whole catalogue).
export function catalogOf(matrix: Record<string, string[]>): Set<string> {
  return new Set(Object.values(matrix).flat());
}
