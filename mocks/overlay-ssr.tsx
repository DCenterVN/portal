import * as React from "react";

// Radix mounts popover/menu content in a portal that SSR never renders. Tests keep the real Root and Trigger
// and swap the content for an inline element shown while `isOpen()` is true.
type Parts = { children?: React.ReactNode; className?: string };

export const ssrPopoverContent = (isOpen: () => boolean) =>
  function PopoverContent({ children, className }: Parts) {
    return isOpen() ? <div className={className}>{children}</div> : null;
  };

export const ssrMenuContent = (isOpen: () => boolean) =>
  function DropdownMenuContent({ children, className }: Parts) {
    return isOpen() ? <div role="menu" className={className}>{children}</div> : null;
  };

export function ssrMenuItem({ children, className }: Parts) {
  return <div role="menuitem" className={className}>{children}</div>;
}
