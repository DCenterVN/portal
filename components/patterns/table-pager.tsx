import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface StepProps {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}

function Step({ label, disabled, onClick, children }: StepProps) {
  return (
    <PaginationLink
      href="#"
      size="default"
      aria-label={label}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      className={cn("gap-1", disabled && "pointer-events-none opacity-50")}
      onClick={(event) => {
        event.preventDefault();
        if (!disabled) onClick();
      }}
    >
      {children}
    </PaginationLink>
  );
}

export interface TablePagerProps {
  hasNext: boolean;
  onNext: () => void;
  /** Omit for next-only lists. */
  onPrevious?: () => void;
  hasPrevious?: boolean;
  status?: ReactNode;
  previousLabel?: string;
  nextLabel?: string;
  label?: string;
  busy?: boolean;
  className?: string;
}

// ponytail: backend pages have no total, so "next" is enabled while a page comes back full.
export function TablePager({ hasNext, onNext, onPrevious, hasPrevious = false, status, previousLabel = "Trang trước", nextLabel = "Trang sau", label = "Phân trang", busy, className }: TablePagerProps) {
  return (
    <Pagination aria-label={label} className={cn("justify-end pt-3 text-sm", className)}>
      <PaginationContent>
        {onPrevious && (
          <PaginationItem>
            <Step label={previousLabel} disabled={Boolean(busy) || !hasPrevious} onClick={onPrevious}>
              <ChevronLeft aria-hidden="true" />
              {previousLabel}
            </Step>
          </PaginationItem>
        )}
        {status && (
          <PaginationItem className="px-2 text-muted-foreground" aria-live="polite">
            {status}
          </PaginationItem>
        )}
        <PaginationItem>
          <Step label={nextLabel} disabled={Boolean(busy) || !hasNext} onClick={onNext}>
            {nextLabel}
            <ChevronRight aria-hidden="true" />
          </Step>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
