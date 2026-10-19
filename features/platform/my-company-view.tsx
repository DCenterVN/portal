"use client";

import { KeyRound } from "lucide-react";
import { PageHeader } from "@/components/ui/page";
import { RequireAction, useAccess } from "./access-boundary";
import { RoleMatrix } from "./role-matrix-view";

export function MyCompanyView() {
  const { root } = useAccess();
  return (
    <RequireAction action="org:company:read">
      <PageHeader icon={<KeyRound />} title="Ma trận quyền" description="Xem quyền của từng role." />
      <RoleMatrix root={root} editable={false} />
    </RequireAction>
  );
}
