import {cookies} from "next/headers";
import {getTranslations} from "@/features/employee-auth/form-feedback";
import {Suspense} from "react";
import {LoginForm} from "@/features/employee-auth/login-form";
export default async function Page() { const t = getTranslations("employeeAuth", (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi");return <><h1 className="font-display text-2xl font-bold">{t("login")}</h1><Suspense fallback={<p role="status">{t("loading")}</p>}><LoginForm/></Suspense></>;}
