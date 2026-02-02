"use client";

import { useDarkMode } from "@/hooks/useDarkMode";

export default function DarkModeToggle() {
  const { isDark, mode, toggle } = useDarkMode();

  const icon = isDark ? "☀️" : "🌙";
  const label = mode === "system" ? "Auto" : isDark ? "Oscuro" : "Claro";

  return (
    <button
      onClick={toggle}
      className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
        mode !== "system"
          ? "text-green-600 bg-green-50"
          : "text-gray-500 hover:text-green-600"
      }`}
      title={`Tema: ${label}`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );
}
