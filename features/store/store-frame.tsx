"use client";

import { useEffect, useState, type ReactNode } from "react";
import { StoreShell } from "@/components/layout/store-shell";
import { STORE_FOOTER, STORE_NAV } from "@/mocks/store";

export type StoreUser = { name: string };

export function resolveStoreUser(status: number, payload: unknown): StoreUser | null {
  if (status !== 200 || typeof payload !== "object" || payload === null || !("name" in payload)) {
    return null;
  }

  const name = payload.name;
  return typeof name === "string" && name.trim() ? { name } : null;
}

export async function fetchStoreUser(fetcher: typeof fetch = fetch): Promise<StoreUser | null> {
  try {
    const response = await fetcher("/api/auth/me");
    if (response.status === 401) return resolveStoreUser(response.status, null);
    if (!response.ok) return null;
    return resolveStoreUser(response.status, await response.json());
  } catch {
    return null;
  }
}

export function StoreFrame({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoreUser | null>(null);

  useEffect(() => {
    let mounted = true;
    void fetchStoreUser().then((resolvedUser) => {
      if (mounted) setUser(resolvedUser);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <StoreShell
      nav={STORE_NAV}
      user={user}
      cartHref="/cart"
      loginHref="/login"
      footer={STORE_FOOTER}
    >
      {children}
    </StoreShell>
  );
}
