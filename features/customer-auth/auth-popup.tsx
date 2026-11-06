"use client";

import { type ComponentType, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { useAuthPopup } from "@/lib/use-auth-popup";

export { useAuthPopup };

const popupLocale = () => (typeof document !== "undefined" && /(?:^|;\s*)NEXT_LOCALE=en(?:;|$)/.test(document.cookie) ? "en" : "vi");

function Body({ register }: { register: boolean }) {
  const t = useTranslations("customerAuth");
  return (
    <>
      <DialogTitle className="font-display text-2xl font-bold text-foreground">{t(register ? "registerTitle" : "login")}</DialogTitle>
      <DialogDescription className="mb-4 mt-1 text-sm text-muted-foreground">{t(register ? "registerSubtitle" : "loginSubtitle")}</DialogDescription>
      {register ? <RegisterForm /> : <LoginForm />}
    </>
  );
}

export function AuthPopup({ signedIn, Shell }: { signedIn: boolean; Shell: ComponentType<{ children: ReactNode; locale?: "vi" | "en" }> }) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useSearchParams()?.get("auth");
  const tab = auth === "login" || auth === "register" ? auth : null;
  return (
    <Dialog open={!!tab && !signedIn} onOpenChange={(open) => !open && router.replace(pathname as Route)}>
      <DialogContent className="max-w-sm overflow-hidden p-0 max-md:max-h-[100dvh] sm:max-w-sm">
        <Shell locale={popupLocale()}>
          <Body register={tab === "register"} />
        </Shell>
      </DialogContent>
    </Dialog>
  );
}
