"use client";

import { useState } from "react";
import { EstadisticasJugador } from "@/lib/supabase";

interface Props {
  estadisticas: EstadisticasJugador[];
}

type OrdenTipo = "victorias" | "winrate" | "asistencias";

export default function RankingTable({ estadisticas }: Props) {
  const [orden, setOrden] = useState<OrdenTipo>("victorias");

  const getMedal = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}`;
  };

  const estadisticasOrdenadas = [...estadisticas].sort((a, b) => {
    if (orden === "victorias") {
      // Primero por victorias, luego por winrate
      if (b.victorias !== a.victorias) {
        return b.victorias - a.victorias;
      }
      return b.porcentaje_victorias - a.porcentaje_victorias;
    } else if (orden === "winrate") {
      // Primero por winrate, luego por partidos jugados
      if (b.porcentaje_victorias !== a.porcentaje_victorias) {
        return b.porcentaje_victorias - a.porcentaje_victorias;
      }
      return b.partidos_jugados - a.partidos_jugados;
    } else {
      // Asistencias: primero por partidos jugados
      return b.partidos_jugados - a.partidos_jugados;
    }
  });

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span>🏆</span> Ranking
        </h2>

        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setOrden("victorias")}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
              orden === "victorias"
                ? "bg-white text-green-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Victorias
          </button>
          <button
            onClick={() => setOrden("winrate")}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
              orden === "winrate"
                ? "bg-white text-green-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Winrate
          </button>
          <button
            onClick={() => setOrden("asistencias")}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
              orden === "asistencias"
                ? "bg-white text-green-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Asistencias
          </button>
        </div>
      </div>

      {estadisticas.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No hay partidos registrados aún
        </p>
      ) : (
        <div className="space-y-2">
          {estadisticasOrdenadas.map((est, index) => (
            <div
              key={est.jugador.id}
              className={`flex items-center justify-between p-3 rounded-lg stagger-item ${
                index < 3 ? "bg-green-50" : "bg-gray-50"
              }`}
              style={{ "--i": index } as React.CSSProperties}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold w-8 text-center">
                  {getMedal(index)}
                </span>
                <div>
                  <p className="font-semibold text-gray-800">
                    {est.jugador.apodo || est.jugador.nombre}
                  </p>
                  {est.jugador.apodo && est.jugador.apodo !== est.jugador.nombre && (
                    <p className="text-xs text-gray-500">{est.jugador.nombre}</p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-green-600">
                  {orden === "victorias" && `${est.victorias}V`}
                  {orden === "winrate" && `${est.porcentaje_victorias.toFixed(0)}%`}
                  {orden === "asistencias" && `${est.partidos_jugados}PJ`}
                </p>
                <p className="text-xs text-gray-500">
                  {orden === "victorias" && `${est.porcentaje_victorias.toFixed(0)}% - ${est.partidos_jugados}PJ`}
                  {orden === "winrate" && `${est.victorias}V - ${est.empates}E - ${est.derrotas}D`}
                  {orden === "asistencias" && `${est.victorias}V - ${est.porcentaje_victorias.toFixed(0)}%`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
