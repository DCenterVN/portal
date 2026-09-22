"use client";

import { Suspense } from "react";
import { useEmailConfirm } from "@dcentervn/auth-react";
import { EmailConfirmView, Skeleton } from "@dcentervn/ui";

function EmailConfirmContainer() {
  const confirmState = useEmailConfirm();
  return <EmailConfirmView {...confirmState} />;
}

export default function EmailConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-11 w-full" />
        </div>
      }
    >
      <EmailConfirmContainer />
    </Suspense>
  );
}
