"use client";

import useSWR from "swr";
import { useAccess } from "@/lib/access-boundary";
import { getProfile } from "@/lib/auth/client";
import { ACCOUNT_PROFILE_KEY, notifyAccountChanged } from "@/lib/api/account-client";

export function useAccount() {
  const { scope } = useAccess();
  const state = useSWR([ACCOUNT_PROFILE_KEY, scope], getProfile);
  async function refresh() {
    await state.mutate();
    notifyAccountChanged();
  }
  return { ...state, refresh };
}
