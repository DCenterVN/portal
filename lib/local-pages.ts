import { useState } from "react";

export const localPageSize = 20;

export function localPage<T>(items: T[], page: number, size = localPageSize) {
  const last = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), last);
  return { rows: items.slice((current - 1) * size, current * size), page: current, hasPrevious: current > 1, hasNext: current < last };
}

export function useLocalPages<T>(items: T[], resetKey: string) {
  const [state, setState] = useState({ key: resetKey, page: 1 });
  const view = localPage(items, state.key === resetKey ? state.page : 1);
  return { ...view, next: () => setState({ key: resetKey, page: view.page + 1 }), previous: () => setState({ key: resetKey, page: view.page - 1 }) };
}
