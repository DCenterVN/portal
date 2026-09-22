"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { AuthUser, AuthSession } from "@dcentervn/auth-core";
import { getProfile, nativeLogout } from "@dcentervn/api-client";

export interface AuthContextValue extends AuthSession {
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY_TOKEN = "dcenter_access_token";
const STORAGE_KEY_REFRESH = "dcenter_refresh_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on initial load
  useEffect(() => {
    try {
      const storedAccess = localStorage.getItem(STORAGE_KEY_TOKEN);
      const storedRefresh = localStorage.getItem(STORAGE_KEY_REFRESH);
      if (storedAccess) {
        setAccessToken(storedAccess);
        setRefreshToken(storedRefresh);
        getProfile(storedAccess)
          .then((profile) => {
            setUser({
              id: (profile.id as string) ?? "",
              email: (profile.email as string) ?? "",
              displayName: (profile.display_name as string) ?? "",
              phone: profile.phone as string | undefined,
              status: (profile.status as string) ?? "ACTIVE",
              avatarUrl: profile.avatar_url as string | undefined,
            });
          })
          .catch(() => {
            localStorage.removeItem(STORAGE_KEY_TOKEN);
            localStorage.removeItem(STORAGE_KEY_REFRESH);
            setAccessToken(null);
            setRefreshToken(null);
          })
          .finally(() => setIsLoading(false));
        return;
      }
    } catch {
      // LocalStorage unavailable in SSR or sandbox
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (newAccessToken: string, newRefreshToken: string) => {
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      try {
        localStorage.setItem(STORAGE_KEY_TOKEN, newAccessToken);
        localStorage.setItem(STORAGE_KEY_REFRESH, newRefreshToken);
      } catch {
        // ignore storage errors
      }

      try {
        const profile = await getProfile(newAccessToken);
        setUser({
          id: (profile.id as string) ?? "",
          email: (profile.email as string) ?? "",
          displayName: (profile.display_name as string) ?? "",
          phone: profile.phone as string | undefined,
          status: (profile.status as string) ?? "ACTIVE",
          avatarUrl: profile.avatar_url as string | undefined,
        });
      } catch {
        // Keep login state even if profile fetch fails initially
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    if (accessToken) {
      try {
        await nativeLogout(accessToken);
      } catch {
        // best effort
      }
    }
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_REFRESH);
    } catch {
      // ignore
    }
  }, [accessToken]);

  const updateUser = useCallback((updated: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isAuthenticated: !!accessToken,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthSession(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthSession must be used within an AuthProvider");
  }
  return context;
}
