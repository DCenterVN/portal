"use client";
import {useTranslations} from "next-intl";
import {useRef,useState} from "react";
import {requestEmailChange,getAccountProfile,accountErrorMessage} from "@/lib/api/account-client";
import {FetchError} from "@/lib/fetcher";
export function useAccountEmail(){
 const t=useTranslations("accountEdit");
 const [email,setEmail]=useState(""),[password,setPassword]=useState("");
 const [pending,setPending]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState(""),[reauth,setReauth]=useState(false);
 const lock=useRef(false);
 async function submit(){
  if(lock.current || !email.trim() || !password)return;
  lock.current=true;setPending(true);setError("");setSent(false);
  try {await requestEmailChange({new_email:email.trim(),current_password:password});setSent(true);setPassword("");}
  catch(error){
   if(error instanceof FetchError && error.code==="UNAUTHORIZED"){
    try {await getAccountProfile();}catch {setReauth(true);}
   }
   setError(accountErrorMessage(error,key=>t(key)));
  } finally {lock.current=false;setPending(false);}
 }
 return {email,setEmail,password,setPassword,pending,sent,error,reauth,submit};
}
