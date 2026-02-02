"use client";

import { useState } from "react";

interface Props {
  onLogin: (pin: string) => Promise<boolean>;
  onCancel: () => void;
}

export default function AdminLogin({ onLogin, onCancel }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const success = await onLogin(pin);
    if (!success) setError(true);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 modal-backdrop">
      <div className="card rounded-2xl p-6 w-full max-w-sm shadow-xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
          Acceso Admin
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            className="w-full p-3 border border-gray-300 rounded-lg mb-3 text-center text-2xl tracking-widest"
            autoFocus
          />
          {error && (
            <p className="text-red-500 text-sm mb-3 text-center">
              PIN incorrecto
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !pin}
            className="btn-primary w-full mb-2 disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Entrar"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 text-gray-500 text-sm hover:text-gray-700"
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}
