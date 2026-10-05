import {cookies} from "next/headers";
import {getTranslations} from "@/features/customer-auth/form-feedback";
import { Suspense } from "react";

import { AuthHeading } from "@/components/patterns/auth-heading";
import { ActivateView } from "@/features/customer-auth/activate-view";

export async function generateMetadata() { const t = getTranslations("customerAuth", (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi"); return {title: t("activateTitle")}; }

export default async function Page() { const t = getTranslations("customerAuth", (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi");
  return (
    <>
      <AuthHeading title={t("activateTitle")} subtitle={t("activateSubtitle")} />
      <Suspense>
        <ActivateView />
      </Suspense>
    </>
  );
}
