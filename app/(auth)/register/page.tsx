import {cookies} from "next/headers";
import {getTranslations} from "@/features/customer-auth/form-feedback";
import { Suspense } from "react";

import { AuthHeading } from "@/components/patterns/auth-heading";
import { RegisterForm } from "@/features/customer-auth/register-form";

export async function generateMetadata() { const t = getTranslations("customerAuth", (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi"); return {title: t("registerTitle")}; }

export default async function Page() { const t = getTranslations("customerAuth", (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi");
  return (
    <>
      <AuthHeading title={t("registerTitle")} subtitle={t("registerSubtitle")} />
      <Suspense>
        <RegisterForm />
      </Suspense>
    </>
  );
}
