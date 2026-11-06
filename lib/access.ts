export const VERBS = ["create", "read", "update", "delete", "import", "export"] as const;

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

export function errorStatus(error: unknown): number {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" ? status : 0;
}
