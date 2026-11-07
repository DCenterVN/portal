"use client";

import { formatDateTime } from "@/lib/format-date";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { accountErrorMessage, type AccountSession } from "@/lib/api/account-client";
import { useAccountSessions, sessionDevice } from "./use-account-sessions";

type SessionsCardProps = { userId: string; loginPath: string };

export function SessionsCard({ userId, loginPath }: SessionsCardProps) {
  const t = useTranslations("account");
  const sessions = useAccountSessions(userId, loginPath);
  function row(session: AccountSession) {
    function select() { sessions.setSelected(session); }
    return <div key={session.id} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
      <div className="min-w-0"><p className="break-words text-sm">{sessionDevice(session.user_agent) || t("unknownDevice")}</p><p className="text-xs text-muted-foreground">{session.ip_address || "—"}</p></div>
      <p className="text-sm tabular-nums text-muted-foreground">{formatDateTime(session.created_at)}</p>
      <Button variant="ghost" size="sm" onClick={select} disabled={sessions.action.busy}>{t("logout")}</Button>
    </div>;
  }
  return (
    <div className="space-y-4">
        {sessions.isLoading ? <LoadingState title={t("loadingSessions")} /> : sessions.error ? <ErrorState title={accountErrorMessage(sessions.error, t)} onRetry={sessions.mutate} /> : !sessions.data?.items.length ? <EmptyState title={t("noSessions")} /> : (
          <div className="divide-y"><div className="hidden grid-cols-[minmax(0,1fr)_auto_auto] gap-2 py-2 text-xs text-muted-foreground sm:grid"><span>{t("device")}</span><span>{t("signedInAt")}</span><span className="sr-only">{t("actions")}</span></div>{sessions.data.items.map(row)}</div>
        )}
        {sessions.action.error && <InlineAlert>{sessions.action.error}</InlineAlert>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" onClick={sessions.askAll} disabled={sessions.action.busy}>{t("logoutAll")}</Button>
          {sessions.data && sessions.data.pagination.total_pages > 1 && <div className="flex items-center gap-2"><Button variant="outline" onClick={sessions.previous} disabled={sessions.page === 1}>{t("previous")}</Button><span className="text-sm tabular-nums">{sessions.page} / {sessions.data.pagination.total_pages}</span><Button variant="outline" onClick={sessions.next} disabled={sessions.page >= sessions.data.pagination.total_pages}>{t("next")}</Button></div>}
        </div>
      <ConfirmDialog open={sessions.selected !== null} onOpenChange={sessions.close} title={t(sessions.selected === "all" ? "logoutAll" : "logoutDevice")} description={t("logoutHint")} confirmLabel={t("logout")} danger busy={sessions.action.busy} onConfirm={sessions.confirm}>{sessions.action.error && <InlineAlert>{sessions.action.error}</InlineAlert>}</ConfirmDialog>
    </div>
  );
}
