"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={next === "dark" ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        setTheme(next);
      }}
    >
      {next === "dark" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
    </Button>
  );
}
