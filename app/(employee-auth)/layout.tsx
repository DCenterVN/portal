import {cookies} from "next/headers";
import {EmployeeAuthShell} from "@/components/layout/employee-auth-shell";
export default async function Layout({children}: {children: React.ReactNode}) {const locale = (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi";
  return <EmployeeAuthShell locale={locale}>{children}</EmployeeAuthShell>;}
