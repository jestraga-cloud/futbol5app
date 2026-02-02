"use client";

import { useEffect, useState, useCallback } from "react";

type ThemeMode = "system" | "dark" | "light";

function getSystemPreference(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(isDark: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", isDark);
}

export function useDarkMode() {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [isDark, setIsDark] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("futbol5-theme") as ThemeMode | null;
    const initial = saved || "system";
    setModeState(initial);

    const dark = initial === "system" ? getSystemPreference() : initial === "dark";
    setIsDark(dark);
    applyTheme(dark);
  }, []);

  // Listen for system preference changes when in system mode
  useEffect(() => {
    if (mode !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
      applyTheme(e.matches);
    };

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem("futbol5-theme", newMode);

    const dark = newMode === "system" ? getSystemPreference() : newMode === "dark";
    setIsDark(dark);
    applyTheme(dark);
  }, []);

  // Cycle: system → dark → light → system
  const toggle = useCallback(() => {
    const next: Record<ThemeMode, ThemeMode> = {
      system: "dark",
      dark: "light",
      light: "system",
    };
    setMode(next[mode]);
  }, [mode, setMode]);

  return { isDark, mode, setMode, toggle };
}
