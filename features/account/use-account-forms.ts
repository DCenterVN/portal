"use client";

import { useTranslations } from "next-intl";
import type { z } from "zod";
import { updateProfile, updatePhone, requestEmailChange, changePassword } from "@/lib/api/account-client";
import type { emailSchema, phoneSchema, nameSchema, passwordSchema } from "@/lib/api/account-validation";
import { toast } from "@/components/ui/toast";

export const fieldErrorKeys: Record<string, string> = {
  display_name: "nameInvalid", phone: "phoneInvalid", new_email: "emailInvalid", current_password: "currentRequired", new_password: "passwordHint", repeat: "passwordMismatch",
};

export function useAccountName(refresh: () => Promise<void>) {
  const t = useTranslations("account");
  async function save(values: z.infer<typeof nameSchema>) {
    await updateProfile({ display_name: values.display_name });
    toast.success(t("nameSaved"));
    await refresh();
  }
  return { save };
}
export function useAccountPhone(refresh: () => Promise<void>) {
  const t = useTranslations("account");
  async function save(values: z.infer<typeof phoneSchema>) {
    await updatePhone(values);
    toast.success(t("phoneSaved"));
    await refresh();
  }
  return { save };
}
export function useAccountEmail() {
  const t = useTranslations("account");
  async function save(values: z.infer<typeof emailSchema>) {
    await requestEmailChange({ new_email: values.new_email, current_password: values.current_password });
    toast.success(t("emailSent", { email: values.new_email }));
  }
  return { save };
}
export function useAccountPassword(loginPath: string) {
  const t = useTranslations("account");
  async function save(values: z.infer<typeof passwordSchema>) {
    await changePassword({ current_password: values.current_password, new_password: values.new_password });
    toast.success(t("passwordSaved"));
    window.location.assign(loginPath);
  }
  return { save };
}
