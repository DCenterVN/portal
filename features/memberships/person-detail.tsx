"use client";

import Link from "next/link";
import { Building2, Mail, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { RequireAction } from "@/lib/access-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { PageShell } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { EmptyState, ErrorState } from "@/components/patterns/empty-state";
import { StatusBadge } from "@/components/patterns/status-badge";
import { RecordHeader, RecordSection, RecordTabs } from "@/components/patterns/record-page";
import { AssignmentPanel } from "./assignment-panel";
import { usePersonDetail } from "./use-person-detail";

function DetailBody({ userId }: { userId: string }) {
  const t = useTranslations("record");
  const a = useTranslations("account");
  const { members, branches, person, can, scope, editTarget, edit } = usePersonDetail(userId);
  if (members.isLoading || branches.isLoading) return <div aria-busy="true" className="space-y-6"><Skeleton className="h-40 w-full" /><Skeleton className="h-10 w-72" /><Skeleton className="h-64 w-full" /></div>;
  if (members.error || !members.data || branches.error) return <ErrorState title={t("detailError")} onRetry={() => { void members.mutate(); void branches.mutate(); }} />;
  if (!person) return <EmptyState title={t("notFound")} description={t("notFoundHint")} />;
  const active = person.assignments.some((item) => !item.locked);
  const info = <RecordSection title={t("personal")}>
    <Field><FieldLabel htmlFor="person-name">{a("displayName")}</FieldLabel><Input id="person-name" readOnly disabled value={person.name} aria-describedby="person-info-hint" /></Field>
    <Field><FieldLabel htmlFor="person-email">{a("email")}</FieldLabel><Input id="person-email" readOnly disabled value={person.email} aria-describedby="person-info-hint" /></Field>
    <p id="person-info-hint" className="text-xs text-muted-foreground md:col-span-2">{t("selfManaged")}</p>
  </RecordSection>;
  const assignments = <RecordSection title={t("assignments")}><div ref={editTarget} className="md:col-span-2"><AssignmentPanel key={person.userId} person={person} branches={branches.data ?? []} viewerIsAdmin={scope?.roles.includes("ADMIN") ?? false} isSelf={person.userId === scope?.userId} canUpdate={can("org:membership:update")} canCreate={can("org:employee:create")} onSaved={() => members.mutate()} /></div></RecordSection>;
  return <>
    <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink asChild><Link href="/memberships">{t("employees")}</Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{person.name}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
    <RecordHeader name={person.name} contacts={<a href={`mailto:${person.email}`} aria-label={t("sendEmail")} className="text-muted-foreground"><Mail className="size-4" /></a>}
      actions={can("org:membership:update") && person.userId !== scope?.userId && <Button variant="outline" size="sm" onClick={edit}><Pencil className="size-4" />{t("editAssignments")}</Button>}
      meta={<><span className="inline-flex items-center gap-2"><Mail className="size-4" />{person.email}</span><span className="inline-flex items-center gap-2"><Building2 className="size-4" />{t("branchCount", { count: person.assignments.length })}</span></>}
      badges={<><span className="text-muted-foreground">{t("status")}</span><StatusBadge tone={active ? "success" : "warning"}>{t(active ? "active" : "locked")}</StatusBadge>{person.allBranches && <Badge variant="secondary">{t("allBranches")}</Badge>}</>} />
    <RecordTabs tabs={[{ value: "assignments", label: t("assignments"), content: assignments }, { value: "info", label: t("info"), content: info }]} />
  </>;
}

export function PersonDetail({ userId }: { userId: string }) {
  return <RequireAction action="org:membership:read"><PageShell className="space-y-6"><DetailBody userId={userId} /></PageShell></RequireAction>;
}
