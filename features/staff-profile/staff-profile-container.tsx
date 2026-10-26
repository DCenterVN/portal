"use client";
import React from "react";
import {NextIntlClientProvider,useTranslations} from "next-intl";
import viMessages from "@/messages/vi.json";
import enMessages from "@/messages/en.json";
import {Skeleton,EmptyState,ErrorState} from "@/components/ui/state";
import {PageShell} from "@/components/ui/page";
import {useStaffProfile} from "./use-staff-profile";
import {StaffProfilePanel} from "./staff-profile-panel";
export interface StaffProfileContainerProps {editor?: React.ReactNode}
function StaffProfileContent({editor}: StaffProfileContainerProps) {
 const t=useTranslations("accountEdit");
 const model=useStaffProfile();
 if(model.isLoading) return <PageShell><Skeleton title={t("staffLoading")}/></PageShell>;
 if(model.error) return <PageShell><ErrorState title={t("loadError")} onRetry={()=>void model.mutate()}/></PageShell>;
 if(!model.data) return <PageShell><EmptyState title={t("empty")}/></PageShell>;
 return <StaffProfilePanel profile={model.data} editor={editor} onLogout={()=>void model.logout()}/>;
}

export function StaffProfileContainer(props:StaffProfileContainerProps){
 const locale=React.useSyncExternalStore(()=>()=>{},()=>/(?:^|;\s*)NEXT_LOCALE=en(?:;|$)/.test(document.cookie) ? "en" : "vi",()=>"vi");
 const messages=locale==="en" ? enMessages : viMessages;
 return <NextIntlClientProvider locale={locale} messages={{accountEdit:messages.accountEdit}} timeZone="Asia/Ho_Chi_Minh"><StaffProfileContent {...props}/></NextIntlClientProvider>;
}
