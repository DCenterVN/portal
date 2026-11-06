import * as React from "react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";

interface StateProps {
  title: string;
  description?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
  className?: string;
}

function Actions({ onRetry, action }: Pick<StateProps, "onRetry" | "action">) {
  if (!onRetry && !action) return null;
  return (
    <>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Thử lại
        </Button>
      )}
      {action}
    </>
  );
}

function Blank({ title, description, onRetry, action, className, busy }: StateProps & { busy?: boolean }) {
  return (
    <Empty role="status" aria-busy={busy || undefined} className={cn("border bg-card", className)}>
      <EmptyHeader>
        <EmptyTitle className="flex items-center gap-2 text-sm">
          {busy && <Spinner aria-hidden="true" />}
          {title}
        </EmptyTitle>
        {description && <EmptyDescription className="text-xs">{description}</EmptyDescription>}
      </EmptyHeader>
      {(onRetry || action) && (
        <EmptyContent className="flex-row flex-wrap justify-center">
          <Actions onRetry={onRetry} action={action} />
        </EmptyContent>
      )}
    </Empty>
  );
}

export function LoadingState({ title = "Đang tải…", ...props }: Partial<StateProps>) {
  return <Blank title={title} busy {...props} />;
}

export function EmptyState(props: StateProps) {
  return <Blank {...props} />;
}

export function ErrorState({ title, description, onRetry, action, className }: StateProps & { denied?: boolean }) {
  return (
    <Alert variant="destructive" className={cn("border-destructive-border bg-destructive-soft", className)}>
      <AlertTitle className="line-clamp-none">{title}</AlertTitle>
      {description && <AlertDescription>{description}</AlertDescription>}
      {(onRetry || action) && (
        <div className="col-start-2 mt-2 flex flex-wrap gap-2">
          <Actions onRetry={onRetry} action={action} />
        </div>
      )}
    </Alert>
  );
}
