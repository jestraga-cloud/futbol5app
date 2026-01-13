"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Inicio", icon: "🏆" },
    { href: "/nuevo-partido", label: "Nuevo Partido", icon: "⚽" },
    { href: "/partidos", label: "Historial", icon: "📋" },
    { href: "/jugadores", label: "Jugadores", icon: "👥" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="max-w-lg mx-auto flex justify-around">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              pathname === link.href
                ? "text-green-600 bg-green-50"
                : "text-gray-500 hover:text-green-600"
            }`}
          >
            <span className="text-xl">{link.icon}</span>
            <span className="text-xs mt-1 font-medium">{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
