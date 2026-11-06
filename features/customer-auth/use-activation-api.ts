"use client";

import { activateAccount, resendActivation } from "@/lib/api/customer-auth";

export function useActivationApi() {
  return { activateAccount, resendActivation };
}
