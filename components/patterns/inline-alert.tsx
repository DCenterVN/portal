import * as React from "react";
import { AlertCircle, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type AlertTone = "error" | "warning" | "success" | "info";
const tones: Record<AlertTone, { box: string; text: string; icon?: typeof AlertCircle }> = {
  error: { box: "border-destructive-border bg-destructive-soft", text: "", icon: AlertCircle },
  warning: { box: "border-warning-border bg-warning-soft text-warning", text: "text-current", icon: TriangleAlert },
  success: { box: "", text: "text-foreground" },
  info: { box: "", text: "text-foreground" },
};

export function InlineAlert({ tone = "error", children, className, ...props }: { tone?: AlertTone } & Omit<React.ComponentProps<typeof Alert>, "variant">) {
  const style = tones[tone];
  const Icon = style.icon;
  return (
    <Alert
      variant={tone === "error" ? "destructive" : "default"}
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={cn(style.box, className)}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" />}
      <AlertDescription className={style.text}>{children}</AlertDescription>
    </Alert>
  );
}
