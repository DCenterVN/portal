"use client";

import { useContext, type ReactNode } from "react";
import { ErrorState } from "@/components/ui/state";

import { AccessContext, type PlaneAccess } from "@/lib/access-context";

export function AccessProvider({ value, children }: { value: PlaneAccess; children: ReactNode }) {
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const access = useContext(AccessContext);
  return {
    root: access?.root ?? "",
    role: access?.role,
    can: (action: string) => access?.actions.has(action) ?? false,
  };
}

export function RequireAction({ action, children }: { action: string; children: ReactNode }) {
  const { can } = useAccess();
  if (!can(action)) {
    return <ErrorState denied title="Bạn không có quyền mở nội dung này." description={`Cần quyền ${action} do tổ chức cấp.`} />;
  }
  return children;
}
