"use client";

import { EstadisticasJugador } from "@/lib/supabase";

interface Props {
  estadisticas: EstadisticasJugador[];
}

export default function RankingTable({ estadisticas }: Props) {
  const getMedal = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}`;
  };

  return (
    <div className="card p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>🏆</span> Ranking de Jugadores
      </h2>

      {estadisticas.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No hay partidos registrados aún
        </p>
      ) : (
        <div className="space-y-2">
          {estadisticas.map((est, index) => (
            <div
              key={est.jugador.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                index < 3 ? "bg-green-50" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold w-8 text-center">
                  {getMedal(index)}
                </span>
                <div>
                  <p className="font-semibold text-gray-800">
                    {est.jugador.apodo || est.jugador.nombre}
                  </p>
                  {est.jugador.apodo && (
                    <p className="text-xs text-gray-500">{est.jugador.nombre}</p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-green-600">
                  {est.porcentaje_victorias.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500">
                  {est.victorias}V - {est.empates}E - {est.derrotas}D
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
