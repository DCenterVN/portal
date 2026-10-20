"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, TextInput, Checkbox } from "@/components/ui/field";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageShell, PageHeader } from "@/components/ui/page";
import { EmptyState, ErrorState, InlineAlert } from "@/components/ui/state";
import { useToast } from "@/components/ui/toast";
import { useAccess } from "@/features/platform/access-boundary";
import { errorStatus } from "@/features/platform/access";
import { companyMemberships, createMembership, employeeRoles, replaceMembershipRoles, updateMembershipStatus, type Membership } from "@/lib/api/platform-client";

type Editor = { kind: "create" } | { kind: "roles"; member: Membership };

export function MembershipsView() {
  const t = useTranslations("memberships");
  const { can } = useAccess();
  const { toast } = useToast();
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

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editor || busy) return;
    if (!can(editor.kind === "create" ? "org:employee:create" : "org:membership:update")) return;
    setBusy(true);
    setFailure("");
    try {
      if (editor.kind === "create") await createMembership({ email: email.trim(), display_name: name.trim(), role_codes: roles });
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
      <PageHeader title={t("title")} description={t("description")} actions={add} />
      {failure && !editor && <InlineAlert>{failure}</InlineAlert>}
      <div className="overflow-x-auto rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("user")}</TableHead><TableHead>{t("roles")}</TableHead>
            <TableHead>{t("status")}</TableHead><TableHead>{t("actions")}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={4}>
              <div role="status" aria-label={t("loading")} className="space-y-4 py-4 motion-safe:animate-pulse">
                {[1, 2, 3].map((row) => <div key={row} className="h-11 rounded-lg bg-[var(--color-tint)]" />)}
              </div>
            </TableCell></TableRow> : error ? <TableRow><TableCell colSpan={4}>
              <ErrorState title={t("requestError")} action={<Button variant="outline" onClick={() => void mutate()}>{t("retry")}</Button>} />
            </TableCell></TableRow> : data?.items.length === 0 ? <TableRow><TableCell colSpan={4}>
              <EmptyState title={t("empty")} description={t("emptyHint")} action={add} />
            </TableCell></TableRow> : data?.items.map((member) => <TableRow key={member.id}>
              <TableCell><span className="font-mono text-xs">{member.user_id}</span></TableCell>
              <TableCell>{member.role_codes.map((role) => <Badge key={role} variant="secondary">{t(`roleLabels.${role}`)}</Badge>)}</TableCell>
              <TableCell><Badge variant={member.status === "ACTIVE" ? "active" : "suspended"}>{t(member.status)}</Badge></TableCell>
              <TableCell>{can("org:membership:update") && <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={busy} onClick={() => openEditor({ kind: "roles", member })}>{t("editRoles")}</Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => void changeStatus(member)}>{t(member.status === "ACTIVE" ? "suspend" : "activate")}</Button>
              </div>}</TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" disabled={page === 1 || isLoading || busy} onClick={() => setPage(page - 1)}>{t("previous")}</Button>
        <span>{t("page", { page })}</span>
        <Button variant="outline" disabled={!data || data.items.length < data.limit || isLoading || busy} onClick={() => setPage(page + 1)}>{t("next")}</Button>
      </div>
      <Dialog open={editor !== null} onOpenChange={(open) => { if (!open && !busy) setEditor(null); }}>
        <DialogContent variant="sheet" showClose={false} className="md:fixed md:inset-y-0 md:right-0 md:max-w-md md:rounded-none overflow-y-auto">
          <DialogHeader><DialogTitle>{t(editor?.kind === "roles" ? "editRoles" : "add")}</DialogTitle>
            <DialogDescription>{t(editor?.kind === "roles" ? "rolesHint" : "inviteHint")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void save(event)} className="space-y-4">
            {editor?.kind === "create" && <>
              <Field label={t("name")} htmlFor="member-name"><TextInput id="member-name" value={name} onChange={(event) => setName(event.target.value)} required disabled={busy} autoFocus /></Field>
              <Field label={t("email")} htmlFor="member-email"><TextInput id="member-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={busy} /></Field>
            </>}
            <fieldset disabled={busy} className="space-y-2"><legend className="mb-2 text-sm font-medium">{t("roles")}</legend>
              {employeeRoles.map((role) => <Checkbox key={role} label={t(`roleLabels.${role}`)} checked={roles.includes(role)} onChange={(event) => setRoles(event.target.checked ? [...roles, role] : roles.filter((value) => value !== role))} />)}
            </fieldset>
            {failure && <InlineAlert>{failure}</InlineAlert>}
            {editor?.kind === "create" && (!name.trim() || !email.trim() || roles.length === 0) && <p className="text-sm text-[var(--color-muted)]">{t("required")}</p>}
            <DialogFooter className="sticky bottom-0 flex-col sm:flex-col sm:space-x-0 bg-[var(--color-surface)]">
              <Button variant="outline" type="button" disabled={busy} onClick={() => setEditor(null)}>{t("cancel")}</Button>
              <Button type="submit" disabled={busy || (editor?.kind === "create" && (!name.trim() || !email.trim() || roles.length === 0))}>{t(busy ? "saving" : "save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
