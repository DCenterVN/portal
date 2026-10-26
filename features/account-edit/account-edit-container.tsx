"use client";
import React from "react";
import {NextIntlClientProvider} from "next-intl";
import viMessages from "@/messages/vi.json";
import enMessages from "@/messages/en.json";
import {useTranslations} from "next-intl";
import {EmailForm} from "@/components/patterns/account/email-form";
import {useAccountEmail} from "./use-account-email";
import {AvatarForm} from "@/components/patterns/account/avatar-form";
import {useAccountAvatar} from "./use-account-avatar";
import {NameForm} from "@/components/patterns/account/name-form";
import {PasswordForm} from "@/components/patterns/account/password-form";
import {Skeleton,EmptyState,ErrorState} from "@/components/ui/state";
import {useAccountEdit} from "./use-account-edit";
export interface AccountEditContainerProps {loginPath?: string; section?: "general"|"security"|"all"}
function AccountEditContent({loginPath="/login",section="all"}: AccountEditContainerProps) {
 const t=useTranslations("accountEdit");
 const model=useAccountEdit(loginPath);
 const email=useAccountEmail();
 const avatar=useAccountAvatar(()=>model.profile.mutate());
 if(model.reauth || email.reauth) return <div role="status"><p>{t("reauth")}</p><a href={loginPath}>{t("reauth")}</a></div>;
 if(model.profile.isLoading) return <Skeleton title={t("loading")}/>;
 if(model.profile.error) return <ErrorState title={t("loadError")} onRetry={()=>void model.profile.mutate()}/>;
 if(!model.profile.data) return <EmptyState title={t("empty")}/>;
 return <div className="space-y-6">
  {section!=="security" && <AvatarForm current={model.profile.data.avatar_url} {...avatar} onSelect={file=>void avatar.select(file)} onSave={()=>void avatar.save()} onCancel={avatar.cancel} onDelete={()=>void avatar.remove()}/>}
  {section!=="security" && <NameForm value={model.name} onChange={model.setName} onSubmit={()=>void model.saveName()} pending={model.pending!==null} error={model.nameError} success={model.notice}/>}
  {section!=="general" && <EmailForm current={model.profile.data.email} {...email} onEmail={email.setEmail} onPassword={email.setPassword} onSubmit={()=>void email.submit()}/>}
  {section!=="general" && <PasswordForm {...model.password} onChange={(field,value)=>model.setPassword(previous=>({...previous,[field]:value}))} onSubmit={()=>void model.savePassword()} pending={model.pending!==null} error={model.passwordError}/>}
 </div>;
}

export function AccountEditContainer(props:AccountEditContainerProps){
 const locale=React.useSyncExternalStore(()=>()=>{},()=>/(?:^|;\s*)NEXT_LOCALE=en(?:;|$)/.test(document.cookie) ? "en" : "vi",()=>"vi");
 const messages=locale==="en" ? enMessages : viMessages;
 return <NextIntlClientProvider locale={locale} messages={{accountEdit:messages.accountEdit}} timeZone="Asia/Ho_Chi_Minh"><AccountEditContent {...props}/></NextIntlClientProvider>;
}
