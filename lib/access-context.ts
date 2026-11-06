"use client";

import { createContext } from "react";

export type AccessScope = { userId: string; orgId: string; branchId: string; branchName: string; roles: string[] };
export type PlaneAccess = { plane: "platform" | "company"; actions: ReadonlySet<string>; root: string; role?: string; scope?: AccessScope };

export const AccessContext = createContext<PlaneAccess | null>(null);
