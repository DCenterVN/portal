"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { AssignmentRow } from "./assignment-row";
import { useAssignmentEditor, type AssignmentEditorProps } from "./use-assignment-editor";

export function AssignmentPanel(props: AssignmentEditorProps) {
  const t = useTranslations("record");
  const { branches, viewerIsAdmin, isSelf, canCreate } = props;
  const { rows, setRows, allBranches, setAllBranches, errors, busy, catalog, readOnly, changes, incomplete, taken, open, patch, addRow, save, reset } = useAssignmentEditor(props);
  const { person } = props;
  return <div className="space-y-6">
        <div className="space-y-4">
          {isSelf && <InlineAlert tone="info">{t("selfAssignment")}</InlineAlert>}
          {catalog.error && <InlineAlert>{t("catalogError")} <Button type="button" variant="outline" size="sm" onClick={() => void catalog.mutate()}>{t("retry")}</Button></InlineAlert>}
          <ul className="space-y-3">
            {rows.map((row) => (
              <AssignmentRow
                key={row.key}
                row={row}
                branch={branches.find((branch) => branch.id === row.branchId)}
                freeBranches={open.filter((branch) => !taken.has(branch.id))}
                catalog={catalog.data}
                viewerIsAdmin={viewerIsAdmin}
                readOnly={readOnly}
                error={errors[row.branchId]}
                onChange={(next) => patch(row.key, next)}
                onRemove={() => setRows((current) => current.filter((item) => item.key !== row.key))}
              />
            ))}
          </ul>
          {!readOnly && canCreate && <Button type="button" variant="outline" onClick={addRow}><Plus className="size-4" />{t("addBranch")}</Button>}
          {viewerIsAdmin && (
            <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
              <Switch checked={allBranches} disabled={readOnly || !person.flagMembershipId} onCheckedChange={setAllBranches} />
              <span>
                <span className="block font-medium">{t("allBranchesView")}</span>
                <span className="block text-muted-foreground">{t("allBranchesHint")}</span>
              </span>
            </label>
          )}
        </div>
        {changes.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
            <p className="text-sm font-medium">{t("unsaved", { count: changes.length })}{incomplete && <span className="block text-xs font-normal text-muted-foreground">{t("incomplete")}</span>}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={reset}>{t("cancel")}</Button>
              <Button type="button" disabled={busy || incomplete} onClick={() => void save()}>{t(busy ? "saving" : "save")}</Button>
            </div>
          </div>
        )}
  </div>;
}
