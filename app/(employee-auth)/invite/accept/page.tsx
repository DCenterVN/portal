import {redirect} from "next/navigation";
import type {Route} from "next";
export default async function Page({searchParams}: {searchParams: Promise<{token?: string | string[]}>}) {
 const {token}=await searchParams;
 const query=typeof token==="string" && token ? `?${new URLSearchParams({token})}` : "";
 redirect(`/staff/invite/accept${query}` as Route);
}
