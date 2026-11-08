export async function allPages<T>(load: (cursor: string) => Promise<{ items: T[]; next_cursor?: string | null }>): Promise<T[]> {
  const result: T[] = [];
  let cursor = "";
  do { const page = await load(cursor); result.push(...page.items); cursor = page.next_cursor ?? ""; } while (cursor);
  return result;
}
