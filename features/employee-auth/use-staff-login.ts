"use client";

import { useTranslations } from "next-intl";
import { login } from "@/lib/api/employee-auth";
import { useLoginForm } from "@/hooks/use-login-form";

export function useStaffLogin() {
  const t = useTranslations("employeeAuth");
  return useLoginForm({ t, login, forbiddenKey: "notStaff" });
}
