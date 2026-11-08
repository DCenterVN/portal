"use client";

import Link from "next/link";
import { Building2, CalendarDays, Mail, Pencil, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UserProfile } from "@/lib/auth/client";
import { roleName } from "@/lib/permission-labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { PageShell } from "@/components/ui/page";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RecordHeader, RecordSection, RecordTabs } from "@/components/patterns/record-page";
import { StatusBadge } from "@/components/patterns/status-badge";
import { AccountGate } from "../account-gate";
import { AvatarEditor } from "../avatar-editor";
import { PasswordSetting } from "../password-setting";
import { SessionsCard } from "../sessions-card";
import { PhoneSetting } from "../phone-setting";
import { NameForm } from "../name-form";
import { useStaffRecord } from "./use-staff-record";

function Memberships({ profile }: { profile: UserProfile }) {
  const t = useTranslations("account");
  const r = useTranslations("record");
  return <RecordSection title={r("rolesBranches")}><div className="min-w-0 space-y-4 md:col-span-2">
    {profile.memberships.length ? <div className="overflow-x-auto"><Table>
      <TableHeader><TableRow><TableHead>{r("branch")}</TableHead><TableHead>{r("roles")}</TableHead></TableRow></TableHeader>
      <TableBody>{profile.memberships.map((member) => <TableRow key={`${member.org_id}:${member.branch_id || ""}`}>
        <TableCell>{member.branch_name || member.org_name || t("organization")}</TableCell>
        <TableCell><div className="flex flex-wrap gap-1">{member.roles.map((code) => <Badge key={code} variant="secondary">{roleName(code)}</Badge>)}</div></TableCell>
      </TableRow>)}</TableBody>
    </Table></div> : <p className="text-sm text-muted-foreground">{t("noMemberships")}</p>}
    {new Set(profile.memberships.map((member) => member.branch_id)).size > 1 && <Button size="sm" variant="outline" asChild><Link href="/staff/switch-branch">{t("switchBranch")}</Link></Button>}
  </div></RecordSection>;
}

function StaffBody({ profile, refresh }: { profile: UserProfile; refresh: () => Promise<void> }) {
  const t = useTranslations("account");
  const r = useTranslations("record");
  const { branchName, roles, joined, editTarget, edit } = useStaffRecord(profile);
  const info = <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <RecordSection title={r("personal")}><div ref={editTarget} className="md:col-span-2"><NameForm profile={profile} refresh={refresh} showLabel /></div></RecordSection>
    <RecordSection title={r("contact")}>
      <Field><FieldLabel htmlFor="account-email">{t("email")}</FieldLabel><Input id="account-email" value={profile.email} readOnly disabled aria-describedby="account-email-hint" /><FieldDescription id="account-email-hint">{r("emailManaged")}</FieldDescription></Field>
      <PhoneSetting phone={profile.phone} refresh={refresh} />
    </RecordSection>
  </div>;
  const security = <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <RecordSection title={t("password")}><div className="md:col-span-2"><PasswordSetting loginPath="/staff/login" /></div></RecordSection>
    <RecordSection title={r("sessions")}><div className="min-w-0 md:col-span-2"><SessionsCard userId={profile.id} loginPath="/staff/login" /></div></RecordSection>
  </div>;
  return <>
    <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbPage>{t("title")}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
    <RecordHeader name={profile.display_name || profile.email} avatar={<AvatarEditor profile={profile} refresh={refresh} compact />}
      actions={<Button variant="outline" size="sm" onClick={edit}><Pencil className="size-4" />{r("edit")}</Button>}
      contacts={<>{profile.phone && <a href={`tel:${profile.phone}`} aria-label={r("call")} className="text-muted-foreground"><Phone className="size-4" /></a>}<a href={`mailto:${profile.email}`} aria-label={r("sendEmail")} className="text-muted-foreground"><Mail className="size-4" /></a></>}
      meta={<><span className="inline-flex items-center gap-2"><Mail className="size-4" />{profile.email}</span>{profile.phone && <span className="inline-flex items-center gap-2"><Phone className="size-4" />{profile.phone}</span>}<span className="inline-flex items-center gap-2"><Building2 className="size-4" />{branchName || r("noBranch")}</span><span className="inline-flex items-center gap-2"><CalendarDays className="size-4" />{r("joined", { date: joined || t("none") })}</span></>}
      badges={<><span className="text-muted-foreground">{r("status")}</span><StatusBadge tone={profile.status === "ACTIVE" ? "success" : "warning"}>{r(profile.status === "ACTIVE" ? "active" : "locked")}</StatusBadge><span className="ml-2 text-muted-foreground">{r("roles")}</span>{roles.map((code) => <Badge key={code} variant="secondary">{roleName(code)}</Badge>)}</>} />
    <RecordTabs tabs={[{ value: "info", label: r("info"), content: info }, { value: "roles", label: r("rolesBranches"), content: <Memberships profile={profile} /> }, { value: "security", label: r("security"), content: security }]} />
  </>;
}

export function StaffAccount() {
  return <PageShell className="space-y-6"><AccountGate staff>{(profile, refresh) => <StaffBody profile={profile} refresh={refresh} />}</AccountGate></PageShell>;
}
