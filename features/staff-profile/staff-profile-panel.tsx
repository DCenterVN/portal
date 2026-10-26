"use client";
import React from "react";
import {useTranslations,useLocale} from "next-intl";
import type {UserProfile} from "@/lib/auth/client";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card,CardContent,CardHeader,CardTitle} from "@/components/ui/card";
import {PageHeader,PageShell} from "@/components/ui/page";
export interface StaffProfilePanelProps {profile: UserProfile; editor?: React.ReactNode; onLogout(): void}
export function StaffProfilePanel({profile,editor,onLogout}: StaffProfilePanelProps) {
 const t=useTranslations("accountEdit");
 const locale=useLocale();
 const fields=[[t("name"),profile.display_name || t("unset")],["Email",profile.email],[t("phone"),profile.phone || "—"],[t("created"),profile.created_at ? new Date(profile.created_at).toLocaleDateString(locale) : "—"]];
 return <PageShell className="space-y-6">
  <PageHeader title={t("staffTitle")} description={t("staffDescription")} badge={<Badge variant="secondary">{profile.status==="ACTIVE" ? t("active") : profile.status}</Badge>} actions={<Button variant="outline" onClick={onLogout}>{t("logout")}</Button>}/>
  <Card className="rounded-lg"><CardHeader><CardTitle>{t("personal")}</CardTitle></CardHeader><CardContent className="space-y-4">
   {profile.avatar_url ? <img src={profile.avatar_url} alt={t("avatar")} className="size-20 rounded-lg object-cover"/> : <span aria-label={t("avatar")}>{profile.display_name.slice(0,2).toUpperCase()}</span>}
   <div className="grid gap-4 sm:grid-cols-2">{fields.map(([label,value])=><div key={label}><p className="text-xs text-fg-3">{label}</p><p className="text-sm font-semibold">{value}</p></div>)}</div>
   {editor}
  </CardContent></Card>
  <Card className="rounded-lg"><CardHeader><CardTitle>{t("organization")}</CardTitle></CardHeader><CardContent className="space-y-3">
   {profile.memberships.length===0 ? <p>{t("noMembership")}</p> : profile.memberships.map(m=><div key={`${m.org_id}:${m.branch_id || ""}`} className="flex flex-wrap gap-3">
    <strong>{m.org_name || t("noOrganizationName")}</strong>{m.branch_name && <span>{m.branch_name}</span>}{m.roles.map(role=><Badge key={role} variant="secondary">{role}</Badge>)}
   </div>)}
   <a href="/staff/switch-org">{t("switchOrg")}</a>
  </CardContent></Card>
 </PageShell>;
}
