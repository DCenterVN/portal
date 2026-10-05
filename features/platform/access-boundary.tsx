"use client";

import { createContext, useContext, type ReactNode } from "react";
import { ErrorState } from "@/components/ui/state";

export type PlaneAccess = { plane: "platform" | "company"; actions: ReadonlySet<string>; root: string; role?: string };

const AccessContext = createContext<PlaneAccess | null>(null);

export function AccessProvider({ value, children }: { value: PlaneAccess; children: ReactNode }) {
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

// ponytail: no provider = no verified access, so every check is false (fail closed).
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
