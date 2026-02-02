"use client";

import { useDarkMode } from "@/hooks/useDarkMode";

export default function DarkModeToggle() {
  const { isDark, mode, toggle } = useDarkMode();

  const icon = isDark ? "☀️" : "🌙";
  const label = mode === "system" ? "Auto" : isDark ? "Oscuro" : "Claro";

  return (
    <button
      onClick={toggle}
      className={`p-1.5 rounded-lg transition-colors ${
        mode !== "system"
          ? "text-green-600 bg-green-50"
          : "text-gray-500 hover:text-green-600"
      }`}
      title={`Tema: ${label}`}
    >
      <span className="text-sm">{icon}</span>
    </button>
  );
}
