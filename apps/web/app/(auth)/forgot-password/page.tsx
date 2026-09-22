"use client";

import { useForgotPassword } from "@dcentervn/auth-react";
import { ForgotPasswordView } from "@dcentervn/ui";

export default function ForgotPasswordPage() {
  const forgotState = useForgotPassword();
  return <ForgotPasswordView {...forgotState} />;
}
