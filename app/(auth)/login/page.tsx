import {redirect} from "next/navigation";
import {authPopupUrl} from "@/features/customer-auth/form-feedback";

export default async function Page({searchParams}: {searchParams: Promise<{redirect?: string}>}) {
  redirect(authPopupUrl("login", (await searchParams).redirect));
}
