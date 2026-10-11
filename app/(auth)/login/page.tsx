import {cookies} from "next/headers";
import {getTranslations} from "@/features/customer-auth/form-feedback";
import { Suspense } from "react";

import { LoginForm } from "@/features/customer-auth/login-form";

export async function generateMetadata() { const t = getTranslations("customerAuth", (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi"); return {title: t("login")}; }

export default async function LoginPage() { const t = getTranslations("customerAuth", (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi");
  return (
    <>
      <header className="mb-4">
        <h1 className="font-display text-2xl font-bold text-fg">{t("login")}</h1>
        <p className="mt-1 text-sm text-fg-2">{t("loginSubtitle")}</p>
      </header>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
