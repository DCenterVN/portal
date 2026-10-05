import {cookies} from "next/headers";
import {getTranslations} from "@/features/employee-auth/form-feedback";
import {Suspense} from "react";
import {InviteForm} from "@/features/employee-auth/invite-form";
export default async function Page() { const t = getTranslations("employeeAuth", (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi");return <><h1 className="font-display text-2xl font-bold">{t("inviteTitle")}</h1><Suspense fallback={<p role="status">{t("loading")}</p>}><InviteForm/></Suspense></>;}
