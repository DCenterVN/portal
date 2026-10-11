"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ErrorState } from "@/components/ui/state";
import { StoreShell } from "@/components/layout/store-shell";
import { logoutTo } from "@/lib/auth/client";
import { STORE_FOOTER, STORE_NAV } from "@/mocks/store";

export type StoreUser = { name: string };

export function resolveStoreUser(status: number, payload: unknown): StoreUser | null {
  if (status !== 200 || typeof payload !== "object" || payload === null || !("display_name" in payload)) {
    return null;
  }

  const name = payload.display_name;
  if (typeof name !== "string") return null;
  const email = "email" in payload && typeof payload.email === "string" ? payload.email : "";
  return { name: name.trim() ? name : email };
}

export async function fetchStoreUser(fetcher: typeof fetch = fetch): Promise<StoreUser | null> {
  const response = await fetcher("/api/auth/me");
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Không tải được thông tin tài khoản.");
  const user = resolveStoreUser(response.status, await response.json());
  if (!user) throw new Error("Thông tin tài khoản không hợp lệ.");
  return user;
}

export function StoreFrame({ children }: { children: ReactNode }) {
  const [error, setError] = useState(false);
  const [user, setUser] = useState<StoreUser | null>(null);

  useEffect(() => {
    let mounted = true;
    void fetchStoreUser().then((resolvedUser) => {
      if (mounted) setUser(resolvedUser);
    }).catch(() => {
      if (mounted) setError(true);
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
      onLogout={() => void logoutTo("/login")}
    >
      {error ? <ErrorState title="Không tải được thông tin tài khoản." /> : children}
    </StoreShell>
  );
}
