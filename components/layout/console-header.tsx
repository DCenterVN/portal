import type { ReactNode } from "react";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  toggleLabel: string;
  actions?: ReactNode;
};

export function ConsoleHeader({ collapsed, onToggle, toggleLabel, actions }: Props) {
  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 md:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={toggleLabel}
        aria-expanded={!collapsed}
        aria-controls="console-sidebar"
        onClick={onToggle}
      >
        <PanelLeft aria-hidden="true" />
      </Button>
      {actions && <div className="flex min-w-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
