"use client";

import { useEffect, useState, type ReactNode } from "react";
import { StoreShell } from "@/components/layout/store-shell";
import { doRefresh } from "@/lib/fetcher";
import { logoutTo } from "@/lib/auth/client";
import { toast } from "@/components/ui/toast";
import { STORE_FOOTER, STORE_NAV } from "@/mocks/store";
import { useAuthPopup } from "@/lib/use-auth-popup";

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
  const startedAt = Date.now();
  let response = await fetcher("/api/auth/me");
  if (response.status === 401) {
    const refreshed = await doRefresh(startedAt);
    if (refreshed === "unavailable") throw new Error("Không tải được thông tin tài khoản.");
    if (refreshed) response = await fetcher("/api/auth/me");
  }
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Không tải được thông tin tài khoản.");
  const user = resolveStoreUser(response.status, await response.json());
  if (!user) throw new Error("Thông tin tài khoản không hợp lệ.");
  return user;
}

export function loadStoreUser(onUser: (user: StoreUser | null) => void, fetcher: typeof fetch = fetch): Promise<void> {
  return fetchStoreUser(fetcher).then(onUser).catch(() => void toast.error("Không tải được thông tin tài khoản.", { id: "store-user-error" }));
}

export function StoreFrame({ children, authPopup }: { children: ReactNode; authPopup?: ReactNode }) {
  const [user, setUser] = useState<StoreUser | null>(null);
  const onLoginClick = useAuthPopup();

  useEffect(() => {
    let mounted = true;
    void loadStoreUser((resolvedUser) => {
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
      onLoginClick={onLoginClick}
      footer={STORE_FOOTER}
      onLogout={() => void logoutTo("/login", toast.error)}
    >
      {children}
      {user ? null : authPopup}
    </StoreShell>
  );
}
