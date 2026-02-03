"use client";

import { useDarkMode } from "@/hooks/useDarkMode";

export default function DarkModeToggle() {
  const { isDark, toggle } = useDarkMode();

  return (
    <button
      onClick={toggle}
      className="relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none"
      style={{ background: isDark ? "#1a2b25" : "#d1d5db" }}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      <span
        className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300 text-xs"
        style={{ transform: isDark ? "translateX(28px)" : "translateX(0)" }}
      >
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
