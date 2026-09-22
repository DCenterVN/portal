"use client";

import { Suspense } from "react";
import { useResetPassword } from "@dcentervn/auth-react";
import { ResetPasswordView, Skeleton } from "@dcentervn/ui";

function ResetPasswordContainer() {
  const resetState = useResetPassword();
  return <ResetPasswordView {...resetState} />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      }
    >
      <ResetPasswordContainer />
    </Suspense>
  );
}
