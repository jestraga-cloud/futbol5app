"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import AdminLogin from "./AdminLogin";
import DarkModeToggle from "./DarkModeToggle";

export default function Navigation() {
  const pathname = usePathname();
  const { isAdmin, login, logout } = useAdmin();
  const [showLogin, setShowLogin] = useState(false);

  const links = [
    { href: "/", label: "Inicio", icon: "🏠" },
    { href: "/nuevo-partido", label: "Nuevo", icon: "⚽" },
    { href: "/partidos", label: "Historial", icon: "📋" },
    { href: "/jugadores", label: "Jugadores", icon: "👥" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <div className="max-w-lg mx-auto flex justify-around items-center">
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
              <span className="text-lg">{link.icon}</span>
              <span className="text-[10px] mt-1 font-medium">{link.label}</span>
            </Link>
          ))}

          {/* Dark mode + Admin compactos */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <DarkModeToggle />
              <button
                onClick={() => isAdmin ? logout() : setShowLogin(true)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isAdmin
                    ? "text-green-600 bg-green-50"
                    : "text-gray-500 hover:text-green-600"
                }`}
              >
                <span className="text-sm">{isAdmin ? "🔓" : "🔒"}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {showLogin && (
        <AdminLogin
          onLogin={async (pin) => {
            const success = await login(pin);
            if (success) setShowLogin(false);
            return success;
          }}
          onCancel={() => setShowLogin(false)}
        />
      )}
    </>
  );
}
