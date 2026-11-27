import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { zoneLabel } from "@/lib/api/storage-locations";

export const zoneTone: Record<string, string> = {
  COLD: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  CHILL: "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200",
  DRY: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
};

export function ZoneBadge({ zone, className }: { zone: string; className?: string }) {
  return <Badge data-zone={zone} className={cn("font-semibold", zoneTone[zone] ?? "bg-muted text-foreground", className)}>{zoneLabel[zone] ?? zone}</Badge>;
}
