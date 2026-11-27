import { useState } from "react";

export type CursorPages = { cursors: string[] };
export const cursorPagesStart: CursorPages = { cursors: [""] };
export const currentCursor = (state: CursorPages) => state.cursors[state.cursors.length - 1];
export const pageNumber = (state: CursorPages) => state.cursors.length;
export const hasPrevious = (state: CursorPages) => state.cursors.length > 1;
export const goNext = (state: CursorPages, nextCursor: string): CursorPages => nextCursor ? { cursors: [...state.cursors, nextCursor] } : state;
export const pagerFlags = (state: CursorPages, nextCursor: string, busy: boolean) => ({ hasPrevious: !busy && hasPrevious(state), hasNext: !busy && Boolean(nextCursor) });
export const goPrevious = (state: CursorPages): CursorPages => hasPrevious(state) ? { cursors: state.cursors.slice(0, -1) } : state;

export function useCursorPages() {
  const [state, setState] = useState(cursorPagesStart);
  return { cursor: currentCursor(state), page: pageNumber(state), hasPrevious: hasPrevious(state), next: (cursor: string) => setState(current => goNext(current, cursor)), previous: () => setState(goPrevious), reset: () => setState(cursorPagesStart) };
}
