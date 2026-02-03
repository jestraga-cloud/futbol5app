"use client";

import { Logro } from "@/lib/supabase";

interface Props {
  logros: Logro[];
}

export default function LogrosJugador({ logros }: Props) {
  const desbloqueados = logros.filter((l) => l.desbloqueado).length;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
        Logros ({desbloqueados}/{logros.length})
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {logros.map((logro) => (
          <div
            key={logro.id}
            className={`text-center p-2 rounded-lg ${
              logro.desbloqueado
                ? "bg-yellow-50"
                : "bg-gray-50 opacity-30"
            }`}
            title={logro.descripcion}
          >
            <div className="text-xl mb-0.5">{logro.icono}</div>
            <p className="text-[10px] font-medium text-gray-700 leading-tight">
              {logro.nombre}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
