"use client";

import { PageHeading } from "@/components/patterns/page-heading";
import { RequireAction, useAccess } from "@/lib/access-boundary";
import { RoleMatrix } from "./role-matrix-view";

export function MyCompanyView() {
  const { root } = useAccess();
  return (
    <RequireAction action="org:company:read">
      <PageHeading title="Ma trận quyền" description="Xem quyền của từng role." />
      <RoleMatrix root={root} editable={false} />
    </RequireAction>
  );
}
