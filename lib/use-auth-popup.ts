"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";

export function useAuthPopup() {
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(() => router.push(`${pathname}?auth=login` as Route), [router, pathname]);
}
