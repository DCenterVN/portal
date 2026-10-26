"use client";
import {useTranslations} from "next-intl";
import {useEffect,useRef,useState} from "react";
import useSWR, {useSWRConfig} from "swr";
import {ACCOUNT_PROFILE_KEY, getAccountProfile, updateProfile, changePassword, accountErrorMessage} from "@/lib/api/account-client";
import {FetchError} from "@/lib/fetcher";
export function validateName(value: string): string {
 const name=value.normalize("NFC").trim();
 return !name || [...name].length>50 || /\p{Cc}/u.test(value) ? "invalidName" : "";
}
export function validatePassword(current: string,next: string,confirmation: string): string {
 if(!current) return "currentRequired";
 if([...next].length<12 || new TextEncoder().encode(next).length>256) return "invalidPassword";
 if(current===next) return "passwordSame";
 return next!==confirmation ? "passwordMismatch" : "";
}
export function useAccountEdit(loginPath: string) {
 const t=useTranslations("accountEdit");
 const profile=useSWR(ACCOUNT_PROFILE_KEY,getAccountProfile,{revalidateOnFocus:false});
 const {mutate}=useSWRConfig();
 const [name,setName]=useState("");
 const [password,setPassword]=useState({current:"",next:"",confirmation:""});
 const [pending,setPending]=useState<"name"|"password"|null>(null);
 const [nameError,setNameError]=useState("");
 const [passwordError,setPasswordError]=useState("");
 const [notice,setNotice]=useState("");
 const [reauth,setReauth]=useState(false);
 const lock=useRef(false);
 useEffect(()=>{if(profile.data) setName(profile.data.display_name);},[profile.data?.display_name]);
 async function saveName() {
  if(lock.current) return;
  const invalid=validateName(name); setNameError(invalid ? t(invalid) : ""); if(invalid) return;
  lock.current=true; setPending("name");setNotice("");
  try {await updateProfile({display_name:name.normalize("NFC").trim()}); await profile.mutate(); setNotice(t("nameSaved"));}
  catch(error) {setNameError(accountErrorMessage(error,key=>t(key)));}
  finally {lock.current=false;setPending(null);}
 }
 async function savePassword() {
  if(lock.current) return;
  const invalid=validatePassword(password.current,password.next,password.confirmation);setPasswordError(invalid ? t(invalid) : "");if(invalid) return;
  lock.current=true;setPending("password");setNotice("");
  try {
   await changePassword({current_password:password.current,new_password:password.next});
   setPassword({current:"",next:"",confirmation:""});setReauth(true);
   await mutate(ACCOUNT_PROFILE_KEY,undefined,{revalidate:false});
  } catch(error) {
   if(error instanceof FetchError && error.code==="UNAUTHORIZED") {
    try {await getAccountProfile();} catch {setReauth(true);}
   }
   setPasswordError(accountErrorMessage(error,key=>t(key)));
  } finally {lock.current=false;setPending(null);}
 }
 return {profile,name,setName,password,setPassword,pending,nameError,passwordError,notice,reauth,loginPath,saveName,savePassword};
}
