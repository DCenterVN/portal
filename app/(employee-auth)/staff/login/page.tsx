import {cookies} from "next/headers";
import {getTranslations} from "@/features/employee-auth/form-feedback";
import {StaffLogin} from "@/features/employee-auth/staff-login";

export default async function Page() {
 const t = getTranslations("employeeAuth", (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi");
 return <><h1 className="font-display text-2xl font-bold">{t("login")}</h1><StaffLogin /></>;
}
