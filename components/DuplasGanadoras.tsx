"use client";

import { useState, useMemo } from "react";
import { Jugador, PartidoConJugadores } from "@/lib/supabase";
import { calcularDuplas } from "@/lib/duplas";

interface Props {
  jugadores: Jugador[];
  partidos: PartidoConJugadores[];
}

export default function DuplasGanadoras({ jugadores, partidos }: Props) {
  const [expandido, setExpandido] = useState(false);

  const duplas = useMemo(
    () => calcularDuplas(jugadores, partidos),
    [jugadores, partidos]
  );

  if (duplas.length === 0) return null;

  const duplasVisibles = expandido ? duplas : duplas.slice(0, 5);

  return (
    <div className="card p-4">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
        <span>🤝</span> Duplas Ganadoras
      </h2>

      <div className="space-y-2">
        {duplasVisibles.map((dupla, index) => {
          const nombre1 = dupla.jugador1.apodo || dupla.jugador1.nombre;
          const nombre2 = dupla.jugador2.apodo || dupla.jugador2.nombre;

          return (
            <div
              key={`${dupla.jugador1.id}-${dupla.jugador2.id}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg stagger-item"
              style={{ "--i": index } as React.CSSProperties}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">
                  {nombre1} + {nombre2}
                </p>
                <p className="text-xs text-gray-500">
                  {dupla.victorias_juntos}/{dupla.partidos_juntos} partidos ganados
                </p>
              </div>
              <div className="text-right ml-3">
                <p className="font-bold text-green-600">{dupla.winrate}%</p>
              </div>
            </div>
          );
        })}
      </div>

      {duplas.length > 5 && (
        <button
          onClick={() => setExpandido(!expandido)}
          className="w-full mt-3 py-2 text-sm text-green-600 font-medium hover:text-green-700"
        >
          {expandido ? "Ver menos" : `Ver mas (${duplas.length - 5} mas)`}
        </button>
      )}
    </div>
  );
}
