"use client";
import React from "react";
import {Button} from "@/components/ui/button";
import {Skeleton,EmptyState,ErrorState} from "@/components/ui/state";
import {useEmailConfirm} from "./use-email-confirm";
export function EmailConfirmContainer(){
 const model=useEmailConfirm();
 const t=model.t;
 if(model.state==="loading")return <Skeleton title={t("loading")}/>;
 if(model.state==="empty")return <EmptyState title={t("confirmEmpty")}/>;
 if(model.state==="done")return <div role="status"><p>{t("emailConfirmed")}</p><a href="/login">{t("customerLogin")}</a><a href="/staff/login">{t("staffLogin")}</a></div>;
 if(model.state==="login")return <div><p>{t("confirmLoginHint")}</p><a href="/login" target="_blank" rel="noreferrer">{t("customerLogin")}</a><a href="/staff/login" target="_blank" rel="noreferrer">{t("staffLogin")}</a><Button onClick={()=>void model.checkSession()}>{t("retry")}</Button></div>;
 if(model.state==="error")return <ErrorState title={model.error} onRetry={()=>void model.checkSession()}/>;
 return <div aria-busy={model.state==="pending"}><h1>{t("confirmEmail")}</h1><p>{t("confirmHint")}</p><Button disabled={model.state==="pending"} onClick={()=>void model.confirm()}>{model.state==="pending" ? t("saving") : t("confirmEmail")}</Button></div>;
}
