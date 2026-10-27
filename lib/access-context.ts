"use client";

import { createContext } from "react";

export type PlaneAccess = { plane: "platform" | "company"; actions: ReadonlySet<string>; root: string; role?: string };

export const AccessContext = createContext<PlaneAccess | null>(null);
