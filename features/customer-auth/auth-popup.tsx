"use client";

import { useCallback, type ComponentType, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

function Body({ register }: { register: boolean }) {
  const t = useTranslations("customerAuth");
  return (
    <>
      <DialogTitle className="font-display text-2xl font-bold text-fg">{t(register ? "registerTitle" : "login")}</DialogTitle>
      <DialogDescription className="mb-4 mt-1 text-sm text-fg-2">{t(register ? "registerSubtitle" : "loginSubtitle")}</DialogDescription>
      {register ? <RegisterForm /> : <LoginForm />}
    </>
  );
}

export function useAuthPopup() {
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(() => router.push(`${pathname}?auth=login` as Route), [router, pathname]);
}

export function AuthPopup({ signedIn, Shell }: { signedIn: boolean; Shell: ComponentType<{ children: ReactNode }> }) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useSearchParams()?.get("auth");
  const tab = auth === "login" || auth === "register" ? auth : null;
  return (
    <Dialog open={!!tab && !signedIn} onOpenChange={(open) => !open && router.replace(pathname as Route)}>
      <DialogContent size="xl" variant="sheet" className="max-w-[880px] overflow-hidden p-0 max-md:max-h-[100dvh]">
        <Shell>
          <Body register={tab === "register"} />
        </Shell>
      </DialogContent>
    </Dialog>
  );
}
