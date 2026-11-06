"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Field, Checkbox } from "@/components/patterns/form-field";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { EmptyState, ErrorState } from "@/components/patterns/empty-state";
import { TablePager } from "@/components/patterns/table-pager";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { toast } from "@/components/ui/toast";
import { useAccess } from "@/lib/access-boundary";
import { errorStatus } from "@/features/platform/access";
import { companyMemberships, createMembership, employeeRoles, replaceMembershipRoles, updateMembershipStatus, type Membership } from "@/lib/api/platform-client";

type Editor = { kind: "create" } | { kind: "roles"; member: Membership };

export function MembershipsView() {
  const t = useTranslations("memberships");
  const { can } = useAccess();
  const [page, setPage] = useState(1);
  const { data, error, isLoading, mutate } = useSWR(can("org:membership:read") ? ["company-memberships", page] : null, () => companyMemberships(page));
  const [editor, setEditor] = useState<Editor | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [roles, setRoles] = useState<string[]>(["SALES"]);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");

  const openEditor = (next: Editor) => {
    setFailure("");
    setName("");
    setEmail("");
    setRoles(next.kind === "roles" ? next.member.role_codes : ["SALES"]);
    setEditor(next);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor || busy) return;
    if (!can(editor.kind === "create" ? "org:employee:create" : "org:membership:update")) return;
    setBusy(true);
    setFailure("");
    try {
      if (editor.kind === "create") {
        const form = event.currentTarget;
        const input = { email: email.trim(), display_name: name.trim(), password: String(new FormData(form).get("password") ?? ""), role_codes: roles };
        const pending = createMembership(input);
        input.password = "";
        form.reset();
        await pending;
      }
      else await replaceMembershipRoles(editor.member.id, roles);
      await mutate();
      setEditor(null);
      toast.success(t("saved"));
    } catch (error) {
      setFailure(t(errorStatus(error) === 409 ? editor.kind === "create" ? "duplicate" : "lastAdmin" : "requestError"));
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (member: Membership) => {
    if (busy || !can("org:membership:update")) return;
    setBusy(true);
    setFailure("");
    try {
      await updateMembershipStatus(member.id, member.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE");
      await mutate();
      toast.success(t("saved"));
    } catch (error) {
      setFailure(t(errorStatus(error) === 409 ? "lastAdmin" : "requestError"));
    } finally {
      setBusy(false);
    }
  };

  if (!can("org:membership:read")) return <ErrorState denied title={t("denied")} />;
  const add = can("org:employee:create") ? <Button disabled={busy} onClick={() => openEditor({ kind: "create" })}>{t("add")}</Button> : undefined;

  return (
    <PageShell>
      <PageHeading title={t("title")} description={t("description")} actions={add} />
      {failure && !editor && <InlineAlert>{failure}</InlineAlert>}
      <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("roles")}</TableHead>
            <TableHead>{t("status")}</TableHead><TableHead>{t("actions")}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={3}>
              <div role="status" aria-label={t("loading")} className="space-y-4 py-4 motion-safe:animate-pulse">
                {[1, 2, 3].map((row) => <div key={row} className="h-11 rounded-lg bg-[var(--color-tint)]" />)}
              </div>
            </TableCell></TableRow> : error ? <TableRow><TableCell colSpan={3}>
              <ErrorState title={t("requestError")} action={<Button variant="outline" onClick={() => void mutate()}>{t("retry")}</Button>} />
            </TableCell></TableRow> : data?.items.length === 0 ? <TableRow><TableCell colSpan={3}>
              <EmptyState title={t("empty")} description={t("emptyHint")} action={add} />
            </TableCell></TableRow> : data?.items.map((member) => <TableRow key={member.id}>

              <TableCell>{member.role_codes.map((role) => <Badge key={role} variant="secondary">{t(`roleLabels.${role}`)}</Badge>)}</TableCell>
              <TableCell><StatusBadge tone={member.status === "ACTIVE" ? "success" : "warning"}>{t(member.status)}</StatusBadge></TableCell>
              <TableCell>{can("org:membership:update") && <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={busy} onClick={() => openEditor({ kind: "roles", member })}>{t("editRoles")}</Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => void changeStatus(member)}>{t(member.status === "ACTIVE" ? "suspend" : "activate")}</Button>
              </div>}</TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
      </div>
      <TablePager busy={isLoading || busy} previousLabel={t("previous")} nextLabel={t("next")} status={t("page", { page })} hasPrevious={page > 1} onPrevious={() => setPage(page - 1)} hasNext={!!data && data.items.length >= data.limit} onNext={() => setPage(page + 1)} />
      <Sheet open={editor !== null} onOpenChange={(open) => { if (!open && !busy) setEditor(null); }}>
        <SheetContent showCloseButton={false} className="overflow-y-auto sm:max-w-md">
          <SheetHeader><SheetTitle>{t(editor?.kind === "roles" ? "editRoles" : "add")}</SheetTitle>
            <SheetDescription>{t(editor?.kind === "roles" ? "rolesHint" : "createHint")}</SheetDescription>
          </SheetHeader>
          <form onSubmit={(event) => void save(event)} className="space-y-4 px-4">
            {editor?.kind === "create" && <>
              <Field label={t("name")} htmlFor="member-name"><Input id="member-name" value={name} onChange={(event) => setName(event.target.value)} required disabled={busy} autoFocus /></Field>
              <Field label={t("email")} htmlFor="member-email"><Input id="member-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={busy} /></Field>
              <Field label={t("password")} htmlFor="member-password"><Input id="member-password" name="password" type="password" autoComplete="new-password" required disabled={busy} /></Field>
            </>}
            <fieldset disabled={busy} className="space-y-2"><legend className="mb-2 text-sm font-medium">{t("roles")}</legend>
              {employeeRoles.map((role) => <Checkbox key={role} label={t(`roleLabels.${role}`)} checked={roles.includes(role)} onChange={(event) => setRoles(event.target.checked ? [...roles, role] : roles.filter((value) => value !== role))} />)}
            </fieldset>
            {failure && <InlineAlert>{failure}</InlineAlert>}
            {editor?.kind === "create" && (!name.trim() || !email.trim() || roles.length === 0) && <p className="text-sm text-[var(--color-muted)]">{t("required")}</p>}
            <SheetFooter className="sticky bottom-0 bg-[var(--color-surface)] px-0">
              <Button variant="outline" type="button" disabled={busy} onClick={() => setEditor(null)}>{t("cancel")}</Button>
              <Button type="submit" disabled={busy || (editor?.kind === "create" && (!name.trim() || !email.trim() || roles.length === 0))}>{t(busy ? "saving" : "save")}</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}
