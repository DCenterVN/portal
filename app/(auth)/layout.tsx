import {cookies} from "next/headers";
import type { ReactNode } from "react";
import { CustomerAuthShell } from "@/components/layout/customer-auth-shell";
export default async function CustomerAuthLayout({children}: {children: ReactNode}) {
  const locale = (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi";
  return <CustomerAuthShell locale={locale}>{children}</CustomerAuthShell>;
}
