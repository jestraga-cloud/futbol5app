"use client";

import { useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import AdminLogin from "./AdminLogin";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AdminGuard({ children, fallback }: Props) {
  const { isAdmin, login } = useAdmin();
  const [showLogin, setShowLogin] = useState(false);

  if (isAdmin) return <>{children}</>;

  if (showLogin) {
    return <AdminLogin onLogin={login} onCancel={() => setShowLogin(false)} />;
  }

  if (fallback) {
    return (
      <div onClick={() => setShowLogin(true)} className="cursor-pointer">
        {fallback}
      </div>
    );
  }

  return null;
}
