"use client";

import { useTranslations } from "next-intl";
import { login } from "@/lib/api/customer-auth";
import { useLoginForm } from "@/hooks/use-login-form";

export function useCustomerLogin() {
  const t = useTranslations("customerAuth");
  return useLoginForm({ t, login });
}
