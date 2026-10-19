"use client";

export { replaceRole } from "@/lib/api/platform-client";
import useSWR from "swr";
import { companyRoleMatrix } from "@/lib/api/platform-client";

export function useRoleMatrix(root: string) {
  return useSWR(root ? ["role-matrix", root] : null, () => companyRoleMatrix(root), { revalidateOnFocus: false });
}

export const VERBS = ["create", "read", "update", "delete", "import", "export"] as const;

// Key = "module:resource:verb"; resource keeps everything before the last segment.
export function resourcesOf(matrix: Record<string, string[]>): string[] {
  const found = new Set<string>();
  for (const actions of Object.values(matrix)) {
    for (const action of actions) {
      const cut = action.lastIndexOf(":");
      if (cut > 0 && (VERBS as readonly string[]).includes(action.slice(cut + 1))) found.add(action.slice(0, cut));
    }
  }
  return [...found].sort();
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
