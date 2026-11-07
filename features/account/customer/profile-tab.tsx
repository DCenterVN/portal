"use client";

import { useTranslations } from "next-intl";
import type { UserProfile } from "@/lib/auth/client";
import { AccountSection } from "../account-section";
import { AvatarEditor } from "../avatar-editor";
import { NameForm } from "../name-form";
import { PhoneSetting } from "../phone-setting";
import { EmailSetting } from "./email-setting";

type ProfileTabProps = { profile: UserProfile; refresh: () => Promise<void> };

export function ProfileTab({ profile, refresh }: ProfileTabProps) {
  const t = useTranslations("account");
  return <div className="space-y-10">
    <AccountSection title={t("avatar")} description={t("avatarDescription")}><AvatarEditor profile={profile} refresh={refresh} /></AccountSection>
    <AccountSection title={t("displayName")} description={t("nameHint")}><NameForm profile={profile} refresh={refresh} /></AccountSection>
    <AccountSection title={t("phone")} description={t("phoneHint")}><PhoneSetting phone={profile.phone} refresh={refresh} /></AccountSection>
    <AccountSection title={t("email")} description={t("emailHint")}><EmailSetting email={profile.email} /></AccountSection>
  </div>;
}
