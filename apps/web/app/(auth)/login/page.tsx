"use client";

import { Suspense } from "react";
import { useLogin } from "@dcentervn/auth-react";
import { LoginView, Skeleton } from "@dcentervn/ui";

function LoginContainer() {
  const loginState = useLogin();
  return <LoginView {...loginState} />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      }
    >
      <LoginContainer />
    </Suspense>
  );
}
