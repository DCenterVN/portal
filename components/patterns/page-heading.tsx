import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  /** Content media beside the title (a photo or avatar), never a decorative glyph. */
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  /** Buttons and filters on the right; wraps below the title on narrow screens. */
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeading({ title, description, icon, badge, actions, className }: Props) {
  return (
    <div className={cn("flex flex-col gap-4 pb-4 md:flex-row md:items-center md:justify-between", className)}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {icon && <div className="shrink-0">{icon}</div>}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="break-words text-xl font-semibold text-foreground">{title}</h1>
            {badge}
          </div>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex min-w-0 flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
