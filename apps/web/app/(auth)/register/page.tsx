"use client";

import { useRegister } from "@dcentervn/auth-react";
import { RegisterView } from "@dcentervn/ui";

export default function RegisterPage() {
  const registerState = useRegister();
  return <RegisterView {...registerState} />;
}
