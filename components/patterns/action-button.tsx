import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export type ActionButtonProps = React.ComponentProps<typeof Button> & {
  pending?: boolean;
  pendingLabel?: React.ReactNode;
  icon?: LucideIcon;
};

export function ActionButton({ pending = false, pendingLabel, icon: Icon, disabled, children, ...props }: ActionButtonProps) {
  return (
    <Button disabled={disabled || pending} aria-busy={pending || undefined} {...props}>
      {pending ? <Spinner aria-hidden="true" /> : Icon && <Icon aria-hidden="true" />}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
