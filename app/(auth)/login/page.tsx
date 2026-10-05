import {cookies} from "next/headers";
import {getTranslations} from "@/features/customer-auth/form-feedback";
import { Suspense } from "react";

import { AuthHeading } from "@/components/patterns/auth-heading";
import { LoginForm } from "@/features/customer-auth/login-form";

export async function generateMetadata() { const t = getTranslations("customerAuth", (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi"); return {title: t("login")}; }

export default async function LoginPage() { const t = getTranslations("customerAuth", (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi");
  return (
    <>
      <AuthHeading title={t("login")} subtitle={t("loginSubtitle")} />
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
