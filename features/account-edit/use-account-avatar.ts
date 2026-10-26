"use client";
import {useEffect,useRef,useState} from "react";
import {useTranslations} from "next-intl";
import {validateAvatar,uploadAvatar} from "@/lib/api/account-avatar";
import {presignAvatar,finalizeAvatar,deleteAvatar,accountErrorMessage} from "@/lib/api/account-client";
export function useAccountAvatar(refresh: ()=>Promise<unknown>) {
 const t=useTranslations("accountEdit");
 const [preview,setPreview]=useState("");
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");
 const file=useRef<File|null>(null),url=useRef(""),lock=useRef(false),generation=useRef(0);
 function release(){if(url.current)URL.revokeObjectURL(url.current);url.current="";file.current=null;}
 useEffect(()=>()=>{generation.current++;release();},[]);
 function cancel(){if(lock.current)return;generation.current++;release();setPreview("");setError("");}
 async function select(next?: File){
  if(lock.current)return;
  cancel();if(!next)return;
  const selected=++generation.current;
  try {await validateAvatar(next);if(selected!==generation.current)return;file.current=next;url.current=URL.createObjectURL(next);setPreview(url.current);}
  catch {if(selected===generation.current)setError(t("invalidAvatar"));}
 }
 async function save(){
  if(lock.current || !file.current)return;
  lock.current=true;setPending(true);setError("");let finalizing=false;
  try {
   const image=file.current;
   const grant=await presignAvatar({file_name:image.name,content_type:image.type,file_size:image.size});
   await uploadAvatar(image,grant);finalizing=true;
   await finalizeAvatar({upload_id:grant.upload_id});await refresh();
   release();setPreview("");
  } catch(error){if(finalizing)await refresh().catch(()=>{});setError(accountErrorMessage(error,key=>t(key)));}
  finally {lock.current=false;setPending(false);}
 }
 async function remove(){
  if(lock.current)return;lock.current=true;setPending(true);setError("");
  try {await deleteAvatar();await refresh();release();setPreview("");}
  catch(error){setError(accountErrorMessage(error,key=>t(key)));}
  finally {lock.current=false;setPending(false);}
 }
 return {preview,pending,error,select,cancel,save,remove};
}
