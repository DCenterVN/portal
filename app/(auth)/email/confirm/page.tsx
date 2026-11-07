import { cookies } from "next/headers";
import { EmailConfirmClient } from "@/features/account/email-confirm-client";

export const metadata = { referrer: "no-referrer" } as const;

export default async function EmailConfirmPage() {
  const locale = (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi";
  return <EmailConfirmClient locale={locale} />;
}
