import {createTranslator} from "next-intl";
import viMessages from "@/messages/vi.json";
import enMessages from "@/messages/en.json";

export function getTranslations(namespace: "employeeAuth", locale: "vi" | "en" = "vi") {
  return createTranslator({locale, messages: locale === "en" ? enMessages : viMessages, namespace});
}

import type {ReactNode} from "react";
import {InlineAlert} from "@/components/patterns/inline-alert";
export function FormAlert({id, children}: {id?: string; children: ReactNode}) {
 return <InlineAlert id={id}>{children}</InlineAlert>;
}
