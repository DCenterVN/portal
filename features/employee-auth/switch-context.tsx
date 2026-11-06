"use client";
import { EmptyState, ErrorState } from "@/components/patterns/empty-state";
import {useTranslations} from "next-intl";
import {FetchError} from "@/lib/fetcher";

import {useEffect, useId, useRef, useState} from "react";
import Link from "next/link";
import {useRouter, useSearchParams} from "next/navigation";
import type {Route} from "next";
import {listContexts, switchOrg, switchBranch, type EmployeeContext} from "@/lib/api/employee-auth";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export function SwitchContext({selection}: {selection: "org" | "branch"}) {
 const t = useTranslations("employeeAuth");
 const id=useId();const router=useRouter();const query=useSearchParams();const pending=useRef(false);
 const [rows,setRows]=useState<EmployeeContext[]>([]);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 useEffect(()=> {let active=true;listContexts().then(value=> {if(active) {setRows([...new Map(value.map(row=>[JSON.stringify([row.org_id,row.branch_id]),row])).values()]);setLoading(false);}}).catch(err=>{if(active){setError(t(err instanceof FetchError && err.code === "rate_limit_exceeded" ? "rateLimited" : "contextFailed"));setLoading(false);}});return ()=>{active=false;};},[]);
 const orgs=[...new Set(rows.map(row=>row.org_id))];const orgId=query.get("org_id") ?? (orgs.length===1 ? orgs[0] : "");
 const branches=rows.filter(row=>row.org_id===orgId);
 async function submit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();if(pending.current || loading) return;
  const element=event.currentTarget;const data=new FormData(element);
  const chosenOrg=selection==="org" ? String(data.get("org_id")??"") : orgId;
  const candidates=rows.filter(row=>row.org_id===chosenOrg);
  const chosenBranch=selection==="org" && candidates.length===1 ? candidates[0].branch_id : String(data.get("branch_id")??"");
  if(selection==="org" && candidates.length>1) {router.push(`/staff/switch-branch?org_id=${encodeURIComponent(chosenOrg)}` as Route);return;}
  if(!candidates.some(row=>row.branch_id===chosenBranch)) {setError(t("contextInvalid"));element.querySelector<HTMLSelectElement>("select")?.focus();return;}
  pending.current=true;setBusy(true);setError("");
  try {const result=await (selection==="org" ? switchOrg : switchBranch)(chosenOrg,chosenBranch);router.push(result.next_path as Route);router.refresh();}
  catch(err) {setError(t(err instanceof FetchError && err.code === "rate_limit_exceeded" ? "rateLimited" : "switchFailed"));element.querySelector<HTMLSelectElement>("select")?.focus();}
  finally {pending.current=false;setBusy(false);}
 }
 const options=selection==="org" ? orgs : branches.map(row=>row.branch_id);
 return <form onSubmit={submit} noValidate aria-busy={loading || busy} className="space-y-4">
  {error && <div id={`${id}-error`}><ErrorState title={error} /></div>}
  {!loading && !error && !options.length && <EmptyState title={t("contextInvalid")} action={<a href="/staff/login">{t("login")}</a>} />}
  {loading && <p role="status"> {t("contextPending")} </p>}
  <Label htmlFor={`${id}-context`}>{selection==="org" ? t("company") : t("branch")}</Label>
  <NativeSelect id={`${id}-context`} name={selection==="org" ? "org_id" : "branch_id"} disabled={loading || busy} required aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}>
   <NativeSelectOption value="">{selection==="org" ? t("chooseCompany") : t("chooseBranch")}</NativeSelectOption>{options.map(value=><NativeSelectOption key={value} value={value}>{value}</NativeSelectOption>)}
  </NativeSelect>
  {selection==="branch" && !orgId && !loading && <Link href="/staff/switch-org" className="inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline"> {t("chooseCompanyFirst")} </Link>}
  <Button type="submit" disabled={loading || busy || !options.length} className="w-full">{busy ? t("switchPending") : t("continue")}</Button>
 </form>;
}
