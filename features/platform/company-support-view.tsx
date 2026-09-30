"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page";
import { Skeleton, EmptyState, ErrorState, InlineAlert } from "@/components/ui/state";
import { TablePager } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { errorText } from "./access";
import { RequireAction, useAccess } from "./access-boundary";
import { AuditLog } from "./audit-view";
import { GrantTable } from "./support-view";
import { DECIDE_CONFLICT, decisionsFor, useCompanySupport, decideCompanyGrant, type SupportGrant } from "./use-company-support";

type Decision = { grant: SupportGrant; kind: "approve" | "revoke" };

function Requests({ root, canDecide }: { root: string; canDecide: boolean }) {
  const [page, setPage] = useState(1);
  const { data, error, isLoading, isValidating, mutate } = useCompanySupport(root, page);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [done, setDone] = useState("");

  async function decide() {
    if (!decision) return;
    setBusy(true);
    setFailure("");
    try {
      await decideCompanyGrant(root, decision.grant.id, decision.kind);
      setDone(decision.kind === "approve" ? "Đã duyệt. Grant có hiệu lực 24 giờ từ bây giờ." : "Đã thu hồi grant.");
      setDecision(null);
    } catch (failed) {
      setFailure(errorText(failed, { 409: DECIDE_CONFLICT, 404: "Grant không thuộc công ty này hoặc không tồn tại." }));
    } finally {
      setBusy(false);
      void mutate();
    }
  }

  if (isLoading) return <Skeleton title="Đang tải yêu cầu hỗ trợ…" />;
  if (error || !data) return <ErrorState title={errorText(error)} onRetry={() => void mutate()} />;
  return (
    <div className="space-y-3">
      {done && <InlineAlert tone="success">{done}</InlineAlert>}
      {data.items.length === 0 ? (
        <EmptyState title={page > 1 ? "Không còn yêu cầu ở trang này." : "Chưa có yêu cầu hỗ trợ nào."} action={page > 1 && <Button variant="outline" size="touch" onClick={() => setPage(page - 1)}>Trang trước</Button>} />
      ) : (
        <div>
          <GrantTable
            grants={data.items}
            who="user"
            actions={
              canDecide
                ? (grant) => (
                    <div className="flex justify-end gap-2">
                      {decisionsFor(grant).map((kind) => (
                        <Button
                          key={kind}
                          size="touch"
                          variant={kind === "approve" ? "default" : "outline"}
                          onClick={() => { setFailure(""); setDone(""); setDecision({ grant, kind }); }}
                        >
                          {kind === "approve" ? "Duyệt" : "Thu hồi"}
                        </Button>
                      ))}
                    </div>
                  )
                : undefined
            }
          />
          <TablePager page={page} hasNext={data.items.length === data.limit} onPage={setPage} busy={isValidating} />
        </div>
      )}
      <ConfirmDialog
        open={Boolean(decision)}
        onOpenChange={(open) => !open && setDecision(null)}
        title={decision?.kind === "approve" ? "Duyệt yêu cầu hỗ trợ?" : "Thu hồi quyền hỗ trợ?"}
        description={
          decision?.kind === "approve"
            ? "Người nền tảng có quyền ngang OWNER trong 24 giờ kể từ lúc duyệt. Mọi thao tác được ghi audit."
            : "Quyền hỗ trợ hết hiệu lực ngay."
        }
        confirmLabel={decision?.kind === "approve" ? "Duyệt 24 giờ" : "Thu hồi"}
        danger={decision?.kind === "revoke"}
        busy={busy}
        onConfirm={() => void decide()}
      >
        {decision && <p className="text-sm">Lý do: {decision.grant.reason}</p>}
        {failure && <InlineAlert className="mt-3">{failure}</InlineAlert>}
      </ConfirmDialog>
    </div>
  );
}

export function CompanySupportView() {
  const { root, can } = useAccess();
  const [tab, setTab] = useState<"requests" | "audit">("requests");
  const tabs = [
    { id: "requests", label: "Yêu cầu hỗ trợ" },
    { id: "audit", label: "Nhật ký công ty" },
  ] as const;
  return (
    <RequireAction action="org:company:read">
      <PageHeader icon={<ShieldCheck />} title="Hỗ trợ từ nền tảng" description="Duyệt hoặc thu hồi quyền hỗ trợ; mọi thao tác của nền tảng trong công ty đều có ở nhật ký." />
      <Tabs label="Hỗ trợ" idPrefix="company-support" items={tabs} value={tab} onChange={setTab}>
        {tab === "requests" ? <Requests root={root} canDecide={can("org:support_access:approve")} /> : <AuditLog source="company" root={root} />}
      </Tabs>
    </RequireAction>
  );
}
