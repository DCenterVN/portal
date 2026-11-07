"use client";

import { useRef, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import type { UserProfile } from "@/lib/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { useAccountAvatar } from "./use-account-avatar";

type AvatarEditorProps = { profile: UserProfile; refresh: () => Promise<void>; editable?: boolean };

export function AvatarEditor({ profile, refresh, editable = true }: AvatarEditorProps) {
  const t = useTranslations("account");
  const input = useRef<HTMLInputElement>(null);
  const avatar = useAccountAvatar(saved);
  async function saved() { toast.success(t("avatarSaved")); await refresh(); }
  function chooseFile() { input.current?.click(); }
  function changeFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    void avatar.selectFile(file);
  }
  function askRemove() { avatar.setRemoving(true); }
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-4">
      <Avatar className="size-16">
        <AvatarImage src={avatar.preview || profile.avatar_url || undefined} alt={t("avatar")} />
        <AvatarFallback>{profile.display_name.trim().charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      {editable && <>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={t("avatar")} onChange={changeFile} disabled={avatar.busy} />
        <Button variant="outline" size="sm" onClick={chooseFile} disabled={avatar.busy}>{t(avatar.busy ? "uploading" : "changeAvatar")}</Button>
        {profile.avatar_url && <Button variant="ghost" size="sm" onClick={askRemove} disabled={avatar.busy}>{t("removeAvatar")}</Button>}
      </>}
    </div>
    <p className="text-xs text-muted-foreground">{t("avatarHint")}</p>
    {avatar.error && <p className="text-sm text-destructive">{avatar.error}</p>}
    <ConfirmDialog open={avatar.removing} onOpenChange={avatar.setRemoving} title={t("removeAvatar")} description={t("removeAvatarHint")} confirmLabel={t("removeAvatar")} danger busy={avatar.busy} onConfirm={avatar.remove} />
  </div>;
}
