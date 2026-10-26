import {cookies} from "next/headers";
import {NextIntlClientProvider} from "next-intl";
import viMessages from "@/messages/vi.json";
import enMessages from "@/messages/en.json";
import {EmailConfirmContainer} from "@/features/account-edit/email-confirm-container";
export const dynamic="force-dynamic";
export const metadata={referrer:"no-referrer"};
export default async function EmailConfirmPage(){
 const locale=(await cookies()).get("NEXT_LOCALE")?.value==="en" ? "en" : "vi";
 const messages=locale==="en" ? enMessages : viMessages;
 return <NextIntlClientProvider locale={locale} messages={{accountEdit:messages.accountEdit}} timeZone="Asia/Ho_Chi_Minh"><EmailConfirmContainer/></NextIntlClientProvider>;
}
