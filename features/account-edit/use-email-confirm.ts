"use client";
import {useEffect,useRef,useState} from "react";
import {useSWRConfig} from "swr";
import {useTranslations} from "next-intl";
import {ACCOUNT_PROFILE_KEY,getAccountProfile,confirmEmailChange,accountErrorMessage} from "@/lib/api/account-client";
export type ConfirmState="loading"|"empty"|"login"|"ready"|"pending"|"error"|"done";
export function useEmailConfirm(){
 const t=useTranslations("accountEdit");
 const [state,setState]=useState<ConfirmState>("loading"),[error,setError]=useState("");
 const token=useRef(""),captured=useRef(false),lock=useRef(false);
 const {mutate}=useSWRConfig();
 async function checkSession(){
  if(!token.current)return;
  try {await getAccountProfile();setState("ready");}catch {setState("login");}
 }
 useEffect(()=>{
  if(captured.current)return;captured.current=true;
  const url=new URL(window.location.href);
  token.current=url.searchParams.get("token") || new URLSearchParams(url.hash.slice(1)).get("token") || "";
  window.history.replaceState(null,"",window.location.pathname);
  if(!token.current){setState("empty");return;}
  void checkSession();
 },[]);
 async function confirm(){
  if(lock.current || !token.current || state!=="ready")return;
  lock.current=true;setState("pending");setError("");
  try {await confirmEmailChange({token:token.current});token.current="";await mutate(ACCOUNT_PROFILE_KEY,undefined,{revalidate:false});setState("done");}
  catch(error){setError(accountErrorMessage(error,key=>t(key)));setState("error");}
  finally {lock.current=false;}
 }
 return {state,error,confirm,checkSession,t};
}
