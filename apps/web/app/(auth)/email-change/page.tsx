"use client";

import { useEmailChange } from "@dcentervn/auth-react";
import { EmailChangeView } from "@dcentervn/ui";

export default function EmailChangePage() {
  const emailChangeState = useEmailChange();
  return <EmailChangeView {...emailChangeState} />;
}
