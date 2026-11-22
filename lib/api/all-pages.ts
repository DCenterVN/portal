export type CursorPage<T> = { items: T[]; next_cursor?: string | null };
export async function allPages<T>(load: (cursor: string) => Promise<CursorPage<T>>): Promise<T[]> {
  const result: T[] = [];
  let cursor = "";
  do { const page = await load(cursor); result.push(...page.items); cursor = page.next_cursor ?? ""; } while (cursor);
  return result;
}
