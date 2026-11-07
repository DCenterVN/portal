"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { UserProfile } from "@/lib/auth/client";
import { Badge } from "@/components/ui/badge";
import { roleName } from "@/lib/permission-labels";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { AccountSection } from "../account-section";
import { AccountGate } from "../account-gate";
import { AvatarEditor } from "../avatar-editor";
import { PasswordSetting } from "../password-setting";
import { SessionsCard } from "../sessions-card";
import { PhoneSetting } from "../phone-setting";
import { SettingRow } from "../setting-row";
import { NameForm } from "../name-form";

function role(name: string) { return <Badge key={name} variant="secondary">{roleName(name)}</Badge>; }

function StaffBody({ profile, refresh }: { profile: UserProfile; refresh: () => Promise<void> }) {
  const t = useTranslations("account");
  function membership(m: UserProfile["memberships"][number]) {
    return <SettingRow key={`${m.org_id}:${m.branch_id || ""}`} label={m.org_name || t("organization")} action={<span className="flex flex-wrap justify-end gap-1">{m.roles.map(role)}</span>}>{m.branch_name !== m.org_name ? m.branch_name : ""}</SettingRow>;
  }
  return <div className="space-y-10">
    <AccountSection title={t("avatar")} description={t("avatarDescription")}><AvatarEditor profile={profile} refresh={refresh} /></AccountSection>
    <AccountSection title={t("displayName")} description={t("nameHint")}><NameForm profile={profile} refresh={refresh} /></AccountSection>
    <AccountSection title={t("phone")} description={t("phoneHint")}>
      <PhoneSetting phone={profile.phone} refresh={refresh} />
    </AccountSection>
    <AccountSection title={t("email")} description={t("emailManaged")}><p className="text-sm break-all">{profile.email}</p></AccountSection>
    <AccountSection title={t("staffOrg")} description={t("adminManaged")}>
      {profile.memberships.length ? <dl>{profile.memberships.map(membership)}</dl> : <p className="py-3 text-sm text-muted-foreground">{t("noMemberships")}</p>}
      {new Set(profile.memberships.map(m => m.branch_id)).size > 1 && <div className="py-3"><Button size="sm" variant="outline" asChild><Link href="/staff/switch-branch">{t("switchBranch")}</Link></Button></div>}
    </AccountSection>
    <AccountSection title={t("password")} description={t("passwordDescription")}><PasswordSetting loginPath="/staff/login" /></AccountSection>
    <AccountSection title={t("sessions")} description={t("sessionsDescription")}><SessionsCard userId={profile.id} loginPath="/staff/login" /></AccountSection>
  </div>;
}

export function StaffAccount() {
  const t = useTranslations("account");
  return <PageShell className="max-w-180 space-y-6"><AccountGate staff>{(profile, refresh) => <><PageHeading title={t("title")} /><StaffBody profile={profile} refresh={refresh} /></>}</AccountGate></PageShell>;
}
