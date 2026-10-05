import {cookies} from "next/headers";
import {getTranslations} from "@/features/customer-auth/form-feedback";
import { Suspense } from "react";

import { AuthHeading } from "@/components/patterns/auth-heading";
import { ForgotForm } from "@/features/customer-auth/forgot-form";

export async function generateMetadata() { const t = getTranslations("customerAuth", (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi"); return {title: t("forgotTitle")}; }

export default async function Page() { const t = getTranslations("customerAuth", (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi");
  return (
    <>
      <AuthHeading title={t("forgotTitle")} subtitle={t("forgotSubtitle")} />
      <Suspense>
        <ForgotForm />
      </Suspense>
    </>
  );
}
