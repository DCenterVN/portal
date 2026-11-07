"use client";

import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/vi.json";
import { CustomerAccount } from "@/features/account/customer/customer-account";

export default function ProfileClient({ tab }: { tab?: string }) {
  return <NextIntlClientProvider locale="vi" messages={{ account: messages.account }} timeZone="Asia/Ho_Chi_Minh"><CustomerAccount tab={tab} /></NextIntlClientProvider>;
}
