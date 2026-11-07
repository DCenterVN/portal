"use client";

import { useTranslations } from "next-intl";
import type { UserProfile } from "@/lib/auth/client";
import { AccountSection } from "../account-section";
import { PasswordSetting } from "../password-setting";
import { SessionsCard } from "../sessions-card";

export function SecurityTab({ profile }: { profile: UserProfile }) {
  const t = useTranslations("account");
  return <div className="space-y-10">
    <AccountSection title={t("password")} description={t("passwordDescription")}><PasswordSetting loginPath="/login" /></AccountSection>
    <AccountSection title={t("sessions")} description={t("sessionsDescription")}><SessionsCard userId={profile.id} loginPath="/login" /></AccountSection>
  </div>;
}
