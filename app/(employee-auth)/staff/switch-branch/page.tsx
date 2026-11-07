import {cookies} from "next/headers";
import {getTranslations} from "@/features/employee-auth/form-feedback";
import {Suspense} from "react";
import {BranchChooser} from "@/features/employee-auth/branch-chooser";
export default async function Page() { const t = getTranslations("employeeAuth", (await cookies()).get("NEXT_LOCALE")?.value === "en" ? "en" : "vi");return <><h1 className="font-display text-2xl font-bold">{t("chooseBranch")}</h1><Suspense fallback={<p role="status">{t("loading")}</p>}><BranchChooser/></Suspense></>;}
