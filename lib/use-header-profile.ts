"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { useAccess } from "@/lib/access-boundary";
import { getProfile } from "@/lib/auth/client";
import { ACCOUNT_CHANGED, ACCOUNT_PROFILE_KEY } from "@/lib/api/account-client";

type HeaderUser = { name: string; detail?: string; avatar_url?: string | null };
export function useHeaderProfile(fallback: HeaderUser): HeaderUser {
  const { scope } = useAccess();
  const { data, mutate } = useSWR([ACCOUNT_PROFILE_KEY, scope], getProfile);
  useEffect(subscribe, [mutate]);
  function subscribe() {
    function changed() { void mutate(); }
    window.addEventListener(ACCOUNT_CHANGED, changed);
    function unsubscribe() { window.removeEventListener(ACCOUNT_CHANGED, changed); }
    return unsubscribe;
  }
  if (!data) return fallback;
  return { name: data.display_name || data.email, detail: data.email, avatar_url: data.avatar_url };
}
