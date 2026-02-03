"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Inicio", icon: "🏠" },
    { href: "/nuevo-partido", label: "Nuevo", icon: "⚽" },
    { href: "/partidos", label: "Historial", icon: "📋" },
    { href: "/jugadores", label: "Jugadores", icon: "👥" },
    { href: "/pachanga", label: "Pachanga", icon: "🏆" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t border-gray-200 px-4 py-2 z-50"
      style={{
        background: "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="max-w-lg mx-auto flex justify-around items-center">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-green-600"
                  : "text-gray-500 hover:text-green-600"
              }`}
            >
              <span
                className="text-lg transition-transform duration-200"
                style={{ transform: isActive ? "scale(1.2)" : "scale(1)" }}
              >
                {link.icon}
              </span>
              <span className="text-[10px] mt-1 font-medium">{link.label}</span>
              {isActive && (
                <span
                  className="absolute bottom-1 h-[3px] w-6 rounded-full bg-green-500"
                  style={{ transition: "all 0.2s ease" }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
