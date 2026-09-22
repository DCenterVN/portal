"use client";

import { Suspense } from "react";
import { useActivate } from "@dcentervn/auth-react";
import { ActivateView, Skeleton } from "@dcentervn/ui";

function ActivateContainer() {
  const activateState = useActivate();
  return <ActivateView {...activateState} />;
}

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-11 w-full" />
        </div>
      }
    >
      <ActivateContainer />
    </Suspense>
  );
}
