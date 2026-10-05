import {createTranslator} from "next-intl";
import viMessages from "@/messages/vi.json";
import enMessages from "@/messages/en.json";

export function getTranslations(namespace: "employeeAuth", locale: "vi" | "en" = "vi") {
  return createTranslator({locale, messages: locale === "en" ? enMessages : viMessages, namespace});
}

import type {ReactNode} from "react";
export function FormAlert({id, children}: {id?: string; children: ReactNode}) {
 return <p id={id} role="alert" className="rounded-[var(--radius-md)] border border-[var(--color-danger)] p-3 text-sm text-[var(--color-danger)]">{children}</p>;
}
