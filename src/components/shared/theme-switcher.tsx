"use client";

import { Moon, Sun } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

export function ThemeSwitcher() {
  const { resolvedThemeMode, setPreference } = usePreferencesStore(
    useShallow((state) => ({ resolvedThemeMode: state.resolvedThemeMode, setPreference: state.setPreference })),
  );
  const nextMode = resolvedThemeMode === "dark" ? "light" : "dark";
  const label = nextMode === "dark" ? "切换到深色模式" : "切换到浅色模式";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setPreference("theme_mode", nextMode)}
      aria-label={label}
      title={label}
    >
      {resolvedThemeMode === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
