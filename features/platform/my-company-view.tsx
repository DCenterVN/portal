"use client";

import { useState } from "react";
import { Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page";
import { InlineAlert } from "@/components/ui/state";
import { errorText } from "./access";
import { RequireAction, useAccess } from "./access-boundary";
import { CompanyModules } from "./company-modules";
import { RoleMatrix } from "./role-matrix-view";
import { consentText, saveConsent, type Consent } from "./use-my-company";

function ConsentCard({ root }: { root: string }) {
  const [value, setValue] = useState<Consent>(null);
  const [next, setNext] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");

  async function confirm() {
    if (next === null) return;
    setBusy(true);
    setFailure("");
    try {
      setValue(await saveConsent(root, next));
      setNext(null);
    } catch (failed) {
      setFailure(errorText(failed));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đồng ý hỗ trợ thường trực</CardTitle>
        <CardDescription>Bật: yêu cầu hỗ trợ của nền tảng có hiệu lực ngay 24 giờ, không cần bạn duyệt từng lần.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">
          Trạng thái: <strong>{consentText(value)}</strong>
        </p>
        {value === null && <p className="text-xs text-[var(--muted-foreground)]">Tổ chức chưa cung cấp API đọc giá trị này; chỉ hiện giá trị bạn vừa lưu.</p>}
        <div className="flex flex-wrap gap-2">
          <Button size="touch" variant={value === true ? "secondary" : "default"} onClick={() => setNext(true)}>
            Bật
          </Button>
          <Button size="touch" variant="outline" onClick={() => setNext(false)}>
            Tắt
          </Button>
        </div>
        {failure && next === null && <InlineAlert>{failure}</InlineAlert>}
      </CardContent>
      <ConfirmDialog
        open={next !== null}
        onOpenChange={(open) => !open && setNext(null)}
        title={next ? "Bật đồng ý hỗ trợ thường trực?" : "Tắt đồng ý hỗ trợ thường trực?"}
        description={next ? "Nền tảng sẽ có quyền ngang OWNER 24 giờ mỗi lần xin hỗ trợ, không cần bạn duyệt." : "Mỗi yêu cầu hỗ trợ sau này phải chờ bạn duyệt."}
        confirmLabel={next ? "Bật" : "Tắt"}
        danger={next === true}
        busy={busy}
        onConfirm={() => void confirm()}
      >
        {failure && <InlineAlert>{failure}</InlineAlert>}
      </ConfirmDialog>
    </Card>
  );
}

export function MyCompanyView() {
  const { root, can } = useAccess();
  return (
    <RequireAction action="org:company:read">
      <PageHeader icon={<Building />} title="Công ty của tôi" description="Module và ma trận quyền do nền tảng quản lý theo hợp đồng. Ở đây chỉ xem." />
      {can("org:support_access:approve") && <ConsentCard root={root} />}
      <section aria-labelledby="my-modules" className="space-y-3">
        <h2 id="my-modules" className="text-sm font-semibold">
          Module
        </h2>
        <CompanyModules source="company" root={root} editable={false} />
      </section>
      <section aria-labelledby="my-matrix" className="space-y-3">
        <h2 id="my-matrix" className="text-sm font-semibold">
          Ma trận quyền
        </h2>
        <RoleMatrix source="company" root={root} editable={false} />
      </section>
    </RequireAction>
  );
}
